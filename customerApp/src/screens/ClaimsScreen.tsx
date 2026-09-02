import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ClaimsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Claims</Text>
      <Text style={styles.subtitle}>This page is under construction.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
