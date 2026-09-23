import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LocationSelector() {
  return (
    <View style={styles.container}>
      <Text>LocationSelector</Text>
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
