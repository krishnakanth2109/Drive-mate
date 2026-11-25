import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface LocationCoordinates {
  address: string;
  name?: string;
  lat: number;
  lng: number;
}

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteDetails {
  distance: number; // in kilometers
  duration: number; // in minutes
  polyline: string; // encoded polyline
  coordinates: RouteCoordinate[]; // decoded road coordinates
}

export interface AutocompleteSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

// ---------------------------------------------------------------------------
// In-Memory Cache — avoids redundant API calls & reduces network latency
// ---------------------------------------------------------------------------
const cache = new Map<string, { value: any; ts: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const getCached = <T = any>(key: string): T | null => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.value;
  cache.delete(key);
  return null;
};

const setCache = (key: string, value: any) => cache.set(key, { value, ts: Date.now() });

// ---------------------------------------------------------------------------
// Polyline Decoder Helper
// ---------------------------------------------------------------------------
export const decodePolyline = (encoded: string): RouteCoordinate[] => {
  if (!encoded || encoded === 'encoded_polyline_placeholder') return [];
  const points: RouteCoordinate[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
};

// ---------------------------------------------------------------------------
// Haversine Distance (km)
// ---------------------------------------------------------------------------
export const deg2rad = (deg: number): number => deg * (Math.PI / 180);

export const getDistanceFromLatLonInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ---------------------------------------------------------------------------
// 1. Places Autocomplete
// ---------------------------------------------------------------------------
export const getPlaceAutocomplete = async (
  input: string,
  bias?: { lat: number; lng: number; radius?: number },
  sessionToken?: string
): Promise<AutocompleteSuggestion[]> => {
  if (!input || !input.trim()) return [];

  const trimmed = input.trim();
  const cacheKey = `autocomplete:${trimmed}:${bias?.lat || 0}:${bias?.lng || 0}`;
  const cached = getCached<AutocompleteSuggestion[]>(cacheKey);
  if (cached) return cached;

  // Primary: Google Places API (New)
  if (API_KEY) {
    try {
      const payload: any = {
        input: trimmed,
        includedRegionCodes: ['in'],
        languageCode: 'en',
      };

      if (bias && bias.lat && bias.lng) {
        payload.locationBias = {
          circle: {
            center: { latitude: bias.lat, longitude: bias.lng },
            radius: bias.radius || 25000.0, // 25km radius bias
          },
        };
      }

      if (sessionToken) {
        payload.sessionToken = sessionToken;
      }

      const res = await axios.post(
        'https://places.googleapis.com/v1/places:autocomplete',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
          },
          timeout: 4000,
        }
      );

      if (res.data?.suggestions?.length) {
        const results: AutocompleteSuggestion[] = res.data.suggestions
          .filter((s: any) => s.placePrediction)
          .map((s: any) => {
            const pred = s.placePrediction;
            return {
              placeId: pred.placeId,
              mainText: pred.structuredFormat?.mainText?.text || pred.text?.text || trimmed,
              secondaryText: pred.structuredFormat?.secondaryText?.text || '',
              fullText: pred.text?.text || trimmed,
            };
          });

        setCache(cacheKey, results);
        return results;
      }
    } catch (err: any) {
      console.warn('Google Places API (New) autocomplete error (trying fallback):', err?.response?.data?.error?.message || err?.message);
    }
  }

  // Fallback: OpenStreetMap Nominatim search
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: trimmed,
        format: 'json',
        addressdetails: 1,
        countrycodes: 'in',
        limit: 8,
      },
      headers: {
        'User-Agent': 'DriveMate/1.0 (contact@drivemate.app)',
      },
      timeout: 4000,
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      const results: AutocompleteSuggestion[] = res.data.map((item: any) => {
        const parts = (item.display_name || '').split(', ');
        const mainText = item.name || parts[0] || trimmed;
        const secondaryText = parts.slice(1).join(', ');
        return {
          placeId: `osm_${item.osm_type || 'node'}_${item.osm_id}`,
          mainText,
          secondaryText,
          fullText: item.display_name,
        };
      });

      setCache(cacheKey, results);
      return results;
    }
  } catch (err: any) {
    console.error('Nominatim autocomplete fallback error:', err?.message);
  }

  return [];
};

// ---------------------------------------------------------------------------
// 2. Place Details (Resolve Place ID to Lat/Lng Coordinates & Address)
// ---------------------------------------------------------------------------
export const getPlaceDetails = async (
  placeId: string,
  sessionToken?: string
): Promise<LocationCoordinates | null> => {
  if (!placeId) return null;

  const cacheKey = `place_details:${placeId}`;
  const cached = getCached<LocationCoordinates>(cacheKey);
  if (cached) return cached;

  // Primary: Google Places API (New)
  if (API_KEY && !placeId.startsWith('osm_')) {
    try {
      const params: any = {};
      if (sessionToken) params.sessionToken = sessionToken;

      const res = await axios.get(`https://places.googleapis.com/v1/places/${placeId}`, {
        params,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
        },
        timeout: 4000,
      });

      if (res.data?.location) {
        const data: LocationCoordinates = {
          name: res.data.displayName?.text || '',
          address: res.data.formattedAddress || res.data.displayName?.text || 'Selected Place',
          lat: res.data.location.latitude,
          lng: res.data.location.longitude,
        };
        setCache(cacheKey, data);
        return data;
      }
    } catch (err: any) {
      console.warn('Google Place Details error (trying fallback):', err?.response?.data?.error?.message || err?.message);
    }
  }

  // Fallback: If OSM ID or fallback needed
  if (placeId.startsWith('osm_')) {
    try {
      const parts = placeId.split('_');
      const osmType = (parts[1] || 'node').charAt(0).toUpperCase(); // N, W, R
      const osmId = parts[2];
      const res = await axios.get('https://nominatim.openstreetmap.org/lookup', {
        params: {
          osm_ids: `${osmType}${osmId}`,
          format: 'json',
        },
        headers: {
          'User-Agent': 'DriveMate/1.0 (contact@drivemate.app)',
        },
        timeout: 4000,
      });

      if (Array.isArray(res.data) && res.data[0]) {
        const item = res.data[0];
        const data: LocationCoordinates = {
          name: item.name || item.display_name.split(',')[0],
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
        setCache(cacheKey, data);
        return data;
      }
    } catch (err: any) {
      console.error('OSM Place Lookup error:', err?.message);
    }
  }

  return null;
};

// ---------------------------------------------------------------------------
// 3. Forward Geocoding — Address/Text → Coordinates
// ---------------------------------------------------------------------------
export const getCoordsFromAddress = async (query: any): Promise<LocationCoordinates> => {
  if (typeof query === 'object' && query && query.lat != null && query.lng != null) {
    return {
      address: query.address || 'Pinned Location',
      name: query.name || query.address || 'Pinned Location',
      lat: parseFloat(query.lat),
      lng: parseFloat(query.lng),
    };
  }

  const queryStr = String(query).trim();
  const cacheKey = `geocode:${queryStr}`;
  const cached = getCached<LocationCoordinates>(cacheKey);
  if (cached) return cached;

  // Try Google Places (New) autocomplete + details
  if (API_KEY) {
    try {
      const suggestions = await getPlaceAutocomplete(queryStr);
      if (suggestions.length > 0) {
        const details = await getPlaceDetails(suggestions[0].placeId);
        if (details) {
          setCache(cacheKey, details);
          return details;
        }
      }
    } catch (_) {}
  }

  // Fallback: Nominatim Forward Geocoding
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: queryStr, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'DriveMate/1.0 (contact@drivemate.app)' },
      timeout: 4000,
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      const item = res.data[0];
      const data: LocationCoordinates = {
        name: item.display_name.split(',')[0],
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
      setCache(cacheKey, data);
      return data;
    }
  } catch (err: any) {
    console.error('Nominatim Geocoding fallback error:', err?.message);
  }

  // Default coordinate if resolution is impossible (Hyderabad center)
  return { address: queryStr, name: queryStr, lat: 17.385, lng: 78.4867 };
};

// ---------------------------------------------------------------------------
// 4. Reverse Geocoding — Coordinates → Formatted Address
// ---------------------------------------------------------------------------
export const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
  const cacheKey = `reverse:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  // Primary: Google Geocoding API
  if (API_KEY) {
    try {
      const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { latlng: `${lat},${lng}`, key: API_KEY },
        timeout: 4000,
      });

      if (res.data?.status === 'OK' && res.data.results?.length) {
        const address = res.data.results[0].formatted_address;
        setCache(cacheKey, address);
        return address;
      }
    } catch (err: any) {
      // Ignored if billing not enabled or quota exceeded
    }
  }

  // Fallback: OpenStreetMap Nominatim Reverse Geocoding
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'json', lat, lon: lng },
      headers: { 'User-Agent': 'DriveMate/1.0 (contact@drivemate.app)' },
      timeout: 4000,
    });

    if (res.data?.display_name) {
      const address = res.data.display_name;
      setCache(cacheKey, address);
      return address;
    }
  } catch (err: any) {
    console.error('Reverse Geocoding fallback failed:', err?.message);
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

// ---------------------------------------------------------------------------
// 5. Route Details — Real Driving Road Network Route via Routes API (New) / OSRM
// ---------------------------------------------------------------------------
export const getRouteDetails = async (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RouteDetails> => {
  const cacheKey = `route:${start.lat.toFixed(4)},${start.lng.toFixed(4)}:${end.lat.toFixed(4)},${end.lng.toFixed(4)}`;
  const cached = getCached<RouteDetails>(cacheKey);
  if (cached) return cached;

  // Primary: Google Routes API (New)
  if (API_KEY) {
    try {
      const res = await axios.post(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          origin: { location: { latLng: { latitude: start.lat, longitude: start.lng } } },
          destination: { location: { latLng: { latitude: end.lat, longitude: end.lng } } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
          },
          timeout: 5000,
        }
      );

      const route = res.data?.routes?.[0];
      if (route && route.polyline?.encodedPolyline) {
        const distanceMeters = route.distanceMeters || 0;
        // duration is returned in format "3600s"
        const durationSec = route.duration ? parseInt(route.duration.replace('s', ''), 10) : 0;
        const polyline = route.polyline.encodedPolyline;
        const coordinates = decodePolyline(polyline);

        const data: RouteDetails = {
          distance: distanceMeters / 1000, // in km
          duration: Math.max(1, Math.round(durationSec / 60)), // in minutes
          polyline,
          coordinates,
        };

        setCache(cacheKey, data);
        return data;
      }
    } catch (err: any) {
      console.warn('Google Routes API (New) error (falling back to OSRM road routing):', err?.response?.data?.error?.message || err?.message);
    }
  }

  // Fallback: OSRM Driving Engine (Real road network polyline, distance and duration)
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline`;
    const res = await axios.get(osrmUrl, { timeout: 6000 });

    if (res.data?.code === 'Ok' && res.data.routes?.length) {
      const route = res.data.routes[0];
      const distance = route.distance / 1000; // in km
      const duration = Math.max(1, Math.round(route.duration / 60)); // in minutes
      const polyline = route.geometry;
      const coordinates = decodePolyline(polyline);

      const data: RouteDetails = {
        distance,
        duration,
        polyline,
        coordinates,
      };

      setCache(cacheKey, data);
      return data;
    }
  } catch (err: any) {
    console.warn('OSRM road routing fallback error:', err?.message);
  }

  // Final fallback: Haversine distance with estimated road detour factor 1.25x
  const directDist = getDistanceFromLatLonInKm(start.lat, start.lng, end.lat, end.lng);
  const roadDist = directDist * 1.25;
  const coordinates: RouteCoordinate[] = [
    { latitude: start.lat, longitude: start.lng },
    { latitude: end.lat, longitude: end.lng },
  ];

  return {
    distance: roadDist,
    duration: Math.max(1, Math.round((roadDist / 25) * 60)),
    polyline: '',
    coordinates,
  };
};
