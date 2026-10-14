import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import { CustomerProvider } from '../context/CustomerContext';

export default function App() {
  return (
    <CustomerProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </CustomerProvider>
  );
}
