import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainDrawerNavigator from './MainDrawerNavigator';
import LocationSearchScreen from '../../features/location/screens/LocationSearchScreen';
import LiveTrackingScreen from '../../features/tracking/screens/LiveTrackingScreen';
import SettingsScreen from '../../features/profile/screens/SettingsScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainDrawer" component={MainDrawerNavigator} />
      <Stack.Screen name="LocationSearch" component={LocationSearchScreen} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
