import React from 'react';
import { View, Text, StyleSheet, ProgressBarAndroid } from 'react-native';

export default function IncentivesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rewards & Incentives</Text>
      
      {/* Referral Card */}
      <View style={[styles.card, { backgroundColor: '#FFD700' }]}>
        <Text style={styles.cardHeader}>Refer & Earn</Text>
        <Text style={styles.cardText}>Invite a friend and get ₹50 when they take their first ride.</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Your Code:</Text>
          <Text style={styles.code}>ALEX2025</Text>
        </View>
      </View>

      {/* Loyalty Points */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Loyalty Points</Text>
        <Text style={styles.points}>350 pts</Text>
        <Text style={styles.subText}>Earn 10 pts for every ₹100 spent</Text>
        
        <Text style={{ marginTop: 20, fontWeight: 'bold' }}>Progress to Gold Member</Text>
        {/* Simple visual bar */}
        <View style={styles.progressBar}>
           <View style={{ width: '35%', backgroundColor: 'green', height: '100%' }} />
        </View>
        <Text style={{ fontSize: 12, color: 'gray', marginTop: 5 }}>150 more points needed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 20, elevation: 4 },
  cardHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  cardText: { fontSize: 16, marginBottom: 15 },
  codeBox: { backgroundColor: 'rgba(255,255,255,0.5)', padding: 10, borderRadius: 8, alignItems: 'center' },
  codeLabel: { fontSize: 12, fontWeight: 'bold' },
  code: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  points: { fontSize: 40, fontWeight: 'bold', color: '#007AFF' },
  subText: { color: 'gray' },
  progressBar: { height: 10, backgroundColor: '#eee', borderRadius: 5, marginTop: 10, overflow: 'hidden' }
});