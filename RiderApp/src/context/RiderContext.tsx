import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, socket, connectSocket } from '../services/api';
import { Ride } from '../services/types';
import { DriverGpsSnapshot, evaluateDriverGeofence } from '../utils/geofence';

export interface RiderSurgeHotZone {
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

export interface RiderSurgeStatus {
  multiplier: number;
  isSurgeActive: boolean;
  demandLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
  trafficLevel: 'Smooth' | 'Moderate' | 'Heavy' | 'Severe';
  trafficDelayMinutes: number;
  trafficSpeedKmh: number;
  activeRequestsNearby: number;
  availableDriversNearby: number;
  reason: string;
  hotZones?: RiderSurgeHotZone[];
  updatedAt?: string;
}

interface RiderContextType {
  isOnline: boolean;
  location: any;
  driverGps: DriverGpsSnapshot | null;
  isArrivalSubmitting: boolean;
  googleMapsKey: string | null;
  incomingRequest: Ride | null;
  activeRide: Ride | null;
  surgeStatus: RiderSurgeStatus | null;
  refreshSurgeStatus: () => Promise<RiderSurgeStatus | null>;
  refreshCurrentGps: () => Promise<DriverGpsSnapshot | null>;
  setActiveRide: (ride: Ride | null) => void;
  refreshActiveRide: () => Promise<void>;
  toggleOnline: () => void;
  acceptRide: () => void;
  rejectRide: () => void;
  arriveAtPickup: () => Promise<boolean>;
  arriveAtDrop: () => Promise<boolean>;
  startRide: (otp: string) => Promise<boolean>;
  completeRide: () => Promise<boolean>;
  logout: (nav: any) => void;
}

const RiderContext = createContext<RiderContextType>({} as RiderContextType);

export const RiderProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [driverGps, setDriverGps] = useState<DriverGpsSnapshot | null>(null);
  const [isArrivalSubmitting, setIsArrivalSubmitting] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState<string | null>('AIzaSyDOMtmUqwZCLcEHSGQI4WpBLnvBiEPmX2E');
  const [incomingRequest, setIncomingRequest] = useState<Ride | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [surgeStatus, setSurgeStatus] = useState<RiderSurgeStatus | null>(null);

  // Interval, watcher & submission-lock references
  const locationInterval = useRef<any>(null);
  const activeWatchSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastServerSyncAtRef = useRef<number>(0);
  const arrivalSubmittingRef = useRef<boolean>(false);
  const requestTimeout = useRef<any>(null);

  const applyLocationReading = (
    loc: Location.LocationObject,
    permissionStatus: 'granted' | 'denied' | 'undetermined' = 'granted',
    servicesEnabled: boolean = true
  ): DriverGpsSnapshot => {
    const snapshot: DriverGpsSnapshot = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      heading: loc.coords.heading ?? 0,
      accuracy: loc.coords.accuracy ?? null,
      timestamp: typeof loc.timestamp === 'number' ? loc.timestamp : Date.now(),
      isMocked: Boolean((loc as any).mocked),
      permissionStatus,
      servicesEnabled,
      error: null,
    };
    setDriverGps(snapshot);
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
    return snapshot;
  };

  const refreshCurrentGps = async (): Promise<DriverGpsSnapshot | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const deniedSnapshot: DriverGpsSnapshot = {
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: null,
          isMocked: false,
          permissionStatus: 'denied',
          servicesEnabled: true,
          error: 'Location permission denied. Enable GPS access in device settings.',
        };
        setDriverGps(deniedSnapshot);
        return deniedSnapshot;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!servicesEnabled) {
        const disabledSnapshot: DriverGpsSnapshot = {
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: null,
          isMocked: false,
          permissionStatus: 'granted',
          servicesEnabled: false,
          error: 'Device GPS/Location services are switched off.',
        };
        setDriverGps(disabledSnapshot);
        return disabledSnapshot;
      }

      const currentLoc = (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('GPS fix timed out')), 7000)),
      ])) as Location.LocationObject;

      if (currentLoc?.coords) {
        return applyLocationReading(currentLoc, 'granted', true);
      }
      return null;
    } catch (err: any) {
      const errSnapshot: DriverGpsSnapshot = {
        latitude: null,
        longitude: null,
        accuracy: null,
        timestamp: null,
        isMocked: false,
        permissionStatus: 'granted',
        servicesEnabled: true,
        error: err?.message || 'Unable to obtain current GPS fix.',
      };
      setDriverGps(errSnapshot);
      return errSnapshot;
    }
  };

  // 1. Initial Permission & Current Location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDriverGps({
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: null,
          isMocked: false,
          permissionStatus: 'denied',
          servicesEnabled: true,
          error: 'Location permission denied. Enable GPS to accept rides and verify arrival.',
        });
        Alert.alert('Permission denied', 'Enable location to receive rides and verify arrival.');
        return;
      }
      try {
        // Fast path for map camera only; geofence keeps exact timestamp so stale cache cannot verify arrival
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown?.coords) {
          applyLocationReading(lastKnown, 'granted', true);
        }

        await refreshCurrentGps();
      } catch (e) {
        console.log('Location fetch error/timeout on init', e);
      }
    })();

    // Fetch Google Maps API key from backend
    (async () => {
      try {
        const res = await api.get('/config/maps-key');
        setGoogleMapsKey(res.data.key || res.data);
      } catch (e) {
        console.log('Failed to fetch maps key', e);
      }
    })();
  }, []);

  // 2. Handle Online/Offline Logic
  useEffect(() => {
    if (isOnline) {
      connectSocket().then(async () => {
        socket.emit('join_drivers_room');
        const userId = await AsyncStorage.getItem('userId');
        if(userId) socket.emit('join_room', userId); // Join private room
      });

      // Start sending location updates to server every 10s
      startLocationUpdates();

      // Listen for New Rides
      socket.on('new_ride_request', (ride: Ride) => {
        if (!activeRide) {
          setIncomingRequest(ride); 
          
          // Auto-hide after 10 seconds
          if (requestTimeout.current) clearTimeout(requestTimeout.current);
          requestTimeout.current = setTimeout(() => {
            setIncomingRequest((current) => {
              if (current && current._id === ride._id) return null;
              return current;
            });
          }, 10000);
        }
      });

      socket.on('ride_taken', ({ rideId }: { rideId: string }) => {
        setIncomingRequest((current) => {
           if (current && current._id === rideId) {
               Alert.alert("Missed", "Ride is no longer available.");
               return null;
           }
           return current;
        });
      });

    } else {
      socket.off('new_ride_request');
      socket.off('ride_taken');
      stopLocationUpdates();
      setIncomingRequest(null);
    }
    return () => { 
        socket.off('new_ride_request'); 
        socket.off('ride_taken');
        stopLocationUpdates();
    };
  }, [isOnline, activeRide, incomingRequest]);

  // High-accuracy GPS watch ONLY during active rides so 50m geofence responds promptly without idling battery
  useEffect(() => {
    let cancelled = false;

    const startActiveWatch = async () => {
      if (activeWatchSubscription.current) {
        activeWatchSubscription.current.remove();
        activeWatchSubscription.current = null;
      }
      if (!activeRide) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDriverGps((prev) => ({
          latitude: prev?.latitude ?? null,
          longitude: prev?.longitude ?? null,
          accuracy: prev?.accuracy ?? null,
          timestamp: prev?.timestamp ?? null,
          isMocked: false,
          permissionStatus: 'denied',
          servicesEnabled: true,
          error: 'Location permission denied.',
        }));
        return;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (loc) => {
          if (cancelled || !loc?.coords) return;
          applyLocationReading(loc, 'granted', true);

          const rideId = activeRide._id || (activeRide as any).id;
          if (rideId) {
            socket.emit('driver_location_update', {
              rideId,
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              heading: loc.coords.heading || 0,
            });
          }

          const now = Date.now();
          if (now - lastServerSyncAtRef.current >= 8000) {
            lastServerSyncAtRef.current = now;
            api
              .put('/users/location', {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                heading: loc.coords.heading || 0,
              })
              .catch(() => {});
          }
        }
      );

      if (cancelled) {
        sub.remove();
      } else {
        activeWatchSubscription.current = sub;
      }
    };

    startActiveWatch().catch(() => {});

    return () => {
      cancelled = true;
      if (activeWatchSubscription.current) {
        activeWatchSubscription.current.remove();
        activeWatchSubscription.current = null;
      }
    };
  }, [activeRide?._id, (activeRide as any)?.id]);

  const startLocationUpdates = () => {
    if (locationInterval.current) clearInterval(locationInterval.current);

    // Lighter 10s balanced polling when idle online (active watch handles activeRide precision)
    locationInterval.current = setInterval(async () => {
      if (activeRide) return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (loc?.coords) {
          applyLocationReading(loc, 'granted', true);
          await api.put('/users/location', {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            heading: loc.coords.heading || 0,
          });
        }
      } catch (e) {
        console.log('Interval location fetch error', e);
      }
    }, 10000);
  };

  const stopLocationUpdates = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  const toggleOnline = async () => {
    if (!location && !driverGps?.latitude) {
      await refreshCurrentGps();
    }
    setIsOnline((prev) => !prev);
  };

  const acceptRide = async () => {
    if (!incomingRequest) return;
    if (requestTimeout.current) clearTimeout(requestTimeout.current);

    try {
      const res = await api.put('/ride/accept', {
        rideId: incomingRequest._id,
      });

      setActiveRide(res.data.ride);
      socket.emit('join_ride', res.data.ride._id);
      setIncomingRequest(null);
      Alert.alert('Success', 'Head to pickup location!');
    } catch (err: any) {
      Alert.alert('Error', 'Ride already taken or expired');
      setIncomingRequest(null);
    }
  };

  const submitGeofencedArrival = async (mode: 'pickup' | 'drop'): Promise<boolean> => {
    if (!activeRide || arrivalSubmittingRef.current) return false;

    const rideId = activeRide._id || (activeRide as any).id;
    const targetCoord = mode === 'pickup' ? activeRide.pickup : activeRide.drop;

    arrivalSubmittingRef.current = true;
    setIsArrivalSubmitting(true);

    try {
      let currentGps = driverGps;
      const isTooOld =
        !currentGps ||
        currentGps.latitude == null ||
        currentGps.timestamp == null ||
        Date.now() - currentGps.timestamp > 15000;

      if (isTooOld) {
        currentGps = (await refreshCurrentGps()) || currentGps;
      }

      const evaluation = evaluateDriverGeofence(currentGps, targetCoord, mode);
      if (!evaluation.canDeclareArrival || !currentGps || currentGps.latitude == null || currentGps.longitude == null) {
        Alert.alert(
          mode === 'pickup' ? 'Cannot Mark Pickup Arrival' : 'Cannot Mark Drop Arrival',
          evaluation.statusMessage
        );
        return false;
      }

      const endpoint = mode === 'pickup' ? `/ride/${rideId}/arrive-pickup` : `/ride/${rideId}/arrive-drop`;
      const res = await api.post(endpoint, {
        lat: currentGps.latitude,
        lng: currentGps.longitude,
        accuracy: currentGps.accuracy,
        timestamp: currentGps.timestamp,
        isMocked: currentGps.isMocked,
      });

      if (res.data?.ride) {
        setActiveRide(res.data.ride);
      }
      return true;
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        `Could not verify ${mode} arrival`;
      Alert.alert('Arrival Check Failed', errMsg);
      return false;
    } finally {
      arrivalSubmittingRef.current = false;
      setIsArrivalSubmitting(false);
    }
  };

  const arriveAtPickup = async () => submitGeofencedArrival('pickup');
  const arriveAtDrop = async () => submitGeofencedArrival('drop');

  const startRide = async (otp: string) => {
    if (!activeRide) return false;
    try {
      const res = await api.put('/ride/update-status', {
        rideId: activeRide._id,
        status: 'ongoing',
        otp,
      });
      setActiveRide(res.data.ride || { ...activeRide, status: 'ongoing' });
      return true;
    } catch (err: any) {
      Alert.alert('Invalid OTP', err?.response?.data?.message || 'Ask customer for the 4-digit code');
      return false;
    }
  };

  const completeRide = async (): Promise<boolean> => {
    if (!activeRide) return false;
    try {
      const fareCollected = activeRide.fare;
      await api.put('/ride/update-status', {
        rideId: activeRide._id,
        status: 'completed',
      });
      setActiveRide(null);
      Alert.alert('Completed', `Fare collected: ₹${fareCollected}`);
      return true;
    } catch (err: any) {
      Alert.alert('Cannot Complete Trip', err?.response?.data?.message || 'Network error');
      return false;
    }
  };

  const rejectRide = () => {
    if (requestTimeout.current) clearTimeout(requestTimeout.current);
    setIncomingRequest(null);
  };

  const refreshActiveRide = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await api.get('/ride/rider/active');
      if (res.data && res.data.ride) {
        setActiveRide(res.data.ride);
      } else {
        setActiveRide(null);
      }
    } catch (e) {
      console.log('Error checking active ride on init:', e);
    }
  };

  const refreshSurgeStatus = async (): Promise<RiderSurgeStatus | null> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return null;
      const res: any = await api.get('/ride/surge-status', {
        params: location
          ? { lat: location.latitude, lng: location.longitude }
          : undefined,
      });
      const payload = res?.data?.multiplier != null ? res.data : res?.multiplier != null ? res : null;
      if (payload) {
        setSurgeStatus(payload);
        return payload;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    refreshActiveRide();
    refreshSurgeStatus();
  }, []);

  useEffect(() => {
    if (!location) return;
    refreshSurgeStatus();
    const interval = setInterval(() => {
      refreshSurgeStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [location?.latitude, location?.longitude]);

  useEffect(() => {
    const onSurgeUpdate = (data: any) => {
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
            activeRequestsNearby: Number(data.activeRequestsNearby ?? 0),
            availableDriversNearby: Number(data.availableDriversNearby ?? 0),
            reason: data.reason || `Live demand surge (${nextMultiplier.toFixed(1)}x)`,
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
          updatedAt: data.updatedAt || prev.updatedAt,
        };
      });
    };

    socket.on('surge:update', onSurgeUpdate);
    return () => {
      socket.off('surge:update', onSurgeUpdate);
    };
  }, []);

  const logout = async (nav: any) => {
      setIsOnline(false);
      // Clear session auth tokens but keep saved credentials if Remember Me was selected
      await AsyncStorage.multiRemove(['token', 'userId', 'user', 'rider']);
      socket.disconnect();
      if (nav?.replace) {
        nav.replace('Login');
      } else if (nav?.reset) {
        nav.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else if (nav?.navigate) {
        nav.navigate('Login');
      }
  };

  return (
    <RiderContext.Provider value={{
      isOnline, location, driverGps, isArrivalSubmitting, googleMapsKey, incomingRequest, activeRide,
      surgeStatus, refreshSurgeStatus, refreshCurrentGps,
      setActiveRide, refreshActiveRide,
      toggleOnline, acceptRide, rejectRide, arriveAtPickup, arriveAtDrop, startRide, completeRide, logout
    }}>
      {children}
    </RiderContext.Provider>
  );
};

export const useRider = () => useContext(RiderContext);