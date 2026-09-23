import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PaymentStatus() {
  return (
    <View style={styles.container}>
      <Text>PaymentStatus</Text>
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
