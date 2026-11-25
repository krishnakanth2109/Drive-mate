import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleDelete = () => {
    Alert.alert("Delete Account", "Are you sure you want to permanently delete your account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive" }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>App Settings</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#3b5998', false: '#ccc' }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: '#3b5998', false: '#ccc' }} />
        </View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Language</Text>
          <View style={styles.rowRight}>
            <Text style={styles.valueText}>English</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: '#e74c3c' }]}>Danger Zone</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={handleDelete}>
          <Text style={[styles.rowLabel, { color: '#e74c3c', fontWeight: '600' }]}>Delete Account</Text>
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
  rowLabel: { fontSize: 16, color: '#1a1a2e' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 16, color: '#888', marginRight: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0' }
});
