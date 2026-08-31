export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'rider';
}

export interface LocationData {
  address?: string;
  lat: number;
  lng: number;
  heading?: number;
}

export interface Estimate {
  pickup: LocationData;
  drop: LocationData;
  fare: number;
  distance: number;
  duration: number;
  polyline: string; // Encoded string
}

export interface Ride {
  _id: string;
  status: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  otp: string;
  pickup: LocationData;
  drop: LocationData;
  fare: number;
}

export interface Driver {
  _id: string;
  name: string;
  phone: string;
  vehicle: string; // e.g., "Honda Activa"
  location: {
    coordinates: number[]; // [lng, lat]
    heading: number;
  };
}