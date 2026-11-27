import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RiderWebMapView from '../../components/RiderWebMapView';
import SwipeButton from '../../components/SwipeButton';
import DriverInRideSupportModal from '../../components/DriverInRideSupportModal';
import GeofenceArrivalCard from '../../components/GeofenceArrivalCard';
import { useRider } from '../../context/RiderContext';
import { useToast } from '../../context/ToastContext';
import { riderService } from '../../services/riderService';
import { evaluateDriverGeofence } from '../../utils/geofence';
import { GO_TO_AREA_STORAGE_KEY } from './GoToAreaScreen';

const decodePolyline = (t: string) => {
  if (!t) return [];
  const points = [];
  let index = 0;
  const len = t.length;
  let lat = 0;
  let lng = 0;
  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

// ─────────────────────────────────────────────
// MAP AREA
// ─────────────────────────────────────────────
const MapArea = ({ showTraffic }: { showTraffic: boolean }) => {
  const { location, driverGps, refreshCurrentGps, googleMapsKey, incomingRequest, activeRide, surgeStatus } = useRider();

  if (!location) {
    return (
      <View style={styles.loadingMap}>
        {driverGps?.error ? (
          <>
            <Ionicons name="location-outline" size={38} color="#f72585" />
            <Text style={styles.loadingMapText}>{driverGps.error}</Text>
            <TouchableOpacity style={styles.retryGpsBtn} onPress={refreshCurrentGps}>
              <Text style={styles.retryGpsBtnText}>Enable & Retry GPS</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#f72585" />
            <Text style={styles.loadingMapText}>Locating partner GPS...</Text>
          </>
        )}
      </View>
    );
  }

  const activeData = incomingRequest || activeRide;
  const routeCoords = activeData ? decodePolyline(activeData.polyline) : [];
  const surgeMultiplier = surgeStatus?.multiplier ?? 1.0;

  const isGoingToPickup = activeRide?.status === 'accepted';
  const isGoingToDrop = activeRide?.status === 'ongoing';
  const activeTargetCoord = isGoingToPickup ? activeRide?.pickup : isGoingToDrop ? activeRide?.drop : null;
  const activeEval = activeTargetCoord
    ? evaluateDriverGeofence(driverGps, activeTargetCoord, isGoingToPickup ? 'pickup' : 'drop')
    : null;

  return (
    <View style={styles.map}>
      <RiderWebMapView
        center={{ latitude: Number(location.latitude), longitude: Number(location.longitude) }}
        googleMapsKey={googleMapsKey}
        zoom={activeData ? 16 : 15}
        pickupCoord={activeData ? { lat: activeData.pickup.lat, lng: activeData.pickup.lng } : null}
        dropCoord={activeData ? { lat: activeData.drop.lat, lng: activeData.drop.lng } : null}
        routeCoords={routeCoords}
        showTraffic={showTraffic}
        surgeMultiplier={surgeMultiplier}
        activeGeofenceTarget={isGoingToPickup ? 'pickup' : isGoingToDrop ? 'drop' : null}
        isWithinGeofence={Boolean(activeEval?.isWithinRadius)}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// HEADER & SURGE TELEMETRY BAR
// ─────────────────────────────────────────────
const HeaderToggle = ({
  navigation,
  showTraffic,
  onToggleTraffic,
  todayEarnings,
}: {
  navigation: any;
  showTraffic: boolean;
  onToggleTraffic: () => void;
  todayEarnings: number;
}) => {
  const { isOnline, toggleOnline, surgeStatus, refreshSurgeStatus } = useRider();
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
          setUnreadNotifs(notifs.filter((n) => !n.isRead).length);
        }
      } catch (_) {}
    };
    fetchHeaderData();
    const interval = setInterval(fetchHeaderData, 12000);
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

  const multiplier = surgeStatus?.multiplier ?? 1.0;
  const isSurgeHot = Boolean(surgeStatus?.isSurgeActive && multiplier > 1.04);

  return (
    <View style={styles.headerWrapper} pointerEvents="box-none">
      {/* Main Command Card */}
      <View style={[styles.headerContainer, isOnline ? styles.headerOn : styles.headerOff]}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton} activeOpacity={0.7}>
          <Ionicons name="menu" size={22} color="#ffffff" />
        </TouchableOpacity>

        <View style={{ flex: 1, paddingHorizontal: 4 }}>
          <View style={styles.statusInline}>
            <View style={[styles.dutyDot, { backgroundColor: isOnline ? '#34d399' : '#94a3b8' }]} />
            <Text style={styles.headerTitle}>{isOnline ? 'DUTY ONLINE' : 'DUTY OFFLINE'}</Text>
          </View>
          <Text style={styles.headerSub} numberOfLines={1}>
            {isOnline
              ? `Today ₹${todayEarnings.toFixed(0)} • Listening for pickups`
              : 'Toggle duty ON to receive requests'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notifButton}
          activeOpacity={0.7}
          accessibilityLabel="Open Notifications"
        >
          <Ionicons name="notifications-outline" size={20} color="#ffffff" />
          {unreadNotifs > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>

        <Switch
          trackColor={{ false: '#475569', true: '#10b981' }}
          thumbColor="#ffffff"
          onValueChange={handleToggleOnline}
          value={isOnline}
        />
      </View>

      {/* Surge & Traffic Telemetry Pill Row */}
      <View style={styles.telemetryStrip}>
        <TouchableOpacity
          style={[styles.surgeChip, isSurgeHot ? styles.surgeChipHot : styles.surgeChipNormal]}
          onPress={refreshSurgeStatus}
          activeOpacity={0.82}
        >
          <Ionicons name={isSurgeHot ? 'flame' : 'pulse'} size={13} color={isSurgeHot ? '#fb7185' : '#34d399'} />
          <Text style={styles.surgeChipText} numberOfLines={1}>
            {isSurgeHot
              ? `${multiplier.toFixed(1)}x Surge • ${surgeStatus?.demandLevel || 'High'} User Traffic`
              : `${surgeStatus?.trafficLevel || 'Smooth'} Traffic • ${surgeStatus?.activeRequestsNearby ?? 0} nearby requests`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.trafficChipBtn, showTraffic && styles.trafficChipBtnActive]}
          onPress={onToggleTraffic}
          activeOpacity={0.82}
        >
          <Ionicons name="layers" size={13} color={showTraffic ? '#ffffff' : '#0f172a'} />
          <Text style={[styles.trafficChipText, showTraffic && { color: '#ffffff' }]}>Traffic</Text>
        </TouchableOpacity>
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

// ─────────────────────────────────────────────
// BOTTOM PANEL
// ─────────────────────────────────────────────
const BottomPanel = ({ navigation }: { navigation: any }) => {
  const {
    isOnline,
    toggleOnline,
    surgeStatus,
    incomingRequest,
    activeRide,
    driverGps,
    isArrivalSubmitting,
    refreshCurrentGps,
    acceptRide,
    rejectRide,
    arriveAtPickup,
    arriveAtDrop,
    startRide,
    completeRide,
  } = useRider();
  const { showToast } = useToast();
  const [otp, setOtp] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  const pickupEval = useMemo(
    () => evaluateDriverGeofence(driverGps, activeRide?.pickup, 'pickup'),
    [driverGps, activeRide?.pickup]
  );

  const dropEval = useMemo(
    () => evaluateDriverGeofence(driverGps, activeRide?.drop, 'drop'),
    [driverGps, activeRide?.drop]
  );

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

  // 1. ACTIVE RIDE (Accepted / Arrived / Ongoing / Drop Arrived)
  if (activeRide) {
    const rawId = (activeRide as any)?.id || activeRide._id || '';
    const cleanDisplayId = (activeRide as any)?.displayId || `DM-${rawId.slice(-6).toUpperCase()}`;

    return (
      <View style={styles.panel}>
        <View style={styles.handle} />
        <View style={styles.rideIdTopBar}>
          <TouchableOpacity
            style={styles.rideIdTag}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Ride Reference', `Ride ID: #${cleanDisplayId}\nFull Reference: ${rawId}`)}
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
          {activeRide.status === 'accepted'
            ? 'Head to Pickup Point'
            : activeRide.status === 'arrived'
            ? 'Waiting for Passenger'
            : activeRide.status === 'drop_arrived'
            ? 'Reached Drop Location'
            : 'Trip in Progress'}
        </Text>

        <View style={styles.customerBox}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {(activeRide.customer?.name || 'C')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.custName}>{activeRide.customer?.name || 'Customer'}</Text>
            <Text style={styles.custPhone}>+91 {activeRide.customer?.phone || 'Unknown'}</Text>
          </View>
          {activeRide.customer?.phone && (
            <TouchableOpacity
              style={styles.callCustBtn}
              onPress={() => Linking.openURL(`tel:${activeRide.customer?.phone}`)}
            >
              <Ionicons name="call" size={15} color="#059669" />
            </TouchableOpacity>
          )}
          <Text style={styles.fare}>₹{activeRide.fare}</Text>
        </View>

        <View style={styles.dropPreviewRow}>
          <Ionicons name="location" size={16} color="#f72585" />
          <Text style={styles.dropPreviewText} numberOfLines={1}>
            {activeRide.status === 'accepted' ? `Pickup: ${activeRide.pickup.address}` : `Drop: ${activeRide.drop.address}`}
          </Text>
        </View>

        {activeRide.status === 'arrived' && (
          <View style={styles.waitBox}>
            <Text style={styles.waitBoxLabel}>Passenger Wait Time</Text>
            <Text style={[styles.waitBoxTime, waitTime > 180000 && { color: '#dc2626' }]}>
              {formatTime(waitTime)}
            </Text>
            {waitTime > 180000 && (
              <Text style={styles.waitExtraNote}>Extra waiting charges applying (₹2/min)</Text>
            )}
          </View>
        )}

        {activeRide.status === 'accepted' && (
          <GeofenceArrivalCard
            mode="pickup"
            evaluation={pickupEval}
            isSubmitting={isArrivalSubmitting}
            onPressArrive={arriveAtPickup}
            onRefreshGps={refreshCurrentGps}
            variant="light"
          />
        )}

        {activeRide.status === 'arrived' && (
          <TouchableOpacity style={styles.btnBlack} onPress={() => setOtpModalVisible(true)}>
            <Text style={styles.btnText}>Start Trip (Enter Customer OTP)</Text>
          </TouchableOpacity>
        )}

        {activeRide.status === 'ongoing' && (
          <GeofenceArrivalCard
            mode="drop"
            evaluation={dropEval}
            isSubmitting={isArrivalSubmitting}
            onPressArrive={arriveAtDrop}
            onRefreshGps={refreshCurrentGps}
            variant="light"
          />
        )}

        {activeRide.status === 'drop_arrived' && (
          <View>
            <View style={styles.dropArrivedBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.dropArrivedBannerText}>
                Verified within 50m drop radius • Ready to collect ₹{activeRide.fare}
              </Text>
            </View>
            <SwipeButton title="Swipe to Complete Trip" onSwipeSuccess={completeRide} buttonColor="#10b981" />
          </View>
        )}

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

        <Modal visible={otpModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Customer Start OTP</Text>
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
                  <Text style={{ fontWeight: '700', color: '#475569' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnBlack}
                  onPress={async () => {
                    const success = await startRide(otp);
                    if (success) setOtpModalVisible(false);
                  }}
                >
                  <Text style={styles.btnText}>Verify & Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // 2. INCOMING RIDE REQUEST (with Surge Badge!)
  if (isOnline && incomingRequest) {
    const reqSurge = Number(incomingRequest.surgeMultiplier || 1.0);
    const hasSurge = reqSurge > 1.04;

    return (
      <View style={[styles.panel, styles.requestPanel]}>
        <View style={styles.handle} />

        <View style={styles.requestTopRow}>
          <Text style={styles.requestTitle}>New Ride Request</Text>
          {hasSurge && (
            <View style={styles.requestSurgeBadge}>
              <Ionicons name="flame" size={13} color="#ffffff" />
              <Text style={styles.requestSurgeText}>{reqSurge.toFixed(1)}x SURGE BONUS</Text>
            </View>
          )}
        </View>

        <View style={styles.requestRouteBox}>
          <View style={styles.reqPointRow}>
            <View style={[styles.reqDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.reqAddr} numberOfLines={2}>
              {incomingRequest.pickup.address}
            </Text>
          </View>
          <View style={styles.reqLine} />
          <View style={styles.reqPointRow}>
            <View style={[styles.reqDot, { backgroundColor: '#f72585' }]} />
            <Text style={styles.reqAddr} numberOfLines={2}>
              {incomingRequest.drop.address}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={[styles.statCellVal, { color: '#059669' }]}>₹{incomingRequest.fare}</Text>
            <Text style={styles.statCellLabel}>Est. Payout</Text>
          </View>
          <View style={styles.statCellDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statCellVal}>{incomingRequest.distance} km</Text>
            <Text style={styles.statCellLabel}>Trip Dist</Text>
          </View>
          <View style={styles.statCellDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statCellVal}>{Math.ceil(incomingRequest.duration)} min</Text>
            <Text style={styles.statCellLabel}>Duration</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => {
              rejectRide();
              showToast({ title: 'Ride Skipped', message: 'Looking for another ride...', type: 'info' });
            }}
          >
            <Text style={styles.rejectText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={() => {
              acceptRide();
              showToast({ title: 'Ride Accepted!', message: 'Navigate to pickup location.', type: 'success' });
            }}
          >
            <Text style={styles.btnText}>Accept Ride • ₹{incomingRequest.fare}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. OFFLINE OR ONLINE IDLE PANEL — Show Live User Traffic & Surge Hotspots
  const multiplier = surgeStatus?.multiplier ?? 1.0;
  const isSurgeHot = Boolean(surgeStatus?.isSurgeActive && multiplier > 1.04);
  const hotZones = surgeStatus?.hotZones || [];

  return (
    <View style={styles.panel}>
      <View style={styles.handle} />

      <View style={styles.idleHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitle}>
            {isOnline ? 'Scanning High-Demand Areas...' : 'You are Currently Offline'}
          </Text>
          <Text style={styles.idleSubText}>
            {isSurgeHot
              ? `${multiplier.toFixed(1)}x Surge active • ${surgeStatus?.reason}`
              : `${surgeStatus?.trafficLevel || 'Smooth'} road traffic • Normal rates`}
          </Text>
        </View>
        {!isOnline && (
          <TouchableOpacity style={styles.goOnlineQuickBtn} onPress={toggleOnline} activeOpacity={0.85}>
            <Text style={styles.goOnlineQuickText}>Go Online</Text>
          </TouchableOpacity>
        )}
      </View>

      {hotZones.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.hotspotSectionLabel}>LIVE USER TRAFFIC & SURGE HOTSPOTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {hotZones.map((zone) => {
              const hot = zone.surgeMultiplier > 1.05;
              return (
                <TouchableOpacity
                  key={zone.id}
                  style={[styles.zoneCard, hot && styles.zoneCardHot]}
                  onPress={() => navigation.navigate('GoToArea')}
                  activeOpacity={0.8}
                >
                  <View style={styles.zoneCardTop}>
                    <Text style={styles.zoneCardName} numberOfLines={1}>
                      {zone.name}
                    </Text>
                    <View style={[styles.zoneMultPill, hot ? styles.zoneMultHot : styles.zoneMultNormal]}>
                      <Text style={[styles.zoneMultText, hot ? { color: '#f72585' } : { color: '#059669' }]}>
                        {zone.surgeMultiplier.toFixed(1)}x
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.zoneCardMeta}>
                    {zone.demandLevel} • {zone.pendingRiders} riders waiting
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// MAIN DASHBOARD SCREEN
// ─────────────────────────────────────────────
export default function RiderDashboard({ navigation }: any) {
  const [showTraffic, setShowTraffic] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);

  useEffect(() => {
    riderService
      .getProfile()
      .then((profile) => {
        if (profile?.todayEarnings != null) {
          setTodayEarnings(Number(profile.todayEarnings) || 0);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <MapArea showTraffic={showTraffic} />

      <View style={styles.overlay} pointerEvents="box-none">
        <HeaderToggle
          navigation={navigation}
          showTraffic={showTraffic}
          onToggleTraffic={() => setShowTraffic((p) => !p)}
          todayEarnings={todayEarnings}
        />
      </View>

      <View style={styles.floatingShortcutsContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.floatingShortcutBtn}
          onPress={() => navigation.navigate('GoToArea')}
          activeOpacity={0.82}
          accessibilityLabel="Open Go To Area"
        >
          <Ionicons name="navigate-circle" size={18} color="#f72585" />
          <Text style={styles.floatingShortcutText}>Go To Area</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingShortcutBtn}
          onPress={() => navigation.navigate('Performance')}
          activeOpacity={0.82}
          accessibilityLabel="Open Performance Hub"
        >
          <Ionicons name="trophy" size={16} color="#f59e0b" />
          <Text style={styles.floatingShortcutText}>Score</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        <BottomPanel navigation={navigation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e2e8f0' },
  loadingMap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  loadingMapText: { marginTop: 10, fontSize: 13, fontWeight: '700', color: '#475569', textAlign: 'center' },
  retryGpsBtn: {
    marginTop: 12,
    backgroundColor: '#f72585',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  retryGpsBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  dropArrivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 4,
  },
  dropArrivedBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  map: { flex: 1 },
  overlay: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 38, left: 14, right: 14, zIndex: 25 },

  headerWrapper: { gap: 8 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  headerOn: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.45)' },
  headerOff: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.25)' },
  statusInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dutyDot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: { color: '#ffffff', fontWeight: '900', fontSize: 14, letterSpacing: 0.4 },
  headerSub: { color: '#cbd5e1', fontSize: 11.5, marginTop: 2, fontWeight: '600' },
  menuButton: { padding: 6, marginRight: 6 },
  notifButton: { padding: 7, position: 'relative', marginRight: 6 },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f72585',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },

  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  surgeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },
  surgeChipHot: {
    backgroundColor: 'rgba(24, 15, 38, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.5)',
  },
  surgeChipNormal: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  surgeChipText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  trafficChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 4,
  },
  trafficChipBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  trafficChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },

  goToAreaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.4)',
  },
  goToAreaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  goToAreaBannerText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  floatingShortcutsContainer: {
    position: 'absolute',
    right: 14,
    top: Platform.OS === 'ios' ? 168 : 156,
    gap: 8,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  floatingShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 5,
  },
  floatingShortcutText: { fontSize: 12, fontWeight: '800', color: '#0f172a' },

  bottomContainer: { position: 'absolute', bottom: 0, width: '100%', zIndex: 30 },
  panel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    elevation: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  requestPanel: { borderTopWidth: 4, borderColor: '#f72585' },
  panelTitle: { fontSize: 17.5, fontWeight: '900', color: '#0f172a' },

  idleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  idleSubText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  goOnlineQuickBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  goOnlineQuickText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  hotspotSectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  zoneCard: {
    width: 175,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  zoneCardHot: {
    backgroundColor: '#fff1f5',
    borderColor: '#fecdd3',
  },
  zoneCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  zoneCardName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  zoneMultPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  zoneMultHot: {
    backgroundColor: 'rgba(247, 37, 133, 0.14)',
  },
  zoneMultNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  zoneMultText: {
    fontSize: 11,
    fontWeight: '900',
  },
  zoneCardMeta: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },

  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  requestSurgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f72585',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  requestSurgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  requestRouteBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  reqPointRow: { flexDirection: 'row', alignItems: 'center' },
  reqDot: { width: 9, height: 9, borderRadius: 4.5, marginRight: 10 },
  reqLine: { width: 2, height: 12, backgroundColor: '#cbd5e1', marginLeft: 3.5, marginVertical: 3 },
  reqAddr: { fontSize: 13, fontWeight: '700', color: '#1e293b', flex: 1 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    alignItems: 'center',
  },
  statCell: { flex: 1, alignItems: 'center' },
  statCellVal: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  statCellLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  statCellDivider: { width: 1, height: 26, backgroundColor: '#e2e8f0' },

  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { flex: 0.34, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  rejectText: { color: '#dc2626', fontWeight: '800', fontSize: 14.5 },
  acceptBtn: { flex: 1, backgroundColor: '#10b981' },
  btnBlack: { backgroundColor: '#0f172a', padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 10, flex: 1 },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },

  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 10,
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  custName: { fontWeight: '800', fontSize: 15, color: '#0f172a' },
  custPhone: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  callCustBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fare: { fontSize: 18, fontWeight: '900', color: '#059669' },
  dropPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dropPreviewText: { fontSize: 12.5, color: '#334155', fontWeight: '600', flex: 1 },
  waitBox: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  waitBoxLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  waitBoxTime: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 2 },
  waitExtraNote: { color: '#dc2626', fontSize: 11.5, fontWeight: '700', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 14 },
  otpInput: {
    borderBottomWidth: 2,
    borderColor: '#0f172a',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 10,
    marginBottom: 20,
    paddingVertical: 8,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  btnOutline: {
    flex: 1,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  rideIdTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rideIdTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  rideIdTagLabel: { fontSize: 10, fontWeight: '800', color: '#f72585', marginRight: 4 },
  rideIdTagText: { fontSize: 12, fontWeight: '800', color: '#0f172a', letterSpacing: 0.5 },
  driverSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  driverSupportBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
