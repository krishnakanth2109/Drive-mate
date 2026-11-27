import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { riderService } from '../../services/riderService';
import { RiderEarningsData } from '../../services/types';
import { extractApiErrorMessage } from '../../services/api';

export default function EarningsScreen({ navigation }: any) {
  const [earnings, setEarnings] = useState<RiderEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      setError(null);
      const data = await riderService.getEarnings();
      setEarnings(data);
    } catch (err: any) {
      setError(extractApiErrorMessage(err, 'Unable to load earnings data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleCashOut = () => {
    if (navigation) {
      navigation.navigate('Wallet');
    } else {
      Alert.alert('Cash Out', 'Redirecting to Wallet for transfer to your linked bank account.');
    }
  };

  const transactions = earnings?.historySummary || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEarnings(); }} colors={['#2ecc71']} />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Balance</Text>
        <Text style={styles.heroAmount}>
          ₹{loading && !earnings ? '...' : Number(earnings?.totalBalance ?? 0).toLocaleString('en-IN')}
        </Text>
        <TouchableOpacity style={styles.cashOutBtn} onPress={handleCashOut}>
          <Text style={styles.cashOutText}>Cash Out to Bank</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={{ margin: 20, padding: 14, backgroundColor: '#fef2f2', borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</Text>
          <TouchableOpacity onPress={fetchEarnings}>
            <Text style={{ color: '#f72585', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loading && !earnings ? (
        <ActivityIndicator size="large" color="#2ecc71" style={{ marginTop: 32 }} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Weekly Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{earnings?.weeklyTrips ?? 0}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{earnings?.onlineHours || '0h 0m'}</Text>
              <Text style={styles.statLabel}>Drive Time</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Recent Earnings Breakdown</Text>
          <View style={styles.listContainer}>
            {transactions.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 16 }}>
                No completed trip earnings recorded yet.
              </Text>
            ) : (
              transactions.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View>
                    <Text style={styles.rowTitle}>{item.day}</Text>
                    <Text style={styles.rowSub}>{item.rides} rides completed</Text>
                  </View>
                  <Text style={styles.rowAmount}>+₹{item.amount}</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  heroCard: { backgroundColor: '#1a1a2e', padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  heroLabel: { color: '#a0a0b0', fontSize: 16, marginBottom: 8 },
  heroAmount: { color: '#fff', fontSize: 48, fontWeight: '900', marginBottom: 20 },
  cashOutBtn: { backgroundColor: '#2ecc71', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 25 },
  cashOutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', margin: 20, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 15 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statVal: { fontSize: 24, fontWeight: '800', color: '#333' },
  statLabel: { fontSize: 14, color: '#888', marginTop: 4 },
  listContainer: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  rowSub: { fontSize: 13, color: '#888', marginTop: 4 },
  rowAmount: { fontSize: 16, fontWeight: 'bold', color: '#2ecc71' }
});
