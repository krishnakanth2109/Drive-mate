import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Privacy() {
  return (
    <View style={styles.container}>
      <Text>Privacy</Text>
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
