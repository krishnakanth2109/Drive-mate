import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { riderService } from '../../services/riderService';
import { Ride } from '../../services/types';
import RiderWebMapView from '../../components/RiderWebMapView';
import DriverInRideSupportModal from '../../components/DriverInRideSupportModal';
import GeofenceArrivalCard from '../../components/GeofenceArrivalCard';
import { evaluateDriverGeofence } from '../../utils/geofence';

// Decode encoded polyline helper
const decodePolyline = (t: string): { latitude: number; longitude: number }[] => {
  if (!t || t === 'encoded_polyline_placeholder') return [];
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  const len = t.length;
  let lat = 0;
  let lng = 0;
  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

// 3-Minute Waiting Timer for Driver
const DriverWaitTimer = ({ arrivedAt }: { arrivedAt?: string | null }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [extraMinutes, setExtraMinutes] = useState<number>(0);

  useEffect(() => {
    const calculateTime = () => {
      const arrivedTime = arrivedAt ? new Date(arrivedAt).getTime() : Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - arrivedTime) / 1000));
      const freeSeconds = 180;
      if (elapsedSeconds < freeSeconds) {
        setSecondsRemaining(freeSeconds - elapsedSeconds);
        setIsExpired(false);
        setExtraMinutes(0);
      } else {
        setSecondsRemaining(0);
        setIsExpired(true);
        const extraSecs = elapsedSeconds - freeSeconds;
        setExtraMinutes(Math.max(1, Math.ceil(extraSecs / 60)));
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [arrivedAt]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <View style={[styles.waitBadge, isExpired && styles.waitBadgeExpired]}>
      <Ionicons name="time" size={16} color={isExpired ? '#e63946' : '#2ecc71'} />
      {!isExpired ? (
        <Text style={styles.waitBadgeText}>
          Customer boarding time: <Text style={{ fontWeight: 'bold', color: '#2ecc71' }}>{timeFormatted}</Text>
        </Text>
      ) : (
        <Text style={[styles.waitBadgeText, { color: '#e63946' }]}>
          Free wait expired (+₹{extraMinutes * 2} wait fee active)
        </Text>
      )}
    </View>
  );
};

export default function ActiveOrderScreen({ navigation }: any) {
  const {
    activeRide,
    arriveAtPickup,
    arriveAtDrop,
    completeRide,
    location,
    driverGps,
    isArrivalSubmitting,
    refreshCurrentGps,
  } = useRider();
  const [rideData, setRideData] = useState<Ride | null>(activeRide);
  const [completing, setCompleting] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);

  useEffect(() => {
    if (activeRide) {
      setRideData(activeRide);
    } else {
      riderService.getActiveRide()
        .then(data => setRideData(data))
        .catch(err => console.log('No active ride fetched', err));
    }
  }, [activeRide]);

  const displayRideId = rideData?.displayId || (rideData?._id || rideData?.id ? `DM-${(rideData?._id || rideData?.id || '').slice(-6).toUpperCase()}` : 'DM-ACTIVE');

  const customerName = rideData?.customer?.name || 'Customer';
  const customerPhone = rideData?.customer?.phone || '+91 98765 43210';
  const pickupAddress = rideData?.pickup?.address || 'Pickup Location';
  const dropAddress = rideData?.drop?.address || 'Destination';

  const pickupCoord = rideData?.pickup?.lat != null && rideData?.pickup?.lng != null ? {
    lat: Number(rideData.pickup.lat),
    lng: Number(rideData.pickup.lng),
  } : null;

  const dropCoord = rideData?.drop?.lat != null && rideData?.drop?.lng != null ? {
    lat: Number(rideData.drop.lat),
    lng: Number(rideData.drop.lng),
  } : null;

  const routeCoords = rideData?.polyline ? decodePolyline(rideData.polyline) : [];

  const handleCall = () => {
    Linking.openURL(`tel:${customerPhone}`);
  };

  const handleChat = () => {
    navigation.navigate('ChatScreen', { customerName, customerPhone });
  };

  const handleArrivePickup = async () => {
    const ok = await arriveAtPickup();
    if (ok) {
      Alert.alert('Arrived', 'Customer notified that you have arrived at pickup location!');
    }
  };

  const handleArriveDrop = async () => {
    const ok = await arriveAtDrop();
    if (ok) {
      Alert.alert('Destination Reached', 'Drop arrival confirmed! Collect fare and complete the trip.');
    }
  };

  const handleCompleteTrip = async () => {
    setCompleting(true);
    try {
      const ok = await completeRide();
      if (ok) {
        const rideId = rideData?._id || rideData?.id;
        if (rideId) navigation.replace('OrderDetails', { rideId });
        else navigation.replace('MainTabs');
      }
    } finally {
      setCompleting(false);
    }
  };

  const isGoingToPickup = !rideData?.status || rideData.status === 'accepted';
  const isGoingToDrop = rideData?.status === 'ongoing';

  const pickupEval = useMemo(
    () => evaluateDriverGeofence(driverGps, pickupCoord, 'pickup'),
    [driverGps, pickupCoord?.lat, pickupCoord?.lng]
  );

  const dropEval = useMemo(
    () => evaluateDriverGeofence(driverGps, dropCoord, 'drop'),
    [driverGps, dropCoord?.lat, dropCoord?.lng]
  );

  return (
    <View style={styles.container}>
      {/* Interactive Map View */}
      <View style={styles.mapArea}>
        <RiderWebMapView
          center={location || (pickupCoord ? { latitude: pickupCoord.lat, longitude: pickupCoord.lng } : null)}
          pickupCoord={pickupCoord}
          dropCoord={dropCoord}
          routeCoords={routeCoords}
          activeGeofenceTarget={isGoingToPickup ? 'pickup' : isGoingToDrop ? 'drop' : null}
          isWithinGeofence={isGoingToPickup ? pickupEval.isWithinRadius : isGoingToDrop ? dropEval.isWithinRadius : false}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() =>
            navigation.navigate(
              rideData?.status === 'ongoing' || rideData?.status === 'drop_arrived'
                ? 'DropNavigation'
                : 'PickupNavigation'
            )
          }
          accessibilityLabel="Open turn-by-turn navigation"
        >
          <Ionicons name="navigate" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        {/* Ride ID & Support Bar */}
        <View style={styles.topInfoRow}>
          <View style={styles.idBadge}>
            <Ionicons name="receipt-outline" size={13} color="#f72585" />
            <Text style={styles.idBadgeText}>#{displayRideId}</Text>
          </View>
          <TouchableOpacity
            style={styles.supportHeaderBtn}
            onPress={() => setSupportVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Open in-ride support"
          >
            <Ionicons name="headset-outline" size={14} color="#00f2fe" />
            <Text style={styles.supportHeaderBtnText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.statusTitle}>
          {rideData?.status === 'arrived'
            ? 'Waiting for Customer'
            : rideData?.status === 'ongoing'
            ? 'Heading to Destination'
            : rideData?.status === 'drop_arrived'
            ? 'Reached Drop Location'
            : 'Picking up Customer'}
        </Text>
        <Text style={styles.timeText}>
          {rideData?.distance ? `${rideData.distance} km total` : 'En route'} • ₹{rideData?.fare || 0}
        </Text>

        {rideData?.status === 'arrived' && (
          <DriverWaitTimer arrivedAt={rideData.arrivedAt} />
        )}

        <View style={styles.customerCard}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#a0a0b0" />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customerName}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleChat}>
              <Ionicons name="chatbubble" size={20} color="#f72585" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#2ecc71" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.locationInfo}>
          <View style={styles.locRow}>
            <Ionicons name="radio-button-on" size={18} color="#2ecc71" />
            <Text style={styles.locText} numberOfLines={1}>{pickupAddress}</Text>
          </View>
          <View style={[styles.locRow, { marginTop: 8 }]}>
            <Ionicons name="location" size={18} color="#f72585" />
            <Text style={styles.locText} numberOfLines={1}>{dropAddress}</Text>
          </View>
        </View>

        {isGoingToPickup ? (
          <GeofenceArrivalCard
            mode="pickup"
            evaluation={pickupEval}
            isSubmitting={isArrivalSubmitting}
            onPressArrive={handleArrivePickup}
            onRefreshGps={refreshCurrentGps}
            variant="dark"
          />
        ) : rideData?.status === 'arrived' ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#2ecc71' }]}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.primaryBtnText}>Enter Customer OTP</Text>
          </TouchableOpacity>
        ) : rideData?.status === 'ongoing' ? (
          <GeofenceArrivalCard
            mode="drop"
            evaluation={dropEval}
            isSubmitting={isArrivalSubmitting}
            onPressArrive={handleArriveDrop}
            onRefreshGps={refreshCurrentGps}
            variant="dark"
          />
        ) : rideData?.status === 'drop_arrived' ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#10b981' }]}
            onPress={handleCompleteTrip}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Complete Trip • ₹{rideData?.fare || 0}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#4CAF50' }]}
            onPress={() => navigation.navigate('DropNavigation')}
          >
            <Text style={styles.primaryBtnText}>View Drop Navigation</Text>
          </TouchableOpacity>
        )}
      </View>

      <DriverInRideSupportModal
        visible={supportVisible}
        onClose={() => setSupportVisible(false)}
        rideId={rideData?._id || rideData?.id}
        displayId={displayRideId}
        customerName={customerName}
        customerPhone={customerPhone}
        rideStatus={rideData?.status}
        driverArrivedAt={rideData?.arrivedAt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2C' },
  mapArea: { flex: 1, backgroundColor: '#242436', position: 'relative' },
  navBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#f72585',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 10,
  },
  bottomSheet: {
    backgroundColor: '#1E1E2C',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: { width: 40, height: 5, backgroundColor: '#3b3b4f', borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(247, 37, 133, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.3)',
  },
  idBadgeText: {
    color: '#f72585',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  supportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.35)',
  },
  supportHeaderBtnText: {
    color: '#00f2fe',
    fontSize: 12,
    fontWeight: '700',
  },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  timeText: { fontSize: 15, color: '#f72585', fontWeight: '600', marginBottom: 18 },
  customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a3c', padding: 14, borderRadius: 14, marginBottom: 16 },
  avatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#3b3b4f', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  customerInfo: { flex: 1 },
  customerName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { color: '#a0a0b0', marginLeft: 4, fontSize: 13 },
  actionButtons: { flexDirection: 'row' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(247, 37, 133, 0.1)', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  locationInfo: { backgroundColor: '#2a2a3c', padding: 14, borderRadius: 14, marginBottom: 18 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  locText: { color: '#fff', marginLeft: 10, flex: 1, fontSize: 14 },
  primaryBtn: { backgroundColor: '#f72585', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b3b2b',
    borderWidth: 1,
    borderColor: '#2ecc71',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  waitBadgeExpired: {
    backgroundColor: '#3b1b22',
    borderColor: '#e63946',
  },
  waitBadgeText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
});
