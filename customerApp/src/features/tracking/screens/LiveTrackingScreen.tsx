import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCustomer } from '../../../context/CustomerContext';
import { trackingService } from '../services/trackingService';
import { extractApiErrorMessage } from '../../../services/api';

type Props = {
  navigation: StackNavigationProp<any, 'LiveTracking'>;
  route?: any;
};

export default function LiveTrackingScreen({ navigation, route }: Props) {
  const { activeRide: contextRide, driver: contextDriver, driverLocation: contextDriverLoc } = useCustomer();
  const [ride, setRide] = useState<any>(route?.params?.ride || contextRide || null);
  const [driverLoc, setDriverLoc] = useState<{ latitude: number; longitude: number } | null>(contextDriverLoc);
  const [loading, setLoading] = useState(!contextRide);
  const [error, setError] = useState<string | null>(null);

  const loadActiveRide = useCallback(async () => {
    try {
      setError(null);
      const data = await trackingService.getActiveRide();
      setRide(data);
    } catch (err: any) {
      setError(extractApiErrorMessage(err, 'Failed to fetch live ride status.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (contextRide) {
      setRide(contextRide);
      setLoading(false);
    } else {
      loadActiveRide();
    }
  }, [contextRide, loadActiveRide]);

  useEffect(() => {
    if (contextDriverLoc) setDriverLoc(contextDriverLoc);
  }, [contextDriverLoc]);

  useEffect(() => {
    const rideId = ride?._id || ride?.id;
    if (!rideId) return;
    let cleanup: (() => void) | undefined;
    trackingService
      .subscribeToRide(String(rideId), {
        onLocation: (loc) => setDriverLoc(loc),
        onStatusChange: () => loadActiveRide(),
      })
      .then((unsub) => {
        cleanup = unsub;
      });
    return () => {
      if (cleanup) cleanup();
    };
  }, [ride?._id, ride?.id, loadActiveRide]);

  const driver = ride?.rider || contextDriver;
  const vehicle = typeof driver?.vehicle === 'string'
    ? driver.vehicle
    : [driver?.vehicle?.make, driver?.vehicle?.model, driver?.vehicle?.color].filter(Boolean).join(' ') ||
      (ride?.vehicleType ? String(ride.vehicleType).toUpperCase() : 'Assigned Vehicle');
  const plate = driver?.vehicle?.plate || driver?.vehicle?.plateNumber || '';
  const etaText = ride?.duration ? `${Math.round(Number(ride.duration))} min` : 'Live';
  const statusLabel =
    ride?.status === 'arrived'
      ? 'Driver arrived at pickup'
      : ride?.status === 'drop_arrived'
        ? 'Arrived at destination'
        : ride?.status === 'ongoing' || ride?.status === 'in_progress'
          ? 'Trip in progress'
          : ride?.status === 'accepted'
            ? 'En route to pickup'
            : 'Live Trip Status';

  const handleCallDriver = () => {
    if (!driver?.phone) {
      Alert.alert('Unavailable', 'Driver phone number is not available yet.');
      return;
    }
    Linking.openURL(`tel:${driver.phone}`).catch(() => {
      Alert.alert('Dialer Error', 'Unable to open phone dialer.');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="navigate-circle" size={72} color="#f72585" />
        <Text style={styles.mapText}>{statusLabel}</Text>
        {driverLoc ? (
          <Text style={[styles.mapText, { fontSize: 12 }]}>
            GPS: {driverLoc.latitude.toFixed(4)}, {driverLoc.longitude.toFixed(4)}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        {loading ? (
          <View style={styles.etaBox}>
            <ActivityIndicator size="large" color="#f72585" />
            <Text style={styles.etaSub}>Connecting to live ride stream...</Text>
          </View>
        ) : error ? (
          <View style={styles.etaBox}>
            <Text style={[styles.etaSub, { color: '#ef4444' }]}>{error}</Text>
            <TouchableOpacity onPress={loadActiveRide} style={{ marginTop: 10 }}>
              <Text style={{ color: '#f72585', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !ride ? (
          <View style={styles.etaBox}>
            <Text style={styles.etaText}>No Active Ride</Text>
            <Text style={styles.etaSub}>Book a trip from the Home screen to track your driver live.</Text>
          </View>
        ) : (
          <>
            <View style={styles.etaBox}>
              <Text style={styles.etaText}>{etaText}</Text>
              <Text style={styles.etaSub}>{statusLabel}</Text>
            </View>

            <View style={styles.driverCard}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driver?.name || 'Matching Partner...'}</Text>
                <Text style={styles.carDetails}>{vehicle}</Text>
                {plate ? (
                  <View style={styles.plateBox}>
                    <Text style={styles.plateText}>{plate}</Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                <Ionicons name="call" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  mapPlaceholder: { flex: 1, backgroundColor: '#e5e5e5', justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#888', marginTop: 10, fontSize: 16 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#e0e0e0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  etaBox: { alignItems: 'center', marginBottom: 25 },
  etaText: { fontSize: 32, fontWeight: 'bold', color: '#f72585' },
  etaSub: { color: '#666', fontSize: 14, marginTop: 4 },
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 15, borderRadius: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  carDetails: { color: '#666', fontSize: 14, marginBottom: 8 },
  plateBox: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ddd' },
  plateText: { fontWeight: 'bold', fontSize: 12 },
  callBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', shadowColor: '#4CAF50', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});
