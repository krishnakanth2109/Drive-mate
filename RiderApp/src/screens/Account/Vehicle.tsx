import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { VehicleInfo } from '../../services/types';

export default function VehicleScreen() {
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [year, setYear] = useState('');

  const fetchVehicle = useCallback(async () => {
    try {
      const data = await riderService.getVehicle();
      setVehicle(data);
      setModel(data.model || '');
      setPlate(data.plate || '');
      setColor(data.color || '');
      setYear(data.year || '');
    } catch (err) {
      console.log('Failed to fetch vehicle:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await riderService.updateVehicle({
        model,
        plate,
        color,
        year
      });
      setVehicle(updated);
      setIsEditing(false);
      Alert.alert('Success', 'Vehicle information updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVehicle(); }} colors={['#f72585']} />}
    >
      <View style={styles.vehicleImageContainer}>
        <Ionicons name="car-sport" size={90} color="#3b5998" />
        <Text style={styles.plateNumber}>{vehicle?.plate || 'KA-01-AB-1234'}</Text>
        <Text style={styles.vehicleName}>{vehicle?.model || 'Honda Activa 6G'}</Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editBtnText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <Text style={styles.inputLabel}>Make & Model</Text>
            <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Model" />

            <Text style={styles.inputLabel}>License Plate</Text>
            <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="Plate Number" />

            <Text style={styles.inputLabel}>Color</Text>
            <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="Color" />

            <Text style={styles.inputLabel}>Year</Text>
            <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="Registration Year" keyboardType="numeric" />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Make & Model</Text>
              <Text style={styles.value}>{vehicle?.model || 'Honda Activa 6G'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Year of Registration</Text>
              <Text style={styles.value}>{vehicle?.year || '2022'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Color</Text>
              <Text style={styles.value}>{vehicle?.color || 'Matte Black'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Vehicle Type</Text>
              <Text style={styles.value}>{vehicle?.vehicleType ? vehicle.vehicleType.toUpperCase() : 'BIKE'}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Insurance & Permits</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Expiry</Text>
          <Text style={[styles.value, { color: '#2ecc71', fontWeight: 'bold' }]}>
            {vehicle?.insuranceExpiry || 'Active (12 Aug 2027)'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Pollution Check</Text>
          <Text style={[styles.value, { color: vehicle?.pollutionStatus === 'Expired' ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }]}>
            {vehicle?.pollutionStatus || 'Active'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  vehicleImageContainer: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  plateNumber: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', marginTop: 12, backgroundColor: '#f0c40f', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  vehicleName: { fontSize: 16, color: '#666', marginTop: 8, fontWeight: '500' },
  detailsCard: { backgroundColor: '#fff', margin: 16, marginBottom: 0, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  editBtnText: { color: '#f72585', fontWeight: 'bold', fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  label: { fontSize: 15, color: '#888' },
  value: { fontSize: 15, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  editForm: { marginTop: 10 },
  inputLabel: { fontSize: 13, color: '#666', fontWeight: '600', marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, fontSize: 15 },
  saveBtn: { backgroundColor: '#f72585', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
