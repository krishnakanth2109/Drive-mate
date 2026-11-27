import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCustomer } from '../../../context/CustomerContext';
import { rideService } from '../services/rideService';

export default function DriverArrivingScreen() {
  const navigation = useNavigation<any>();
  const { activeRide: contextRide, driver: contextDriver } = useCustomer();
  const [ride, setRide] = useState<any>(contextRide);
  const [loading, setLoading] = useState(!contextRide);

  useEffect(() => {
    if (contextRide) {
      setRide(contextRide);
      setLoading(false);
    } else {
      rideService
        .getActiveRide()
        .then((res) => setRide(res))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [contextRide]);

  const driver = ride?.rider || contextDriver;
  const driverPhone = driver?.phone;
  const vehicleLabel =
    [driver?.vehicle?.model, driver?.vehicle?.plate || driver?.vehicle?.plateNumber].filter(Boolean).join(' • ') ||
    (ride?.vehicleType ? String(ride.vehicleType).toUpperCase() : 'Vehicle details pending');

  const handleCall = () => {
    if (!driverPhone) {
      Alert.alert('Unavailable', 'Driver phone number is not available yet.');
      return;
    }
    Linking.openURL(`tel:${driverPhone}`);
  };

  const handleChat = () => {
    navigation.navigate('Chat', { rideId: ride?._id || ride?.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Arrived</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#f72585" />
        ) : !ride ? (
          <Text style={styles.statusText}>No active ride found.</Text>
        ) : (
          <>
            <View style={styles.driverInfoCard}>
              <View style={[styles.avatarContainer, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }]}>
                <Ionicons name="person" size={44} color="#fff" />
              </View>
              <Text style={styles.driverName}>{driver?.name || 'Driver Assigned'}</Text>
              <Text style={styles.carInfo}>{vehicleLabel}</Text>
              {driver?.rating !== undefined && driver?.rating !== null ? (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{Number(driver.rating).toFixed(1)}</Text>
                </View>
              ) : null}
              {ride?.otp ? (
                <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '700', color: '#f72585' }}>
                  Start OTP: {ride.otp}
                </Text>
              ) : null}
            </View>

            <Text style={styles.statusText}>
              {ride.status === 'arrived'
                ? 'Your driver has reached the pickup location.'
                : 'Your driver is on the way to your pickup point.'}
            </Text>

            <View style={styles.actionsContainer}>
              <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
                <Ionicons name="call" size={24} color="#fff" />
                <Text style={styles.btnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.chatBtn]} onPress={handleChat}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                <Text style={styles.btnText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfoCard: {
    alignItems: 'center',
    marginBottom: 40,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  carInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  callBtn: {
    backgroundColor: '#4CAF50',
  },
  chatBtn: {
    backgroundColor: '#2196F3',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
