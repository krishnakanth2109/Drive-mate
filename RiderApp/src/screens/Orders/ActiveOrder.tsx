import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { riderService } from '../../services/riderService';
import { Ride } from '../../services/types';

export default function ActiveOrderScreen({ navigation }: any) {
  const { activeRide, arriveAtPickup } = useRider();
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
  const pickupAddress = rideData?.pickup?.address || '123 Main St, Apartment 4B';
  const dropAddress = rideData?.drop?.address || 'Destination';

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
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={80} color="#f72585" />
        <Text style={styles.mapText}>Live Tracking Map</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('PickupNavigation')}>
          <Ionicons name="navigate" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        <Text style={styles.statusTitle}>
          {rideData?.status === 'arrived' ? 'Waiting for Customer' : 'Picking up Customer'}
        </Text>
        <Text style={styles.timeText}>
          {rideData?.distance ? `${rideData.distance} km away` : '1.2 km away'} • ₹{rideData?.fare || 150}
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

        {rideData?.status !== 'arrived' ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleArrive} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Arrived at Pickup</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#2ecc71' }]}
            onPress={() => navigation.navigate('DashboardRoot')}
          >
            <Text style={styles.primaryBtnText}>Enter Customer OTP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2C' },
  mapPlaceholder: { flex: 1, backgroundColor: '#2a2a3c', justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#a0a0b0', marginTop: 10, fontSize: 16 },
  navBtn: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#f72585', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#f72585', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4 },
  bottomSheet: { backgroundColor: '#1E1E2C', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#3b3b4f', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  statusTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  timeText: { fontSize: 16, color: '#f72585', fontWeight: '600', marginBottom: 20 },
  customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a3c', padding: 15, borderRadius: 15, marginBottom: 20 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3b3b4f', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  customerInfo: { flex: 1 },
  customerName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { color: '#a0a0b0', marginLeft: 4, fontSize: 14 },
  actionButtons: { flexDirection: 'row' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(247, 37, 133, 0.1)', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  locationInfo: { backgroundColor: '#2a2a3c', padding: 15, borderRadius: 15, marginBottom: 20 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  locText: { color: '#fff', marginLeft: 10, flex: 1, fontSize: 16 },
  primaryBtn: { backgroundColor: '#f72585', padding: 18, borderRadius: 15, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
