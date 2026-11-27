import { api, safeGet } from '../../../services/api';

export interface CustomerProfileData {
  id: string;
  _id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  profession?: string;
  company?: string;
  industry?: string;
  city?: string;
  purpose?: string;
  walletBalance?: number;
  coinBalance?: number;
}

export const profileService = {
  getMe: () => safeGet<CustomerProfileData>('/auth/me'),
  updateProfile: async (payload: Partial<CustomerProfileData>) => {
    const res = await api.put('/auth/profile', payload);
    return res.data;
  },
  getBalances: () => safeGet<{ walletBalance: number; coinBalance: number; powerPass: any }>('/profile/balances'),
  getRewards: () => safeGet<any[]>('/profile/rewards'),
  getTransactions: () => safeGet<any[]>('/profile/transactions'),
  getPaymentMethods: () => safeGet<any[]>('/profile/payment-methods'),
  addPaymentMethod: async (payload: any) => {
    const res = await api.post('/profile/payment-methods', payload);
    return res.data;
  },
  subscribePowerPass: async () => {
    const res = await api.post('/profile/powerpass/subscribe');
    return res.data;
  },
};
