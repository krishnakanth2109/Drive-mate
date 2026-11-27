import { safeGet } from '../../../services/api';

export const locationService = {
  autocomplete: (input: string, bias?: { lat: number; lng: number; radius?: number }, sessionToken?: string) => {
    const params = new URLSearchParams({ input });
    if (bias) {
      params.set('lat', String(bias.lat));
      params.set('lng', String(bias.lng));
      if (bias.radius) params.set('radius', String(bias.radius));
    }
    if (sessionToken) params.set('sessionToken', sessionToken);
    return safeGet<any[]>(`/ride/autocomplete?${params.toString()}`);
  },
  getPlaceDetails: (placeId: string, sessionToken?: string) => {
    const params = new URLSearchParams({ placeId });
    if (sessionToken) params.set('sessionToken', sessionToken);
    return safeGet<any>(`/ride/place-details?${params.toString()}`);
  },
  reverseGeocode: (lat: number, lng: number) =>
    safeGet<any>(`/ride/reverse-geocode?lat=${lat}&lng=${lng}`),
};
