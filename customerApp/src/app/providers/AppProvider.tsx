import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppProvider() {
  return (
    <View style={flex: 1, justifyContent: 'center', alignItems: 'center'}>
      <Text>AppProvider</Text>
    </View>
  );
}
