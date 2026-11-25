import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';

export default function PickupNavigationScreen({ navigation }: any) {
  const { activeRide, arriveAtPickup } = useRider();
  const [loading, setLoading] = useState(false);

  const pickupLat = activeRide?.pickup?.lat || 28.6139;
  const pickupLng = activeRide?.pickup?.lng || 77.2090;
  const pickupAddress = activeRide?.pickup?.address || 'Pickup Location';
  const customerName = activeRide?.customer?.name || 'Customer';
  const customerPhone = activeRide?.customer?.phone || '';

  const handleOpenExternalMaps = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${pickupLat},${pickupLng}`,
      android: `google.navigation:q=${pickupLat},${pickupLng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${pickupLat},${pickupLng}`
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
      rideId: activeRide?._id
    });
  };

  const handleArrived = async () => {
    setLoading(true);
    const success = await arriveAtPickup();
    setLoading(false);
    if (success) {
      Alert.alert('Status Updated', 'Customer notified that you have arrived at pickup!');
      navigation.navigate('ActiveOrder');
    }
  };

  return (
    <View style={styles.container}>
      {/* Map visual card */}
      <View style={styles.mapArea}>
        <Ionicons name="navigate-circle" size={90} color="#f72585" />
        <Text style={styles.navStatusText}>Navigating to Pickup</Text>
        <Text style={styles.targetAddress} numberOfLines={2}>
          {pickupAddress}
        </Text>
        <TouchableOpacity style={styles.externalMapsBtn} onPress={handleOpenExternalMaps}>
          <Ionicons name="map-outline" size={18} color="#fff" />
          <Text style={styles.externalMapsText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Top Floating Bar */}
      <View style={styles.overlayHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.instructionBox}>
          <Ionicons name="arrow-up" size={28} color="#fff" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.instructionText}>Head towards pickup point</Text>
            <Text style={styles.instructionSub}>
              {activeRide?.distance ? `${activeRide.distance} km remaining` : 'On the way'}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Customer & Actions Sheet */}
      <View style={styles.bottomCard}>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#fff" />
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

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => navigation.navigate('RouteDetails')}
          >
            <Ionicons name="list" size={18} color="#fff" />
            <Text style={styles.detailsBtnText}>Route Steps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.arrivedBtn}
            onPress={handleArrived}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.arrivedBtnText}>I Have Arrived</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2C' },
  mapArea: {
    flex: 1,
    backgroundColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  navStatusText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 15 },
  targetAddress: {
    color: '#a0a0b0',
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },
  externalMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34495e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
    gap: 8,
  },
  externalMapsText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  overlayHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  instructionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  instructionSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  bottomCard: {
    backgroundColor: '#1E1E2C',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#34344e',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f72585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  customerStatus: { color: '#a0a0b0', fontSize: 12, marginTop: 2 },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  callBtn: { backgroundColor: '#1b3b2b' },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a3c',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  detailsBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  arrivedBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06d6a0',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  arrivedBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
