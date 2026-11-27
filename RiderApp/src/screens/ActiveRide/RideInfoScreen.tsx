import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { riderService } from '../../services/riderService';
import { Ride } from '../../services/types';

export default function RideInfoScreen({ navigation, route }: any) {
  const { activeRide } = useRider();
  const [ride, setRide] = useState<Ride | null>(route?.params?.ride || activeRide);

  useEffect(() => {
    if (!ride) {
      riderService.getActiveRide()
        .then(data => setRide(data))
        .catch(err => console.log('No active ride', err));
    }
  }, []);

  const pickup = ride?.pickup?.address || 'Pickup Location';
  const dropoff = ride?.drop?.address || 'Dropoff Location';
  const fare = ride?.fare !== undefined ? `₹${ride.fare}` : '₹0';
  const distance = ride?.distance !== undefined ? `${ride.distance} km` : '0 km';
  const estTime = ride?.duration !== undefined ? `${ride.duration} mins` : '0 mins';
  const rideType = ride?.vehicleType ? `DriveMate ${ride.vehicleType.toUpperCase()}` : 'DriveMate Standard';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Locations</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="radio-button-on" size={20} color="#4CAF50" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationValue}>{pickup}</Text>
            </View>
          </View>
          
          <View style={styles.connector} />
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={20} color="#f72585" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.locationValue}>{dropoff}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Fare</Text>
            <Text style={styles.detailValueHighlight}>{fare}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>{distance}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Time</Text>
            <Text style={styles.detailValue}>{estTime}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ride Type</Text>
            <Text style={styles.detailValue}>{rideType}</Text>
          </View>
        </View>

      </ScrollView>
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
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationTextContainer: {
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  connector: {
    width: 2,
    height: 24,
    backgroundColor: '#ddd',
    marginLeft: 9,
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  detailValueHighlight: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    width: '100%',
  }
});
