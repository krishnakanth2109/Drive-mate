import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface RideHistoryItem {
  id: string;
  date: string;
  pickup: string;
  drop: string;
  fare: number;
  distance: string;
  duration: string;
  vehicleType: string;
  vehicleEmoji: string;
  status: 'Completed' | 'Cancelled';
  driverName: string;
  driverRating: number;
  paymentMethod: string;
}

const MOCK_RIDES: RideHistoryItem[] = [
  {
    id: 'RIDE-1049',
    date: 'Today, 02:45 PM',
    pickup: 'Inorbit Mall, Hitec City',
    drop: 'Mindspace Junction, Madhapur',
    fare: 145,
    distance: '4.8 km',
    duration: '16 mins',
    vehicleType: 'Car (Sedan)',
    vehicleEmoji: '🚗',
    status: 'Completed',
    driverName: 'Ramesh K.',
    driverRating: 4.9,
    paymentMethod: 'Wallet',
  },
  {
    id: 'RIDE-1048',
    date: 'Yesterday, 07:15 PM',
    pickup: 'Cyber Towers, Hitec City',
    drop: 'Gachibowli DLF Cyber City',
    fare: 75,
    distance: '3.2 km',
    duration: '11 mins',
    vehicleType: 'Bike',
    vehicleEmoji: '🏍️',
    status: 'Completed',
    driverName: 'Suresh V.',
    driverRating: 4.8,
    paymentMethod: 'Cash',
  },
  {
    id: 'RIDE-1047',
    date: '12 Oct, 11:20 AM',
    pickup: 'Secunderabad Station',
    drop: 'Banjara Hills Road No. 12',
    fare: 210,
    distance: '9.6 km',
    duration: '28 mins',
    vehicleType: 'Auto',
    vehicleEmoji: '🛺',
    status: 'Completed',
    driverName: 'Mohd. Imran',
    driverRating: 5.0,
    paymentMethod: 'Wallet',
  },
  {
    id: 'RIDE-1046',
    date: '10 Oct, 09:05 PM',
    pickup: 'Kondapur Main Road',
    drop: 'Jubilee Hills Check Post',
    fare: 180,
    distance: '7.1 km',
    duration: '22 mins',
    vehicleType: 'Car (Sedan)',
    vehicleEmoji: '🚗',
    status: 'Cancelled',
    driverName: 'Driver not assigned',
    driverRating: 0,
    paymentMethod: 'Cancelled by Rider',
  },
  {
    id: 'RIDE-1045',
    date: '08 Oct, 08:30 AM',
    pickup: 'Financial District, Nanakramguda',
    drop: 'IKEA Hyderabad, HITEC City',
    fare: 95,
    distance: '5.4 km',
    duration: '15 mins',
    vehicleType: 'Scooty',
    vehicleEmoji: '🛵',
    status: 'Completed',
    driverName: 'Praveen T.',
    driverRating: 4.7,
    paymentMethod: 'Wallet',
  },
];

export default function RideHistoryScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<'All' | 'Completed' | 'Cancelled'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<RideHistoryItem[]>(MOCK_RIDES);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const filteredRides = rides.filter((item) => {
    if (filter === 'All') return true;
    return item.status === filter;
  });

  const renderRideCard = ({ item }: { item: RideHistoryItem }) => {
    const isCompleted = item.status === 'Completed';

    return (
      <View style={styles.card}>
        {/* Card Header: Date & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.vehicleEmoji}>{item.vehicleEmoji}</Text>
            <View>
              <Text style={styles.vehicleType}>{item.vehicleType}</Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusCancelled]}>
            <Text style={[styles.statusText, isCompleted ? styles.statusCompletedText : styles.statusCancelledText]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Route Details */}
        <View style={styles.routeContainer}>
          <View style={styles.routeIndicators}>
            <View style={styles.pickupDot} />
            <View style={styles.routeLine} />
            <View style={styles.dropDot} />
          </View>
          <View style={styles.routeTexts}>
            <View style={styles.routePoint}>
              <Text style={styles.pointLabel}>PICKUP</Text>
              <Text style={styles.pointAddress} numberOfLines={1}>
                {item.pickup}
              </Text>
            </View>
            <View style={styles.routePoint}>
              <Text style={styles.pointLabel}>DROPOFF</Text>
              <Text style={styles.pointAddress} numberOfLines={1}>
                {item.drop}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Card Footer: Driver, Distance & Fare */}
        <View style={styles.cardFooter}>
          <View>
            {isCompleted ? (
              <View style={styles.driverRow}>
                <Ionicons name="person-circle-outline" size={18} color="#555" />
                <Text style={styles.driverText}>{item.driverName}</Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.ratingText}>{item.driverRating}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.cancelledNote}>Trip cancelled</Text>
            )}
            <Text style={styles.tripMeta}>
              {item.distance} • {item.duration}
            </Text>
          </View>

          <View style={styles.fareBox}>
            <Text style={styles.fareText}>₹{item.fare}</Text>
            <Text style={styles.paymentMethodText}>{item.paymentMethod}</Text>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.bookAgainBtn}
            onPress={() => {
              navigation.navigate('Home');
            }}
          >
            <Ionicons name="repeat-outline" size={16} color="#f72585" />
            <Text style={styles.bookAgainText}>Book Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => {
              navigation.navigate('Help');
            }}
          >
            <Ionicons name="help-circle-outline" size={16} color="#666" />
            <Text style={styles.helpText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Rides</Text>
          <Text style={styles.subtitle}>View and manage past trips</Text>
        </View>
        <TouchableOpacity
          style={styles.receiptBtn}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Ionicons name="wallet-outline" size={20} color="#f72585" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['All', 'Completed', 'Cancelled'] as const).map((tab) => {
          const isActive = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Rides List */}
      <FlatList
        data={filteredRides}
        keyExtractor={(item) => item.id}
        renderItem={renderRideCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#f72585']}
            tintColor="#f72585"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Rides Found</Text>
            <Text style={styles.emptySub}>
              You do not have any {filter.toLowerCase()} trips yet.
            </Text>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.bookNowText}>Book a Ride Now</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  receiptBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff0f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd6e7',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
  },
  filterTabActive: {
    backgroundColor: '#f72585',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleEmoji: {
    fontSize: 28,
  },
  vehicleType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#e6fcf5',
  },
  statusCancelled: {
    backgroundColor: '#ffe3e3',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusCompletedText: {
    color: '#0ca678',
  },
  statusCancelledText: {
    color: '#fa5252',
  },
  divider: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginVertical: 12,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeIndicators: {
    alignItems: 'center',
    width: 14,
    paddingTop: 4,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#06d6a0',
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginVertical: 2,
  },
  dropDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f72585',
  },
  routeTexts: {
    flex: 1,
    gap: 12,
  },
  routePoint: {},
  pointLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#aaa',
    letterSpacing: 0.5,
  },
  pointAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  cancelledNote: {
    fontSize: 12,
    color: '#fa5252',
    fontStyle: 'italic',
  },
  tripMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  fareBox: {
    alignItems: 'flex-end',
  },
  fareText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  paymentMethodText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f9f9f9',
  },
  bookAgainBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#fff0f6',
    borderWidth: 1,
    borderColor: '#ffd6e7',
  },
  bookAgainText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f72585',
  },
  helpBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  helpText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  bookNowBtn: {
    backgroundColor: '#f72585',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  bookNowText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
