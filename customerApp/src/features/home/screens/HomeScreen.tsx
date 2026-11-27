import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WebMapView, { RoutePoint } from '../../../components/WebMapView';
import InRideSupportModal from '../../../components/InRideSupportModal';
import { useCustomer, FareOption } from '../../../context/CustomerContext';
import HomeHeader from '../components/HomeHeader';
import DestinationInput from '../components/DestinationInput';
import PromoBanner from '../components/PromoBanner';
import RecentRides from '../components/RecentRides';
import SurgeBreakdownModal from '../components/SurgeBreakdownModal';

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

const VEHICLE_TYPES = [
  { type: 'bike', emoji: '🏍️', label: 'Bike', seats: '1 seat', basePrice: 20, tag: 'FASTEST' },
  { type: 'scooty', emoji: '🛵', label: 'Scooty', seats: '1 seat', basePrice: 25, tag: 'VALUE' },
  { type: 'auto', emoji: '🛺', label: 'Auto', seats: '3 seats', basePrice: 30, tag: 'NO-AC' },
  { type: 'car', emoji: '🚗', label: 'Car', seats: '4 seats', basePrice: 50, tag: 'COMFORT' },
];

// ─────────────────────────────────────────────
// MAP COMPONENT
// ─────────────────────────────────────────────
const MapComponent = ({
  isPinPicking,
  onPinChange,
  showTraffic,
}: {
  isPinPicking: boolean;
  onPinChange: (loc: { lat: number; lng: number }) => void;
  showTraffic: boolean;
}) => {
  const {
    userLocation,
    estimate,
    driverLocation,
    appState,
    availableDrivers,
    googleMapsKey,
    surgeStatus,
  } = useCustomer();

  if (!userLocation) {
    return (
      <View style={styles.loader}>
        <View style={styles.loaderPulse}>
          <ActivityIndicator size="large" color="#f72585" />
        </View>
        <Text style={styles.loaderText}>Acquiring GPS location...</Text>
        <Text style={styles.loaderSub}>Syncing nearby captains & live road traffic</Text>
      </View>
    );
  }

  let routeCoordinates: RoutePoint[] = [];
  if (estimate?.coordinates && estimate.coordinates.length > 0) {
    routeCoordinates = estimate.coordinates;
  } else if (estimate?.polyline) {
    routeCoordinates = decodePolyline(estimate.polyline);
  }

  const markers = estimate
    ? [
        { coord: { latitude: estimate.pickup.lat, longitude: estimate.pickup.lng }, color: '#10b981', label: 'FROM' },
        { coord: { latitude: estimate.drop.lat, longitude: estimate.drop.lng }, color: '#f72585', label: 'TO' },
      ]
    : [];

  const visibleDrivers = appState === 'IDLE' || appState === 'ESTIMATING' ? availableDrivers : {};
  const activeMultiplier = estimate?.surge?.multiplier ?? surgeStatus?.multiplier ?? 1.0;

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
        showTraffic={showTraffic}
        surgeMultiplier={activeMultiplier}
        onRegionChange={(lat, lng) => onPinChange({ lat, lng })}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// 3-MINUTE WAIT TIMER BADGE
// ─────────────────────────────────────────────
const WaitTimerBadge = ({ arrivedAt }: { arrivedAt?: string | null }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [extraMinutes, setExtraMinutes] = useState<number>(0);

  useEffect(() => {
    const calculateTime = () => {
      const arrivedTime = arrivedAt ? new Date(arrivedAt).getTime() : Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - arrivedTime) / 1000));
      const freeSeconds = 180;
      if (elapsedSeconds < freeSeconds) {
        setSecondsRemaining(freeSeconds - elapsedSeconds);
        setIsExpired(false);
        setExtraMinutes(0);
      } else {
        setSecondsRemaining(0);
        setIsExpired(true);
        const extraSecs = elapsedSeconds - freeSeconds;
        setExtraMinutes(Math.max(1, Math.ceil(extraSecs / 60)));
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [arrivedAt]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <View style={[styles.waitTimerBox, isExpired && styles.waitTimerBoxExpired]}>
      <Ionicons name="time" size={16} color={isExpired ? '#e63946' : '#f72585'} />
      {!isExpired ? (
        <Text style={styles.waitTimerText}>
          Free Waiting Time: <Text style={styles.waitTimerBold}>{timeFormatted}</Text>
        </Text>
      ) : (
        <Text style={styles.waitTimerExpiredText}>
          Free wait time ended (+₹{extraMinutes * 2} wait charges)
        </Text>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// SEARCHING RADAR ANIMATION
// ─────────────────────────────────────────────
const SearchingRadar = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.9],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.5, 0.18, 0],
  });

  return (
    <View style={styles.radarContainer}>
      <Animated.View
        style={[
          styles.radarRing,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />
      <View style={styles.radarCenter}>
        <Ionicons name="navigate" size={26} color="#f72585" />
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// BOOKING INPUT PANEL (IDLE STATE)
// ─────────────────────────────────────────────
const InputPanel = ({
  isPinPicking,
  setIsPinPicking,
  pinLocation,
  pinTarget,
  setPinTarget,
  selectedVehicle,
  setSelectedVehicle,
  onOpenSurgeModal,
}: {
  isPinPicking: boolean;
  setIsPinPicking: (v: boolean) => void;
  pinLocation: { lat: number; lng: number } | null;
  pinTarget: 'pickup' | 'drop';
  setPinTarget: (t: 'pickup' | 'drop') => void;
  selectedVehicle: string;
  setSelectedVehicle: (t: string) => void;
  onOpenSurgeModal: () => void;
}) => {
  const {
    appState,
    fetchEstimate,
    userLocation,
    currentAddress,
    locationPermissionGranted,
    requestCurrentLocation,
    isLocating,
    surgeStatus,
    refreshSurgeStatus,
  } = useCustomer();

  const [pickupText, setPickupText] = useState<string>('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number; name?: string; address: string } | null>(null);
  const [dropText, setDropText] = useState<string>('');
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number; name?: string; address: string } | null>(null);
  const [isEstimatingRoute, setIsEstimatingRoute] = useState<boolean>(false);

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
      refreshSurgeStatus(pinLocation.lat, pinLocation.lng, addrStr);
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

  const handleSwapLocations = () => {
    const tempText = pickupText;
    const tempCoords = pickupCoords;
    setPickupText(dropText);
    setPickupCoords(dropCoords);
    setDropText(tempText);
    setDropCoords(tempCoords);

    if (tempCoords && dropCoords) {
      fetchEstimate(dropCoords, tempCoords);
    }
  };

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

  if (isPinPicking) {
    return (
      <View style={styles.panel}>
        <View style={styles.handle} />
        <Text style={styles.panelTitle}>
          Pin {pinTarget === 'pickup' ? 'Pickup Point' : 'Drop Destination'}
        </Text>
        <Text style={styles.panelSub}>
          Pan the map under the center pin, then confirm your exact spot
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelOutlineBtn} onPress={() => setIsPinPicking(false)}>
            <Text style={styles.cancelOutlineText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPinLocation}>
            <Text style={styles.confirmBtnText}>Confirm Pin</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const activeMultiplier = surgeStatus?.multiplier ?? 1.0;
  const isSurgeActive = Boolean(surgeStatus?.isSurgeActive && activeMultiplier > 1.04);

  return (
    <View style={styles.panel}>
      <View style={styles.handle} />

      {locationPermissionGranted === false && (
        <View style={styles.warningBanner}>
          <Ionicons name="information-circle" size={16} color="#b45309" />
          <Text style={styles.warningText}>
            GPS permission is off — enter pickup manually or enable location.
          </Text>
        </View>
      )}

      {/* Title Row */}
      <View style={styles.panelHeaderRow}>
        <View>
          <Text style={styles.panelTitle}>Where to today?</Text>
          <Text style={styles.panelSub}>
            Real-time road routing • Up to 40 km
          </Text>
        </View>
        {isSurgeActive && (
          <TouchableOpacity style={styles.headerSurgeBadge} onPress={onOpenSurgeModal} activeOpacity={0.8}>
            <Ionicons name="flame" size={13} color="#ffffff" />
            <Text style={styles.headerSurgeBadgeText}>{activeMultiplier.toFixed(1)}x Surge</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pickup & Drop Autocomplete Inputs */}
      <DestinationInput
        pickupText={pickupText}
        dropText={dropText}
        isLocating={isLocating}
        userLocationBias={
          userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : undefined
        }
        onChangePickupText={(t) => {
          setPickupText(t);
          setPickupCoords(null);
        }}
        onSelectPickup={(place) => {
          setPickupText(place.address || place.name || '');
          setPickupCoords(place);
          refreshSurgeStatus(place.lat, place.lng, place.address);
        }}
        onClearPickup={() => {
          setPickupText('');
          setPickupCoords(null);
        }}
        onUseCurrentLocation={async () => {
          await requestCurrentLocation();
          if (userLocation && currentAddress) {
            setPickupText(currentAddress);
            setPickupCoords({
              lat: userLocation.latitude,
              lng: userLocation.longitude,
              name: 'Current Location',
              address: currentAddress,
            });
            refreshSurgeStatus(userLocation.latitude, userLocation.longitude, currentAddress);
          }
        }}
        onPickPickupOnMap={() => {
          setPinTarget('pickup');
          setIsPinPicking(true);
        }}
        onChangeDropText={(t) => {
          setDropText(t);
          setDropCoords(null);
        }}
        onSelectDrop={(place) => {
          setDropText(place.address || place.name || '');
          setDropCoords(place);
        }}
        onClearDrop={() => {
          setDropText('');
          setDropCoords(null);
        }}
        onPickDropOnMap={() => {
          setPinTarget('drop');
          setIsPinPicking(true);
        }}
        onSwapLocations={handleSwapLocations}
      />

      {/* Quick Destinations Strip */}
      <RecentRides
        onSelectPlace={(loc) => {
          setDropText(loc.address);
          setDropCoords(loc);
        }}
      />

      {/* Interactive Starting Price Vehicle Tier Preview */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickTierScroll}
        contentContainerStyle={{ gap: 8, paddingRight: 6 }}
      >
        {VEHICLE_TYPES.map((vt) => {
          const backendStarting = surgeStatus?.vehicleStartingFares?.find((f) => f.type === vt.type);
          const startingFare = backendStarting?.fare ?? Math.round(vt.basePrice * activeMultiplier);
          const eta = backendStarting?.eta ?? (vt.type === 'bike' || vt.type === 'scooty' ? 2 : 4);
          const isSelected = selectedVehicle === vt.type;

          return (
            <TouchableOpacity
              key={vt.type}
              style={[styles.miniVehiclePill, isSelected && styles.miniVehiclePillActive]}
              onPress={() => setSelectedVehicle(vt.type)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>{vt.emoji}</Text>
              <View>
                <Text style={[styles.miniVehicleTitle, isSelected && { color: '#ffffff' }]}>
                  {vt.label}
                </Text>
                <Text style={[styles.miniVehicleSub, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
                  ₹{startingFare}+ • {eta}m
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Surge / Zero Surge Live Banner */}
      <PromoBanner surgeStatus={surgeStatus} onPress={onOpenSurgeModal} />

      {/* Find Rides CTA Button */}
      <TouchableOpacity
        style={[
          styles.findBtn,
          isSurgeActive && styles.findBtnSurge,
          isEstimatingRoute && { opacity: 0.8 },
        ]}
        onPress={handleEstimateRoute}
        disabled={isEstimatingRoute}
        activeOpacity={0.85}
      >
        {isEstimatingRoute ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.findBtnText}>Calculating Traffic & Fares...</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.findBtnText}>
              {isSurgeActive
                ? `Check Fares (${activeMultiplier.toFixed(1)}x Surge)`
                : 'Find Available Rides'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────
// STATUS PANEL (ESTIMATING → SEARCHING → ACTIVE → COMPLETED)
// ─────────────────────────────────────────────
const StatusPanel = ({
  navigation,
  selectedVehicle,
  setSelectedVehicle,
  onOpenSurgeModal,
}: {
  navigation: any;
  selectedVehicle: string;
  setSelectedVehicle: (t: string) => void;
  onOpenSurgeModal: () => void;
}) => {
  const {
    appState,
    estimate,
    requestRide,
    cancelRide,
    driver,
    activeRide,
    resetFlow,
    currentUser,
  } = useCustomer();

  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isSupportModalVisible, setIsSupportModalVisible] = useState<boolean>(false);

  if (appState === 'IDLE') return null;

  // ── ESTIMATING ──────────────────────────────
  if (appState === 'ESTIMATING' && estimate) {
    const selectedFare: FareOption | undefined =
      estimate.fareOptions?.find((o) => o.type === selectedVehicle) || estimate.fareOptions?.[0];
    const surge = estimate.surge;
    const surgeMultiplier = surge?.multiplier ?? selectedFare?.surgeMultiplier ?? 1.0;
    const isSurgeActive = Boolean(surge?.isSurgeActive && surgeMultiplier > 1.04);
    const trafficDelay = estimate.trafficDelayMinutes ?? surge?.trafficDelayMinutes ?? 0;
    const walletBalance = Math.max(0, Number(currentUser?.walletBalance) || 0);

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

        {/* Compact Route Summary Card */}
        <View style={styles.routeSummary}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: '#10b981' }]} />
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

        {/* Stats Strip with Road Traffic Info */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{estimate.distance} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{estimate.duration} min</Text>
            <Text style={styles.statLabel}>
              {trafficDelay > 0 ? `+${trafficDelay}m traffic` : `${estimate.trafficLevel || 'Smooth'} road`}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={onOpenSurgeModal} activeOpacity={0.75}>
            <Text style={[styles.statValue, isSurgeActive ? { color: '#f72585' } : { color: '#059669' }]}>
              {surgeMultiplier.toFixed(1)}x
            </Text>
            <Text style={styles.statLabel}>{isSurgeActive ? 'Traffic Surge ⓘ' : 'Standard ⓘ'}</Text>
          </TouchableOpacity>
        </View>

        {/* Vehicle Selection Carousel */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>CHOOSE YOUR RIDE</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Wallet')} activeOpacity={0.7}>
            <Text style={styles.walletHintText}>
              Wallet: ₹{walletBalance.toFixed(0)}
              {selectedFare && walletBalance < selectedFare.fare ? ' (Top Up)' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {(estimate.fareOptions || []).map((option) => {
            const vcfg = VEHICLE_TYPES.find((v) => v.type === option.type);
            const isSelected = selectedVehicle === option.type;
            const hasSurgeDiff = isSurgeActive && option.baseFare && option.baseFare < option.fare;

            return (
              <TouchableOpacity
                key={option.type}
                style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                onPress={() => setSelectedVehicle(option.type)}
                activeOpacity={0.82}
              >
                <View style={[styles.vehicleTagBadge, isSelected && { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                  <Text style={[styles.vehicleTagText, isSelected && { color: '#ffffff' }]}>
                    {vcfg?.tag || 'RIDE'}
                  </Text>
                </View>

                <Text style={styles.vehicleEmoji}>{option.emoji || vcfg?.emoji || '🚗'}</Text>
                <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={[styles.vehicleSeats, isSelected && { color: 'rgba(255,255,255,0.75)' }]}>
                  {option.seats || vcfg?.seats || '1 seat'}
                </Text>

                <View style={styles.farePairRow}>
                  <Text style={[styles.vehicleFare, isSelected && { color: '#ffffff' }]}>
                    ₹{option.fare}
                  </Text>
                  {hasSurgeDiff && (
                    <Text
                      style={[
                        styles.baseFareStrike,
                        isSelected && { color: 'rgba(255,255,255,0.65)' },
                      ]}
                    >
                      ₹{option.baseFare}
                    </Text>
                  )}
                </View>

                <Text style={[styles.vehicleEta, isSelected && { color: 'rgba(255,255,255,0.85)' }]}>
                  {option.eta} min ETA
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelOutlineBtn} onPress={resetFlow} disabled={isConfirming}>
            <Text style={styles.cancelOutlineText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, isConfirming && { opacity: 0.8 }]}
            onPress={handleConfirmBooking}
            disabled={isConfirming}
            activeOpacity={0.85}
          >
            {isConfirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>
                Confirm {selectedFare?.label || 'Ride'} • ₹{selectedFare?.fare || 0}
              </Text>
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
        <Text style={styles.statusText}>Calculating best road route & surge...</Text>
        <Text style={styles.statusSub}>Checking real-time traffic & captain availability</Text>
      </View>
    );
  }

  // ── SEARCHING ───────────────────────────────
  if (appState === 'SEARCHING') {
    const chosen = estimate?.fareOptions?.find((o) => o.type === selectedVehicle) || estimate?.fareOptions?.[0];

    return (
      <View style={[styles.panel, styles.centerPanel]}>
        <SearchingRadar />
        <Text style={styles.statusText}>Connecting to nearby captains...</Text>
        <Text style={styles.statusSub}>
          Searching within 5 km • Fare locked at ₹{chosen?.fare || 0}
        </Text>

        {estimate?.surge?.isSurgeActive && (
          <View style={styles.lockedSurgeChip}>
            <Ionicons name="shield-checkmark" size={14} color="#f72585" />
            <Text style={styles.lockedSurgeText}>
              Surge locked at {estimate.surge.multiplier.toFixed(1)}x for your booking
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.cancelTextBtn} onPress={cancelRide} activeOpacity={0.8}>
          <Text style={styles.cancelTextBtnText}>Cancel Ride Request</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── ACCEPTED / ONGOING ──────────────────────
  if ((appState === 'ACCEPTED' || appState === 'ONGOING') && driver && activeRide) {
    const rawId = (activeRide as any)?.id || activeRide._id || '';
    const cleanDisplayId = (activeRide as any)?.displayId || `DM-${rawId.slice(-6).toUpperCase()}`;

    return (
      <View style={styles.panel}>
        <View style={styles.handle} />

        {/* Top Ride ID & Support Row */}
        <View style={styles.rideIdTopBar}>
          <TouchableOpacity
            style={styles.rideIdTag}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert('Ride Reference', `Ride ID: #${cleanDisplayId}\nFull Reference: ${rawId}`);
            }}
          >
            <Ionicons name="receipt-outline" size={13} color="#7c3aed" />
            <Text style={styles.rideIdTagLabel}>RIDE ID:</Text>
            <Text style={styles.rideIdTagText}>#{cleanDisplayId}</Text>
            <Ionicons name="copy-outline" size={12} color="#7c3aed" style={{ marginLeft: 3 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inRideSupportBtn}
            onPress={() => setIsSupportModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="headset" size={13} color="#ffffff" />
            <Text style={styles.inRideSupportBtnText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusBadgeRow}>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    activeRide.status === 'drop_arrived' || activeRide.status === 'arrived'
                      ? '#10b981'
                      : appState === 'ACCEPTED'
                      ? '#f59e0b'
                      : '#2563eb',
                },
              ]}
            />
            <Text style={styles.statusBadgeText}>
              {activeRide.status === 'drop_arrived'
                ? 'Driver has reached destination'
                : activeRide.status === 'arrived'
                ? 'Driver has arrived'
                : appState === 'ACCEPTED'
                ? 'Driver approaching pickup'
                : 'Ride in progress'}
            </Text>
          </View>

          {Number(activeRide.surgeMultiplier || 1) > 1.04 && (
            <View style={styles.miniSurgePill}>
              <Text style={styles.miniSurgeText}>{Number(activeRide.surgeMultiplier).toFixed(1)}x Surge</Text>
            </View>
          )}
        </View>

        {activeRide.status === 'arrived' && <WaitTimerBadge arrivedAt={activeRide.arrivedAt} />}

        {/* Driver Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarInitial}>{driver.name?.[0] || 'D'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.driverVehicle}>{driver.vehicle}</Text>
            <View style={styles.driverActionLinks}>
              <TouchableOpacity
                style={styles.quickContactChip}
                onPress={() => driver.phone && Linking.openURL(`tel:${driver.phone}`)}
              >
                <Ionicons name="call" size={12} color="#059669" />
                <Text style={styles.quickContactText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickContactChip, { backgroundColor: '#eef2ff' }]}
                onPress={() => navigation.navigate('Chat')}
              >
                <Ionicons name="chatbubble-ellipses" size={12} color="#4361ee" />
                <Text style={[styles.quickContactText, { color: '#4361ee' }]}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.otpBox}>
            <Text style={styles.otpLabel}>START OTP</Text>
            <Text style={styles.otpValue}>{activeRide.otp}</Text>
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.tripRow}>
          <View style={styles.tripItem}>
            <Ionicons name="location" size={15} color="#f72585" />
            <Text style={styles.tripText} numberOfLines={1}>
              {activeRide.drop?.address?.split(',')[0] || 'Destination'}
            </Text>
          </View>
          <View style={styles.tripFareChip}>
            <Text style={styles.tripFareValue}>₹{activeRide.fare}</Text>
          </View>
        </View>

        <InRideSupportModal
          visible={isSupportModalVisible}
          onClose={() => setIsSupportModalVisible(false)}
          rideId={rawId}
          displayId={cleanDisplayId}
          driverName={driver.name}
          driverPhone={driver.phone}
          fare={activeRide.fare}
        />
      </View>
    );
  }

  // ── COMPLETED ───────────────────────────────
  if (appState === 'COMPLETED') {
    return (
      <View style={[styles.panel, styles.centerPanel]}>
        <View style={styles.completeIconCircle}>
          <Ionicons name="checkmark-done" size={32} color="#10b981" />
        </View>
        <Text style={styles.statusText}>Trip Completed!</Text>
        <Text style={styles.statusSub}>
          Thank you for riding with DriveMate{activeRide?.fare ? ` • Fare: ₹${activeRide.fare}` : ''}
        </Text>
        <TouchableOpacity style={[styles.confirmBtn, { width: '100%', marginTop: 18 }]} onPress={resetFlow}>
          <Text style={styles.confirmBtnText}>Book Another Ride</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

// ─────────────────────────────────────────────
// MAIN HOME SCREEN
// ─────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const {
    requestCurrentLocation,
    currentUser,
    currentAddress,
    surgeStatus,
    refreshSurgeStatus,
    availableDrivers,
    appState,
  } = useCustomer();

  const [isPinPicking, setIsPinPicking] = useState<boolean>(false);
  const [pinTarget, setPinTarget] = useState<'pickup' | 'drop'>('drop');
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('bike');
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [surgeModalVisible, setSurgeModalVisible] = useState<boolean>(false);

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Rider';
  const initialLetter = (currentUser?.name || 'R')[0].toUpperCase();
  const walletBalance = Number(currentUser?.walletBalance) || 0;
  const nearbyDriversCount = Object.keys(availableDrivers || {}).length;

  return (
    <View style={styles.container}>
      <MapComponent
        isPinPicking={isPinPicking}
        onPinChange={setPinLocation}
        showTraffic={showTraffic}
      />

      <HomeHeader
        firstName={firstName}
        initialLetter={initialLetter}
        walletBalance={walletBalance}
        currentAddress={currentAddress}
        surgeStatus={surgeStatus}
        isLoadingSurge={false}
        nearbyDriversCount={nearbyDriversCount}
        showTraffic={showTraffic}
        onToggleTraffic={() => setShowTraffic((prev) => !prev)}
        onOpenSurgeModal={() => setSurgeModalVisible(true)}
        onOpenWallet={() => navigation.navigate('Wallet')}
        onOpenNotifications={() => navigation.navigate('Notifications')}
        onOpenProfile={() => navigation.navigate('Profile')}
      />

      {/* Bottom Sheet Overlay + Docked Floating GPS Control */}
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        {!isPinPicking && (appState === 'IDLE' || appState === 'ESTIMATING') && (
          <View style={styles.floatingControlsBar} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.floatingGpsBtn}
              onPress={() => {
                requestCurrentLocation();
                refreshSurgeStatus();
              }}
              activeOpacity={0.82}
              accessibilityLabel="Center on current GPS location"
            >
              <Ionicons name="locate" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>
        )}

        <InputPanel
          isPinPicking={isPinPicking}
          setIsPinPicking={setIsPinPicking}
          pinLocation={pinLocation}
          pinTarget={pinTarget}
          setPinTarget={setPinTarget}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          onOpenSurgeModal={() => setSurgeModalVisible(true)}
        />

        <StatusPanel
          navigation={navigation}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          onOpenSurgeModal={() => setSurgeModalVisible(true)}
        />
      </KeyboardAvoidingView>

      <SurgeBreakdownModal
        visible={surgeModalVisible}
        surgeStatus={surgeStatus}
        onClose={() => setSurgeModalVisible(false)}
        onRefresh={() => refreshSurgeStatus()}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  map: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  loaderPulse: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(247, 37, 133, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: { marginTop: 14, color: '#0f172a', fontSize: 16, fontWeight: '800' },
  loaderSub: { marginTop: 4, color: '#64748b', fontSize: 12.5, fontWeight: '500' },

  overlay: { position: 'absolute', bottom: 0, width: '100%', zIndex: 30 },
  floatingControlsBar: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  floatingGpsBtn: {
    backgroundColor: '#ffffff',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 7,
  },
  panel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 22,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
  centerPanel: { alignItems: 'center', paddingTop: 22, paddingBottom: 30 },
  handle: {
    width: 42,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 12,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    gap: 8,
  },
  warningText: { fontSize: 12, color: '#92400e', flex: 1, fontWeight: '600' },

  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  panelTitle: { fontSize: 19, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },
  panelSub: { fontSize: 11.5, color: '#64748b', marginTop: 1, fontWeight: '600' },
  headerSurgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f72585',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  headerSurgeBadgeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },

  quickTierScroll: {
    marginBottom: 12,
  },
  miniVehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 7,
  },
  miniVehiclePillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  miniVehicleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  miniVehicleSub: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },

  findBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  findBtnSurge: {
    backgroundColor: '#f72585',
    shadowColor: '#f72585',
  },
  findBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },

  // Estimating State
  routeSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 11,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  routePoint: { flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 9, height: 9, borderRadius: 4.5, marginRight: 10 },
  routeLine: {
    width: 2,
    height: 11,
    backgroundColor: '#cbd5e1',
    marginLeft: 3.5,
    marginVertical: 2,
  },
  routeAddr: { fontSize: 13.5, color: '#1e293b', fontWeight: '700', flex: 1 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 15.5, fontWeight: '900', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 1, fontWeight: '600' },
  statDivider: { width: 1, height: 26, backgroundColor: '#e2e8f0' },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  walletHintText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f72585',
  },
  vehicleScroll: { marginBottom: 14 },
  vehicleCard: {
    width: 112,
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  vehicleCardSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#f72585',
  },
  vehicleTagBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  vehicleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },
  vehicleEmoji: { fontSize: 26, marginBottom: 2 },
  vehicleLabel: { fontSize: 13.5, fontWeight: '800', color: '#0f172a' },
  vehicleLabelSelected: { color: '#ffffff' },
  vehicleSeats: { fontSize: 10.5, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  farePairRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleFare: { fontSize: 16, fontWeight: '900', color: '#f72585' },
  baseFareStrike: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  vehicleEta: { fontSize: 10.5, color: '#64748b', marginTop: 2, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 10 },
  cancelOutlineBtn: {
    flex: 0.34,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineText: { color: '#475569', fontWeight: '800', fontSize: 14 },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#f72585',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },

  // Searching Radar
  radarContainer: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  radarRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f72585',
  },
  radarCenter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(247, 37, 133, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(247, 37, 133, 0.35)',
  },
  statusText: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 6 },
  statusSub: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '600', textAlign: 'center' },
  lockedSurgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 12,
  },
  lockedSurgeText: {
    fontSize: 12,
    color: '#be123c',
    fontWeight: '700',
  },
  cancelTextBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
  },
  cancelTextBtnText: { color: '#dc2626', fontWeight: '800', fontSize: 13.5 },

  // Active Ride
  rideIdTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rideIdTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  rideIdTagLabel: { fontSize: 10, fontWeight: '800', color: '#7c3aed', marginRight: 4 },
  rideIdTagText: { fontSize: 12, fontWeight: '800', color: '#0f172a', letterSpacing: 0.5 },
  inRideSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  inRideSupportBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusBadgeText: { fontSize: 12.5, fontWeight: '800', color: '#0f172a' },
  miniSurgePill: {
    backgroundColor: '#fff1f5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  miniSurgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },

  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  avatarInitial: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  driverName: { fontSize: 15.5, fontWeight: '800', color: '#0f172a' },
  driverVehicle: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  driverActionLinks: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  quickContactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  quickContactText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  otpBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  otpLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '800' },
  otpValue: { fontSize: 18, fontWeight: '900', color: '#34d399', letterSpacing: 2 },

  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  tripItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  tripText: { fontSize: 13, fontWeight: '700', color: '#1e293b', flex: 1 },
  tripFareChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tripFareValue: { color: '#ffffff', fontWeight: '800', fontSize: 13.5 },

  waitTimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f5',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  waitTimerBoxExpired: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  waitTimerText: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  waitTimerBold: { fontWeight: '800', color: '#f72585' },
  waitTimerExpiredText: { fontSize: 12, color: '#dc2626', fontWeight: '700' },

  completeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
