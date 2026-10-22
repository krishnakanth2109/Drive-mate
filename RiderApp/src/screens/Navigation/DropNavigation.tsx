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

export default function DropNavigationScreen({ navigation }: any) {
  const { activeRide, completeRide } = useRider();
  const [loading, setLoading] = useState(false);

  const dropLat = activeRide?.drop?.lat || 28.6289;
  const dropLng = activeRide?.drop?.lng || 77.2180;
  const dropAddress = activeRide?.drop?.address || 'Drop-off Destination';
  const customerName = activeRide?.customer?.name || 'Customer';
  const customerPhone = activeRide?.customer?.phone || '';
  const fare = activeRide?.fare || 0;
  const distance = activeRide?.distance || 0;

  const handleOpenExternalMaps = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${dropLat},${dropLng}`,
      android: `google.navigation:q=${dropLat},${dropLng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${dropLat},${dropLng}`
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
      rideId: activeRide?._id
    });
  };

  const handleEndTrip = () => {
    Alert.alert(
      'Complete Trip',
      `Confirm trip completion and collect ₹${fare}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Trip',
          onPress: async () => {
            const rideId = activeRide?._id;
            setLoading(true);
            try {
              await completeRide();
              if (rideId) {
                navigation.replace('OrderDetails', { rideId });
              } else {
                navigation.replace('MainTabs');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to complete trip');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Map visual card */}
      <View style={styles.mapArea}>
        <Ionicons name="navigate-circle" size={90} color="#4CAF50" />
        <Text style={styles.navStatusText}>Heading to Destination</Text>
        <Text style={styles.targetAddress} numberOfLines={2}>
          {dropAddress}
        </Text>
        <TouchableOpacity style={styles.externalMapsBtn} onPress={handleOpenExternalMaps}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.externalMapsText}>Turn-by-Turn Navigation</Text>
        </TouchableOpacity>
      </View>

      {/* Top Floating Bar */}
      <View style={styles.overlayHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.instructionBox}>
          <Ionicons name="flag" size={28} color="#fff" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.instructionText}>En route to Drop Location</Text>
            <Text style={styles.instructionSub}>
              {distance ? `${distance} km total trip` : 'Driving safely'}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Fare & Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.paymentMode}>
              {activeRide?.paymentMethod || 'Cash on Delivery'}
            </Text>
          </View>
          <TouchableOpacity style={styles.contactBtn} onPress={handleChatCustomer}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactBtn, styles.callBtn]} onPress={handleCallCustomer}>
            <Ionicons name="call" size={18} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        <View style={styles.tripMetaRow}>
          <View>
            <Text style={styles.fareLabel}>Collect Fare</Text>
            <Text style={styles.fareValue}>₹{fare}</Text>
          </View>
          <TouchableOpacity
            style={styles.endBtn}
            onPress={handleEndTrip}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={20} color="#fff" />
                <Text style={styles.endBtnText}>End Trip</Text>
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
    backgroundColor: '#2e7d32',
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
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  instructionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  instructionSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  bottomBar: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
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
  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: { color: '#a0a0b0', fontSize: 12 },
  fareValue: { color: '#06d6a0', fontSize: 26, fontWeight: 'bold', marginTop: 2 },
  endBtn: {
    backgroundColor: '#f72585',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    elevation: 4,
  },
  endBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
