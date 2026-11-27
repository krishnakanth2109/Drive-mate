import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import RiderWebMapView from '../../components/RiderWebMapView';
import GeofenceArrivalCard from '../../components/GeofenceArrivalCard';
import { evaluateDriverGeofence } from '../../utils/geofence';

export default function PickupNavigationScreen({ navigation }: any) {
  const {
    activeRide,
    arriveAtPickup,
    location,
    driverGps,
    googleMapsKey,
    isArrivalSubmitting,
    refreshCurrentGps,
  } = useRider();

  const pickupLat = activeRide?.pickup?.lat ?? null;
  const pickupLng = activeRide?.pickup?.lng ?? null;
  const pickupAddress = activeRide?.pickup?.address || 'Pickup Location';
  const customerName = activeRide?.customer?.name || 'Customer';
  const customerPhone = activeRide?.customer?.phone || '';

  const pickupEval = useMemo(
    () => evaluateDriverGeofence(driverGps, activeRide?.pickup, 'pickup'),
    [driverGps, activeRide?.pickup]
  );

  const handleOpenExternalMaps = () => {
    if (pickupLat == null || pickupLng == null) {
      Alert.alert('Navigation Error', 'Pickup coordinates unavailable');
      return;
    }
    const url = Platform.select({
      ios: `maps://app?daddr=${pickupLat},${pickupLng}`,
      android: `google.navigation:q=${pickupLat},${pickupLng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${pickupLat},${pickupLng}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${pickupLat},${pickupLng}`);
      });
    }
  };

  const handleCallCustomer = () => {
    if (!customerPhone) {
      Alert.alert('Phone', 'Customer phone number not available');
      return;
    }
    Linking.openURL(`tel:${customerPhone}`);
  };

  const handleChatCustomer = () => {
    navigation.navigate('ChatScreen', {
      customerName,
      customerPhone,
      rideId: activeRide?._id,
    });
  };

  const handleArrived = async () => {
    const success = await arriveAtPickup();
    if (success) {
      Alert.alert('Arrival Verified', 'Customer notified that you have arrived at the pickup point.');
      navigation.navigate('ActiveOrder');
    }
  };

  const centerPoint =
    driverGps?.latitude != null && driverGps?.longitude != null
      ? { latitude: driverGps.latitude, longitude: driverGps.longitude }
      : location || (pickupLat != null && pickupLng != null ? { latitude: Number(pickupLat), longitude: Number(pickupLng) } : null);

  return (
    <View style={styles.container}>
      {/* Live Map with 50m Pickup Geofence Circle */}
      <View style={styles.mapArea}>
        <RiderWebMapView
          center={centerPoint}
          googleMapsKey={googleMapsKey}
          zoom={17}
          pickupCoord={pickupLat != null && pickupLng != null ? { lat: Number(pickupLat), lng: Number(pickupLng) } : null}
          activeGeofenceTarget="pickup"
          isWithinGeofence={pickupEval.isWithinRadius}
          style={StyleSheet.absoluteFill}
        />

        <TouchableOpacity style={styles.externalMapsFloatingBtn} onPress={handleOpenExternalMaps}>
          <Ionicons name="map-outline" size={16} color="#fff" />
          <Text style={styles.externalMapsText}>Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Top Floating Bar */}
      <View style={styles.overlayHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.instructionBox}>
          <Ionicons name="navigate" size={24} color="#fff" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.instructionText}>Navigating to Pickup</Text>
            <Text style={styles.instructionSub} numberOfLines={1}>
              {pickupEval.distanceLabel} • {pickupAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Customer & Geofence Actions Sheet */}
      <View style={styles.bottomCard}>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerStatus}>
              {activeRide?.status === 'arrived' ? 'Waiting for boarding' : 'Expecting pickup'}
            </Text>
          </View>
          <TouchableOpacity style={styles.contactBtn} onPress={handleChatCustomer}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactBtn, styles.callBtn]} onPress={handleCallCustomer}>
            <Ionicons name="call" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {activeRide?.status === 'arrived' ? (
          <View style={styles.arrivedConfirmedBox}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.arrivedConfirmedText}>
              Arrival confirmed at pickup. Return to dashboard to enter customer OTP.
            </Text>
          </View>
        ) : (
          <GeofenceArrivalCard
            mode="pickup"
            evaluation={pickupEval}
            isSubmitting={isArrivalSubmitting}
            onPressArrive={handleArrived}
            onRefreshGps={refreshCurrentGps}
            variant="dark"
          />
        )}

        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => navigation.navigate('RouteDetails')}
        >
          <Ionicons name="list" size={16} color="#cbd5e1" />
          <Text style={styles.detailsBtnText}>View Route Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2C' },
  mapArea: {
    flex: 1,
    backgroundColor: '#242436',
    position: 'relative',
  },
  externalMapsFloatingBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    elevation: 6,
  },
  externalMapsText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  overlayHeader: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  instructionBox: {
    flex: 1,
    backgroundColor: '#f72585',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
  instructionText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  instructionSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  bottomCard: {
    backgroundColor: '#1E1E2C',
    padding: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#34344e',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f72585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  customerStatus: { color: '#a0a0b0', fontSize: 12, marginTop: 2 },
  contactBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2a2a3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  callBtn: { backgroundColor: '#1b3b2b' },
  arrivedConfirmedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b3b2b',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  arrivedConfirmedText: {
    color: '#d1fae5',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    gap: 6,
  },
  detailsBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
});
