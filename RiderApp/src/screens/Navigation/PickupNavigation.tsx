import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PickupNavigationScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="navigate" size={80} color="#f72585" />
        <Text style={styles.mapText}>Turn-by-turn Navigation Map</Text>
      </View>
      <View style={styles.overlayHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.instructionBox}>
          <Ionicons name="arrow-up" size={30} color="#fff" />
          <Text style={styles.instructionText}>Continue straight for 2 km</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2C' },
  mapPlaceholder: { flex: 1, backgroundColor: '#2a2a3c', justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#a0a0b0', marginTop: 10, fontSize: 16 },
  overlayHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', alignItems: 'center' },
  closeBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  instructionBox: { flex: 1, backgroundColor: '#f72585', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#f72585', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  instructionText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
});
