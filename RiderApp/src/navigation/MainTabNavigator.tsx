import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import RiderDashboard from '../screens/Dashboard';
import RidesScreen from '../screens/RidesScreen';
import TravelScreen from '../screens/TravelScreen';
import OffersScreen from '../screens/OffersScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { RiderProvider } from '../context/RiderContext';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <RiderProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'ellipse';
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Rides') iconName = focused ? 'time' : 'time-outline';
            else if (route.name === 'Travel') iconName = focused ? 'map' : 'map-outline';
            else if (route.name === 'Offers') iconName = focused ? 'gift' : 'gift-outline';
            else if (route.name === 'My Profile') iconName = focused ? 'person' : 'person-outline';
            
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#f72585',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 10,
            height: Platform.OS === 'ios' ? 85 : 65,
          }
        })}
      >
        <Tab.Screen name="Home" component={RiderDashboard} />
        <Tab.Screen name="Rides" component={RidesScreen} />
        <Tab.Screen name="Travel" component={TravelScreen} />
        <Tab.Screen name="Offers" component={OffersScreen} />
        <Tab.Screen name="My Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </RiderProvider>
  );
}
