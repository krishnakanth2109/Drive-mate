import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddToCart() {
  return (
    <View style={styles.container}>
      <Text>AddToCart</Text>
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
