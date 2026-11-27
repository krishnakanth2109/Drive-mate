import { api, safeGet } from '../../../services/api';

export const paymentService = {
  getWallet: () => safeGet<any>('/wallet'),
  getWalletTransactions: (page = 1, limit = 15, type?: string) => {
    const typeQuery = type && type !== 'ALL' ? `&type=${type}` : '';
    return safeGet<any>(`/wallet/transactions?page=${page}&limit=${limit}${typeQuery}`);
  },
  createTopupOrder: async (amount: number) => {
    const res = await api.post('/wallet/topup/order', { amount, currency: 'INR' });
    return res.data;
  },
  verifyTopupPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const res = await api.post('/wallet/topup/verify', payload);
    return res.data;
  },
};
