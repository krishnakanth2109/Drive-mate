import { api } from '../../../services/api';

export const ratingService = {
  rateRide: async (rideId: string, rating: number, review?: string) => {
    const res = await api.post(`/ride/${rideId}/rate`, { rating, review });
    return res.data;
  },
};
