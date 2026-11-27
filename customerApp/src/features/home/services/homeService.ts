import { safeGet } from '../../../services/api';

export const homeService = {
  getSurgeStatus: (lat?: number, lng?: number) => {
    const query = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : '';
    return safeGet<any>(`/ride/surge-status${query}`);
  },
  getNearbyDrivers: (lat?: number, lng?: number) => {
    const query = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : '';
    return safeGet<any[]>(`/users/nearby-riders${query}`);
  },
};
