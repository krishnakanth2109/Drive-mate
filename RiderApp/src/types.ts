// src/types.ts

export interface Coords {
  lat: number;
  lng: number;
}

export interface LocationData extends Coords {
  address: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'rider' | 'customer';
}

export interface Ride {
  _id: string;
  customer: string; // User ID
  rider?: string | null; // User ID
  pickupLocation: LocationData;
  dropLocation: LocationData;
  fare: number;
  distance: number;
  duration: string;
  status: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  name: string;
}