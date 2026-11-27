import { prisma } from '../config/prisma.js';
import { redisService } from './redisService.js';
import { getDistanceFromLatLonInKm } from './locationService.js';

export type DemandLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';
export type TrafficLevel = 'Smooth' | 'Moderate' | 'Heavy' | 'Severe';

export interface SurgeHotZone {
  id: string;
  name: string;
  city: string;
  demandLevel: string;
  surgeMultiplier: number;
  activeDrivers: number;
  pendingRiders: number;
  status: string;
  reason?: string | null;
}

export interface SurgeBreakdown {
  baseMultiplier: number;
  demandSurcharge: number;
  trafficSurcharge: number;
  peakSurcharge: number;
  zoneOverrideMultiplier: number | null;
  matchedZoneName: string | null;
}

export interface SurgeResult {
  multiplier: number;
  isSurgeActive: boolean;
  demandLevel: DemandLevel;
  trafficLevel: TrafficLevel;
  trafficDelayMinutes: number;
  trafficSpeedKmh: number;
  trafficRatio: number;
  activeRequestsNearby: number;
  activeRequestsCity: number;
  recentDemandCount: number;
  availableDriversNearby: number;
  availableDriversCity: number;
  demandSupplyRatio: number;
  peakWindowActive: boolean;
  peakLabel: string | null;
  reason: string;
  breakdown: SurgeBreakdown;
  hotZones: SurgeHotZone[];
  updatedAt: string;
}

export interface SurgeCalculationInput {
  lat?: number | null;
  lng?: number | null;
  pickupAddress?: string | null;
  distanceKm?: number | null;
  durationMin?: number | null;
  staticDurationMin?: number | null;
  trafficDelayMinutes?: number | null;
  trafficRatio?: number | null;
}

const DISPATCH_SURGE_RADIUS_KM = 6;
const MAX_SURGE_MULTIPLIER = 2.5;
const MIN_SURGE_MULTIPLIER = 1.0;

/**
 * Returns IST hour + minute and whether current time falls into high-traffic commute or late-night windows.
 */
function getCommuteWindowStatus(): { peakWindowActive: boolean; peakLabel: string | null; surcharge: number } {
  const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const totalMinutes = istNow.getHours() * 60 + istNow.getMinutes();

  // Morning office rush: 08:30 – 11:00 IST
  if (totalMinutes >= 510 && totalMinutes <= 660) {
    return { peakWindowActive: true, peakLabel: 'Morning Rush Hour', surcharge: 0.1 };
  }
  // Evening peak traffic: 17:30 – 21:30 IST
  if (totalMinutes >= 1050 && totalMinutes <= 1290) {
    return { peakWindowActive: true, peakLabel: 'Evening Peak Traffic', surcharge: 0.15 };
  }
  // Late night limited driver supply: 23:30 – 05:00 IST
  if (totalMinutes >= 1410 || totalMinutes < 300) {
    return { peakWindowActive: true, peakLabel: 'Late-Night Demand Window', surcharge: 0.2 };
  }

  return { peakWindowActive: false, peakLabel: null, surcharge: 0 };
}

/**
 * Calculates dynamic surge pricing based on:
 * 1. Live user ride demand vs available drivers nearby & city-wide (PostgreSQL + Redis).
 * 2. Real road congestion / traffic delay (Google Routes TRAFFIC_AWARE delay ratio & implied speed).
 * 3. Peak commute window + active Operations Manager CityZone rules.
 */
export async function calculateDynamicSurge(input: SurgeCalculationInput = {}): Promise<SurgeResult> {
  const { lat, lng, pickupAddress, distanceKm, durationMin, trafficDelayMinutes, trafficRatio } = input;
  const hasCoords = lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const pickupLat = hasCoords ? Number(lat) : null;
  const pickupLng = hasCoords ? Number(lng) : null;

  const recentWindowStart = new Date(Date.now() - 20 * 60 * 1000);
  const liveActiveWindowStart = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const [activeRides, recentRidesCount, dbOnlineDrivers, redisDrivers, cityZones] = await Promise.all([
    prisma.ride
      .findMany({
        where: {
          OR: [
            {
              status: 'pending',
              createdAt: { gte: recentWindowStart },
            },
            {
              status: { in: ['accepted', 'arrived', 'ongoing', 'drop_arrived'] },
              updatedAt: { gte: liveActiveWindowStart },
            },
            {
              createdAt: { gte: recentWindowStart },
            },
          ],
        },
        select: {
          id: true,
          status: true,
          pickupLat: true,
          pickupLng: true,
          createdAt: true,
        },
      })
      .catch(() => []),
    prisma.ride
      .count({
        where: { createdAt: { gte: recentWindowStart } },
      })
      .catch(() => 0),
    prisma.rider
      .findMany({
        where: { isAvailable: true },
        select: { id: true, currentLat: true, currentLng: true, vehicleType: true },
      })
      .catch(() => []),
    redisService.getAllActiveDriverLocations().catch(() => []),
    prisma.cityZone
      .findMany({
        include: {
          surgeRules: {
            where: { isActive: true },
            take: 1,
          },
        },
        orderBy: { surgeMultiplier: 'desc' },
      })
      .catch(() => []),
  ]);

  // Merge DB online drivers + live Redis driver locations by unique riderId
  const onlineDriverMap = new Map<string, { lat: number | null; lng: number | null }>();
  for (const d of dbOnlineDrivers as any[]) {
    onlineDriverMap.set(d.id, {
      lat: d.currentLat != null ? Number(d.currentLat) : null,
      lng: d.currentLng != null ? Number(d.currentLng) : null,
    });
  }
  for (const rd of redisDrivers) {
    if (rd.riderId) {
      onlineDriverMap.set(rd.riderId, { lat: rd.lat, lng: rd.lng });
    }
  }

  const availableDriversCity = onlineDriverMap.size;
  let availableDriversNearby = availableDriversCity;

  if (pickupLat != null && pickupLng != null) {
    let nearbyCount = 0;
    for (const d of onlineDriverMap.values()) {
      if (d.lat != null && d.lng != null) {
        const dist = getDistanceFromLatLonInKm(pickupLat, pickupLng, d.lat, d.lng);
        if (dist <= DISPATCH_SURGE_RADIUS_KM) {
          nearbyCount++;
        }
      }
    }
    availableDriversNearby = nearbyCount;
  }

  // Active rides weighted: pending requests weigh full (1.0), active in-progress trips weigh (0.6), recent wave (0.4)
  let activeRequestsCity = 0;
  let activeRequestsNearby = 0;

  for (const r of activeRides as any[]) {
    const weight =
      r.status === 'pending'
        ? 1.0
        : ['accepted', 'arrived', 'ongoing', 'drop_arrived'].includes(r.status)
        ? 0.65
        : 0.35;

    activeRequestsCity += weight;

    if (pickupLat != null && pickupLng != null && r.pickupLat != null && r.pickupLng != null) {
      const dist = getDistanceFromLatLonInKm(pickupLat, pickupLng, Number(r.pickupLat), Number(r.pickupLng));
      if (dist <= DISPATCH_SURGE_RADIUS_KM) {
        activeRequestsNearby += weight;
      }
    } else if (pickupLat == null) {
      activeRequestsNearby += weight;
    }
  }

  const roundedNearbyRequests = Math.round(activeRequestsNearby);
  const roundedCityRequests = Math.round(activeRequestsCity);

  // Combine local user traffic + city-wide demand pressure
  const effectiveDemand = activeRequestsNearby + activeRequestsCity * 0.2;
  const supplyDenominator = Math.max(1, availableDriversNearby);
  const demandSupplyRatio = Number((effectiveDemand / supplyDenominator).toFixed(2));

  // 1) Demand / User-Traffic Surcharge (only triggers when genuine recent/active user demand exists)
  let demandSurcharge = 0;
  if (activeRequestsNearby > 0 || recentRidesCount > 0) {
    if (activeRequestsNearby >= 2.5 && availableDriversNearby === 0) {
      demandSurcharge = 0.7;
    } else if (demandSupplyRatio >= 2.5) {
      demandSurcharge = 0.6;
    } else if (demandSupplyRatio >= 1.5) {
      demandSurcharge = 0.4;
    } else if (demandSupplyRatio >= 0.85) {
      demandSurcharge = 0.2;
    } else if (activeRequestsCity >= 4 && availableDriversCity <= 2) {
      demandSurcharge = 0.3;
    } else if (recentRidesCount >= 5 && availableDriversNearby <= 1) {
      demandSurcharge = 0.2;
    }
  }

  // 2) Road Traffic Surcharge (Route duration vs static duration & implied km/h speed)
  const effectiveDelayMin = Math.max(0, Number(trafficDelayMinutes || 0));
  const effectiveTrafficRatio = Math.max(1.0, Number(trafficRatio || 1.0));
  const trafficSpeedKmh =
    distanceKm && durationMin && durationMin > 0
      ? Number(((Number(distanceKm) / Number(durationMin)) * 60).toFixed(1))
      : 26;

  let trafficSurcharge = 0;
  let trafficLevel: TrafficLevel = 'Smooth';

  if (effectiveTrafficRatio >= 1.55 || effectiveDelayMin >= 12 || (distanceKm && distanceKm >= 1.5 && trafficSpeedKmh < 11)) {
    trafficSurcharge = 0.4;
    trafficLevel = 'Severe';
  } else if (effectiveTrafficRatio >= 1.3 || effectiveDelayMin >= 7 || (distanceKm && distanceKm >= 1.5 && trafficSpeedKmh < 16)) {
    trafficSurcharge = 0.25;
    trafficLevel = 'Heavy';
  } else if (effectiveTrafficRatio >= 1.15 || effectiveDelayMin >= 3 || (distanceKm && distanceKm >= 1.5 && trafficSpeedKmh < 21)) {
    trafficSurcharge = 0.1;
    trafficLevel = 'Moderate';
  }

  // 3) Peak Hour Window + City Zone Operational Surge Overrides
  const commuteWindow = getCommuteWindowStatus();
  // Apply peak window multiplier only when there is actual demand or congestion so quiet empty streets stay reasonable
  const peakSurcharge =
    commuteWindow.peakWindowActive && (demandSurcharge > 0 || trafficSurcharge > 0 || roundedCityRequests >= 1)
      ? commuteWindow.surcharge
      : 0;

  let matchedZone: any = null;
  if (pickupAddress && cityZones.length > 0) {
    const normalizedAddr = pickupAddress.toLowerCase();
    matchedZone = (cityZones as any[]).find((z) => {
      const zoneTokens = String(z.name || '')
        .toLowerCase()
        .split(/[&\s]+/)
        .filter((t) => t.length >= 3);
      return zoneTokens.some((tok) => normalizedAddr.includes(tok));
    });
  }

  const matchedZoneMultiplier =
    matchedZone && Number(matchedZone.surgeMultiplier) > 1.0 ? Number(matchedZone.surgeMultiplier) : null;

  const rawDynamicMultiplier = 1.0 + demandSurcharge + trafficSurcharge + peakSurcharge;
  const blendedMultiplier = matchedZoneMultiplier
    ? Math.max(rawDynamicMultiplier, matchedZoneMultiplier)
    : rawDynamicMultiplier;

  const multiplier = Math.min(
    MAX_SURGE_MULTIPLIER,
    Math.max(MIN_SURGE_MULTIPLIER, Math.round(blendedMultiplier * 10) / 10)
  );
  const isSurgeActive = multiplier > 1.04;

  let demandLevel: DemandLevel = 'Low';
  if (multiplier >= 1.6 || demandSupplyRatio >= 2.2) demandLevel = 'Extreme';
  else if (multiplier >= 1.3 || demandSupplyRatio >= 1.2) demandLevel = 'High';
  else if (isSurgeActive || demandSupplyRatio >= 0.5 || commuteWindow.peakWindowActive) demandLevel = 'Moderate';

  // Human-readable explanation for Customer & Driver apps
  const reasonParts: string[] = [];
  if (demandSurcharge >= 0.4) reasonParts.push('High rider demand nearby');
  else if (demandSurcharge > 0) reasonParts.push('Rising user requests in this area');
  if (trafficLevel === 'Severe' || trafficLevel === 'Heavy') reasonParts.push(`${trafficLevel.toLowerCase()} road traffic`);
  else if (trafficLevel === 'Moderate') reasonParts.push('Moderate road traffic');
  if (matchedZone && matchedZoneMultiplier && matchedZoneMultiplier >= rawDynamicMultiplier) {
    reasonParts.push(`${matchedZone.name} peak zone rule`);
  }
  if (peakSurcharge > 0 && commuteWindow.peakLabel) {
    reasonParts.push(commuteWindow.peakLabel);
  }

  const reason = isSurgeActive
    ? reasonParts.length > 0
      ? `${multiplier.toFixed(1)}x Surge • ${reasonParts.slice(0, 2).join(' & ')}`
      : `${multiplier.toFixed(1)}x Dynamic Surge due to high traffic`
    : availableDriversNearby > 0
    ? `Normal fares • ${availableDriversNearby} driver${availableDriversNearby === 1 ? '' : 's'} nearby`
    : 'Normal fares • Standard traffic conditions';

  const hotZones: SurgeHotZone[] = (cityZones as any[]).slice(0, 6).map((z) => ({
    id: z.id,
    name: z.name,
    city: z.city || 'Bangalore',
    demandLevel: z.demandLevel || 'Moderate',
    surgeMultiplier: Number(z.surgeMultiplier || 1.0),
    activeDrivers: Number(z.activeDrivers || 0),
    pendingRiders: Number(z.pendingRiders || 0),
    status: Number(z.surgeMultiplier || 1.0) > 1.0 ? 'surge_active' : z.status || 'normal',
    reason: z.surgeRules?.[0]?.reason || null,
  }));

  return {
    multiplier,
    isSurgeActive,
    demandLevel,
    trafficLevel,
    trafficDelayMinutes: effectiveDelayMin,
    trafficSpeedKmh,
    trafficRatio: effectiveTrafficRatio,
    activeRequestsNearby: roundedNearbyRequests,
    activeRequestsCity: roundedCityRequests,
    recentDemandCount: recentRidesCount,
    availableDriversNearby,
    availableDriversCity,
    demandSupplyRatio,
    peakWindowActive: commuteWindow.peakWindowActive,
    peakLabel: commuteWindow.peakLabel,
    reason,
    breakdown: {
      baseMultiplier: 1.0,
      demandSurcharge: Number(demandSurcharge.toFixed(2)),
      trafficSurcharge: Number(trafficSurcharge.toFixed(2)),
      peakSurcharge: Number(peakSurcharge.toFixed(2)),
      zoneOverrideMultiplier: matchedZoneMultiplier,
      matchedZoneName: matchedZone?.name || null,
    },
    hotZones,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Emits a real-time Socket.IO `surge:update` broadcast whenever ride demand shifts.
 */
export async function broadcastCitySurgeUpdate(
  io: any,
  input: SurgeCalculationInput = {}
): Promise<void> {
  if (!io) return;
  try {
    const snapshot = await calculateDynamicSurge(input);
    io.emit('surge:update', {
      multiplier: snapshot.multiplier,
      surgeMultiplier: snapshot.multiplier,
      isSurgeActive: snapshot.isSurgeActive,
      demandLevel: snapshot.demandLevel,
      trafficLevel: snapshot.trafficLevel,
      reason: snapshot.reason,
      activeRequestsNearby: snapshot.activeRequestsNearby,
      availableDriversNearby: snapshot.availableDriversNearby,
      updatedAt: snapshot.updatedAt,
    });
  } catch (err) {
    // Non-blocking telemetry broadcast
  }
}
