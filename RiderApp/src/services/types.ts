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
  customer: User;
  rider?: any;
  pickup: LocationData;
  drop: LocationData;
  fare: number;
  distance: number;
  duration: number;
  status: 'pending' | 'accepted' | 'arrived' | 'ongoing' | 'completed' | 'cancelled';
  otp: string;
  polyline: string;
  vehicleType?: string;
  paymentMethod?: string;
  arrivedAt?: string;
  waitCharges?: number;
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'rider' | 'system';
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleInfo {
  model: string;
  plate: string;
  year?: string;
  color?: string;
  vehicleType?: 'bike' | 'scooty' | 'auto' | 'car';
  insuranceExpiry?: string;
  pollutionStatus?: string;
}

export interface RiderDocument {
  id: string;
  title: string;
  status: 'Approved' | 'Pending Review' | 'Required';
  documentNumber?: string;
  verifiedAt?: string;
}

export interface RiderPreferences {
  autoAccept: boolean;
  darkMode: boolean;
  outstationOptIn: boolean;
  navigationApp: string;
}

export interface RiderProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  todayEarnings: number;
  walletBalance: number;
  loyaltyPoints: number;
  referralCode: string;
  vehicle: VehicleInfo;
  documents: RiderDocument[];
  preferences: RiderPreferences;
}

export interface PaymentAccount {
  _id: string;
  type: string;
  provider: string;
  last4?: string;
  accountNumber?: string;
  isDefault: boolean;
}

export interface RiderTransaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface RiderWalletData {
  balance: number;
  totalEarnings: number;
  linkedAccounts: PaymentAccount[];
  transactions: RiderTransaction[];
}

export interface EarningsDaySummary {
  id: string;
  day: string;
  amount: number;
  rides: number;
}

export interface RiderEarningsData {
  totalBalance: number;
  totalEarnings: number;
  weeklyTrips: number;
  onlineHours: string;
  historySummary: EarningsDaySummary[];
}

export interface RiderIncentive {
  _id: string;
  title: string;
  description?: string;
  code?: string;
  progress?: number;
  target?: number;
  rewardAmount?: number;
  validUntil: string;
}

export interface RiderIncentivesData {
  loyaltyPoints: number;
  referralCode: string;
  progressPercentage: number;
  pointsNeeded: number;
  tier?: string;
  targets?: RiderIncentive[];
  incentives: RiderIncentive[];
}

export interface RiderOffer {
  _id: string;
  title: string;
  description: string;
  code?: string;
  progress?: number;
  target?: number;
  validUntil: string;
}

export interface RiderNotification {
  _id: string;
  title: string;
  body: string;
  type: 'promo' | 'ride' | 'system' | 'claim' | 'payout' | 'bonus';
  isRead: boolean;
  createdAt: string;
}

export interface SupportFaq {
  id: string;
  question: string;
  answer: string;
}

export interface SupportTicket {
  _id: string;
  type: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected';
  rideId?: string;
  createdAt: string;
}