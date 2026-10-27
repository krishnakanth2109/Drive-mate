import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import MainTabsNavigator from './MainTabsNavigator';
import WalletScreen from '../../features/profile/screens/WalletScreen';
import PaymentScreen from '../../features/payments/screens/PaymentScreen';
import NotificationsScreen from '../../features/notifications/screens/NotificationsScreen';
import HelpScreen from '../../features/support/screens/HelpScreen';
import SettingsScreen from '../../features/profile/screens/SettingsScreen';

const Drawer = createDrawerNavigator();

export default function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: '#fff',
        headerStyle: {
          backgroundColor: '#f72585',
        },
        drawerActiveTintColor: '#f72585',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        }
      }}
    >
      <Drawer.Screen 
        name="HomeTabs" 
        component={MainTabsNavigator} 
        options={{
          headerShown: false,
          title: 'DriveMate',
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="DrawerWallet" 
        component={WalletScreen} 
        options={{
          headerShown: false,
          title: 'My Wallet',
          drawerLabel: 'My Wallet',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Payment" 
        component={PaymentScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Support" 
        component={HelpScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="help-buoy-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          )
        }}
      />
    </Drawer.Navigator>
  );
}
