import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRider } from '../context/RiderContext';

export default function ProfileScreen({ navigation }: any) {
  const { logout } = useRider();
  const [driverData, setDriverData] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('rider').then(data => {
      if (data) setDriverData(JSON.parse(data));
    });
  }, []);

  const menuItems = [
    { title: 'My Earnings', icon: 'wallet-outline', screen: 'Earnings' },
    { title: 'Documents & Verification', icon: 'document-text-outline', screen: 'Documents' },
    { title: 'Vehicle Information', icon: 'car-outline', screen: 'Vehicle' },
    { title: 'Support & Help', icon: 'help-circle-outline', screen: 'Support' },
    { title: 'Settings', icon: 'settings-outline', screen: 'Settings' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{driverData?.name || 'Driver Name'}</Text>
        <Text style={styles.phone}>{driverData?.phone || 'Loading...'}</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>4.9 ⭐</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Rides</Text>
          <Text style={styles.statValue}>1,245</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Today's Earnings</Text>
          <Text style={styles.statValue}>₹850</Text>
        </View>
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen as any)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon as any} size={24} color="#555" style={styles.menuIcon} />
              <Text style={styles.menuText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout(navigation)}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { backgroundColor: '#1a1a2e', alignItems: 'center', paddingVertical: 40, paddingBottom: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b5998', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  phone: { fontSize: 16, color: '#a0a0b0', marginTop: 4 },
  ratingBadge: { backgroundColor: '#f7bc00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  ratingText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, padding: 20, marginTop: -30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#eee' },
  statLabel: { fontSize: 13, color: '#888', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  menuList: { marginTop: 20, backgroundColor: '#fff', paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 16 },
  menuText: { fontSize: 16, fontWeight: '600', color: '#333' },
  logoutBtn: { margin: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold' }
});
