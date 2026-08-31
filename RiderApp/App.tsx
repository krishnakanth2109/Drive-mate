import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CustomerDashboard from './src/screens/Dashboard'; // Ensure this matches your file name
import HistoryScreen from './src/screens/menu/HistoryScreen';
import OffersScreen from './src/screens/menu/OffersScreen';
import OfficeScreen from './src/screens/menu/OfficeScreen';
import TermsScreen from './src/screens/menu/TermsScreen.tsx';
import IncentivesScreen from './src/screens/menu/IncentivesScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// The "App" part (Sidebar + Dashboard)
function DrawerNavigator() {
  return (
    <Drawer.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerShown: true, // Show the hamburger menu
        headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: 'black',
        drawerLabelStyle: { fontWeight: 'bold' }
      }}
    >
      <Drawer.Screen name="Home" component={CustomerDashboard} options={{ title: 'Ride Now' }} />
      <Drawer.Screen name="History" component={HistoryScreen} options={{ title: 'Your Trips' }} />
      <Drawer.Screen name="Offers" component={OffersScreen} options={{ title: 'Offers & Coupons' }} />
      <Drawer.Screen name="Incentives" component={IncentivesScreen} options={{ title: 'Rewards' }} />
      <Drawer.Screen name="Support" component={OfficeScreen} options={{ title: 'Help & Office' }} />
      <Drawer.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
    </Drawer.Navigator>
  );
}

// The "Auth" part + Entry Point
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Login">
        {/* Auth Screens (No Sidebar) */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        
        {/* Main App (Has Sidebar) */}
        {/* We replace the direct dashboard link with the DrawerNavigator */}
        <Stack.Screen name="Dashboard" component={DrawerNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}