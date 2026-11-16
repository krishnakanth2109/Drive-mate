import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket, socket } from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade & scale in entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start(async () => {
      // Check saved login
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            const uid = user._id || user.id;
            await connectSocket();
            if (uid) {
              socket.emit('join_room', uid);
            }
            socket.emit('join_customers_room');
          } catch (_) {}

          // Auto-login successful: Navigate straight into the app!
          navigation.replace('Main');
        } else {
          navigation.replace('Auth');
        }
      } catch (err) {
        navigation.replace('Auth');
      }
    });
  }, [navigation, fadeAnim, scaleAnim, pulseAnim, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0b14" />

      {/* Futuristic Background Ambient Glows */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Animated Center Brand Emblem */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Pulsing Radar Ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Center Glowing Logo Badge */}
        <View style={styles.logoBadge}>
          <Ionicons name="car-sport" size={54} color="#ffffff" />
          <View style={styles.sparkleDot} />
        </View>

        {/* Brand Typography */}
        <Text style={styles.title}>DriveMate</Text>
        <Text style={styles.tagline}>YOUR RIDE • YOUR WAY</Text>

        <View style={styles.pillBadge}>
          <Ionicons name="shield-checkmark" size={13} color="#06d6a0" />
          <Text style={styles.pillText}>Safe • Fast • Verified Rides</Text>
        </View>
      </Animated.View>

      {/* Bottom Loading Bar & Session Restorer Indicator */}
      <View style={styles.footer}>
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.footerText}>Restoring your secure trip session...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b14',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(247, 37, 133, 0.15)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: (width * 1.1) / 2,
    backgroundColor: 'rgba(114, 9, 183, 0.18)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(247, 37, 133, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(247, 37, 133, 0.35)',
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: '#f72585',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  sparkleDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06d6a0',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginTop: 24,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f72585',
    letterSpacing: 3,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 45,
    width: width * 0.65,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f72585',
    borderRadius: 2,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
});
