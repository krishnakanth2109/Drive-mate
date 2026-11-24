import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import { CustomerProvider } from '../context/CustomerContext';
import { ToastProvider } from '../context/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <CustomerProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </CustomerProvider>
    </ToastProvider>
  );
}
