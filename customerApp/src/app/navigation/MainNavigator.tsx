import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainDrawerNavigator from './MainDrawerNavigator';
import LocationSearchScreen from '../../features/location/screens/LocationSearchScreen';
import LiveTrackingScreen from '../../features/tracking/screens/LiveTrackingScreen';
import SettingsScreen from '../../features/profile/screens/SettingsScreen';
import WalletScreen from '../../features/profile/screens/WalletScreen';
import ChatScreen from '../../features/ride/screens/ChatScreen';
import HelpScreen from '../../features/support/screens/HelpScreen';
import NotificationsScreen from '../../features/notifications/screens/NotificationsScreen';
import RideHistoryScreen from '../../features/rides/screens/RideHistoryScreen';
import PaymentScreen from '../../features/payments/screens/PaymentScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainDrawer" component={MainDrawerNavigator} />
      <Stack.Screen name="LocationSearch" component={LocationSearchScreen} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
}
