import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import RiderWebMapView from '../../components/RiderWebMapView';
import GeofenceArrivalCard from '../../components/GeofenceArrivalCard';
import { evaluateDriverGeofence } from '../../utils/geofence';

export default function DropNavigationScreen({ navigation }: any) {
  const {
    activeRide,
    arriveAtDrop,
    completeRide,
    location,
    driverGps,
    googleMapsKey,
    isArrivalSubmitting,
    refreshCurrentGps,
  } = useRider();
  const [completing, setCompleting] = useState(false);

  const dropLat = activeRide?.drop?.lat ?? null;
  const dropLng = activeRide?.drop?.lng ?? null;
  const dropAddress = activeRide?.drop?.address || 'Drop-off Destination';
  const customerName = activeRide?.customer?.name || 'Customer';
  const customerPhone = activeRide?.customer?.phone || '';
  const fare = activeRide?.fare || 0;
  const distance = activeRide?.distance || 0;
  const isDropArrived = activeRide?.status === 'drop_arrived';

  const dropEval = useMemo(
    () => evaluateDriverGeofence(driverGps, activeRide?.drop, 'drop'),
    [driverGps, activeRide?.drop]
  );

  const handleOpenExternalMaps = () => {
    if (dropLat == null || dropLng == null) {
      Alert.alert('Navigation Error', 'Drop coordinates unavailable');
      return;
    }
    const url = Platform.select({
      ios: `maps://app?daddr=${dropLat},${dropLng}`,
      android: `google.navigation:q=${dropLat},${dropLng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${dropLat},${dropLng}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dropLat},${dropLng}`);
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

  const handleDeclareDropArrival = async () => {
    const ok = await arriveAtDrop();
    if (ok) {
      Alert.alert('Destination Reached', 'Drop arrival confirmed! You can now collect the fare and complete the trip.');
    }
  };

  const handleEndTrip = () => {
    if (!isDropArrived) {
      Alert.alert('Drop Arrival Required', 'Move within 50 m of the drop location and tap "Reached Drop Location" first.');
      return;
    }
    Alert.alert(
      'Complete Trip',
      `Confirm trip completion and collect ₹${fare}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Trip',
          onPress: async () => {
            const rideId = activeRide?._id;
            setCompleting(true);
            try {
              const ok = await completeRide();
              if (ok) {
                if (rideId) {
                  navigation.replace('OrderDetails', { rideId });
                } else {
                  navigation.replace('MainTabs');
                }
              }
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  const centerPoint =
    driverGps?.latitude != null && driverGps?.longitude != null
      ? { latitude: driverGps.latitude, longitude: driverGps.longitude }
      : location || (dropLat != null && dropLng != null ? { latitude: Number(dropLat), longitude: Number(dropLng) } : null);

  return (
    <View style={styles.container}>
      {/* Live Map with 50m Drop Geofence Circle */}
      <View style={styles.mapArea}>
        <RiderWebMapView
          center={centerPoint}
          googleMapsKey={googleMapsKey}
          zoom={17}
          dropCoord={dropLat != null && dropLng != null ? { lat: Number(dropLat), lng: Number(dropLng) } : null}
          activeGeofenceTarget="drop"
          isWithinGeofence={dropEval.isWithinRadius || isDropArrived}
          style={StyleSheet.absoluteFill}
        />

        <TouchableOpacity style={styles.externalMapsBtn} onPress={handleOpenExternalMaps}>
          <Ionicons name="navigate-outline" size={16} color="#fff" />
          <Text style={styles.externalMapsText}>Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Top Floating Bar */}
      <View style={styles.overlayHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.instructionBox}>
          <Ionicons name="flag" size={24} color="#fff" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.instructionText}>
              {isDropArrived ? 'Reached Destination' : 'En route to Drop Location'}
            </Text>
            <Text style={styles.instructionSub} numberOfLines={1}>
              {isDropArrived ? dropAddress : `${dropEval.distanceLabel} • ${distance ? `${distance} km trip` : dropAddress}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Fare, Geofence & Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.paymentMode}>
              {activeRide?.paymentMethod || 'Wallet / Cash'} • ₹{fare}
            </Text>
          </View>
          <TouchableOpacity style={styles.contactBtn} onPress={handleChatCustomer}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactBtn, styles.callBtn]} onPress={handleCallCustomer}>
            <Ionicons name="call" size={18} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {isDropArrived ? (
          <>
            <View style={styles.arrivedConfirmedBox}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.arrivedConfirmedText}>
                Drop arrival verified within 50m radius. Ready to complete trip!
              </Text>
            </View>
            <View style={styles.tripMetaRow}>
              <View>
                <Text style={styles.fareLabel}>Collect Fare</Text>
                <Text style={styles.fareValue}>₹{fare}</Text>
              </View>
              <TouchableOpacity
                style={styles.endBtn}
                onPress={handleEndTrip}
                disabled={completing}
              >
                {completing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                    <Text style={styles.endBtnText}>End Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <GeofenceArrivalCard
            mode="drop"
            evaluation={dropEval}
            isSubmitting={isArrivalSubmitting}
            onPressArrive={handleDeclareDropArrival}
            onRefreshGps={refreshCurrentGps}
            variant="dark"
          />
        )}
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
  externalMapsBtn: {
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
    backgroundColor: '#10b981',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
  instructionText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  instructionSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  bottomBar: {
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  paymentMode: { color: '#a0a0b0', fontSize: 12, marginTop: 2 },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginBottom: 14,
  },
  arrivedConfirmedText: {
    color: '#d1fae5',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: { color: '#a0a0b0', fontSize: 12 },
  fareValue: { color: '#06d6a0', fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  endBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    elevation: 4,
  },
  endBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
