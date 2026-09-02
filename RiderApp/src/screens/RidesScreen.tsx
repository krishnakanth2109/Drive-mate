import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RidesScreen() {
  const rides = [
    { id: '1', date: '02 Sep, 10:30 AM', pickup: 'Hitech City', drop: 'Gachibowli', earnings: '₹120', status: 'Completed' },
    { id: '2', date: '01 Sep, 04:15 PM', pickup: 'Jubilee Hills', drop: 'Madhapur', earnings: '₹85', status: 'Completed' },
    { id: '3', date: '30 Aug, 09:00 AM', pickup: 'Secunderabad', drop: 'Begumpet', earnings: '₹0', status: 'Cancelled' },
  ];

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={[styles.status, { color: item.status === 'Completed' ? '#2ecc71' : '#e74c3c' }]}>{item.status}</Text>
      </View>
      <View style={styles.route}>
        <View style={styles.routePoint}>
          <Ionicons name="radio-button-on" size={16} color="#3498db" />
          <Text style={styles.location}>{item.pickup}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <Ionicons name="location" size={16} color="#e74c3c" />
          <Text style={styles.location}>{item.drop}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.earningsLabel}>Earnings</Text>
        <Text style={styles.earningsValue}>{item.earnings}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Ride History</Text>
      <FlatList 
        data={rides}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', padding: 20, paddingTop: 40, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  date: { fontSize: 14, color: '#666', fontWeight: '600' },
  status: { fontSize: 14, fontWeight: 'bold' },
  route: { paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  routePoint: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  routeLine: { width: 2, height: 12, backgroundColor: '#ccc', marginLeft: 7 },
  location: { fontSize: 16, color: '#333', marginLeft: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' },
  earningsLabel: { fontSize: 14, color: '#888' },
  earningsValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' }
});
