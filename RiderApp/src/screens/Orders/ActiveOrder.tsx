import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { riderService } from '../../services/riderService';
import { Ride } from '../../services/types';
import RiderWebMapView from '../../components/RiderWebMapView';

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

export default function ActiveOrderScreen({ navigation }: any) {
  const { activeRide, arriveAtPickup, location } = useRider();
  const [rideData, setRideData] = useState<Ride | null>(activeRide);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeRide) {
      setRideData(activeRide);
    } else {
      riderService.getActiveRide()
        .then(data => setRideData(data))
        .catch(err => console.log('No active ride fetched', err));
    }
  }, [activeRide]);

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

  const handleArrive = async () => {
    setLoading(true);
    try {
      const ok = await arriveAtPickup();
      if (ok) {
        Alert.alert('Arrived', 'Customer notified that you have arrived at pickup location!');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update arrival status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Interactive Map View */}
      <View style={styles.mapArea}>
        <RiderWebMapView
          center={location || (pickupCoord ? { latitude: pickupCoord.lat, longitude: pickupCoord.lng } : null)}
          pickupCoord={pickupCoord}
          dropCoord={dropCoord}
          routeCoords={routeCoords}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate(rideData?.status === 'ongoing' ? 'DropNavigation' : 'PickupNavigation')}
          accessibilityLabel="Open turn-by-turn navigation"
        >
          <Ionicons name="navigate" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        <Text style={styles.statusTitle}>
          {rideData?.status === 'arrived'
            ? 'Waiting for Customer'
            : rideData?.status === 'ongoing'
            ? 'Heading to Destination'
            : 'Picking up Customer'}
        </Text>
        <Text style={styles.timeText}>
          {rideData?.distance ? `${rideData.distance} km total` : 'En route'} • ₹{rideData?.fare || 0}
        </Text>

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

        {rideData?.status !== 'arrived' && rideData?.status !== 'ongoing' ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleArrive} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Arrived at Pickup</Text>}
          </TouchableOpacity>
        ) : rideData?.status === 'arrived' ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#2ecc71' }]}
            onPress={() => navigation.navigate('DashboardRoot')}
          >
            <Text style={styles.primaryBtnText}>Enter Customer OTP</Text>
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
  dragHandle: { width: 40, height: 5, backgroundColor: '#3b3b4f', borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
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
});
