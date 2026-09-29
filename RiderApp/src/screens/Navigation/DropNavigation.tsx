import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DropNavigationScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="navigate" size={80} color="#4CAF50" />
        <Text style={styles.mapText}>Drop-off Navigation Map</Text>
      </View>
      <View style={styles.overlayHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.instructionBox}>
          <Ionicons name="arrow-undo" size={30} color="#fff" />
          <Text style={styles.instructionText}>Turn left in 300 meters</Text>
        </View>
      </View>
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.timeText}>15 min</Text>
          <Text style={styles.distText}>4.2 km • 10:45 AM</Text>
        </View>
        <TouchableOpacity style={styles.endBtn} onPress={() => navigation.navigate('OrderDetails')}>
          <Text style={styles.endBtnText}>End Trip</Text>
        </TouchableOpacity>
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
  instructionBox: { flex: 1, backgroundColor: '#4CAF50', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#4CAF50', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  instructionText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  bottomBar: { backgroundColor: '#1E1E2C', padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#3b3b4f' },
  timeText: { color: '#4CAF50', fontSize: 24, fontWeight: 'bold' },
  distText: { color: '#a0a0b0', fontSize: 14, marginTop: 4 },
  endBtn: { backgroundColor: '#f72585', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  endBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
