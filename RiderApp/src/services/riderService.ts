import { api, safeGet } from './api';
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
  RiderPerformanceData,
  SupportFaq,
  SupportTicket,
  Ride
} from './types';

export const riderService = {
  // --- Profile ---
  getProfile: async (): Promise<RiderProfile> => safeGet('/rider/profile'),
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

  // --- Wallet, Razorpay Top-Up & Payout ---
  getWallet: async (): Promise<RiderWalletData> => {
    const res = await api.get('/rider/wallet');
    return res.data;
  },
  getAuthoritativeWallet: async (): Promise<any> => {
    const res = await api.get('/wallet');
    return res.data;
  },
  getWalletTransactions: async (page = 1, limit = 15, type?: string): Promise<any> => {
    const query = type && type !== 'ALL' ? `&type=${type}` : '';
    const res = await api.get(`/wallet/transactions?page=${page}&limit=${limit}${query}`);
    return res.data;
  },
  createTopupOrder: async (amount: number): Promise<any> => {
    const res = await api.post('/wallet/topup/order', { amount, currency: 'INR' });
    return res.data;
  },
  verifyTopupPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<any> => {
    const res = await api.post('/wallet/topup/verify', payload);
    return res.data;
  },
  simulateTopupPayment: async (orderId: string): Promise<any> => {
    const res = await api.post('/wallet/topup/simulate-test-payment', { orderId });
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

  // --- Earnings, Incentives, Performance & Offers ---
  getEarnings: async (): Promise<RiderEarningsData> => safeGet('/rider/earnings'),
  getIncentives: async (): Promise<RiderIncentivesData> => safeGet('/rider/incentives'),
  getOffers: async (): Promise<RiderOffer[]> => safeGet('/rider/offers'),
  getPerformance: async (): Promise<RiderPerformanceData> => safeGet('/rider/performance'),

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

  // --- 7-Step Driver Onboarding & Sandbox Document Verification ---
  startOnboarding: async (): Promise<any> => {
    const res = await api.post('/driver-onboarding/start');
    return res.data;
  },
  getOnboardingProgress: async (): Promise<any> => {
    const res = await api.get('/driver-onboarding/progress');
    return res.data;
  },
  saveOnboardingStep: async (step: number, data: any): Promise<any> => {
    const res = await api.put(`/driver-onboarding/step/${step}`, data);
    return res.data;
  },
  verifyDl: async (data: { dlNumber?: string; dob?: string; frontImage?: string; backImage?: string; expiryDate?: string }): Promise<any> => {
    const res = await api.post('/driver-onboarding/dl', data);
    return res.data;
  },
  verifyAadhaar: async (data: { aadhaarNumber?: string; frontImage?: string; backImage?: string; consentGiven: boolean; useDigiLocker?: boolean }): Promise<any> => {
    const res = await api.post('/driver-onboarding/aadhaar', data);
    return res.data;
  },
  verifyPan: async (data: { pan: string; nameAsPerPan: string; panImage?: string }): Promise<any> => {
    const res = await api.post('/driver-onboarding/pan', data);
    return res.data;
  },
  verifyRc: async (data: {
    vehiclePlate: string;
    vehicleType?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    vehicleColor?: string;
    rcFrontImage?: string;
    rcBackImage?: string;
    insurancePolicyNumber?: string;
    insuranceExpiryDate?: string;
    insuranceDocumentImage?: string;
  }): Promise<any> => {
    const res = await api.post('/driver-onboarding/rc', data);
    return res.data;
  },
  submitOnboarding: async (consentDeclaration: boolean = true): Promise<any> => {
    const res = await api.post('/driver-onboarding/submit', { consentDeclaration });
    return res.data;
  },
  getVerificationStatus: async (): Promise<any> => {
    const res = await api.get('/driver-onboarding/status');
    return res.data;
  },
  uploadDocumentFile: async (payload: { documentType: string; base64Image?: string; file?: any }): Promise<any> => {
    if (payload.base64Image) {
      const res = await api.post('/driver-onboarding/upload', {
        documentType: payload.documentType,
        base64Image: payload.base64Image,
      });
      return res.data;
    }
    const formData = new FormData();
    formData.append('documentType', payload.documentType);
    if (payload.file) {
      formData.append('file', payload.file);
    }
    const res = await api.post('/driver-onboarding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
