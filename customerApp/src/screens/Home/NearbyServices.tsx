import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NearbyServices() {
  return (
    <View style={styles.container}>
      <Text>NearbyServices</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
