import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import CustomerDashboard from '../screens/Dashboard';
import MyRidesScreen from '../screens/MyRidesScreen';
import TravelScreen from '../screens/TravelScreen';
import MyAccountScreen from '../screens/MyAccountScreen';
import { CustomerProvider } from '../context/CustomerContext';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <CustomerProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let icon = '📍'; // default
            
            if (route.name === 'Home') {
              icon = '🏠';
            } else if (route.name === 'My Rides') {
              icon = '🚗';
            } else if (route.name === 'Travel') {
              icon = '✈️';
            } else if (route.name === 'My Account') {
              icon = '👤';
            }

            return <Text style={{ fontSize: size ? size - 5 : 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
          },
          tabBarActiveTintColor: '#f72585',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          }
        })}
      >
        <Tab.Screen name="Home" component={CustomerDashboard} />
        <Tab.Screen name="My Rides" component={MyRidesScreen} />
        <Tab.Screen name="Travel" component={TravelScreen} />
        <Tab.Screen name="My Account" component={MyAccountScreen} />
      </Tab.Navigator>
    </CustomerProvider>
  );
}
