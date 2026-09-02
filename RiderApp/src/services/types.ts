export interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'rider' | 'customer';
}

export interface Ride {
  _id: string;
  customer: User; // Backend populates this
  pickup: LocationData; // Matches Backend Schema
  drop: LocationData;   // Matches Backend Schema
  fare: number;
  distance: number;
  duration: number;
  status: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  otp: string;
  polyline: string;
}