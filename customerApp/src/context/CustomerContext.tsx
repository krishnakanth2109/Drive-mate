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
type AppState =
  | 'IDLE'
  | 'ESTIMATING'
  | 'SEARCHING'
  | 'ACCEPTED'
  | 'ONGOING'
  | 'COMPLETED';

interface LocationRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
}

interface FareOption {
  type: string;
  label: string;
  emoji: string;
  fare: number;
  perKm: number;
  eta: number;
}

interface Estimate {
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  distance: number;
  duration: number;
  polyline: string;
  fareOptions: FareOption[];
}

interface Driver {
  name: string;
  phone: string;
  vehicle: string;
  vehicleType: string;
}

interface ActiveRide {
  _id: string;
  otp: string;
  fare: number;
  status: string;
  pickup: { address: string; lat: number; lng: number };
  drop: { address: string; lat: number; lng: number };
}

interface CustomerContextType {
  appState: AppState;
  userLocation: LocationRegion | null;
  estimate: Estimate | null;
  driver: Driver | null;
  activeRide: ActiveRide | null;
  driverLocation: DriverLocation | null;
  availableDrivers: { [id: string]: { lat: number; lng: number; heading: number; vehicleType: string } };
  googleMapsKey: string | null;
  fetchEstimate: (
    pickup: string | { lat: number; lng: number },
    drop: string | { lat: number; lng: number }
  ) => Promise<void>;
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
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [userLocation, setUserLocation] = useState<LocationRegion | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<{ [id: string]: { lat: number; lng: number; heading: number; vehicleType: string } }>({});
  const [googleMapsKey, setGoogleMapsKey] = useState<string | null>(null);

  const activeRideIdRef = useRef<string | null>(null);

  // ── Get GPS location on mount ──────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission denied — using fallback');
          setUserLocation({
            latitude: 17.385,
            longitude: 78.4867,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (err: any) {
        console.warn('Location error:', err.message);
        // Fallback to Hyderabad if error
        setUserLocation({
          latitude: 17.385,
          longitude: 78.4867,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    })();

    // Fetch initial nearby drivers (approx center of hyderabad if no gps yet)
    (async () => {
      try {
        const res = await api.get('/users/nearby?lat=17.385&lng=78.4867');
        const initialDrivers: any = {};
        res.data.forEach((d: any) => {
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

    // Fetch Maps Key
    (async () => {
      try {
        const res = await api.get('/config/maps-key');
        setGoogleMapsKey(res.data.key);
      } catch (err) {
        console.warn('Failed to fetch maps key from backend');
      }
    })();
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

    // Available driver location update (for map)
    socket.on('available_driver_location', (data: any) => {
      setAvailableDrivers(prev => ({
        ...prev,
        [data.driverId]: {
          lat: data.lat,
          lng: data.lng,
          heading: data.heading,
          vehicleType: data.vehicleType,
        }
      }));
    });

    // Driver accepted our ride
    socket.on('ride_accepted', (data: { ride: ActiveRide; rider: Driver }) => {
      setDriver(data.rider);
      setActiveRide(data.ride);
      activeRideIdRef.current = data.ride._id;
      setAppState('ACCEPTED');
    });

    // Ride status updates (ongoing / completed)
    socket.on('ride_status_update', (data: { status: string; ride: ActiveRide }) => {
      if (data.status === 'ongoing') {
        setActiveRide(data.ride);
        setAppState('ONGOING');
      } else if (data.status === 'completed') {
        setAppState('COMPLETED');
        activeRideIdRef.current = null;
      }
    });

    // Live driver location
    socket.on(
      'driver_location_update',
      (data: { lat: number; lng: number }) => {
        setDriverLocation({ latitude: data.lat, longitude: data.lng });
      }
    );

    // Ride timed out (no drivers accepted in 10s)
    socket.on('ride_timeout', (data: { rideId: string; message: string }) => {
      Alert.alert('No Riders Found', data.message);
      resetFlow();
    });

    return () => {
      socket.off('ride_accepted');
      socket.off('ride_status_update');
      socket.off('driver_location_update');
      socket.off('available_driver_location');
      socket.off('ride_timeout');
    };
  }, []);

  // ── Fetch estimate ─────────────────────────
  const fetchEstimate = useCallback(
    async (
      pickup: string | { lat: number; lng: number },
      drop: string | { lat: number; lng: number }
    ) => {
      setAppState('ESTIMATING');
      setEstimate(null);

      try {
        const res = await api.post('/ride/estimate', { pickup, drop });
        const data = res.data;

        // 40 km hard limit check (redundant guard on client)
        if (data.limitExceeded) {
          Alert.alert(
            'Too Far',
            `The distance is ${data.distance} km, which exceeds our 40 km booking limit.`
          );
          setAppState('IDLE');
          return;
        }

        setEstimate(data);
      } catch (err: any) {
        const msg =
          err.response?.data?.msg || 'Could not get ride estimate. Try again.';
        Alert.alert('Estimation Failed', msg);
        setAppState('IDLE');
      }
    },
    []
  );

  // ── Request ride ───────────────────────────
  const requestRide = useCallback(
    async (vehicleType: string) => {
      if (!estimate) return;

      setAppState('SEARCHING');

      try {
        const fareOption = estimate.fareOptions.find(
          (o) => o.type === vehicleType
        );
        const fare = fareOption?.fare ?? estimate.fareOptions[0]?.fare ?? 0;

        const res = await api.post('/ride/create', {
          pickup: estimate.pickup,
          drop: estimate.drop,
          fare,
          distance: estimate.distance,
          duration: estimate.duration,
          polyline: estimate.polyline,
          vehicleType,
        });

        activeRideIdRef.current = res.data._id;
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Could not book ride.';
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
  const logout = useCallback(async (navigation: any) => {
    await AsyncStorage.multiRemove(['token', 'user', 'userId']);
    socket.disconnect();
    resetFlow();
    navigation.replace('Login');
  }, [resetFlow]);

  return (
    <CustomerContext.Provider
      value={{
        appState,
        userLocation,
        estimate,
        driver,
        activeRide,
        driverLocation,
        availableDrivers,
        googleMapsKey,
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