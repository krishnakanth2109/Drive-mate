/**
 * TypeScript Type Definitions for DriveMate Database Models
 * Maps MongoDB documents and PostgreSQL relational entities
 */

export type VehicleType = 'bike' | 'scooty' | 'auto' | 'car';
export type RideStatus = 'pending' | 'accepted' | 'arrived' | 'ongoing' | 'completed' | 'cancelled';
export type UserRole = 'customer' | 'rider' | 'admin';

export interface PowerPass {
  isActive: boolean;
  planName: string | null;
  validUntil: Date | null;
}

export interface CustomerEntity {
  id: string; // Preserves MongoDB _id (24 hex characters)
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'customer';
  walletBalance: number;
  coinBalance: number;
  powerPass?: PowerPass;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiderDocument {
  id: string;
  title: string;
  status: 'Approved' | 'Pending Review' | 'Required';
  documentNumber: string;
  verifiedAt: Date;
}

export interface RiderPreferences {
  autoAccept: boolean;
  darkMode: boolean;
  outstationOptIn: boolean;
  navigationApp: string;
}

export interface RiderVehicle {
  model: string;
  plate: string;
  year: string;
  color: string;
  insuranceExpiry: string;
  pollutionStatus: string;
}

export interface RiderEntity {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'rider';
  isAvailable: boolean;
  vehicleType: VehicleType;
  currentLocationLat?: number;
  currentLocationLng?: number;
  heading?: number;
  vehicle: RiderVehicle;
  walletBalance: number;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  loyaltyPoints: number;
  referralCode: string;
  documents: RiderDocument[];
  preferences: RiderPreferences;
  resetOtp?: string | null;
  resetOtpExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationPoint {
  address: string;
  lat: number;
  lng: number;
}

export interface RideEntity {
  id: string;
  customer: string; // Foreign key / reference to Customer id
  rider?: string | null; // Foreign key / reference to Rider id
  pickup: LocationPoint;
  drop: LocationPoint;
  status: RideStatus;
  vehicleType: VehicleType;
  fare: number;
  distance?: number;
  duration?: number;
  polyline?: string;
  otp?: string;
  arrivedAt?: Date;
  waitCharges?: number;
  cancellationReason?: string | null;
  cancelledBy?: 'customer' | 'rider' | 'system' | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostgresQueryResult<T> {
  rows: T[];
  rowCount: number;
}
