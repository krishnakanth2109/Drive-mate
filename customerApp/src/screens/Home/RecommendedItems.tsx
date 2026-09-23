import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RecommendedItems() {
  return (
    <View style={styles.container}>
      <Text>RecommendedItems</Text>
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
