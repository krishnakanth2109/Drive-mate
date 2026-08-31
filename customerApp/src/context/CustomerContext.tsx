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
  fetchEstimate: (
    pickup: string | { lat: number; lng: number },
    drop: string
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
  }, []);

  // ── Socket listeners ───────────────────────
  useEffect(() => {
    const setupSocket = async () => {
      await connectSocket();
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        socket.emit('join_room', userId);
      }
    };
    setupSocket();

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

    return () => {
      socket.off('ride_accepted');
      socket.off('ride_status_update');
      socket.off('driver_location_update');
    };
  }, []);

  // ── Fetch estimate ─────────────────────────
  const fetchEstimate = useCallback(
    async (
      pickup: string | { lat: number; lng: number },
      drop: string
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