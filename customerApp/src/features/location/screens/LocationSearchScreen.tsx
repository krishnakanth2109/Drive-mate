import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import PlaceAutocompleteInput from '../../../components/PlaceAutocompleteInput';
import { useCustomer } from '../../../context/CustomerContext';
import { rideHistoryService } from '../../rides/services/rideHistoryService';

type Props = {
  navigation: StackNavigationProp<any, 'LocationSearch'>;
  route?: any;
};

interface RecentLocationItem {
  id: string;
  name: string;
  address: string;
  icon: string;
  lat: number;
  lng: number;
}

export default function LocationSearchScreen({ navigation, route }: Props) {
  const { currentAddress, userLocation, requestCurrentLocation, fetchEstimate } = useCustomer();
  const [searchText, setSearchText] = useState('');
  const [recentLocations, setRecentLocations] = useState<RecentLocationItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    let active = true;
    rideHistoryService
      .getHistory({ limit: 8 })
      .then((res) => {
        if (!active || !Array.isArray(res?.rides)) return;
        const seen = new Set<string>();
        const list: RecentLocationItem[] = [];
        for (const r of res.rides) {
          const address = r.drop?.address || r.dropAddress;
          const lat = Number(r.drop?.lat ?? r.dropLat);
          const lng = Number(r.drop?.lng ?? r.dropLng);
          if (!address || isNaN(lat) || isNaN(lng) || seen.has(address)) continue;
          seen.add(address);
          list.push({
            id: r.id || r._id,
            name: r.drop?.name || r.dropPlaceName || address.split(',')[0],
            address,
            icon: 'time',
            lat,
            lng,
          });
        }
        setRecentLocations(list);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingRecent(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const target = route?.params?.target || 'drop'; // 'pickup' | 'drop'

  const handleSelectPlace = async (place: { name?: string; address: string; lat: number; lng: number }) => {
    if (route?.params?.onSelect) {
      route.params.onSelect(place);
      navigation.goBack();
      return;
    }

    if (userLocation) {
      const pickup = {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        address: currentAddress || 'Current Location',
      };
      await fetchEstimate(pickup, place);
      navigation.navigate('MainTabs');
    } else {
      navigation.goBack();
    }
  };

  const handleUseCurrentLocation = async () => {
    await requestCurrentLocation();
    if (userLocation) {
      handleSelectPlace({
        name: 'Current Location',
        address: currentAddress || 'Current Location',
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {target === 'pickup' ? 'Select Pickup Point' : 'Select Destination'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <PlaceAutocompleteInput
          placeholder={target === 'pickup' ? 'Search pickup location...' : 'Where to? (e.g. Landmark, locality)...'}
          value={searchText}
          dotColor={target === 'pickup' ? '#06d6a0' : '#f72585'}
          onChangeText={setSearchText}
          onSelect={handleSelectPlace}
          autoFocus
        />
      </View>

      <TouchableOpacity style={styles.currentLocationBtn} onPress={handleUseCurrentLocation}>
        <View style={styles.gpsIconCircle}>
          <Ionicons name="locate" size={20} color="#f72585" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.currentLocationText}>Use my current location</Text>
          <Text style={styles.currentLocationSub} numberOfLines={1}>
            {currentAddress || 'Acquiring GPS coordinates...'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Destinations</Text>
        {loadingRecent ? (
          <ActivityIndicator size="small" color="#f72585" style={{ marginTop: 16 }} />
        ) : (
          <FlatList
            data={recentLocations}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={{ color: '#888', fontSize: 13, marginTop: 12 }}>
                No recent destinations yet. Search an address above to get started.
              </Text>
            }
            renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.locationItem}
              onPress={() =>
                handleSelectPlace({
                  name: item.name,
                  address: item.address,
                  lat: item.lat,
                  lng: item.lng,
                })
              }
            >
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={20} color="#666" />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationAddress}>{item.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: { marginRight: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, zIndex: 100 },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 6,
    borderBottomColor: '#f8f9fa',
    gap: 12,
  },
  gpsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(247, 37, 133, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationText: { color: '#f72585', fontSize: 15, fontWeight: '700' },
  currentLocationSub: { color: '#888', fontSize: 12, marginTop: 2 },
  recentSection: { flex: 1, paddingTop: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f4',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  locationDetails: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 2 },
  locationAddress: { fontSize: 13, color: '#888' },
});
