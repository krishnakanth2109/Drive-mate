import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import { RiderProvider, useRider } from '../context/RiderContext';

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
  const { location, incomingRequest, activeRide } = useRider();
  const mapRef = useRef<MapView>(null);

  // Focus Logic
  useEffect(() => {
    if (incomingRequest && mapRef.current) {
        // Zoom to fit Pickup & Drop
        mapRef.current.fitToCoordinates([
            { latitude: incomingRequest.pickup.lat, longitude: incomingRequest.pickup.lng },
            { latitude: incomingRequest.drop.lat, longitude: incomingRequest.drop.lng }
        ], { edgePadding: { top: 50, right: 50, bottom: 300, left: 50 }, animated: true });
    } else if (activeRide && mapRef.current) {
        // Keep focus on route
         mapRef.current.fitToCoordinates([
            { latitude: activeRide.pickup.lat, longitude: activeRide.pickup.lng },
            { latitude: activeRide.drop.lat, longitude: activeRide.drop.lng }
        ], { edgePadding: { top: 50, right: 50, bottom: 300, left: 50 }, animated: true });
    }
  }, [incomingRequest, activeRide]);

  const activeData = incomingRequest || activeRide;
  const routeCoords = activeData ? decodePolyline(activeData.polyline) : [];

  if (!location) return <View style={styles.loadingMap}><ActivityIndicator size="large" color="black" /></View>;

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={location}
      showsUserLocation={true}
    >

      {/* Route Line */}
      {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#f72585" />}

      {/* Markers */}
      {activeData && (
        <>
          <Marker coordinate={{ latitude: activeData.pickup.lat, longitude: activeData.pickup.lng }} title="Pickup">
            <View style={styles.markerGreen}>
              <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>FROM</Text>
            </View>
          </Marker>
          <Marker coordinate={{ latitude: activeData.drop.lat, longitude: activeData.drop.lng }} title="Drop">
            <View style={styles.markerRed}>
              <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>TO</Text>
            </View>
          </Marker>
        </>
      )}
    </MapView>
  );
};

// --- COMPONENT: HEADER ---
const HeaderToggle = ({navigation}: any) => {
  const { isOnline, toggleOnline, logout } = useRider();

  return (
    <View style={[styles.headerContainer, isOnline ? styles.headerOn : styles.headerOff]}>
      <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
        <Text style={{fontSize: 24, color: 'white'}}>☰</Text>
      </TouchableOpacity>
      <View style={{alignItems: 'center', flex: 1}}>
        <Text style={styles.headerTitle}>{isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}</Text>
        <Text style={styles.headerSub}>{isOnline ? 'Searching for rides...' : 'Go online to start'}</Text>
      </View>
      <Switch
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={isOnline ? "#fff" : "#f4f3f4"}
        onValueChange={toggleOnline}
        value={isOnline}
      />
    </View>
  );
};

// --- COMPONENT: BOTTOM PANEL ---
const BottomPanel = () => {
  const { isOnline, incomingRequest, activeRide, acceptRide, rejectRide, startRide, completeRide } = useRider();
  const [otp, setOtp] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  if (!isOnline) return null;

  // 1. ACTIVE RIDE (Ongoing)
  if (activeRide) {
    const isStarted = activeRide.status === 'ongoing';

    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{isStarted ? "Ride in Progress" : "Pick up Customer"}</Text>
        
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

        {!isStarted ? (
            <TouchableOpacity style={styles.btnBlack} onPress={() => setOtpModalVisible(true)}>
                <Text style={styles.btnText}>Start Ride</Text>
            </TouchableOpacity>
        ) : (
            <TouchableOpacity style={styles.btnRed} onPress={completeRide}>
                <Text style={styles.btnText}>Complete Ride</Text>
            </TouchableOpacity>
        )}

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
          <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={rejectRide}>
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={acceptRide}>
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

  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  headerOn: { backgroundColor: '#2ecc71' }, 
  headerOff: { backgroundColor: '#34495e' },
  headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  menuButton: { padding: 5, paddingRight: 15 },

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
  btnOutline: { flex: 1, padding: 15, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }
});