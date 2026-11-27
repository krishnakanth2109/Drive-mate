import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { Ride } from '../../services/types';

export default function OrderDetailsScreen({ navigation, route }: any) {
  const initialRide: Ride | null = route?.params?.ride || null;
  const rideId: string = route?.params?.rideId || initialRide?._id || '';

  const [ride, setRide] = useState<Ride | null>(initialRide);
  const [loading, setLoading] = useState(!initialRide && !!rideId);

  useEffect(() => {
    if (rideId) {
      riderService.getRideDetails(rideId)
        .then(data => setRide(data))
        .catch(err => console.log('Failed to fetch ride details:', err))
        .finally(() => setLoading(false));
    }
  }, [rideId]);

  const dateFormatted = ride?.createdAt
    ? new Date(ride.createdAt).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const isCompleted = ride?.status === 'completed';
  const fare = Number(ride?.fare ?? 0);
  const distance = ride?.distance ? `${ride.distance} km` : '0 km';
  const duration = ride?.duration ? `${ride.duration} mins` : '0 mins';
  const waitCharges = Number(ride?.waitCharges ?? 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Order {ride?._id ? `#${ride._id.slice(-6).toUpperCase()}` : ''}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#f72585" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusCard}>
            <Text style={[styles.statusText, { color: isCompleted ? '#4CAF50' : '#f72585' }]}>
              {ride?.status ? ride.status.toUpperCase() : 'COMPLETED'}
            </Text>
            <Text style={styles.dateText}>{dateFormatted}</Text>
          </View>

          <View style={styles.routeCard}>
            <View style={styles.routePoint}>
              <Ionicons name="radio-button-on" size={16} color="#4CAF50" />
              <Text style={styles.pointText}>{ride?.pickup?.address || 'Pickup Location'}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <Ionicons name="location" size={16} color="#f72585" />
              <Text style={styles.pointText}>{ride?.drop?.address || 'Dropoff Location'}</Text>
            </View>
          </View>

          <View style={styles.earningsCard}>
            <Text style={styles.earningsTitle}>Trip Earnings & Fare</Text>
            
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Vehicle Type</Text>
              <Text style={styles.earningsValue}>{ride?.vehicleType ? ride.vehicleType.toUpperCase() : 'BIKE'}</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Distance ({distance})</Text>
              <Text style={styles.earningsValue}>₹{Math.round(fare * 0.7)}</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Duration ({duration})</Text>
              <Text style={styles.earningsValue}>₹{Math.round(fare * 0.3)}</Text>
            </View>
            {waitCharges > 0 && (
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Waiting Charges</Text>
                <Text style={styles.earningsValue}>+₹{waitCharges}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.earningsRow}>
              <Text style={styles.totalLabel}>Total Payout</Text>
              <Text style={styles.totalValue}>₹{fare}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => navigation.navigate('RaiseTicket', { rideId: ride?._id, type: 'fare_issue' })}
          >
            <Ionicons name="help-circle-outline" size={20} color="#f72585" />
            <Text style={styles.helpText}>Get help with this trip</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2C' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: '#2a2a3c' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#1E1E2C' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  statusCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2a2a3c', padding: 20, borderRadius: 15, marginBottom: 20 },
  statusText: { color: '#4CAF50', fontSize: 18, fontWeight: 'bold' },
  dateText: { color: '#a0a0b0', fontSize: 14 },
  routeCard: { backgroundColor: '#2a2a3c', padding: 20, borderRadius: 15, marginBottom: 20 },
  routePoint: { flexDirection: 'row', alignItems: 'center' },
  pointText: { color: '#fff', marginLeft: 10, fontSize: 16 },
  routeLine: { width: 2, height: 20, backgroundColor: '#3b3b4f', marginLeft: 7, marginVertical: 5 },
  earningsCard: { backgroundColor: '#2a2a3c', padding: 20, borderRadius: 15, marginBottom: 20 },
  earningsTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  earningsLabel: { color: '#a0a0b0', fontSize: 15 },
  earningsValue: { color: '#fff', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#3b3b4f', marginVertical: 15 },
  totalLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  totalValue: { color: '#f72585', fontSize: 18, fontWeight: 'bold' },
  helpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#3b3b4f' },
  helpText: { color: '#f72585', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});
