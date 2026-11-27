import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabsNavigator from './MainTabsNavigator';
import LocationSearchScreen from '../../features/location/screens/LocationSearchScreen';
import LiveTrackingScreen from '../../features/tracking/screens/LiveTrackingScreen';
import SettingsScreen from '../../features/profile/screens/SettingsScreen';
import WalletScreen from '../../features/profile/screens/WalletScreen';
import ChatScreen from '../../features/ride/screens/ChatScreen';
import HelpScreen from '../../features/support/screens/HelpScreen';
import NotificationScreen from '../../features/notifications/screens/NotificationsScreen';
import RideHistoryScreen from '../../features/rides/screens/RideHistoryScreen';
import RideHistoryDetailsScreen from '../../features/rides/screens/RideHistoryDetailsScreen';
import EditProfileScreen from '../../features/profile/screens/EditProfileScreen';
import RateDriverScreen from '../../features/ratings/screens/RateDriverScreen';
import FAQScreen from '../../features/support/screens/FAQScreen';
import SupportTicketScreen from '../../features/support/screens/SupportTicketScreen';
import PaymentScreen from '../../features/payments/screens/PaymentScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
      {/* Backward-compatibility alias for previous drawer references */}
      <Stack.Screen name="MainDrawer" component={MainTabsNavigator} />
      <Stack.Screen name="LocationSearch" component={LocationSearchScreen} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="SupportTicket" component={SupportTicketScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
      <Stack.Screen name="RideHistoryDetails" component={RideHistoryDetailsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="RateDriver" component={RateDriverScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
}
