import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import WebMapView, { RoutePoint } from '../../../components/WebMapView';
import PlaceAutocompleteInput from '../../../components/PlaceAutocompleteInput';
import { useCustomer } from '../../../context/CustomerContext';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Decode Encoded Polyline Helper
// ─────────────────────────────────────────────
const decodePolyline = (t: string): RoutePoint[] => {
  if (!t || t === 'encoded_polyline_placeholder') return [];
  const points: RoutePoint[] = [];
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
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

// ─────────────────────────────────────────────
// Vehicle Types Config
// ─────────────────────────────────────────────
const VEHICLE_TYPES = [
  { type: 'bike', emoji: '🏍️', label: 'Bike', desc: 'Fast & affordable' },
  { type: 'scooty', emoji: '🛵', label: 'Scooty', desc: 'Light & easy' },
  { type: 'auto', emoji: '🛺', label: 'Auto', desc: 'Comfortable' },
  { type: 'car', emoji: '🚗', label: 'Car', desc: 'Premium' },
];

// ─────────────────────────────────────────────
// MAP COMPONENT
// ─────────────────────────────────────────────
const MapComponent = ({
  isPinPicking,
  onPinChange,
  pinTarget,
}: {
  isPinPicking: boolean;
  onPinChange: (loc: { lat: number; lng: number }) => void;
  pinTarget: 'pickup' | 'drop';
}) => {
  const { userLocation, estimate, driverLocation, appState, availableDrivers, googleMapsKey } = useCustomer();

  if (!userLocation) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f72585" />
        <Text style={styles.loaderText}>Acquiring GPS location...</Text>
      </View>
    );
  }

  // Use route coordinates from backend estimate or decode polyline
  let routeCoordinates: RoutePoint[] = [];
  if (estimate?.coordinates && estimate.coordinates.length > 0) {
    routeCoordinates = estimate.coordinates;
  } else if (estimate?.polyline) {
    routeCoordinates = decodePolyline(estimate.polyline);
  }

  const markers = estimate
    ? [
        { coord: { latitude: estimate.pickup.lat, longitude: estimate.pickup.lng }, color: '#06d6a0', label: 'FROM' },
        { coord: { latitude: estimate.drop.lat, longitude: estimate.drop.lng }, color: '#f72585', label: 'TO' },
      ]
    : [];

  const visibleDrivers = appState === 'IDLE' || appState === 'ESTIMATING' ? availableDrivers : {};

  return (
    <View style={styles.map}>
      <WebMapView
        center={userLocation}
        googleMapsKey={googleMapsKey}
        zoom={15}
        markers={markers}
        routeCoords={routeCoordinates}
        driverLocation={appState === 'ACCEPTED' || appState === 'ONGOING' ? driverLocation : null}
        nearbyDrivers={visibleDrivers}
        isPinPicking={isPinPicking}
        onRegionChange={(lat, lng) => onPinChange({ lat, lng })}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// INPUT & BOOKING PANEL
// ─────────────────────────────────────────────
const InputPanel = ({
  isPinPicking,
  setIsPinPicking,
  pinLocation,
  pinTarget,
  setPinTarget,
}: {
  isPinPicking: boolean;
  setIsPinPicking: (v: boolean) => void;
  pinLocation: { lat: number; lng: number } | null;
  pinTarget: 'pickup' | 'drop';
  setPinTarget: (t: 'pickup' | 'drop') => void;
}) => {
  const {
    appState,
    fetchEstimate,
    userLocation,
    currentAddress,
    locationPermissionGranted,
    requestCurrentLocation,
    isLocating,
  } = useCustomer();

  // Location State
  const [pickupText, setPickupText] = useState<string>('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number; name?: string; address: string } | null>(null);

  const [dropText, setDropText] = useState<string>('');
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number; name?: string; address: string } | null>(null);

  const [isEstimatingRoute, setIsEstimatingRoute] = useState<boolean>(false);

  // Initialize Pickup to Current Location when GPS is ready
  useEffect(() => {
    if (userLocation && currentAddress && !pickupCoords && !pickupText) {
      setPickupText(currentAddress);
      setPickupCoords({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        name: 'My Current Location',
        address: currentAddress,
      });
    }
  }, [userLocation, currentAddress]);

  // Pin Picking Confirmation Handler
  const handleConfirmPinLocation = () => {
    if (!pinLocation) {
      setIsPinPicking(false);
      return;
    }

    const addrStr = `${pinLocation.lat.toFixed(4)}, ${pinLocation.lng.toFixed(4)}`;
    if (pinTarget === 'pickup') {
      setPickupText(addrStr);
      setPickupCoords({
        lat: pinLocation.lat,
        lng: pinLocation.lng,
        name: 'Selected Pin Location',
        address: addrStr,
      });
    } else {
      setDropText(addrStr);
      setDropCoords({
        lat: pinLocation.lat,
        lng: pinLocation.lng,
        name: 'Selected Pin Destination',
        address: addrStr,
      });
    }
    setIsPinPicking(false);
  };

  // Swap Pickup & Destination
  const handleSwapLocations = () => {
    const tempText = pickupText;
    const tempCoords = pickupCoords;

    setPickupText(dropText);
    setPickupCoords(dropCoords);

    setDropText(tempText);
    setDropCoords(tempCoords);

    if (tempCoords && dropCoords) {
      // Both exist; re-calculate road route immediately
      fetchEstimate(dropCoords, tempCoords);
    }
  };

  // Trigger Road Route Estimate
  const handleEstimateRoute = async () => {
    if (!pickupCoords && !pickupText.trim()) {
      Alert.alert('Missing Pickup', 'Please enter or select a pickup location.');
      return;
    }
    if (!dropCoords && !dropText.trim()) {
      Alert.alert('Missing Destination', 'Please enter or select a drop destination.');
      return;
    }

    const finalPickup = pickupCoords || pickupText.trim();
    const finalDrop = dropCoords || dropText.trim();

    setIsEstimatingRoute(true);
    try {
      await fetchEstimate(finalPickup, finalDrop);
    } finally {
      setIsEstimatingRoute(false);
    }
  };

  if (appState !== 'IDLE') return null;

  // Pin Picking Overlay Mode
  if (isPinPicking) {
    return (
      <View style={styles.panel}>
        <View style={styles.handle} />
        <Text style={styles.panelTitle}>
          Pick {pinTarget === 'pickup' ? 'Pickup Location' : 'Destination'}
        </Text>
        <Text style={styles.panelSub}>Drag the map to position the center pin at your desired location</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelOutlineBtn} onPress={() => setIsPinPicking(false)}>
            <Text style={styles.cancelOutlineText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPinLocation}>
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.handle} />

      {/* Permission Denied Notice */}
      {locationPermissionGranted === false && (
        <View style={styles.warningBanner}>
          <Ionicons name="information-circle" size={18} color="#e65100" />
          <Text style={styles.warningText}>
            Location access is disabled. Please search or enter your pickup manually.
          </Text>
        </View>
      )}

      <View style={styles.panelHeaderRow}>
        <View>
          <Text style={styles.panelTitle}>Book a Ride</Text>
          <Text style={styles.panelSub}>Real road route • Max distance: 40 km</Text>
        </View>
      </View>

      {/* Inputs Container with Swap Button */}
      <View style={styles.inputsContainer}>
        {/* Pickup Input */}
        <View style={styles.inputItemRow}>
          <PlaceAutocompleteInput
            placeholder="Enter pickup location"
            value={pickupText}
            dotColor="#06d6a0"
            onChangeText={(t) => {
              setPickupText(t);
              setPickupCoords(null); // Clear stale coordinates on manual text edit
            }}
            onSelect={(place) => {
              setPickupText(place.address || place.name || '');
              setPickupCoords(place);
            }}
            onClear={() => {
              setPickupText('');
              setPickupCoords(null);
            }}
            rightAction={
              <TouchableOpacity
                style={styles.gpsSmallBtn}
                onPress={async () => {
                  await requestCurrentLocation();
                  if (userLocation && currentAddress) {
                    setPickupText(currentAddress);
                    setPickupCoords({
                      lat: userLocation.latitude,
                      lng: userLocation.longitude,
                      name: 'Current Location',
                      address: currentAddress,
                    });
                  }
                }}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#06d6a0" />
                ) : (
                  <Ionicons name="locate" size={18} color="#06d6a0" />
                )}
              </TouchableOpacity>
            }
          />
        </View>

        {/* Swap Button Divider */}
        <View style={styles.swapRow}>
          <View style={styles.connectorLine} />
          <TouchableOpacity
            style={styles.swapBtn}
            onPress={handleSwapLocations}
            activeOpacity={0.7}
            accessibilityLabel="Swap pickup and destination"
          >
            <Ionicons name="swap-vertical" size={18} color="#1a1a2e" />
          </TouchableOpacity>
          <View style={styles.connectorLine} />
        </View>

        {/* Destination Drop Input */}
        <View style={styles.inputItemRow}>
          <PlaceAutocompleteInput
            placeholder="Where to? (e.g. Airport, Charminar)"
            value={dropText}
            dotColor="#f72585"
            onChangeText={(t) => {
              setDropText(t);
              setDropCoords(null); // Clear stale coordinates on manual text edit
            }}
            onSelect={(place) => {
              setDropText(place.address || place.name || '');
              setDropCoords(place);
            }}
            onClear={() => {
              setDropText('');
              setDropCoords(null);
            }}
            rightAction={
              <TouchableOpacity
                style={styles.mapPinSmallBtn}
                onPress={() => {
                  setPinTarget('drop');
                  setIsPinPicking(true);
                }}
                accessibilityLabel="Choose destination by dragging map pin"
              >
                <Ionicons name="map" size={18} color="#f72585" />
              </TouchableOpacity>
            }
          />
        </View>
      </View>

      {/* Find Rides CTA Button */}
      <TouchableOpacity
        style={[styles.findBtn, isEstimatingRoute && { opacity: 0.8 }]}
        onPress={handleEstimateRoute}
        disabled={isEstimatingRoute}
      >
        {isEstimatingRoute ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.findBtnText}>Generating Road Route...</Text>
          </View>
        ) : (
          <Text style={styles.findBtnText}>Find Available Rides →</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────
// STATUS PANEL (ESTIMATING → SEARCHING → ACTIVE → COMPLETED)
// ─────────────────────────────────────────────
const StatusPanel = () => {
  const { appState, estimate, requestRide, cancelRide, driver, activeRide, resetFlow } = useCustomer();

  const [selectedVehicle, setSelectedVehicle] = useState<string>('bike');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  if (appState === 'IDLE') return null;

  // ── ESTIMATING ──────────────────────────────
  if (appState === 'ESTIMATING' && estimate) {
    const selectedFare = estimate.fareOptions?.find((o: any) => o.type === selectedVehicle) || estimate.fareOptions?.[0];

    const handleConfirmBooking = async () => {
      setIsConfirming(true);
      try {
        await requestRide(selectedVehicle);
      } finally {
        setIsConfirming(false);
      }
    };

    return (
      <View style={styles.panel}>
        <View style={styles.handle} />

        {/* Route summary */}
        <View style={styles.routeSummary}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: '#06d6a0' }]} />
            <Text style={styles.routeAddr} numberOfLines={1}>
              {estimate.pickup.address?.split(',')[0] || 'Pickup Location'}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: '#f72585' }]} />
            <Text style={styles.routeAddr} numberOfLines={1}>
              {estimate.drop.address?.split(',')[0] || 'Destination Location'}
            </Text>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{estimate.distance} km</Text>
            <Text style={styles.statLabel}>Road Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{estimate.duration} min</Text>
            <Text style={styles.statLabel}>Travel Time</Text>
          </View>
          {selectedFare && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#f72585' }]}>₹{selectedFare.fare}</Text>
                <Text style={styles.statLabel}>Estimated Fare</Text>
              </View>
            </>
          )}
        </View>

        {/* Vehicle Selection Carousel */}
        <Text style={styles.sectionLabel}>Select Vehicle Option</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {(estimate.fareOptions || []).map((option: any) => {
            const vcfg = VEHICLE_TYPES.find((v) => v.type === option.type);
            const isSelected = selectedVehicle === option.type;
            return (
              <TouchableOpacity
                key={option.type}
                style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                onPress={() => setSelectedVehicle(option.type)}
                activeOpacity={0.8}
              >
                <Text style={styles.vehicleEmoji}>{vcfg?.emoji || '🚗'}</Text>
                <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={[styles.vehicleFare, isSelected && { color: '#fff' }]}>₹{option.fare}</Text>
                <Text style={[styles.vehicleEta, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
                  {option.eta} min ETA
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelOutlineBtn} onPress={resetFlow} disabled={isConfirming}>
            <Text style={styles.cancelOutlineText}>✕ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, isConfirming && { opacity: 0.8 }]}
            onPress={handleConfirmBooking}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Booking • ₹{selectedFare?.fare || 0}</Text>
            )}
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
        <Text style={styles.statusText}>Generating road directions & route...</Text>
      </View>
    );
  }

  // ── SEARCHING ───────────────────────────────
  if (appState === 'SEARCHING') {
    return (
      <View style={[styles.panel, styles.centerPanel]}>
        <View style={styles.pulseWrap}>
          <ActivityIndicator size="large" color="#f72585" />
        </View>
        <Text style={styles.statusText}>Matching nearby drivers...</Text>
        <Text style={styles.statusSub}>Notifying drivers within 5 km of your pickup</Text>
        <TouchableOpacity style={styles.cancelTextBtn} onPress={cancelRide}>
          <Text style={styles.cancelTextBtnText}>Cancel Booking Request</Text>
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
            {appState === 'ACCEPTED' ? 'Driver is heading to pickup' : 'Ride In Progress'}
          </Text>
        </View>

        {/* Driver Card */}
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
            <Text style={styles.otpLabel}>START OTP</Text>
            <Text style={styles.otpValue}>{activeRide.otp}</Text>
          </View>
        </View>

        {/* Trip Info */}
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
        <Text style={styles.statusText}>Trip Completed Successfully!</Text>
        <Text style={styles.statusSub}>Thank you for riding with DriveMate</Text>
        <TouchableOpacity style={styles.confirmBtn} onPress={resetFlow}>
          <Text style={styles.confirmBtnText}>Book Another Ride</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

// ─────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────
export default function CustomerDashboard({ navigation }: any) {
  const { logout, requestCurrentLocation } = useCustomer();
  const [isPinPicking, setIsPinPicking] = useState<boolean>(false);
  const [pinTarget, setPinTarget] = useState<'pickup' | 'drop'>('drop');
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <View style={styles.container}>
      <MapComponent isPinPicking={isPinPicking} onPinChange={setPinLocation} pinTarget={pinTarget} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => {
              try {
                if (navigation.dispatch) {
                  navigation.dispatch(DrawerActions.toggleDrawer());
                } else if (navigation.getParent?.()?.toggleDrawer) {
                  navigation.getParent().toggleDrawer();
                } else if (navigation.toggleDrawer) {
                  navigation.toggleDrawer();
                }
              } catch (_) {}
            }}
          >
            <Ionicons name="menu" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <View style={styles.appBrand}>
            <Text style={styles.brandText}>DRIVEMATE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout(navigation)}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Locate Me Button */}
      {!isPinPicking && (
        <TouchableOpacity
          style={styles.floatingGpsBtn}
          onPress={() => requestCurrentLocation()}
          activeOpacity={0.8}
          accessibilityLabel="Locate current position"
        >
          <Ionicons name="locate" size={24} color="#1a1a2e" />
        </TouchableOpacity>
      )}

      {/* Bottom Panel Overlay */}
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <InputPanel
          isPinPicking={isPinPicking}
          setIsPinPicking={setIsPinPicking}
          pinLocation={pinLocation}
          pinTarget={pinTarget}
          setPinTarget={setPinTarget}
        />
        <StatusPanel />
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  map: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loaderText: { marginTop: 12, color: '#495057', fontSize: 14, fontWeight: '600' },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 44,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  menuBtn: {
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  appBrand: {
    backgroundColor: '#f72585',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 4,
  },
  brandText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1.5 },
  logoutBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: { fontWeight: '700', color: '#1a1a2e', fontSize: 13 },

  // Floating GPS Button
  floatingGpsBtn: {
    position: 'absolute',
    right: 18,
    bottom: 340,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 15,
  },

  // Panel Overlay
  overlay: { position: 'absolute', bottom: 0, width: '100%', zIndex: 30 },
  panel: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
    width: 44,
    height: 4,
    backgroundColor: '#dee2e6',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 14,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  warningText: { fontSize: 12, color: '#e65100', flex: 1, fontWeight: '500' },

  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  panelTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  panelSub: { fontSize: 12, color: '#888', marginTop: 2 },

  // Inputs & Swap
  inputsContainer: {
    marginBottom: 12,
  },
  inputItemRow: {
    marginVertical: 2,
    zIndex: 10,
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -6,
    zIndex: 20,
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  swapBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginHorizontal: 12,
    elevation: 2,
  },
  gpsSmallBtn: {
    padding: 6,
    marginLeft: 4,
  },
  mapPinSmallBtn: {
    padding: 6,
    marginLeft: 4,
  },

  findBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    elevation: 3,
  },
  findBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },

  // Route Summary in Estimating State
  routeSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  routePoint: { flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: '#dee2e6',
    marginLeft: 4,
    marginVertical: 2,
  },
  routeAddr: { fontSize: 14, color: '#333', fontWeight: '600', flex: 1 },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#dee2e6' },

  // Vehicle Picker
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  vehicleScroll: { marginBottom: 16 },
  vehicleCard: {
    width: 95,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginRight: 10,
    backgroundColor: '#fdfdfd',
  },
  vehicleCardSelected: {
    backgroundColor: '#f72585',
    borderColor: '#f72585',
  },
  vehicleEmoji: { fontSize: 26, marginBottom: 4 },
  vehicleLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  vehicleLabelSelected: { color: '#fff' },
  vehicleFare: { fontSize: 15, fontWeight: '800', color: '#f72585', marginTop: 4 },
  vehicleEta: { fontSize: 10, color: '#888', marginTop: 2 },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelOutlineBtn: {
    flex: 0.35,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineText: { color: '#666', fontWeight: '700' },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#f72585',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Status & Searching
  pulseWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(247, 37, 133, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusText: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginTop: 8 },
  statusSub: { fontSize: 13, color: '#888', marginTop: 4 },
  cancelTextBtn: { marginTop: 18, paddingVertical: 8 },
  cancelTextBtnText: { color: '#e63946', fontWeight: '700', fontSize: 14 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusBadgeText: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },

  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#f72585',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '800' },
  driverName: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  driverVehicle: { fontSize: 12, color: '#666', marginTop: 2 },
  driverPhone: { fontSize: 12, color: '#2b9348', marginTop: 4, fontWeight: '600' },
  otpBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  otpLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  otpValue: { fontSize: 18, fontWeight: '900', color: '#06d6a0', letterSpacing: 2 },

  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
  },
  tripItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  tripIcon: { fontSize: 16 },
  tripText: { fontSize: 13, fontWeight: '600', color: '#333' },
});