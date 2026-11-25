import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RiderWebMapView from '../../components/RiderWebMapView';
import SwipeButton from '../../components/SwipeButton';
import DriverInRideSupportModal from '../../components/DriverInRideSupportModal';
import { RiderProvider, useRider } from '../../context/RiderContext';
import { useToast } from '../../context/ToastContext';
import { riderService } from '../../services/riderService';
import { GO_TO_AREA_STORAGE_KEY } from './GoToAreaScreen';


// --- HELPER: Decode Polyline ---
const decodePolyline = (t: string) => {
  if(!t) return [];
  let points = [];
  let index = 0, len = t.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push({ latitude: (lat / 1e5), longitude: (lng / 1e5) });
  }
  return points;
};

// --- COMPONENT: MAP AREA ---
const MapArea = () => {
  const { location, googleMapsKey, incomingRequest, activeRide } = useRider();

  if (!location) return <View style={styles.loadingMap}><ActivityIndicator size="large" color="black" /></View>;

  const activeData = incomingRequest || activeRide;
  const routeCoords = activeData ? decodePolyline(activeData.polyline) : [];

  return (
    <View style={styles.map}>
      <RiderWebMapView
        center={{ latitude: (location as any).latitude, longitude: (location as any).longitude }}
        googleMapsKey={googleMapsKey}
        zoom={15}
        pickupCoord={activeData ? { lat: activeData.pickup.lat, lng: activeData.pickup.lng } : null}
        dropCoord={activeData ? { lat: activeData.drop.lat, lng: activeData.drop.lng } : null}
        routeCoords={routeCoords}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};


// --- COMPONENT: HEADER ---
const HeaderToggle = ({navigation}: any) => {
  const { isOnline, toggleOnline } = useRider();
  const { showToast } = useToast();
  const [goToArea, setGoToArea] = useState<any>(null);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchHeaderData = async () => {
      try {
        const areaStr = await AsyncStorage.getItem(GO_TO_AREA_STORAGE_KEY);
        if (areaStr && isMounted) {
          const parsed = JSON.parse(areaStr);
          if (parsed.isActive) setGoToArea(parsed);
          else setGoToArea(null);
        }
        const notifs = await riderService.getNotifications();
        if (isMounted) {
          const unread = notifs.filter((n) => !n.isRead).length;
          setUnreadNotifs(unread);
        }
      } catch (_) {}
    };
    fetchHeaderData();
    const interval = setInterval(fetchHeaderData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOnline]);

  const handleToggleOnline = () => {
    toggleOnline();
    if (!isOnline) {
      showToast({
        title: 'Duty ONLINE',
        message: 'Looking for passengers nearby...',
        type: 'success',
      });
    } else {
      showToast({
        title: 'Duty OFFLINE',
        message: 'Duty paused. Turn ON when ready to drive.',
        type: 'info',
      });
    }
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={[styles.headerContainer, isOnline ? styles.headerOn : styles.headerOff]}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton} activeOpacity={0.7}>
          <Ionicons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={{alignItems: 'center', flex: 1}}>
          <Text style={styles.headerTitle}>{isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}</Text>
          <Text style={styles.headerSub}>{isOnline ? 'Searching for rides...' : 'Go online to start'}</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notifButton}
          activeOpacity={0.7}
          accessibilityLabel="Open Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color="#ffffff" />
          {unreadNotifs > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>

        <Switch
          trackColor={{ false: "#767577", true: "#f72585" }}
          thumbColor={isOnline ? "#fff" : "#f4f3f4"}
          onValueChange={handleToggleOnline}
          value={isOnline}
        />
      </View>

      {/* Floating Active Go-To-Area Corridor Banner */}
      {isOnline && goToArea && (
        <TouchableOpacity
          style={styles.goToAreaBanner}
          onPress={() => navigation.navigate('GoToArea')}
          activeOpacity={0.8}
        >
          <View style={styles.goToAreaLeft}>
            <Ionicons name="navigate-circle" size={18} color="#f72585" />
            <Text style={styles.goToAreaBannerText} numberOfLines={1}>
              Corridor: {goToArea.targetArea} (±{goToArea.radiusKm || 5}km)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#f72585" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// --- COMPONENT: BOTTOM PANEL ---
const BottomPanel = () => {
  const { isOnline, incomingRequest, activeRide, acceptRide, rejectRide, arriveAtPickup, startRide, completeRide } = useRider();
  const { showToast } = useToast();
  const [otp, setOtp] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [waitTime, setWaitTime] = useState(0);

  const [supportModalVisible, setSupportModalVisible] = useState(false);

  // Timer logic for wait time
  useEffect(() => {
    let interval: any;
    if (activeRide?.status === 'arrived' && activeRide.arrivedAt) {
      interval = setInterval(() => {
        setWaitTime(Date.now() - new Date(activeRide.arrivedAt!).getTime());
      }, 1000);
    } else {
      setWaitTime(0);
    }
    return () => clearInterval(interval);
  }, [activeRide?.status, activeRide?.arrivedAt]);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOnline) return null;

  // 1. ACTIVE RIDE (Ongoing)
  if (activeRide) {
    const isStarted = activeRide.status === 'ongoing';
    const rawId = (activeRide as any)?.id || activeRide._id || '';
    const cleanDisplayId = (activeRide as any)?.displayId || `DM-${rawId.slice(-6).toUpperCase()}`;

    return (
      <View style={styles.panel}>
        {/* Top Ride ID & Partner Support Header */}
        <View style={styles.rideIdTopBar}>
          <TouchableOpacity
            style={styles.rideIdTag}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert('Ride Reference', `Ride ID: #${cleanDisplayId}\nFull Reference: ${rawId}`);
            }}
          >
            <Ionicons name="receipt-outline" size={13} color="#f72585" />
            <Text style={styles.rideIdTagLabel}>RIDE ID:</Text>
            <Text style={styles.rideIdTagText}>#{cleanDisplayId}</Text>
            <Ionicons name="copy-outline" size={12} color="#f72585" style={{ marginLeft: 3 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.driverSupportBtn}
            onPress={() => setSupportModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="headset" size={13} color="#ffffff" />
            <Text style={styles.driverSupportBtnText}>Help & Safety</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.panelTitle}>
          {activeRide.status === 'accepted' ? "Head to Pickup" : 
           activeRide.status === 'arrived' ? "Waiting for Customer" : 
           "Ride in Progress"}
        </Text>
        
        {/* Customer Info */}
        <View style={styles.customerBox}>
            <View style={styles.avatar}><Text style={{fontSize: 20}}>👤</Text></View>
            <View>
                <Text style={styles.custName}>{activeRide.customer?.name || "Customer"}</Text>
                <Text style={styles.custPhone}>+91 {activeRide.customer?.phone || "Unknown"}</Text>
            </View>
            <Text style={styles.fare}>₹{activeRide.fare}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Drop:</Text>
          <Text style={styles.value} numberOfLines={1}>{activeRide.drop.address}</Text>
        </View>

        {/* Wait Timer (Shows when arrived) */}
        {activeRide.status === 'arrived' && (
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <Text style={{ color: 'gray', fontSize: 14 }}>Wait Time</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: waitTime > 180000 ? 'red' : 'black' }}>
              {formatTime(waitTime)}
            </Text>
            {waitTime > 180000 && <Text style={{ color: 'red', fontSize: 12 }}>Charges applying (₹2/min)</Text>}
          </View>
        )}

        {/* Action Buttons */}
        {activeRide.status === 'accepted' && (
          <SwipeButton title="Swipe to Arrive" onSwipeSuccess={arriveAtPickup} buttonColor="#3498db" />
        )}

        {activeRide.status === 'arrived' && (
          <TouchableOpacity style={styles.btnBlack} onPress={() => setOtpModalVisible(true)}>
            <Text style={styles.btnText}>Start Ride (Enter OTP)</Text>
          </TouchableOpacity>
        )}

        {activeRide.status === 'ongoing' && (
          <SwipeButton title="Swipe to Complete" onSwipeSuccess={completeRide} buttonColor="#f72585" />
        )}

        {/* Driver In-Ride Support Modal */}
        <DriverInRideSupportModal
          visible={supportModalVisible}
          onClose={() => setSupportModalVisible(false)}
          rideId={rawId}
          displayId={cleanDisplayId}
          customerName={activeRide.customer?.name}
          customerPhone={activeRide.customer?.phone}
          fare={activeRide.fare}
          waitTimeFormatted={formatTime(waitTime)}
          waitTimeMs={waitTime}
        />

        {/* OTP MODAL */}
        <Modal visible={otpModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Enter Customer OTP</Text>
                    <TextInput 
                        style={styles.otpInput} 
                        placeholder="XXXX" 
                        maxLength={4} 
                        keyboardType="number-pad"
                        value={otp}
                        onChangeText={setOtp}
                    />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.btnOutline} onPress={() => setOtpModalVisible(false)}>
                            <Text>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnBlack} onPress={async () => {
                            const success = await startRide(otp);
                            if(success) setOtpModalVisible(false);
                        }}>
                            <Text style={styles.btnText}>Verify</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
      </View>
    );
  }

  // 2. INCOMING REQUEST
  if (incomingRequest) {
    return (
      <View style={[styles.panel, styles.requestPanel]}>
        <Text style={styles.panelTitle}>🔥 New Ride Request!</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Pickup:</Text>
          <Text style={styles.value} numberOfLines={2}>{incomingRequest.pickup.address}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Drop:</Text>
          <Text style={styles.value} numberOfLines={2}>{incomingRequest.drop.address}</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statBox}>₹{incomingRequest.fare}</Text>
          <Text style={styles.statBox}>{incomingRequest.distance} km</Text>
          <Text style={styles.statBox}>{Math.ceil(incomingRequest.duration)} min</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => {
            rejectRide();
            showToast({ title: 'Ride Skipped', message: 'Looking for another ride...', type: 'info' });
          }}>
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => {
            acceptRide();
            showToast({ title: 'Ride Accepted!', message: 'Navigate to pickup location.', type: 'success' });
          }}>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. IDLE
  return (
    <View style={styles.panel}>
      <Text style={{ textAlign: 'center', color: 'gray' }}>Waiting for customers nearby...</Text>
    </View>
  );
};

// --- MAIN SCREEN ---
export default function RiderDashboard({navigation}: any) {
  return (
    <View style={styles.container}>
      <MapArea />
      <View style={styles.overlay}>
        <HeaderToggle navigation={navigation} />
      </View>

      {/* Floating Action Shortcuts */}
      <View style={styles.floatingShortcutsContainer}>
        <TouchableOpacity
          style={styles.floatingShortcutBtn}
          onPress={() => navigation.navigate('GoToArea')}
          activeOpacity={0.8}
          accessibilityLabel="Open Go To Area"
        >
          <Ionicons name="navigate-circle" size={20} color="#f72585" />
          <Text style={styles.floatingShortcutText}>Go To Area</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingShortcutBtn}
          onPress={() => navigation.navigate('Performance')}
          activeOpacity={0.8}
          accessibilityLabel="Open Performance Hub"
        >
          <Ionicons name="trophy" size={18} color="#f59e0b" />
          <Text style={styles.floatingShortcutText}>Score</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        <BottomPanel />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingMap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
  map: { flex: 1 },
  mapFallback: { padding: 24 },
  mapFallbackIcon: { fontSize: 52, marginBottom: 12 },
  mapFallbackTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  mapFallbackSub: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20 },
  mapFallbackCoords: { marginTop: 16, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  mapFallbackCoordsText: { fontSize: 12, color: '#555', fontWeight: '600' },
  overlay: { position: 'absolute', top: 50, left: 20, right: 20 },
  
  // Map markers
  markerGreen: {
    backgroundColor: '#06d6a0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    elevation: 4,
  },
  markerRed: {
    backgroundColor: '#f72585',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    elevation: 4,
  },

  headerWrapper: { gap: 8 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  headerOn: { backgroundColor: '#2ecc71' }, 
  headerOff: { backgroundColor: '#34495e' },
  headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  menuButton: { padding: 5, paddingRight: 15 },
  notifButton: {
    padding: 6,
    position: 'relative',
    marginRight: 6,
  },
  notifDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f72585',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  goToAreaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 30, 44, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.4)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  goToAreaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  goToAreaBannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingShortcutsContainer: {
    position: 'absolute',
    right: 20,
    top: 135,
    gap: 10,
    alignItems: 'flex-end',
  },
  floatingShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingShortcutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },

  bottomContainer: { position: 'absolute', bottom: 0, width: '100%' },
  panel: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 15, minHeight: 100 },
  requestPanel: { borderTopWidth: 5, borderColor: '#3498db' },
  panelTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  label: { fontWeight: 'bold', width: 60, color: '#555' },
  value: { flex: 1, color: '#000' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  statBox: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, fontWeight: 'bold', minWidth: 70, textAlign: 'center' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#2ecc71' },
  rejectBtn: { backgroundColor: '#e74c3c' },
  btnBlack: { backgroundColor: 'black', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, flex: 1 },
  btnRed: { backgroundColor: 'red', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  customerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 10, marginBottom: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  custName: { fontWeight: 'bold', fontSize: 16 },
  custPhone: { color: 'gray', fontSize: 12 },
  fare: { marginLeft: 'auto', fontSize: 20, fontWeight: 'bold', color: 'green' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  otpInput: { borderBottomWidth: 2, borderColor: 'black', textAlign: 'center', fontSize: 30, letterSpacing: 10, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  btnOutline: { flex: 1, padding: 15, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // In-Ride Top Bar & Support
  rideIdTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideIdTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 37, 133, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.25)',
  },
  rideIdTagLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f72585',
    marginRight: 4,
  },
  rideIdTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  driverSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    elevation: 2,
  },
  driverSupportBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});