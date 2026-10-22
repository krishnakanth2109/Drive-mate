import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

// ---------------------------------------------------------------------------
// In-Memory Cache — avoids redundant API calls, reduces latency significantly
// ---------------------------------------------------------------------------
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCached = (key) => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.value;
  cache.delete(key);
  return null;
};

const setCache = (key, value) => cache.set(key, { value, ts: Date.now() });

// ---------------------------------------------------------------------------
// Haversine Fallback — used when Google API fails or no key is provided
// ---------------------------------------------------------------------------
const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ---------------------------------------------------------------------------
// 1. Forward Geocoding — Address/Text → Coordinates
// ---------------------------------------------------------------------------
export const getCoordsFromAddress = async (query) => {
  // If query is already a coordinate object {lat, lng}, return it directly
  if (typeof query === 'object' && query.lat && query.lng) {
    return {
      address: query.address || 'Pinned Location',
      lat: parseFloat(query.lat),
      lng: parseFloat(query.lng),
    };
  }

  const cacheKey = `geocode:${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    if (!API_KEY) throw new Error('No Google Maps API Key configured');

    const res = await axios.get(GEOCODE_URL, {
      params: { address: query, key: API_KEY },
      timeout: 5000,
    });

    if (res.data.status !== 'OK' || !res.data.results.length) {
      throw new Error(`Geocoding failed: ${res.data.status}`);
    }

    const result = res.data.results[0];
    const { lat, lng } = result.geometry.location;
    const data = { lat, lng, address: result.formatted_address };

    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error('Geocoding API failed (using fallback):', err.message);
    // Fallback: default to Bengaluru coordinates
    return { address: String(query), lat: 12.9716, lng: 77.5946 };
  }
};

// ---------------------------------------------------------------------------
// 2. Reverse Geocoding — Coordinates → Address
// ---------------------------------------------------------------------------
export const getAddressFromCoords = async (lat, lng) => {
  const cacheKey = `reverse:${lat},${lng}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    if (!API_KEY) throw new Error('No Google Maps API Key configured');

    const res = await axios.get(GEOCODE_URL, {
      params: { latlng: `${lat},${lng}`, key: API_KEY },
      timeout: 5000,
    });

    if (res.data.status !== 'OK' || !res.data.results.length) {
      throw new Error(`Reverse geocoding failed: ${res.data.status}`);
    }

    const address = res.data.results[0].formatted_address;
    setCache(cacheKey, address);
    return address;
  } catch (err) {
    console.error('Reverse Geocoding failed:', err.message);
    return 'Unknown Location';
  }
};

// ---------------------------------------------------------------------------
// 3. Route Details — Distance & Duration via Google Directions API
// ---------------------------------------------------------------------------
export const getRouteDetails = async (start, end) => {
  const cacheKey = `directions:${start.lat},${start.lng}:${end.lat},${end.lng}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    if (!API_KEY) throw new Error('No Google Maps API Key configured');

    const res = await axios.get(DIRECTIONS_URL, {
      params: {
        origin: `${start.lat},${start.lng}`,
        destination: `${end.lat},${end.lng}`,
        mode: 'driving',
        key: API_KEY,
      },
      timeout: 5000,
    });

    if (res.data.status !== 'OK' || !res.data.routes.length) {
      throw new Error(`Directions API failed: ${res.data.status}`);
    }

    const leg = res.data.routes[0].legs[0];
    const data = {
      distance: leg.distance.value / 1000,                        // meters → km
      duration: leg.duration.value / 60,                           // seconds → minutes
      polyline: res.data.routes[0].overview_polyline.points,       // Google encoded polyline
    };

    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error('Directions API failed (using Haversine fallback):', err.message);
    const dist = getDistanceFromLatLonInKm(start.lat, start.lng, end.lat, end.lng);
    return {
      distance: dist,
      duration: (dist / 30) * 60, // Assume 30 km/h average speed
      polyline: '',
    };
  }
};