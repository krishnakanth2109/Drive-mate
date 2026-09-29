import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type Props = {
  navigation: StackNavigationProp<any, 'LiveTracking'>;
};

export default function LiveTrackingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={80} color="#ddd" />
        <Text style={styles.mapText}>Live Tracking Map View</Text>
      </View>
      
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        
        <View style={styles.etaBox}>
          <Text style={styles.etaText}>5 min</Text>
          <Text style={styles.etaSub}>Arrival Time</Text>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>Ramesh K.</Text>
            <Text style={styles.carDetails}>Toyota Innova • White</Text>
            <View style={styles.plateBox}>
              <Text style={styles.plateText}>MH 01 AB 1234</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  mapPlaceholder: { flex: 1, backgroundColor: '#e5e5e5', justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#888', marginTop: 10, fontSize: 16 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#e0e0e0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  etaBox: { alignItems: 'center', marginBottom: 25 },
  etaText: { fontSize: 32, fontWeight: 'bold', color: '#f72585' },
  etaSub: { color: '#666', fontSize: 14, marginTop: 4 },
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 15, borderRadius: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  carDetails: { color: '#666', fontSize: 14, marginBottom: 8 },
  plateBox: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ddd' },
  plateText: { fontWeight: 'bold', fontSize: 12 },
  callBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', shadowColor: '#4CAF50', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});
