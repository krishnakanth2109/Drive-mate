import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, socket, connectSocket } from '../services/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type AppState =
  | 'IDLE'
  | 'ESTIMATING'
  | 'SEARCHING'
  | 'ACCEPTED'
  | 'ONGOING'
  | 'COMPLETED';

export interface LocationRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
}

export interface FareOption {
  type: string;
  label: string;
  emoji: string;
  seats?: string;
  desc?: string;
  baseFare?: number;
  fare: number;
  surgeAmount?: number;
  surgeMultiplier?: number;
  perKm: number;
  eta: number;
}

export interface SurgeHotZone {
  id: string;
  name: string;
  city: string;
  demandLevel: string;
  surgeMultiplier: number;
  activeDrivers: number;
  pendingRiders: number;
  status: string;
  reason?: string | null;
}

export interface SurgeBreakdown {
  baseMultiplier: number;
  demandSurcharge: number;
  trafficSurcharge: number;
  peakSurcharge: number;
  zoneOverrideMultiplier: number | null;
  matchedZoneName: string | null;
}

export interface VehicleStartingFare {
  type: string;
  label: string;
  emoji: string;
  seats?: string;
  desc?: string;
  baseFare: number;
  fare: number;
  perKm: number;
  surgeMultiplier: number;
  eta: number;
}

export interface SurgeStatus {
  multiplier: number;
  isSurgeActive: boolean;
  demandLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
  trafficLevel: 'Smooth' | 'Moderate' | 'Heavy' | 'Severe';
  trafficDelayMinutes: number;
  trafficSpeedKmh: number;
  trafficRatio: number;
  activeRequestsNearby: number;
  activeRequestsCity: number;
  recentDemandCount?: number;
  availableDriversNearby: number;
  availableDriversCity: number;
  demandSupplyRatio: number;
  peakWindowActive: boolean;
  peakLabel: string | null;
  reason: string;
  breakdown?: SurgeBreakdown;
  hotZones?: SurgeHotZone[];
  vehicleStartingFares?: VehicleStartingFare[];
  updatedAt?: string;
}

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface Estimate {
  pickup: { lat: number; lng: number; address: string; name?: string };
  drop: { lat: number; lng: number; address: string; name?: string };
  distance: number;
  duration: number;
  staticDuration?: number;
  trafficDelayMinutes?: number;
  trafficLevel?: string;
  surge?: SurgeStatus;
  polyline: string;
  coordinates?: RouteCoordinate[];
  fareOptions: FareOption[];
}

export interface Driver {
  name: string;
  phone: string;
  vehicle: string;
  vehicleType: string;
}

export interface ActiveRide {
  _id: string;
  id?: string;
  displayId?: string;
  otp: string;
  fare: number;
  baseFare?: number;
  surgeMultiplier?: number;
  surgeAmount?: number;
  surgeReason?: string;
  status: string;
  arrivedAt?: string | null;
  startedAt?: string | null;
  waitCharges?: number;
  pickup: { address: string; lat: number; lng: number; name?: string };
  drop: { address: string; lat: number; lng: number; name?: string };
}

export interface AutocompleteItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

export interface PlaceDetails {
  name?: string;
  address: string;
  lat: number;
  lng: number;
}

export interface CustomerUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  rating?: number;
  avatar?: string;
  walletBalance?: number;
}

interface CustomerContextType {
  appState: AppState;
  userLocation: LocationRegion | null;
  currentAddress: string | null;
  locationPermissionGranted: boolean | null;
  isLocating: boolean;
  estimate: Estimate | null;
  driver: Driver | null;
  activeRide: ActiveRide | null;
  driverLocation: DriverLocation | null;
  availableDrivers: { [id: string]: { lat: number; lng: number; heading: number; vehicleType: string } };
  surgeStatus: SurgeStatus | null;
  isLoadingSurge: boolean;
  refreshSurgeStatus: (lat?: number, lng?: number, address?: string) => Promise<SurgeStatus | null>;
  googleMapsKey: string | null;
  currentUser: CustomerUser | null;
  setCurrentUser: (user: CustomerUser | null) => void;
  isLoggedIn: boolean;
  saveAuthSession: (token: string, user: CustomerUser, rememberMe?: boolean) => Promise<void>;
  checkAndRestoreSession: () => Promise<CustomerUser | null>;
  requestCurrentLocation: () => Promise<void>;
  searchPlaces: (query: string, bias?: { lat: number; lng: number }) => Promise<AutocompleteItem[]>;
  getPlaceDetails: (placeId: string) => Promise<PlaceDetails | null>;
  fetchEstimate: (
    pickup: string | { lat: number; lng: number; address?: string; name?: string },
    drop: string | { lat: number; lng: number; address?: string; name?: string }
  ) => Promise<Estimate | null>;
  requestRide: (vehicleType: string) => Promise<void>;
  cancelRide: () => Promise<void>;
  resetFlow: () => void;
  logout: (navigation: any) => Promise<void>;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const CustomerContext = createContext<CustomerContextType | null>(null);

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used inside CustomerProvider');
  return ctx;
};

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [userLocation, setUserLocation] = useState<LocationRegion | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<{ [id: string]: { lat: number; lng: number; heading: number; vehicleType: string } }>({});
  const [surgeStatus, setSurgeStatus] = useState<SurgeStatus | null>(null);
  const [isLoadingSurge, setIsLoadingSurge] = useState<boolean>(false);
  const [googleMapsKey, setGoogleMapsKey] = useState<string | null>('AIzaSyDOMtmUqwZCLcEHSGQI4WpBLnvBiEPmX2E');

  const activeRideIdRef = useRef<string | null>(null);

  // ── Restore saved authentication session ────
  const checkAndRestoreSession = useCallback(async (): Promise<CustomerUser | null> => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.walletBalance !== undefined && parsedUser.walletBalance !== null) {
          parsedUser.walletBalance = Number(parsedUser.walletBalance);
        }
        setCurrentUser(parsedUser);
        setIsLoggedIn(true);

        // Attach token and connect socket
        await connectSocket();
        const uid = parsedUser._id || parsedUser.id;
        if (uid) {
          socket.emit('join_room', uid);
        }
        socket.emit('join_customers_room');

        return parsedUser;
      }
    } catch (err) {
      console.warn('Session restoration failed:', err);
    }
    return null;
  }, []);

  // ── Save session permanently ────────────────
  const saveAuthSession = useCallback(
    async (token: string, user: CustomerUser, rememberMe: boolean = true) => {
      try {
        const sanitizedUser: CustomerUser = {
          ...user,
          walletBalance: user.walletBalance !== undefined && user.walletBalance !== null ? Number(user.walletBalance) : 0,
        };
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(sanitizedUser));
        const uid = user._id || user.id;
        if (uid) {
          await AsyncStorage.setItem('userId', uid);
        }
        if (rememberMe) {
          await AsyncStorage.setItem('remember_me', 'true');
          if (user.email) await AsyncStorage.setItem('saved_email', user.email);
          if (user.phone) await AsyncStorage.setItem('saved_phone', user.phone);
        }
        setCurrentUser(sanitizedUser);
        setIsLoggedIn(true);

        await connectSocket();
        if (uid) {
          socket.emit('join_room', uid);
        }
        socket.emit('join_customers_room');
      } catch (err) {
        console.error('Error saving session to storage:', err);
      }
    },
    []
  );

  // ── Request Current Location (GPS + Reverse Geocode) ──
  const requestCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionGranted(false);
        // Default to Hyderabad center if permission is denied
        setUserLocation({
          latitude: 17.385,
          longitude: 78.4867,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setCurrentAddress('Hyderabad, Telangana');
        setIsLocating(false);
        return;
      }

      setLocationPermissionGranted(true);
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion: LocationRegion = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      setUserLocation(newRegion);

      // Reverse geocode via Backend to get readable address
      try {
        const revRes: any = await api.get('/ride/reverse-geocode', {
          params: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
        if (revRes.data?.address) {
          setCurrentAddress(revRes.data.address);
        } else if (typeof revRes === 'object' && revRes.address) {
          setCurrentAddress(revRes.address);
        }
      } catch (err) {
        setCurrentAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      }
    } catch (err: any) {
      console.warn('Location retrieval error:', err.message);
      setLocationPermissionGranted(false);
      setUserLocation({
        latitude: 17.385,
        longitude: 78.4867,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setCurrentAddress('Hyderabad, Telangana');
    } finally {
      setIsLocating(false);
    }
  }, []);

  // ── Get GPS location & restore session on mount ──────────────
  useEffect(() => {
    checkAndRestoreSession();
    requestCurrentLocation();

    // Fetch Google Maps API key from backend if configured
    (async () => {
      try {
        const res: any = await api.get('/config/maps-key');
        const key = res.key || res.data?.key || res;
        if (typeof key === 'string') {
          setGoogleMapsKey(key);
        }
      } catch (e) {
        console.log('Using configured maps key');
      }
    })();
  }, [requestCurrentLocation]);

  // ── Fetch nearby online drivers whenever userLocation updates ──
  useEffect(() => {
    if (!isLoggedIn || !userLocation) return;
    let active = true;
    (async () => {
      try {
        const res: any = await api.get(
          `/users/nearby?lat=${userLocation.latitude}&lng=${userLocation.longitude}`
        );
        if (!active) return;
        const driverList = Array.isArray(res) ? res : res.data || [];
        const initialDrivers: any = {};
        driverList.forEach((d: any) => {
          if (d.currentLocation && d.currentLocation.coordinates) {
            initialDrivers[d._id] = {
              lat: d.currentLocation.coordinates[1],
              lng: d.currentLocation.coordinates[0],
              heading: d.currentLocation.heading || 0,
              vehicleType: d.vehicleType || 'bike',
            };
          }
        });
        setAvailableDrivers(initialDrivers);
      } catch (err) {}
    })();
    return () => {
      active = false;
    };
  }, [isLoggedIn, userLocation?.latitude, userLocation?.longitude]);

  // ── Live Traffic & User Demand Surge Telemetry ──────────
  const refreshSurgeStatus = useCallback(
    async (lat?: number, lng?: number, address?: string): Promise<SurgeStatus | null> => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return null;

        setIsLoadingSurge(true);
        const targetLat = lat ?? userLocation?.latitude;
        const targetLng = lng ?? userLocation?.longitude;
        const targetAddress = address ?? currentAddress ?? undefined;

        const res: any = await api.get('/ride/surge-status', {
          params: {
            ...(targetLat != null ? { lat: targetLat } : {}),
            ...(targetLng != null ? { lng: targetLng } : {}),
            ...(targetAddress ? { address: targetAddress } : {}),
          },
        });

        const payload: SurgeStatus | null = res?.data?.multiplier != null ? res.data : res?.multiplier != null ? res : null;
        if (payload) {
          setSurgeStatus(payload);
          return payload;
        }
        return null;
      } catch (err) {
        return null;
      } finally {
        setIsLoadingSurge(false);
      }
    },
    [userLocation?.latitude, userLocation?.longitude, currentAddress]
  );

  // Auto-refresh surge whenever user location/login settles & periodically on home screen
  useEffect(() => {
    if (!isLoggedIn) return;
    refreshSurgeStatus();
    const interval = setInterval(() => {
      if (appState === 'IDLE' || appState === 'ESTIMATING') {
        refreshSurgeStatus();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userLocation?.latitude, userLocation?.longitude, appState, refreshSurgeStatus]);

  // ── Search Places (Autocomplete through Backend) ──
  const searchPlaces = useCallback(async (query: string, bias?: { lat: number; lng: number }): Promise<AutocompleteItem[]> => {
    if (!query || !query.trim()) return [];
    try {
      const res: any = await api.get('/ride/autocomplete', {
        params: {
          input: query.trim(),
          lat: bias?.lat || userLocation?.latitude,
          lng: bias?.lng || userLocation?.longitude,
        },
      });
      const items = Array.isArray(res) ? res : res.data || [];
      return items;
    } catch (err: any) {
      console.warn('Place search error:', err.message);
      return [];
    }
  }, [userLocation]);

  // ── Place Details Lookup ──
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    if (!placeId) return null;
    try {
      const res: any = await api.get('/ride/place-details', {
        params: { placeId },
      });
      const data = res.data || res;
      if (data && data.lat != null && data.lng != null) {
        return {
          name: data.name,
          address: data.address,
          lat: Number(data.lat),
          lng: Number(data.lng),
        };
      }
      return null;
    } catch (err: any) {
      console.warn('Place details error:', err.message);
      return null;
    }
  }, []);

  // ── Socket listeners ───────────────────────
  useEffect(() => {
    const setupSocket = async () => {
      await connectSocket();
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        socket.emit('join_room', userId);
      }
      socket.emit('join_customers_room');
    };
    setupSocket();

    // Available driver location update
    socket.on('available_driver_location', (data: any) => {
      setAvailableDrivers((prev) => ({
        ...prev,
        [data.driverId]: {
          lat: data.lat,
          lng: data.lng,
          heading: data.heading,
          vehicleType: data.vehicleType,
        },
      }));
    });

    // Driver accepted our ride
    socket.on('ride_accepted', (data: { ride: ActiveRide; rider: Driver }) => {
      setDriver(data.rider);
      setActiveRide(data.ride);
      activeRideIdRef.current = data.ride._id || (data.ride as any).id;
      socket.emit('join_ride', activeRideIdRef.current);
      setAppState('ACCEPTED');
    });

    // Ride status updates (arrived / ongoing / drop_arrived / completed)
    socket.on('ride_status_update', (data: { status: string; ride: ActiveRide; waitInfo?: any }) => {
      if (data.status === 'arrived') {
        setActiveRide(data.ride);
      } else if (data.status === 'ongoing') {
        setActiveRide(data.ride);
        setAppState('ONGOING');
      } else if (data.status === 'drop_arrived') {
        setActiveRide(data.ride);
        setAppState('ONGOING');
      } else if (data.status === 'completed') {
        setAppState('COMPLETED');
        activeRideIdRef.current = null;
      }
    });

    // Driver arrived at pickup notification
    socket.on('driver_arrived', (data: { ride: ActiveRide; freeWaitMinutes?: number }) => {
      setActiveRide(data.ride);
      Alert.alert(
        'Driver Arrived!',
        `Your driver has arrived at the pickup location. Free waiting period is ${data.freeWaitMinutes || 3} minutes.`
      );
    });

    // Driver reached destination drop-off notification
    socket.on('driver_arrived_drop', (data: { ride: ActiveRide; message?: string }) => {
      setActiveRide(data.ride);
      Alert.alert(
        'Destination Reached',
        data.message || 'Your driver has reached the drop location.'
      );
    });

    // Free 3-min wait expired notification
    socket.on('wait_time_expired', (data: { message?: string }) => {
      Alert.alert(
        'Wait Time Exceeded',
        data.message || 'Free 3-minute wait period has ended. Waiting charges of ₹2/min now apply.'
      );
    });

    // Live driver location
    socket.on('driver_location_update', (data: { lat: number; lng: number }) => {
      setDriverLocation({ latitude: data.lat, longitude: data.lng });
    });

    // Ride timed out (no drivers accepted in 15s)
    socket.on('ride_timeout', (data: { rideId: string; message: string }) => {
      Alert.alert('No Riders Found', data.message);
      resetFlow();
    });

    // Real-time surge pricing update broadcast from server / ops console
    socket.on('surge:update', (data: any) => {
      if (!data) return;
      setSurgeStatus((prev) => {
        const nextMultiplier = Number(data.multiplier ?? data.surgeMultiplier ?? prev?.multiplier ?? 1.0);
        if (!prev) {
          return {
            multiplier: nextMultiplier,
            isSurgeActive: nextMultiplier > 1.04,
            demandLevel: data.demandLevel || 'Moderate',
            trafficLevel: data.trafficLevel || 'Smooth',
            trafficDelayMinutes: 0,
            trafficSpeedKmh: 24,
            trafficRatio: 1.0,
            activeRequestsNearby: Number(data.activeRequestsNearby ?? 0),
            activeRequestsCity: Number(data.activeRequestsNearby ?? 0),
            availableDriversNearby: Number(data.availableDriversNearby ?? 0),
            availableDriversCity: Number(data.availableDriversNearby ?? 0),
            demandSupplyRatio: 0,
            peakWindowActive: false,
            peakLabel: null,
            reason: data.reason || `Live traffic updated (${nextMultiplier.toFixed(1)}x)`,
            updatedAt: data.updatedAt,
          };
        }
        return {
          ...prev,
          multiplier: nextMultiplier,
          isSurgeActive: nextMultiplier > 1.04,
          demandLevel: data.demandLevel || prev.demandLevel,
          trafficLevel: data.trafficLevel || prev.trafficLevel,
          activeRequestsNearby: data.activeRequestsNearby ?? prev.activeRequestsNearby,
          availableDriversNearby: data.availableDriversNearby ?? prev.availableDriversNearby,
          reason: data.reason || prev.reason,
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      });
    });

    return () => {
      socket.off('ride_accepted');
      socket.off('ride_status_update');
      socket.off('driver_arrived');
      socket.off('driver_arrived_drop');
      socket.off('wait_time_expired');
      socket.off('driver_location_update');
      socket.off('available_driver_location');
      socket.off('ride_timeout');
      socket.off('surge:update');
    };
  }, []);

  // ── Fetch estimate ─────────────────────────
  const fetchEstimate = useCallback(
    async (
      pickup: string | { lat: number; lng: number; address?: string; name?: string },
      drop: string | { lat: number; lng: number; address?: string; name?: string }
    ): Promise<Estimate | null> => {
      setAppState('ESTIMATING');
      setEstimate(null);

      try {
        const res: any = await api.post('/ride/estimate', { pickup, drop });
        const data = res.data || res;

        if (data.limitExceeded) {
          Alert.alert(
            'Distance Limit Exceeded',
            `The route distance is ${data.distance} km, which exceeds our 40 km service limit.`
          );
          setAppState('IDLE');
          return null;
        }

        setEstimate(data);
        return data;
      } catch (err: any) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.msg ||
          'Could not calculate road route. Please verify locations and try again.';
        Alert.alert('Route Estimation Failed', msg);
        setAppState('IDLE');
        return null;
      }
    },
    []
  );

  // ── Request ride with Idempotency ─────────
  const requestRide = useCallback(
    async (vehicleType: string) => {
      if (!estimate) return;

      setAppState('SEARCHING');

      try {
        const fareOption = estimate.fareOptions.find((o) => o.type === vehicleType);
        const fare = fareOption?.fare ?? estimate.fareOptions[0]?.fare ?? 0;
        const idempotencyKey = `ride_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const res: any = await api.post(
          '/ride/create',
          {
            pickup: estimate.pickup,
            drop: estimate.drop,
            fare,
            distance: estimate.distance,
            duration: estimate.duration,
            polyline: estimate.polyline,
            vehicleType,
            idempotencyKey,
          },
          {
            headers: {
              'x-idempotency-key': idempotencyKey,
            },
          }
        );

        const createdRide = res.data || res;
        activeRideIdRef.current = createdRide._id || createdRide.id;
        socket.emit('join_ride', activeRideIdRef.current);
      } catch (err: any) {
        const msg = err.response?.data?.message || err.response?.data?.msg || 'Could not book ride.';
        Alert.alert('Booking Failed', msg);
        setAppState('ESTIMATING');
      }
    },
    [estimate]
  );

  // ── Cancel ride ────────────────────────────
  const cancelRide = useCallback(async () => {
    const rideId = activeRideIdRef.current;
    if (rideId) {
      try {
        await api.put('/ride/cancel', { rideId });
      } catch (_) {}
    }
    resetFlow();
  }, []);

  // ── Reset ──────────────────────────────────
  const resetFlow = useCallback(() => {
    setAppState('IDLE');
    setEstimate(null);
    setDriver(null);
    setActiveRide(null);
    setDriverLocation(null);
    activeRideIdRef.current = null;
  }, []);

  // ── Logout ─────────────────────────────────
  const logout = useCallback(
    async (navigation: any) => {
      await AsyncStorage.multiRemove(['token', 'user', 'userId']);
      setCurrentUser(null);
      setIsLoggedIn(false);
      socket.disconnect();
      resetFlow();
      if (navigation) {
        if (typeof navigation.replace === 'function') {
          navigation.replace('Auth');
        } else if (typeof navigation.reset === 'function') {
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        } else if (typeof navigation.navigate === 'function') {
          navigation.navigate('Auth');
        }
      }
    },
    [resetFlow]
  );

  return (
    <CustomerContext.Provider
      value={{
        appState,
        userLocation,
        currentAddress,
        locationPermissionGranted,
        isLocating,
        estimate,
        driver,
        activeRide,
        driverLocation,
        availableDrivers,
        surgeStatus,
        isLoadingSurge,
        refreshSurgeStatus,
        googleMapsKey,
        currentUser,
        setCurrentUser,
        isLoggedIn,
        saveAuthSession,
        checkAndRestoreSession,
        requestCurrentLocation,
        searchPlaces,
        getPlaceDetails,
        fetchEstimate,
        requestRide,
        cancelRide,
        resetFlow,
        logout,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};