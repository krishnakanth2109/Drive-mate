import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';

// Profile sub-pages
import PaymentScreen from './src/screens/PaymentScreen';
import ReferAndEarnScreen from './src/screens/ReferAndEarnScreen';
import MyRewardsScreen from './src/screens/MyRewardsScreen';
import PowerPassScreen from './src/screens/PowerPassScreen';
import CoinsScreen from './src/screens/CoinsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ClaimsScreen from './src/screens/ClaimsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HelpScreen from './src/screens/HelpScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
        
        {/* Profile screens with visible headers */}
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
        <Stack.Screen name="ReferAndEarn" component={ReferAndEarnScreen} options={{ title: 'Refer & Earn' }} />
        <Stack.Screen name="MyRewards" component={MyRewardsScreen} options={{ title: 'My Rewards' }} />
        <Stack.Screen name="PowerPass" component={PowerPassScreen} options={{ title: 'Power Pass' }} />
        <Stack.Screen name="Coins" component={CoinsScreen} options={{ title: 'Rapido Coins' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        <Stack.Screen name="Claims" component={ClaimsScreen} options={{ title: 'Claims' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Help' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}