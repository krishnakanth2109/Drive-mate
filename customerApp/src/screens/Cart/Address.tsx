import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Address() {
  return (
    <View style={styles.container}>
      <Text>Address</Text>
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
