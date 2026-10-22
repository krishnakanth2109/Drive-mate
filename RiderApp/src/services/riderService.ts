import { api } from './api';
import {
  RiderProfile,
  VehicleInfo,
  RiderDocument,
  RiderPreferences,
  RiderWalletData,
  RiderEarningsData,
  RiderIncentivesData,
  RiderOffer,
  RiderNotification,
  SupportFaq,
  SupportTicket,
  Ride
} from './types';

export const riderService = {
  // --- Profile ---
  getProfile: async (): Promise<RiderProfile> => {
    const res = await api.get('/rider/profile');
    return res.data;
  },
  updateProfile: async (data: Partial<RiderProfile>): Promise<RiderProfile> => {
    const res = await api.put('/rider/profile', data);
    return res.data;
  },

  // --- Vehicle ---
  getVehicle: async (): Promise<VehicleInfo> => {
    const res = await api.get('/rider/vehicle');
    return res.data;
  },
  updateVehicle: async (data: Partial<VehicleInfo>): Promise<VehicleInfo> => {
    const res = await api.put('/rider/vehicle', data);
    return res.data;
  },

  // --- Documents ---
  getDocuments: async (): Promise<RiderDocument[]> => {
    const res = await api.get('/rider/documents');
    return res.data;
  },
  updateDocument: async (data: { id: string; documentNumber?: string; status?: string; title?: string }): Promise<RiderDocument[]> => {
    const res = await api.put('/rider/documents', data);
    return res.data;
  },

  // --- Settings & Preferences ---
  getSettings: async (): Promise<RiderPreferences> => {
    const res = await api.get('/rider/settings');
    return res.data;
  },
  updateSettings: async (data: Partial<RiderPreferences>): Promise<RiderPreferences> => {
    const res = await api.put('/rider/settings', data);
    return res.data;
  },
  optInOutstation: async (optIn: boolean): Promise<RiderPreferences> => {
    const res = await api.post('/rider/outstation', { optIn });
    return res.data;
  },

  // --- Wallet & Payout ---
  getWallet: async (): Promise<RiderWalletData> => {
    const res = await api.get('/rider/wallet');
    return res.data;
  },
  requestPayout: async (amount: number, accountId?: string): Promise<{ newBalance: number; transaction: any }> => {
    const res = await api.post('/rider/wallet/payout', { amount, accountId });
    return res.data;
  },
  linkAccount: async (data: { provider: string; type?: string; last4?: string; accountNumber?: string; ifscOrRouting?: string }): Promise<any> => {
    const res = await api.post('/rider/wallet/link-account', data);
    return res.data;
  },

  // --- Earnings & Incentives & Offers ---
  getEarnings: async (): Promise<RiderEarningsData> => {
    const res = await api.get('/rider/earnings');
    return res.data;
  },
  getIncentives: async (): Promise<RiderIncentivesData> => {
    const res = await api.get('/rider/incentives');
    return res.data;
  },
  getOffers: async (): Promise<RiderOffer[]> => {
    const res = await api.get('/rider/offers');
    return res.data;
  },

  // --- Notifications ---
  getNotifications: async (): Promise<RiderNotification[]> => {
    const res = await api.get('/rider/notifications');
    return res.data;
  },
  markNotificationsRead: async (): Promise<void> => {
    await api.put('/rider/notifications/mark-read');
  },

  // --- Support & Tickets ---
  getFaqs: async (): Promise<SupportFaq[]> => {
    const res = await api.get('/rider/support/faqs');
    return res.data;
  },
  raiseTicket: async (data: { type: string; description: string; rideId?: string }): Promise<SupportTicket> => {
    const res = await api.post('/rider/support/ticket', data);
    return res.data;
  },
  getTickets: async (): Promise<SupportTicket[]> => {
    const res = await api.get('/rider/support/tickets');
    return res.data;
  },

  // --- Rides ---
  getRideHistory: async (): Promise<Ride[]> => {
    const res = await api.get('/ride/rider/history');
    return res.data;
  },
  getActiveRide: async (): Promise<Ride | null> => {
    const res = await api.get('/ride/rider/active');
    return res.data;
  },
  getRideDetails: async (id: string): Promise<Ride> => {
    const res = await api.get(`/ride/${id}`);
    return res.data;
  },
  cancelRide: async (rideId: string, reason: string): Promise<any> => {
    const res = await api.put('/ride/cancel', { rideId, reason });
    return res.data;
  },

  // --- Password Recovery ---
  forgotPassword: async (email: string): Promise<any> => {
    const res = await api.post('/rider/auth/forgot-password', { email });
    return res.data;
  },
  verifyOtp: async (email: string, otp: string): Promise<any> => {
    const res = await api.post('/rider/auth/verify-otp', { email, otp });
    return res.data;
  },
  resetPassword: async (email: string, password: string): Promise<any> => {
    const res = await api.post('/rider/auth/reset-password', { email, password });
    return res.data;
  },
};
