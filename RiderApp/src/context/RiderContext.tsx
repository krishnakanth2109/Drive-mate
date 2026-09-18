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
  toggleOnline: () => void;
  acceptRide: () => void;
  rejectRide: () => void;
  startRide: (otp: string) => Promise<boolean>;
  completeRide: () => void;
  logout: (nav: any) => void;
}

const RiderContext = createContext<RiderContextType>({} as RiderContextType);

export const RiderProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [googleMapsKey, setGoogleMapsKey] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<Ride | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  
  // Interval & Timeout references
  const locationInterval = useRef<NodeJS.Timeout | null>(null);
  const requestTimeout = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Permission & Current Location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable location to receive rides');
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (e) {
        console.log("Location fetch error on init", e);
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
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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

  const startRide = async (otp: string) => {
    if(!activeRide) return false;
    try {
        await api.put('/ride/update-status', {
            rideId: activeRide._id,
            status: 'ongoing',
            otp
        });
        setActiveRide({ ...activeRide, status: 'ongoing' });
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

  const logout = async (nav: any) => {
      setIsOnline(false);
      stopLocationUpdates();
      await AsyncStorage.clear();
      socket.disconnect();
      nav.replace('Login');
  };

  return (
    <RiderContext.Provider value={{
      isOnline, location, googleMapsKey, incomingRequest, activeRide,
      toggleOnline, acceptRide, rejectRide, startRide, completeRide, logout
    }}>
      {children}
    </RiderContext.Provider>
  );
};

export const useRider = () => useContext(RiderContext);