import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [autoAccept, setAutoAccept] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Auto-Accept Rides</Text>
            <Text style={styles.rowSub}>Automatically accept rides within 2km</Text>
          </View>
          <Switch value={autoAccept} onValueChange={setAutoAccept} trackColor={{ true: '#2ecc71', false: '#ccc' }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Dark Mode</Text>
            <Text style={styles.rowSub}>Easier on the eyes at night</Text>
          </View>
          <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: '#3b5998', false: '#ccc' }} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Navigation</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Default Navigation App</Text>
          <View style={styles.rowRight}>
            <Text style={styles.valueText}>Google Maps</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: '#e74c3c' }]}>Danger Zone</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row}>
          <Text style={[styles.rowLabel, { color: '#e74c3c', fontWeight: '600' }]}>Delete Driver Account</Text>
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 10, marginTop: 10, marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowLabel: { fontSize: 16, color: '#1a1a2e', fontWeight: '500' },
  rowSub: { fontSize: 12, color: '#888', marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 15, color: '#888', marginRight: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0' }
});
