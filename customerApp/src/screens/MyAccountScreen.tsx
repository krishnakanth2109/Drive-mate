import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCustomer } from '../context/CustomerContext';

export default function MyAccountScreen({ navigation }: any) {
  const { logout } = useCustomer();
  const [userData, setUserData] = useState<{name: string, phone: string} | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setUserData(JSON.parse(userStr));
        }
      } catch (err) {
        console.error("Failed to load user data");
      }
    };
    fetchUser();
  }, []);

  const menuItems = [
    { id: '1', title: 'Payment', icon: 'wallet-outline', screen: 'Payment' },
    { id: '2', title: 'My Rides', icon: 'time-outline', screen: 'MyRides' },
    { id: '3', title: 'Refer and Earn', icon: 'gift-outline', screen: 'ReferAndEarn' },
    { id: '4', title: 'My Rewards', icon: 'medal-outline', screen: 'MyRewards' },
    { id: '5', title: 'Power Pass', icon: 'card-outline', screen: 'PowerPass' },
    { id: '6', title: 'Rapido Coins', icon: 'cash-outline', screen: 'Coins' },
    { id: '7', title: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' },
    { id: '8', title: 'Claims', icon: 'shield-checkmark-outline', screen: 'Claims' },
    { id: '9', title: 'Settings', icon: 'settings-outline', screen: 'Settings' },
    { id: '10', title: 'Help', icon: 'help-circle-outline', screen: 'Help' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={28} color="#3b5998" />
              {/* Optional border arc styling would go here */}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userData?.name || 'Loading...'}</Text>
              <Text style={styles.profilePhone}>{userData?.phone || 'Loading...'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#333" />
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.menuItem, 
                index === menuItems.length - 1 ? styles.menuItemLast : null
              ]}
              onPress={() => {
                if (item.screen === 'MyRides') {
                  navigation.navigate('My Rides');
                } else {
                  navigation.navigate(item.screen);
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={22} color="#3b5998" />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout(navigation)}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 25,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#3b5998',
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 30,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#f72585',
    fontWeight: '700',
    fontSize: 16,
  },
});
