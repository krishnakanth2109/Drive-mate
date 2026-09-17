import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import HistoryScreen from './src/screens/menu/HistoryScreen';
import OffersScreen from './src/screens/menu/OffersScreen';
import OfficeScreen from './src/screens/menu/OfficeScreen';
import TermsScreen from './src/screens/menu/TermsScreen';
import IncentivesScreen from './src/screens/menu/IncentivesScreen';

// Driver Profile Screens
import EarningsScreen from './src/screens/EarningsScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import VehicleScreen from './src/screens/VehicleScreen';
import SupportScreen from './src/screens/SupportScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OutstationOptInScreen from './src/screens/OutstationOptInScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Login">
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />

        {/* Main App with Drawer and Tabs */}
        <Stack.Screen name="MainTabs" component={DrawerNavigator} options={{ headerShown: false }} />

        {/* Profile Sub-Pages */}
        <Stack.Screen name="Earnings" component={EarningsScreen} options={{ title: 'My Earnings' }} />
        <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Documents & Verification' }} />
        <Stack.Screen name="Vehicle" component={VehicleScreen} options={{ title: 'Vehicle Information' }} />
        <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Driver Support' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'App Settings' }} />
        
        {/* Outstation Feature */}
        <Stack.Screen name="OutstationOptIn" component={OutstationOptInScreen} options={{ title: 'Outstation Rides' }} />

        {/* Legacy Menu Screens */}
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Your Trips' }} />
        <Stack.Screen name="Offers" component={OffersScreen} options={{ title: 'Offers & Coupons' }} />
        <Stack.Screen name="Incentives" component={IncentivesScreen} options={{ title: 'Rewards' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}