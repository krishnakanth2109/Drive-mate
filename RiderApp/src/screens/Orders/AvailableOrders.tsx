import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { Ride } from '../../services/types';

export default function RidesScreen({ navigation }: any) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRides = useCallback(async () => {
    try {
      const data = await riderService.getRideHistory();
      setRides(data);
    } catch (err) {
      console.log('Failed to fetch rides:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'completed';
    const dateFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Today';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation?.navigate('OrderDetails', { rideId: item._id, ride: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{dateFormatted}</Text>
          <Text style={[styles.status, { color: isCompleted ? '#2ecc71' : '#e74c3c' }]}>
            {item.status ? item.status.toUpperCase() : 'COMPLETED'}
          </Text>
        </View>
        <View style={styles.route}>
          <View style={styles.routePoint}>
            <Ionicons name="radio-button-on" size={16} color="#3498db" />
            <Text style={styles.location} numberOfLines={1}>{item.pickup?.address || 'Pickup'}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <Ionicons name="location" size={16} color="#e74c3c" />
            <Text style={styles.location} numberOfLines={1}>{item.drop?.address || 'Dropoff'}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.earningsLabel}>Trip Earnings</Text>
          <Text style={styles.earningsValue}>₹{item.fare || 0}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Rides</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#f72585" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={rides}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchRides(); }}
              colors={['#f72585']}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="bicycle-outline" size={60} color="#bbb" />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 12 }}>No rides found</Text>
              <Text style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Turn duty ON from Home tab to receive rides</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', padding: 20, paddingTop: 40, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  date: { fontSize: 14, color: '#666', fontWeight: '600' },
  status: { fontSize: 13, fontWeight: 'bold' },
  route: { paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  routePoint: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  routeLine: { width: 2, height: 12, backgroundColor: '#ccc', marginLeft: 7 },
  location: { fontSize: 15, color: '#333', marginLeft: 10, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' },
  earningsLabel: { fontSize: 14, color: '#888' },
  earningsValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' }
});
