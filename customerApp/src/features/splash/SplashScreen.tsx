import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        navigation.replace('Login'); // Or Onboarding
      }, 1000);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Ionicons name="location" size={100} color="#f72585" />
        <Text style={styles.title}>DriveMate</Text>
        <Text style={styles.subtitle}>Your Ride, Your Way</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#333',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 20,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
});
