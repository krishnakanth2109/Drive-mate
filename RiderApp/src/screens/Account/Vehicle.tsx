import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VehicleScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.vehicleImageContainer}>
        <Ionicons name="car-sport" size={100} color="#3b5998" />
        <Text style={styles.plateNumber}>TS 09 EH 1234</Text>
        <Text style={styles.vehicleName}>Honda Activa 6G</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Make & Model</Text>
          <Text style={styles.value}>Honda Activa 6G</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Year of Registration</Text>
          <Text style={styles.value}>2022</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Color</Text>
          <Text style={styles.value}>Matte Black</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Vehicle Type</Text>
          <Text style={styles.value}>Bike (2-Wheeler)</Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Insurance & Permits</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Expiry</Text>
          <Text style={[styles.value, { color: '#2ecc71', fontWeight: 'bold' }]}>Active (12 Aug 2027)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Pollution Check</Text>
          <Text style={[styles.value, { color: '#e74c3c', fontWeight: 'bold' }]}>Expired</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  vehicleImageContainer: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  plateNumber: { fontSize: 24, fontWeight: '900', color: '#1a1a2e', marginTop: 16, backgroundColor: '#f0c40f', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  vehicleName: { fontSize: 16, color: '#666', marginTop: 8, fontWeight: '500' },
  detailsCard: { backgroundColor: '#fff', margin: 20, marginBottom: 0, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  label: { fontSize: 15, color: '#888' },
  value: { fontSize: 15, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f0f0f0' }
});
