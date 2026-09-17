import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TravelScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Ionicons name="map-outline" size={60} color="#fff" />
        <Text style={styles.heroTitle}>Outstation & Intercity</Text>
        <Text style={styles.heroSub}>Opt-in for longer trips and earn up to 3x more per ride.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Why opt-in?</Text>
        
        <View style={styles.benefit}>
          <Ionicons name="cash-outline" size={24} color="#2ecc71" />
          <View style={styles.bTextContainer}>
            <Text style={styles.bTitle}>Higher Earnings</Text>
            <Text style={styles.bSub}>Guaranteed higher per-km rates for outstation trips.</Text>
          </View>
        </View>

        <View style={styles.benefit}>
          <Ionicons name="time-outline" size={24} color="#3498db" />
          <View style={styles.bTextContainer}>
            <Text style={styles.bTitle}>Flexible Schedule</Text>
            <Text style={styles.bSub}>Accept advance bookings that fit your timetable.</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('OutstationOptIn')}>
          <Text style={styles.btnText}>Opt-in for Outstation Rides</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  hero: { backgroundColor: '#1a1a2e', padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 10, textAlign: 'center' },
  heroSub: { fontSize: 14, color: '#a0a0b0', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  card: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 20 },
  benefit: { flexDirection: 'row', marginBottom: 20 },
  bTextContainer: { marginLeft: 16, flex: 1 },
  bTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  bSub: { fontSize: 14, color: '#666', marginTop: 4, lineHeight: 20 },
  btn: { backgroundColor: '#f72585', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
