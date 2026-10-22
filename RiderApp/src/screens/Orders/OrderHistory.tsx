import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { Ride } from '../../services/types';

export default function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await riderService.getRideHistory();
      setHistory(data);
    } catch (err) {
      console.log('Failed to fetch ride history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'completed';
    const dateFormatted = item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Today';

    const pickupText = item.pickup?.address || 'Pickup Location';
    const dropText = item.drop?.address || 'Dropoff Location';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('OrderDetails', { rideId: item._id, ride: item })}
      >
        <View style={styles.row}>
          <Text style={styles.date}>{dateFormatted}</Text>
          <Text style={[styles.status, { color: isCompleted ? '#2ecc71' : '#e74c3c' }]}>
            {item.status ? item.status.toUpperCase() : 'COMPLETED'}
          </Text>
        </View>

        <View style={styles.locContainer}>
          <Text style={styles.dot} numberOfLines={1}>🟢 {pickupText}</Text>
          <Text style={styles.dot} numberOfLines={1}>🔴 {dropText}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.vehicleType}>{item.vehicleType ? item.vehicleType.toUpperCase() : 'BIKE'}</Text>
          <Text style={styles.price}>₹{item.fare || 0}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride History</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#f72585" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={history}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchHistory(); }}
              colors={['#f72585']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No rides completed yet</Text>
              <Text style={styles.emptySub}>Go online on the dashboard to accept requests.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e', marginTop: 10 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 14, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  date: { color: 'gray', fontWeight: 'bold', fontSize: 13 },
  status: { fontWeight: 'bold', fontSize: 13 },
  locContainer: { marginVertical: 8, paddingLeft: 6, borderLeftWidth: 2, borderColor: '#eee' },
  dot: { fontSize: 14, marginBottom: 6, color: '#333' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#f0f0f0' },
  vehicleType: { fontSize: 12, color: '#888', fontWeight: '600' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#888', marginTop: 4 }
});