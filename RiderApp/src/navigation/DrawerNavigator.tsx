import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MainTabNavigator from './MainTabNavigator';
import EarningsScreen from '../screens/EarningsScreen';
import HistoryScreen from '../screens/menu/HistoryScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import VehicleScreen from '../screens/VehicleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SupportScreen from '../screens/SupportScreen';
import { useRider } from '../context/RiderContext';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { logout } = useRider();
  
  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: '#2c3e50' }}>
        <View style={styles.profileSection}>
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name="person" size={40} color="#ccc" />
          </View>
          <Text style={styles.profileName}>Rider App</Text>
          <Text style={styles.profileStatus}>DriveMate Partner</Text>
        </View>
        
        <View style={styles.drawerItemsContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
      
      <View style={styles.footerSection}>
        <DrawerItem
          label="Logout"
          icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={color} />}
          onPress={() => logout(props.navigation)}
          labelStyle={{ color: '#e74c3c', fontWeight: 'bold' }}
        />
      </View>
    </View>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#f72585',
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: { marginLeft: -20, fontSize: 15, fontWeight: '500' }
      }}
    >
      <Drawer.Screen 
        name="DashboardRoot" 
        component={MainTabNavigator} 
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
        }} 
      />
      
      <Drawer.Screen 
        name="MyEarnings" 
        component={EarningsScreen} 
        options={{
          title: 'My Earnings',
          drawerIcon: ({ color }) => <Ionicons name="wallet-outline" size={22} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="RideHistory" 
        component={HistoryScreen} 
        options={{
          title: 'Ride History',
          drawerIcon: ({ color }) => <Ionicons name="time-outline" size={22} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="MyVehicle" 
        component={VehicleScreen} 
        options={{
          title: 'Vehicle Information',
          drawerIcon: ({ color }) => <Ionicons name="car-sport-outline" size={22} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="MyDocuments" 
        component={DocumentsScreen} 
        options={{
          title: 'Documents',
          drawerIcon: ({ color }) => <Ionicons name="document-text-outline" size={22} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="AppSettings" 
        component={SettingsScreen} 
        options={{
          title: 'Settings',
          drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />
        }} 
      />
      
      <Drawer.Screen 
        name="HelpSupport" 
        component={SupportScreen} 
        options={{
          title: 'Help & Support',
          drawerIcon: ({ color }) => <Ionicons name="help-circle-outline" size={22} color={color} />
        }} 
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    padding: 20,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#f72585',
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileStatus: {
    color: '#f72585',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  drawerItemsContainer: {
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  footerSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    backgroundColor: '#fff',
  }
});
