import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Items() {
  return (
    <View style={styles.container}>
      <Text>Items</Text>
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
