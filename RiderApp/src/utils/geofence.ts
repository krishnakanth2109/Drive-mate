export const GEOFENCE_RADIUS_METERS = 50;
export const MAX_GPS_ACCURACY_METERS = 80;
export const MAX_LOCATION_AGE_MS = 60 * 1000;
const EARTH_RADIUS_METERS = 6371000;

export type GpsPermissionState = 'granted' | 'denied' | 'undetermined';

export interface DriverGpsSnapshot {
  latitude: number | null;
  longitude: number | null;
  heading?: number | null;
  accuracy: number | null;
  timestamp: number | null;
  isMocked: boolean;
  permissionStatus: GpsPermissionState;
  servicesEnabled: boolean;
  error?: string | null;
}

export interface TargetCoord {
  lat?: number | null;
  lng?: number | null;
}

export interface GeofenceClientEvaluation {
  distanceMeters: number | null;
  roundedMeters: number | null;
  distanceLabel: string;
  accuracyMeters: number | null;
  locationAgeSeconds: number | null;
  isWithinRadius: boolean;
  isGpsUnavailable: boolean;
  isPermissionDenied: boolean;
  isServicesDisabled: boolean;
  isPoorAccuracy: boolean;
  isStaleLocation: boolean;
  isMockedLocation: boolean;
  canDeclareArrival: boolean;
  statusMessage: string;
}

/**
 * Great-circle distance in meters using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

/**
 * Formats remaining distance cleanly (e.g., "45 m away", "120 m away", "1.4 km away").
 */
export function formatDistanceMeters(meters: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return 'GPS unavailable';
  const rounded = Math.max(0, Math.round(meters));
  if (rounded < 1000) return `${rounded} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

/**
 * Evaluates live driver GPS quality and 50m destination geofence state.
 */
export function evaluateDriverGeofence(
  gps: DriverGpsSnapshot | null,
  target: TargetCoord | null | undefined,
  mode: 'pickup' | 'drop',
  nowMs: number = Date.now()
): GeofenceClientEvaluation {
  const targetLabel = mode === 'pickup' ? 'pickup point' : 'drop location';

  if (!gps) {
    return {
      distanceMeters: null,
      roundedMeters: null,
      distanceLabel: 'Waiting for GPS...',
      accuracyMeters: null,
      locationAgeSeconds: null,
      isWithinRadius: false,
      isGpsUnavailable: true,
      isPermissionDenied: false,
      isServicesDisabled: false,
      isPoorAccuracy: false,
      isStaleLocation: false,
      isMockedLocation: false,
      canDeclareArrival: false,
      statusMessage: 'Acquiring live GPS fix...',
    };
  }

  if (gps.permissionStatus === 'denied') {
    return {
      distanceMeters: null,
      roundedMeters: null,
      distanceLabel: 'Permission denied',
      accuracyMeters: gps.accuracy,
      locationAgeSeconds: null,
      isWithinRadius: false,
      isGpsUnavailable: true,
      isPermissionDenied: true,
      isServicesDisabled: false,
      isPoorAccuracy: false,
      isStaleLocation: false,
      isMockedLocation: false,
      canDeclareArrival: false,
      statusMessage: 'Location permission denied. Enable GPS permission to mark arrival.',
    };
  }

  if (!gps.servicesEnabled) {
    return {
      distanceMeters: null,
      roundedMeters: null,
      distanceLabel: 'GPS turned off',
      accuracyMeters: gps.accuracy,
      locationAgeSeconds: null,
      isWithinRadius: false,
      isGpsUnavailable: true,
      isPermissionDenied: false,
      isServicesDisabled: true,
      isPoorAccuracy: false,
      isStaleLocation: false,
      isMockedLocation: false,
      canDeclareArrival: false,
      statusMessage: 'Device location services are disabled. Turn on GPS.',
    };
  }

  if (
    gps.error ||
    gps.latitude == null ||
    gps.longitude == null ||
    !Number.isFinite(gps.latitude) ||
    !Number.isFinite(gps.longitude) ||
    (Math.abs(gps.latitude) < 0.0001 && Math.abs(gps.longitude) < 0.0001)
  ) {
    return {
      distanceMeters: null,
      roundedMeters: null,
      distanceLabel: 'GPS unavailable',
      accuracyMeters: gps.accuracy,
      locationAgeSeconds: null,
      isWithinRadius: false,
      isGpsUnavailable: true,
      isPermissionDenied: false,
      isServicesDisabled: false,
      isPoorAccuracy: false,
      isStaleLocation: false,
      isMockedLocation: false,
      canDeclareArrival: false,
      statusMessage: gps.error || 'Live GPS coordinates unavailable. Tap Refresh GPS.',
    };
  }

  if (target?.lat == null || target?.lng == null || !Number.isFinite(Number(target.lat)) || !Number.isFinite(Number(target.lng))) {
    return {
      distanceMeters: null,
      roundedMeters: null,
      distanceLabel: 'Destination coordinates missing',
      accuracyMeters: gps.accuracy,
      locationAgeSeconds: null,
      isWithinRadius: false,
      isGpsUnavailable: false,
      isPermissionDenied: false,
      isServicesDisabled: false,
      isPoorAccuracy: false,
      isStaleLocation: false,
      isMockedLocation: false,
      canDeclareArrival: false,
      statusMessage: `Target ${targetLabel} coordinates missing for this ride.`,
    };
  }

  const distanceMeters = calculateDistanceMeters(
    gps.latitude,
    gps.longitude,
    Number(target.lat),
    Number(target.lng)
  );
  const roundedMeters = Math.round(distanceMeters);
  const distanceLabel = formatDistanceMeters(distanceMeters);

  const locationAgeSeconds =
    gps.timestamp != null && Number.isFinite(gps.timestamp)
      ? Math.max(0, Math.round((nowMs - gps.timestamp) / 1000))
      : null;

  const isStaleLocation = gps.timestamp != null && nowMs - gps.timestamp > MAX_LOCATION_AGE_MS;
  const isPoorAccuracy = gps.accuracy != null && gps.accuracy > MAX_GPS_ACCURACY_METERS;
  const isMockedLocation = Boolean(gps.isMocked);
  const isWithinRadius = distanceMeters <= GEOFENCE_RADIUS_METERS;

  if (isMockedLocation) {
    return {
      distanceMeters,
      roundedMeters,
      distanceLabel,
      accuracyMeters: gps.accuracy,
      locationAgeSeconds,
      isWithinRadius: false,
      isGpsUnavailable: false,
      isPermissionDenied: false,
      isServicesDisabled: false,
      isPoorAccuracy,
      isStaleLocation,
      isMockedLocation: true,
      canDeclareArrival: false,
      statusMessage: 'Mocked GPS detected. Disable mock location apps to declare arrival.',
    };
  }

  if (isStaleLocation) {
    return {
      distanceMeters,
      roundedMeters,
      distanceLabel,
      accuracyMeters: gps.accuracy,
      locationAgeSeconds,
      isWithinRadius: false,
      isGpsUnavailable: false,
      isPermissionDenied: false,
      isServicesDisabled: false,
      isPoorAccuracy,
      isStaleLocation: true,
      isMockedLocation: false,
      canDeclareArrival: false,
      statusMessage: `Location signal is stale (${locationAgeSeconds}s old). Refreshing live GPS...`,
    };
  }

  if (isPoorAccuracy) {
    return {
      distanceMeters,
      roundedMeters,
      distanceLabel,
      accuracyMeters: gps.accuracy,
      locationAgeSeconds,
      isWithinRadius: false,
      isGpsUnavailable: false,
      isPermissionDenied: false,
      isServicesDisabled: false,
      isPoorAccuracy: true,
      isStaleLocation: false,
      isMockedLocation: false,
      canDeclareArrival: false,
      statusMessage: `Weak GPS signal (±${Math.round(gps.accuracy!)} m). Move to an open area (≤ ${MAX_GPS_ACCURACY_METERS} m needed).`,
    };
  }

  if (!isWithinRadius) {
    const excessMeters = Math.max(1, roundedMeters - GEOFENCE_RADIUS_METERS);
    return {
      distanceMeters,
      roundedMeters,
      distanceLabel,
      accuracyMeters: gps.accuracy,
      locationAgeSeconds,
      isWithinRadius: false,
      isGpsUnavailable: false,
      isPermissionDenied: false,
      isServicesDisabled: false,
      isPoorAccuracy: false,
      isStaleLocation: false,
      isMockedLocation: false,
      canDeclareArrival: false,
      statusMessage: `Outside ${GEOFENCE_RADIUS_METERS}m zone • Move ${excessMeters} m closer to ${targetLabel}`,
    };
  }

  return {
    distanceMeters,
    roundedMeters,
    distanceLabel,
    accuracyMeters: gps.accuracy,
    locationAgeSeconds,
    isWithinRadius: true,
    isGpsUnavailable: false,
    isPermissionDenied: false,
    isServicesDisabled: false,
    isPoorAccuracy: false,
    isStaleLocation: false,
    isMockedLocation: false,
    canDeclareArrival: true,
    statusMessage: `Within ${GEOFENCE_RADIUS_METERS}m ${mode === 'pickup' ? 'pickup' : 'drop'} radius • Arrival unlocked`,
  };
}
