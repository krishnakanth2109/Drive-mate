import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CustomerDashboard from './src/screens/Dashboard';
import HistoryScreen from './src/screens/menu/HistoryScreen';
import OffersScreen from './src/screens/menu/OffersScreen';
import OfficeScreen from './src/screens/menu/OfficeScreen';
import TermsScreen from './src/screens/menu/TermsScreen';
import IncentivesScreen from './src/screens/menu/IncentivesScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Login">
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />

        {/* Main App */}
        <Stack.Screen name="Dashboard" component={CustomerDashboard} options={{ headerShown: false }} />

        {/* Menu Screens */}
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Your Trips' }} />
        <Stack.Screen name="Offers" component={OffersScreen} options={{ title: 'Offers & Coupons' }} />
        <Stack.Screen name="Incentives" component={IncentivesScreen} options={{ title: 'Rewards' }} />
        <Stack.Screen name="Support" component={OfficeScreen} options={{ title: 'Help & Office' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}