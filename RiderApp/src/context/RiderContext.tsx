import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, socket, connectSocket } from '../services/api';
import { Ride } from '../services/types';

interface RiderContextType {
  isOnline: boolean;
  location: any;
  googleMapsKey: string | null;
  incomingRequest: Ride | null;
  activeRide: Ride | null;
  setActiveRide: (ride: Ride | null) => void;
  refreshActiveRide: () => Promise<void>;
  toggleOnline: () => void;
  acceptRide: () => void;
  rejectRide: () => void;
  arriveAtPickup: () => Promise<boolean>;
  startRide: (otp: string) => Promise<boolean>;
  completeRide: () => void;
  logout: (nav: any) => void;
}

const RiderContext = createContext<RiderContextType>({} as RiderContextType);

export const RiderProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [googleMapsKey, setGoogleMapsKey] = useState<string | null>('AIzaSyDOMtmUqwZCLcEHSGQI4WpBLnvBiEPmX2E');
  const [incomingRequest, setIncomingRequest] = useState<Ride | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  
  // Interval & Timeout references
  const locationInterval = useRef<any>(null);
  const requestTimeout = useRef<any>(null);

  // 1. Initial Permission & Current Location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable location to receive rides');
        return;
      }
      try {
        // Fast path: use last known position immediately to get past loading screen
        let loc = await Location.getLastKnownPositionAsync({});
        if (loc) {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
        
        // Accurate path: attempt to get current position with a 5-second timeout
        const currentLoc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]) as any;

        if (currentLoc) {
            setLocation({
                latitude: currentLoc.coords.latitude,
                longitude: currentLoc.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        }
      } catch (e) {
        console.log("Location fetch error/timeout on init", e);
        // If location is STILL null, set a fallback location (e.g. New Delhi) so the app loads
        setLocation((prev: any) => prev || {
            latitude: 28.6139,
            longitude: 77.2090,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        });
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

  const startLocationUpdates = () => {
    if(locationInterval.current) clearInterval(locationInterval.current);
    
    locationInterval.current = setInterval(async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude, heading } = loc.coords;
            
            setLocation((prev: any) => ({
                ...prev,
                latitude,
                longitude
            }));

            // Send to Backend
            try {
                await api.put('/users/location', { lat: latitude, lng: longitude, heading });
                
                // If active ride, send to customer via socket
                if(activeRide) {
                    socket.emit('driver_location_update', {
                        rideId: activeRide._id,
                        lat: latitude,
                        lng: longitude,
                        heading
                    });
                }
            } catch(e) { console.log("Loc Update Error"); }
        } catch (e) {
            console.log("Interval location fetch error", e);
        }

    }, 10000); // 10 Seconds
  };

  const stopLocationUpdates = () => {
    if(locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
    }
  };

  const toggleOnline = async () => {
    if (!location) return Alert.alert("Wait", "Fetching GPS...");
    setIsOnline(!isOnline);
  };

  const acceptRide = async () => {
    if (!incomingRequest) return;
    if (requestTimeout.current) clearTimeout(requestTimeout.current);

    try {
      const res = await api.put('/ride/accept', { 
        rideId: incomingRequest._id
      });

      setActiveRide(res.data.ride);
      socket.emit('join_ride', res.data.ride._id);
      setIncomingRequest(null);
      Alert.alert("Success", "Head to pickup location!");
    } catch (err: any) {
      Alert.alert("Error", "Ride already taken or expired");
      setIncomingRequest(null);
    }
  };

  const arriveAtPickup = async () => {
    if(!activeRide) return false;
    try {
        const res = await api.put('/ride/update-status', {
            rideId: activeRide._id,
            status: 'arrived'
        });
        setActiveRide(res.data.ride || { ...activeRide, status: 'arrived', arrivedAt: new Date().toISOString() });
        return true;
    } catch (err) {
        Alert.alert("Error", "Could not update status");
        return false;
    }
  };

  const startRide = async (otp: string) => {
    if(!activeRide) return false;
    try {
        const res = await api.put('/ride/update-status', {
            rideId: activeRide._id,
            status: 'ongoing',
            otp
        });
        setActiveRide(res.data.ride || { ...activeRide, status: 'ongoing' });
        return true;
    } catch (err: any) {
        Alert.alert("Invalid OTP", "Ask customer for the 4-digit code");
        return false;
    }
  };

  const completeRide = async () => {
    if(!activeRide) return;
    try {
        await api.put('/ride/update-status', {
            rideId: activeRide._id,
            status: 'completed'
        });
        setActiveRide(null);
        Alert.alert("Completed", `Fare collected: ₹${activeRide.fare}`);
    } catch (err) {
        Alert.alert("Error", "Network error");
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

  useEffect(() => {
    refreshActiveRide();
  }, []);

  const logout = async (nav: any) => {
      setIsOnline(false);
      stopLocationUpdates();
      await AsyncStorage.clear();
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
      isOnline, location, googleMapsKey, incomingRequest, activeRide,
      setActiveRide, refreshActiveRide,
      toggleOnline, acceptRide, rejectRide, arriveAtPickup, startRide, completeRide, logout
    }}>
      {children}
    </RiderContext.Provider>
  );
};

export const useRider = () => useContext(RiderContext);