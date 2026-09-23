import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OffersScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Driver Offers & Incentives</Text>
      
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <Ionicons name="flame" size={24} color="#e74c3c" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerTitle}>Weekend Bonanza</Text>
            <Text style={styles.offerDesc}>Complete 15 rides this weekend and earn an extra ₹500 bonus.</Text>
          </View>
        </View>
        <View style={styles.progressBg}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressText}>8 / 15 Rides Completed</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="star" size={24} color="#3b5998" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerTitle}>Top Rated Driver</Text>
            <Text style={styles.offerDesc}>Maintain a 4.8+ rating for the month to unlock 0% commission week.</Text>
          </View>
        </View>
        <Text style={[styles.progressText, { color: '#2ecc71', fontWeight: 'bold' }]}>Current Rating: 4.9 ⭐</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', padding: 20, paddingTop: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ffe5e5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  offerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  offerDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
  progressBg: { height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 10 },
  progressFill: { width: '53%', height: '100%', backgroundColor: '#e74c3c', borderRadius: 4 },
  progressText: { fontSize: 14, color: '#888', fontWeight: '500' }
});
