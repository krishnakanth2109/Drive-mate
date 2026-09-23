import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Quantity() {
  return (
    <View style={styles.container}>
      <Text>Quantity</Text>
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
