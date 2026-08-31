import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, socket, connectSocket } from '../services/api';
import { Ride } from '../services/types';

interface RiderContextType {
  isOnline: boolean;
  location: any;
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
  const [incomingRequest, setIncomingRequest] = useState<Ride | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  
  // Location interval reference
  const locationInterval = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Permission & Current Location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable location to receive rides');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
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
        }
      });

      socket.on('ride_taken', ({ rideId }: { rideId: string }) => {
        if (incomingRequest && incomingRequest._id === rideId) {
            setIncomingRequest(null);
            Alert.alert("Missed", "Another driver took the ride.");
        }
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
                    customerId: activeRide.customer._id,
                    lat: latitude,
                    lng: longitude,
                    heading
                });
            }
        } catch(e) { console.log("Loc Update Error"); }

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
    try {
      const res = await api.put('/ride/accept', { 
        rideId: incomingRequest._id
      });

      setActiveRide(res.data.ride);
      setIncomingRequest(null);
      Alert.alert("Success", "Head to pickup location!");
    } catch (err: any) {
      Alert.alert("Error", "Ride already taken");
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

  const rejectRide = () => setIncomingRequest(null);

  const logout = async (nav: any) => {
      setIsOnline(false);
      stopLocationUpdates();
      await AsyncStorage.clear();
      socket.disconnect();
      nav.replace('Login');
  };

  return (
    <RiderContext.Provider value={{
      isOnline, location, incomingRequest, activeRide,
      toggleOnline, acceptRide, rejectRide, startRide, completeRide, logout
    }}>
      {children}
    </RiderContext.Provider>
  );
};

export const useRider = () => useContext(RiderContext);