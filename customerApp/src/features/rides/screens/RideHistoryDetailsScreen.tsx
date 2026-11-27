import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { rideHistoryService } from '../services/rideHistoryService';
import { extractApiErrorMessage } from '../../../services/api';

export default function RideHistoryDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = route?.params?.rideId;
  const initialRide = route?.params?.ride || null;

  const [ride, setRide] = useState<any>(initialRide);
  const [loading, setLoading] = useState(!initialRide && !!rideId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId) return;
    rideHistoryService
      .getRideById(String(rideId))
      .then((res) => setRide(res))
      .catch((err) => {
        if (!initialRide) setError(extractApiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [rideId]);

  const fare = Number(ride?.fare ?? 0);
  const status = String(ride?.status || '').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f72585" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errText}>{error}</Text>
        </View>
      ) : !ride ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Ride details unavailable.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.status}>{status || 'RIDE'}</Text>
            <Text style={styles.date}>
              {ride.createdAt ? new Date(ride.createdAt).toLocaleString('en-IN') : ''}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.label}>PICKUP</Text>
            <Text style={styles.val}>{ride.pickup?.address || ride.pickupAddress}</Text>
            <Text style={[styles.label, { marginTop: 12 }]}>DROP</Text>
            <Text style={styles.val}>{ride.drop?.address || ride.dropAddress}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fare Breakdown</Text>
            <View style={styles.row}>
              <Text style={styles.muted}>Base / Trip Fare</Text>
              <Text style={styles.bold}>₹{Math.max(0, fare - Number(ride.waitCharges || 0))}</Text>
            </View>
            {Number(ride.waitCharges || 0) > 0 ? (
              <View style={styles.row}>
                <Text style={styles.muted}>Waiting Charges</Text>
                <Text style={styles.bold}>₹{Number(ride.waitCharges)}</Text>
              </View>
            ) : null}
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalVal}>₹{fare}</Text>
            </View>
          </View>

          {ride.rider?.name ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Driver</Text>
              <Text style={styles.val}>{ride.rider.name}</Text>
              {ride.rider.vehicleType ? (
                <Text style={styles.muted}>{String(ride.rider.vehicleType).toUpperCase()}</Text>
              ) : null}
            </View>
          ) : null}

          {String(ride.status).toLowerCase() === 'completed' ? (
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => navigation.navigate('RateDriver', { rideId: ride._id || ride.id, driverName: ride.rider?.name })}
            >
              <Text style={styles.rateBtnText}>Rate Driver</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: Platform.OS === 'android' ? 36 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errText: { color: '#ef4444' },
  muted: { color: '#64748b', fontSize: 14 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  status: { fontSize: 16, fontWeight: '800', color: '#10b981' },
  date: { fontSize: 12, color: '#64748b', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  label: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  val: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bold: { fontWeight: '600', color: '#0f172a' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  totalVal: { fontSize: 18, fontWeight: '800', color: '#f72585' },
  rateBtn: { backgroundColor: '#f72585', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  rateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
