import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RaiseTicket() {
  return (
    <View style={styles.container}>
      <Text>RaiseTicket</Text>
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
