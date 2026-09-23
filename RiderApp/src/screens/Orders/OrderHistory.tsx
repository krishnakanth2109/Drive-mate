import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

// Mock Data - In real app, fetch from API /ride/history
const HISTORY = [
  { id: '1', date: '27 Dec, 10:30 AM', from: 'Central Mall', to: 'Airport', price: 450, status: 'Completed' },
  { id: '2', date: '26 Dec, 05:15 PM', from: 'Office Park', to: 'Home', price: 120, status: 'Cancelled' },
  { id: '3', date: '25 Dec, 08:00 PM', from: 'Cinema Hall', to: 'Restaurant', price: 80, status: 'Completed' },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride History</Text>
      <FlatList 
        data={HISTORY}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={[styles.status, { color: item.status === 'Cancelled' ? 'red' : 'green' }]}>
                {item.status}
              </Text>
            </View>
            <View style={styles.locContainer}>
              <Text style={styles.dot}>🟢 {item.from}</Text>
              <Text style={styles.dot}>🔴 {item.to}</Text>
            </View>
            <Text style={styles.price}>₹{item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  date: { color: 'gray', fontWeight: 'bold' },
  status: { fontWeight: 'bold' },
  locContainer: { marginVertical: 10, paddingLeft: 10, borderLeftWidth: 2, borderColor: '#eee' },
  dot: { fontSize: 14, marginBottom: 5 },
  price: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginTop: 5 }
});