import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FAQs() {
  return (
    <View style={styles.container}>
      <Text>FAQs</Text>
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
