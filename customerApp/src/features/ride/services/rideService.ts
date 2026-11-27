import { api, safeGet } from '../../../services/api';

export const rideService = {
  getActiveRide: () => safeGet<any | null>('/ride/customer/active'),
  getRideById: (rideId: string) => safeGet<any>(`/ride/${rideId}`),
  getWaitTime: (rideId: string) => safeGet<any>(`/ride/${rideId}/wait-time`),
  cancelRide: async (rideId: string, reason: string) => {
    const res = await api.put('/ride/cancel', { rideId, reason });
    return res.data;
  },
};
