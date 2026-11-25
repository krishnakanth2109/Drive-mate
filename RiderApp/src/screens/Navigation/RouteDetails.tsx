import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';

export default function RouteDetailsScreen({ navigation }: any) {
  const { activeRide } = useRider();

  const pickupAddress = activeRide?.pickup?.address || 'Pickup point';
  const dropAddress = activeRide?.drop?.address || 'Drop location';
  const distance = activeRide?.distance || 0;
  const duration = activeRide?.duration || 0;
  const fare = activeRide?.fare || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route & Directions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Route Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricValue}>{distance} km</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Est. Time</Text>
            <Text style={styles.metricValue}>{Math.ceil(duration)} min</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Trip Fare</Text>
            <Text style={styles.metricFare}>₹{fare}</Text>
          </View>
        </View>

        {/* Origin / Destination Details */}
        <View style={styles.locationsCard}>
          <View style={styles.locationRow}>
            <View style={[styles.dot, styles.pickupDot]} />
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
              <Text style={styles.locationAddress}>{pickupAddress}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <View style={[styles.dot, styles.dropDot]} />
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationLabel}>DROP DESTINATION</Text>
              <Text style={styles.locationAddress}>{dropAddress}</Text>
            </View>
          </View>
        </View>

        {/* Turn-by-Turn Waypoints */}
        <Text style={styles.sectionTitle}>Turn-by-Turn Waypoints</Text>

        <View style={styles.step}>
          <View style={styles.iconCircle}>
            <Ionicons name="locate" size={20} color="#2196F3" />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>Start at pickup point</Text>
            <Text style={styles.stepDist}>{pickupAddress}</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.iconCircle}>
            <Ionicons name="arrow-up" size={20} color="#06d6a0" />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>Follow the primary arterial road</Text>
            <Text style={styles.stepDist}>Main corridor towards destination</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.iconCircle}>
            <Ionicons name="arrow-undo" size={20} color="#f72585" />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>Take the connecting exit / flyover</Text>
            <Text style={styles.stepDist}>Fastest route via traffic management</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.iconCircle}>
            <Ionicons name="flag" size={20} color="#4CAF50" />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>Arrive at drop destination</Text>
            <Text style={styles.stepDist}>{dropAddress}</Text>
          </View>
        </View>

        {activeRide && (
          <TouchableOpacity
            style={styles.navActionBtn}
            onPress={() => {
              if (activeRide.status === 'ongoing') {
                navigation.navigate('DropNavigation');
              } else {
                navigation.navigate('PickupNavigation');
              }
            }}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.navActionText}>Launch Live Navigation</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2C' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#2a2a3c',
    borderBottomWidth: 1,
    borderBottomColor: '#3b3b4f',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a3c',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { color: '#a0a0b0', fontSize: 12, marginBottom: 4 },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  metricFare: { color: '#06d6a0', fontSize: 18, fontWeight: 'bold' },
  metricDivider: { width: 1, height: 35, backgroundColor: '#3b3b4f' },
  locationsCard: {
    backgroundColor: '#2a2a3c',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  pickupDot: { backgroundColor: '#2196F3' },
  dropDot: { backgroundColor: '#06d6a0' },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#4a4a60',
    marginLeft: 6,
    marginVertical: 4,
  },
  locationTextWrap: { flex: 1, marginLeft: 12 },
  locationLabel: { color: '#888', fontSize: 11, fontWeight: 'bold' },
  locationAddress: { color: '#fff', fontSize: 14, marginTop: 2, lineHeight: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242436',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepTextContainer: { flex: 1 },
  stepText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  stepDist: { color: '#a0a0b0', fontSize: 12, marginTop: 3 },
  navActionBtn: {
    backgroundColor: '#f72585',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
    gap: 8,
  },
  navActionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
