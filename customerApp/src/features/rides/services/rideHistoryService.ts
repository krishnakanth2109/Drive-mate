import { api, safeGet } from '../../../services/api';

export interface CustomerRideHistoryResponse {
  rides: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const rideHistoryService = {
  getHistory: async (params: { status?: string; page?: number; limit?: number } = {}): Promise<CustomerRideHistoryResponse> => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'All') {
      query.set('status', params.status.toLowerCase());
    }
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 20));
    return safeGet<CustomerRideHistoryResponse>(`/ride/customer/history?${query.toString()}`);
  },

  getRideById: async (rideId: string) => {
    return safeGet<any>(`/ride/${rideId}`);
  },
};
