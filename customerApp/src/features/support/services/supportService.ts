import { api, safeGet } from '../../../services/api';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ClaimItem {
  _id: string;
  id?: string;
  type: string;
  description: string;
  rideId?: string | null;
  status: string;
  createdAt: string;
}

export const supportService = {
  getFaqs: (role: 'customer' | 'rider' = 'customer') =>
    safeGet<FaqItem[]>(`/support/faqs?role=${role}`),
  getClaims: () => safeGet<ClaimItem[]>('/profile/claims'),
  addClaim: async (payload: { type: string; description: string; rideId?: string }) => {
    const res = await api.post('/profile/claims', payload);
    return res.data;
  },
  submitSupportTicket: async (payload: {
    rideId?: string;
    userType?: string;
    userName: string;
    userPhone?: string;
    category: string;
    subject: string;
    details: string;
    priority?: string;
  }) => {
    const res = await api.post('/support/tickets', payload);
    return res.data;
  },
};
