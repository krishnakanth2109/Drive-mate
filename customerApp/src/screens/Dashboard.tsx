import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  Alert,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, {
  Marker,
  Polyline,
  UrlTile,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { CustomerProvider, useCustomer } from '../context/CustomerContext';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────
// HELPER: Decode encoded polyline
// ─────────────────────────────────────────────
const decodePolyline = (t: string): { latitude: number; longitude: number }[] => {
  if (!t || t === 'encoded_polyline_placeholder') return [];
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  const len = t.length;
  let lat = 0;
  let lng = 0;
  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

// ─────────────────────────────────────────────
// Vehicle options config (matches backend)
// ─────────────────────────────────────────────
const VEHICLE_TYPES = [
  { type: 'bike',   emoji: '🏍️', label: 'Bike',   desc: 'Fast & affordable' },
  { type: 'scooty', emoji: '🛵', label: 'Scooty', desc: 'Light & easy' },
  { type: 'auto',   emoji: '🛺', label: 'Auto',   desc: 'Comfortable' },
  { type: 'car',    emoji: '🚗', label: 'Car',    desc: 'Premium' },
];

// ─────────────────────────────────────────────
// MAP COMPONENT
// ─────────────────────────────────────────────
const MapComponent = ({ isPinPicking, onPinChange }: { isPinPicking: boolean, onPinChange: (loc: {lat: number, lng: number}) => void }) => {
  const { userLocation, estimate, driverLocation, appState, availableDrivers } = useCustomer();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (estimate && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: estimate.pickup.lat, longitude: estimate.pickup.lng },
          { latitude: estimate.drop.lat, longitude: estimate.drop.lng },
        ],
        { edgePadding: { top: 120, right: 50, bottom: 380, left: 50 }, animated: true }
      );
    }
  }, [estimate]);

  const routeCoordinates =
    estimate?.polyline ? decodePolyline(estimate.polyline) : [];

  if (!userLocation) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1a1a2e" />
        <Text style={styles.loaderText}>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.map}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={userLocation}
        showsUserLocation={true}
        onRegionChangeComplete={(region) => {
          if (isPinPicking) {
            onPinChange({ lat: region.latitude, lng: region.longitude });
          }
        }}
      >
      {routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeWidth={5}
          strokeColor="#f72585"
        />
      )}

      {estimate && (
        <>
          <Marker
            coordinate={{ latitude: estimate.pickup.lat, longitude: estimate.pickup.lng }}
            title="Pickup"
          >
            <View style={styles.markerGreen}>
              <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>FROM</Text>
            </View>
          </Marker>
          <Marker
            coordinate={{ latitude: estimate.drop.lat, longitude: estimate.drop.lng }}
            title="Drop"
          >
            <View style={styles.markerRed}>
              <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>TO</Text>
            </View>
          </Marker>
        </>
      )}

      {/* Dynamic Nearby Drivers (Pre-booking) */}
      {(appState === 'IDLE' || appState === 'ESTIMATING') && Object.entries(availableDrivers || {}).map(([id, driver]) => {
        const vcfg = VEHICLE_TYPES.find(v => v.type === driver.vehicleType);
        return (
          <Marker 
            key={id} 
            coordinate={{ latitude: driver.lat, longitude: driver.lng }} 
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={driver.heading || 0}
          >
            <View style={[styles.driverMarker, { backgroundColor: '#f8f8f8', padding: 4, transform: [{ scale: 0.85 }] }]}>
              <Text style={{ fontSize: 22 }}>{vcfg?.emoji || '🏍️'}</Text>
            </View>
          </Marker>
        );
      })}

      {(appState === 'ACCEPTED' || appState === 'ONGOING') && driverLocation && (
        <Marker coordinate={driverLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.driverMarker}>
            <Text style={{ fontSize: 26 }}>🏍️</Text>
          </View>
        </Marker>
      )}
      </MapView>

      {isPinPicking && (
        <View style={styles.centerPinWrap} pointerEvents="none">
          <Text style={styles.centerPinIcon}>📍</Text>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// INPUT PANEL (IDLE state)
// ─────────────────────────────────────────────
const InputPanel = ({ isPinPicking, setIsPinPicking, pinLocation }: any) => {
  const { appState, fetchEstimate, userLocation, googleMapsKey } = useCustomer();
  const [dropText, setDropText] = useState('');
  const [dropCoords, setDropCoords] = useState<{lat: number, lng: number} | null>(null);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(true);
  const [pickupText, setPickupText] = useState('📍 Current Location');
  const autocompleteRef = useRef<any>(null);

  if (appState !== 'IDLE') return null;

  if (isPinPicking) {
    return (
      <View style={styles.panel}>
        <View style={styles.handle} />
        <Text style={styles.panelTitle}>Pick Location</Text>
        <Text style={styles.panelSub}>Drag the map to choose your destination</Text>
        
        <View style={styles.actionRow}>
           <TouchableOpacity style={styles.cancelOutlineBtn} onPress={() => setIsPinPicking(false)}>
             <Text style={styles.cancelOutlineText}>Cancel</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.confirmBtn} onPress={() => {
              if(pinLocation) {
                setDropCoords(pinLocation);
                const addressStr = `${pinLocation.lat.toFixed(4)}, ${pinLocation.lng.toFixed(4)}`;
                setDropText(addressStr);
                if (autocompleteRef.current) {
                   autocompleteRef.current.setAddressText(addressStr);
                }
              }
              setIsPinPicking(false);
           }}>
             <Text style={styles.confirmBtnText}>Confirm Location</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleFindRide = () => {
    if (!dropText.trim() && !dropCoords) {
      Alert.alert('Missing Drop', 'Please enter your destination.');
      return;
    }

    const finalPickup = usingCurrentLocation && userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude }
      : pickupText.trim();
      
    const finalDrop = dropCoords ? dropCoords : dropText.trim();

    fetchEstimate(finalPickup, finalDrop);
  };

  return (
    <View style={styles.panel}>
      <View style={styles.handle} />
      <Text style={styles.panelTitle}>Book a Ride</Text>
      <Text style={styles.panelSub}>Max distance: 40 km</Text>

      {/* Pickup */}
      <View style={styles.locationRow}>
        <View style={[styles.locationDot, { backgroundColor: '#06d6a0' }]} />
        <View style={styles.locationInputWrap}>
          {usingCurrentLocation ? (
            <TouchableOpacity
              style={styles.currentLocBtn}
              onPress={() => {
                setUsingCurrentLocation(false);
                setPickupText('');
              }}
            >
              <Text style={styles.currentLocText}>📍 Current Location</Text>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Enter pickup location"
              value={pickupText}
              onChangeText={setPickupText}
              autoFocus
            />
          )}
        </View>
      </View>

      {/* Connector line */}
      <View style={styles.connector} />

      {/* Drop */}
      <View style={[styles.locationRow, { zIndex: 100 }]}>
        <View style={[styles.locationDot, { backgroundColor: '#f72585', marginTop: 16 }]} />
        <View style={{flex: 1, flexDirection: 'row', alignItems: 'flex-start'}}>
          <View style={{flex: 1}}>
            {googleMapsKey ? (
              <GooglePlacesAutocomplete
                ref={autocompleteRef}
                placeholder="Where to? (city, landmark...)"
                onPress={(data, details = null) => {
                  setDropText(data.description);
                  if(details?.geometry?.location) {
                    setDropCoords({
                      lat: details.geometry.location.lat,
                      lng: details.geometry.location.lng,
                    });
                  } else {
                    setDropCoords(null);
                  }
                }}
                query={{
                  key: googleMapsKey,
                  language: 'en',
                  components: 'country:in',
                }}
                fetchDetails={true}
                styles={{
                  textInputContainer: { width: '100%' },
                  textInput: [styles.input, { flex: undefined, height: 48, marginBottom: 0 }],
                  listView: { position: 'absolute', top: 52, zIndex: 100, backgroundColor: '#fff', elevation: 10, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                }}
                enablePoweredByContainer={false}
                textInputProps={{
                  onChangeText: (t) => { setDropText(t); setDropCoords(null); },
                  value: dropText
                }}
              />
            ) : (
              <ActivityIndicator size="small" color="#f72585" style={{ marginTop: 12 }} />
            )}
          </View>
          <TouchableOpacity style={styles.mapPickBtn} onPress={() => setIsPinPicking(true)}>
            <Text style={{fontSize: 20}}>🗺️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.findBtn} onPress={handleFindRide}>
        <Text style={styles.findBtnText}>Search Rides →</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────
// STATUS PANEL (ESTIMATING → SEARCHING → ACTIVE)
// ─────────────────────────────────────────────
const StatusPanel = () => {
  const {
    appState,
    estimate,
    requestRide,
    cancelRide,
    driver,
    activeRide,
    resetFlow,
  } = useCustomer();

  const [selectedVehicle, setSelectedVehicle] = useState('bike');

  if (appState === 'IDLE') return null;

  // ── ESTIMATING ──────────────────────────────
  if (appState === 'ESTIMATING' && estimate) {
    const selectedFare = estimate.fareOptions?.find(
      (o: any) => o.type === selectedVehicle
    );

    return (
      <View style={styles.panel}>
        <View style={styles.handle} />

        {/* Route summary */}
        <View style={styles.routeSummary}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: '#06d6a0' }]} />
            <Text style={styles.routeAddr} numberOfLines={1}>
              {estimate.pickup.address?.split(',')[0] || 'Pickup'}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: '#f72585' }]} />
            <Text style={styles.routeAddr} numberOfLines={1}>
              {estimate.drop.address?.split(',')[0] || 'Drop'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{estimate.distance} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{estimate.duration} min</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          {selectedFare && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#f72585' }]}>
                  ₹{selectedFare.fare}
                </Text>
                <Text style={styles.statLabel}>Fare</Text>
              </View>
            </>
          )}
        </View>

        {/* Vehicle picker */}
        <Text style={styles.sectionLabel}>Choose your ride</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {(estimate.fareOptions || []).map((option: any) => {
            const vcfg = VEHICLE_TYPES.find((v) => v.type === option.type);
            const isSelected = selectedVehicle === option.type;
            return (
              <TouchableOpacity
                key={option.type}
                style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                onPress={() => setSelectedVehicle(option.type)}
              >
                <Text style={styles.vehicleEmoji}>{vcfg?.emoji || '🚗'}</Text>
                <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={[styles.vehicleFare, isSelected && { color: '#fff' }]}>
                  ₹{option.fare}
                </Text>
                <Text style={[styles.vehiclePerKm, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
                  ₹{option.perKm}/km
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelOutlineBtn} onPress={resetFlow}>
            <Text style={styles.cancelOutlineText}>✕ Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => requestRide(selectedVehicle)}
          >
            <Text style={styles.confirmBtnText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── LOADING ESTIMATE ────────────────────────
  if (appState === 'ESTIMATING' && !estimate) {
    return (
      <View style={[styles.panel, styles.centerPanel]}>
        <ActivityIndicator size="large" color="#f72585" />
        <Text style={styles.statusText}>Calculating best route...</Text>
      </View>
    );
  }

  // ── SEARCHING ───────────────────────────────
  if (appState === 'SEARCHING') {
    return (
      <View style={[styles.panel, styles.centerPanel]}>
        <View style={styles.pulseWrap}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
        </View>
        <Text style={styles.statusText}>Finding a driver nearby...</Text>
        <Text style={styles.statusSub}>This usually takes under a minute</Text>
        <TouchableOpacity style={styles.cancelTextBtn} onPress={cancelRide}>
          <Text style={styles.cancelTextBtnText}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── ACCEPTED / ONGOING ──────────────────────
  if ((appState === 'ACCEPTED' || appState === 'ONGOING') && driver && activeRide) {
    return (
      <View style={styles.panel}>
        <View style={styles.handle} />

        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: appState === 'ACCEPTED' ? '#ffd166' : '#06d6a0' },
            ]}
          />
          <Text style={styles.statusBadgeText}>
            {appState === 'ACCEPTED' ? 'Driver on the way' : 'Ride in Progress'}
          </Text>
        </View>

        {/* Driver card */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarInitial}>{driver.name?.[0] || 'D'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.driverVehicle}>{driver.vehicle}</Text>
            <Text style={styles.driverPhone}>📞 {driver.phone}</Text>
          </View>
          <View style={styles.otpBox}>
            <Text style={styles.otpLabel}>OTP</Text>
            <Text style={styles.otpValue}>{activeRide.otp}</Text>
          </View>
        </View>

        {/* Trip info */}
        <View style={styles.tripRow}>
          <View style={styles.tripItem}>
            <Text style={styles.tripIcon}>📍</Text>
            <Text style={styles.tripText} numberOfLines={1}>
              {activeRide.drop?.address?.split(',')[0] || 'Destination'}
            </Text>
          </View>
          <View style={styles.tripItem}>
            <Text style={styles.tripIcon}>💰</Text>
            <Text style={styles.tripText}>₹{activeRide.fare}</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── COMPLETED ───────────────────────────────
  if (appState === 'COMPLETED') {
    return (
      <View style={[styles.panel, styles.centerPanel]}>
        <Text style={{ fontSize: 48 }}>🎉</Text>
        <Text style={styles.statusText}>Ride Completed!</Text>
        <Text style={styles.statusSub}>Hope you enjoyed the ride</Text>
        <TouchableOpacity style={styles.confirmBtn} onPress={resetFlow}>
          <Text style={styles.confirmBtnText}>Book Another Ride</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export default function CustomerDashboard({ navigation }: any) {
  return (
    <View style={styles.container}>
      <DashboardContent navigation={navigation} />
    </View>
  );
}

const DashboardContent = ({ navigation }: any) => {
  const { logout } = useCustomer();
  const [isPinPicking, setIsPinPicking] = useState(false);
  const [pinLocation, setPinLocation] = useState<{lat: number, lng: number} | null>(null);

  return (
    <>
      <MapComponent isPinPicking={isPinPicking} onPinChange={setPinLocation} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.appBrand}>
          <Text style={styles.brandText}>RIDE</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout(navigation)}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom overlay */}
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <InputPanel isPinPicking={isPinPicking} setIsPinPicking={setIsPinPicking} pinLocation={pinLocation} />
        <StatusPanel />
      </KeyboardAvoidingView>
    </>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  map: { flex: 1 },
  centerPinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -15,
    marginTop: -30,
    zIndex: 10,
  },
  centerPinIcon: { fontSize: 30 },
  mapPickBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginLeft: 8,
    width: 48,
    height: 48,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loaderText: { marginTop: 12, color: '#666', fontSize: 14 },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appBrand: {
    backgroundColor: '#f72585',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  brandText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  logoutBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: { fontWeight: '700', color: '#1a1a2e', fontSize: 13 },

  // Map markers
  markerGreen: {
    backgroundColor: '#06d6a0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    elevation: 4,
  },
  markerRed: {
    backgroundColor: '#f72585',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    elevation: 4,
  },
  driverMarker: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // Panel base
  overlay: { position: 'absolute', bottom: 0, width: '100%' },
  panel: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  centerPanel: { alignItems: 'center', paddingTop: 24, paddingBottom: 36 },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 18,
  },

  // Input panel
  panelTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 2 },
  panelSub: { fontSize: 12, color: '#aaa', marginBottom: 18 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  locationInputWrap: { flex: 1 },
  currentLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  currentLocText: { fontSize: 15, color: '#1a1a2e', fontWeight: '600' },
  changeText: { fontSize: 12, color: '#f72585', fontWeight: '700' },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a2e',
  },
  connector: {
    width: 2,
    height: 14,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginBottom: 6,
  },
  findBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  findBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },

  // Route summary (estimating)
  routeSummary: { marginBottom: 16 },
  routePoint: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#eee',
    marginLeft: 4,
    marginVertical: 2,
  },
  routeAddr: { fontSize: 14, color: '#333', fontWeight: '600', flex: 1 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#e0e0e0' },

  // Vehicle picker
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  vehicleScroll: { marginBottom: 18 },
  vehicleCard: {
    width: 90,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e8e8e8',
    marginRight: 10,
    backgroundColor: '#fafafa',
  },
  vehicleCardSelected: {
    backgroundColor: '#f72585',
    borderColor: '#f72585',
  },
  vehicleEmoji: { fontSize: 28, marginBottom: 6 },
  vehicleLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  vehicleLabelSelected: { color: '#fff' },
  vehicleFare: { fontSize: 15, fontWeight: '800', color: '#f72585', marginTop: 4 },
  vehiclePerKm: { fontSize: 10, color: '#aaa', marginTop: 2 },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelOutlineBtn: {
    flex: 0.4,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineText: { color: '#888', fontWeight: '700' },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#f72585',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Status states
  pulseWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff0f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusText: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginTop: 8 },
  statusSub: { fontSize: 13, color: '#aaa', marginTop: 6, marginBottom: 20 },
  cancelTextBtn: { marginTop: 4 },
  cancelTextBtnText: { color: '#f72585', fontWeight: '700', fontSize: 14 },

  // Driver / Active ride
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusBadgeText: { fontWeight: '700', color: '#1a1a2e', fontSize: 13 },

  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: '#fff' },
  driverName: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  driverVehicle: { fontSize: 12, color: '#888', marginTop: 2 },
  driverPhone: { fontSize: 12, color: '#555', marginTop: 2 },
  otpBox: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  otpLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  otpValue: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 4 },

  tripRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tripItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 10,
  },
  tripIcon: { fontSize: 16, marginRight: 6 },
  tripText: { fontSize: 13, fontWeight: '600', color: '#333', flex: 1 },
});