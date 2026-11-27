import { api } from '../../../services/api';

export const bookingService = {
  estimate: async (pickup: any, drop: any) => {
    const res = await api.post('/ride/estimate', { pickup, drop });
    return res.data;
  },
  createRide: async (payload: {
    pickup: any;
    drop: any;
    vehicleType: string;
    paymentMethod?: string;
  }) => {
    const res = await api.post('/ride/create', payload);
    return res.data;
  },
};
