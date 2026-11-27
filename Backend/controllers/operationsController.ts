import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Get all city zones with live demand, active drivers, and surge status
 * Accessible by: Operations Manager, Super Admin
 */
export const getCityZones = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const zones = await prisma.cityZone.findMany({
    orderBy: { activeDrivers: 'desc' },
    include: {
      surgeRules: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  const formatted = zones.map((z) => ({
    ...z,
    _id: z.id,
    currentSurgeRule: z.surgeRules[0] || null,
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'City zones fetched successfully'));
});

/**
 * Update surge pricing and demand status for a city zone
 */
export const updateZoneSurge = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const { surgeMultiplier, demandLevel, reason, status } = req.body;

  const zone = await prisma.cityZone.findUnique({ where: { id } });
  if (!zone) {
    throw new ApiError(404, 'City zone not found');
  }

  const managerId: string = req.user?.id ? String(req.user.id) : 'operations_manager';
  const multiplierVal = surgeMultiplier ? Number(surgeMultiplier) : Number(zone.surgeMultiplier);

  // Deactivate old active rules for this zone
  await prisma.surgeRule.updateMany({
    where: { zoneId: id, isActive: true },
    data: { isActive: false, endTime: new Date() },
  });

  // Create new active surge rule if multiplier > 1.0
  if (multiplierVal > 1.0) {
    await prisma.surgeRule.create({
      data: {
        id: crypto.randomBytes(12).toString('hex'),
        zoneId: id,
        managerId,
        multiplier: multiplierVal,
        reason: reason ? String(reason) : 'Peak demand operational adjustment',
        isActive: true,
        startTime: new Date(),
      },
    });
  }

  const updatedZone = await prisma.cityZone.update({
    where: { id },
    data: {
      surgeMultiplier: multiplierVal,
      demandLevel: demandLevel ? String(demandLevel) : zone.demandLevel,
      status: status ? String(status) : (multiplierVal > 1.0 ? 'surge_active' : 'normal'),
    },
  });

  // Broadcast surge update via socket.io if attached
  if (req.io) {
    req.io.emit('surge:update', {
      zoneId: id,
      zoneName: zone.name,
      surgeMultiplier: multiplierVal,
      demandLevel: updatedZone.demandLevel,
    });
  }

  res.status(200).json(new ApiResponse(200, updatedZone, `Surge for ${zone.name} updated to ${multiplierVal}x`));
});

/**
 * Get all driver incentive broadcasts
 */
export const getIncentiveBroadcasts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const broadcasts = await prisma.driverIncentiveBroadcast.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      manager: { select: { id: true, name: true } },
    },
  });

  const formatted = broadcasts.map((b) => ({
    ...b,
    _id: b.id,
    managerName: b.manager?.name || 'Operations Team',
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'Incentive broadcasts fetched successfully'));
});

/**
 * Create a new driver incentive broadcast
 */
export const createIncentiveBroadcast = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { title, bonusAmount, targetZone, message, durationHours = 4 } = req.body;

  if (!title || !bonusAmount || !message) {
    throw new ApiError(400, 'Title, bonus amount, and broadcast message are required');
  }

  const managerId: string = req.user?.id ? String(req.user.id) : 'operations_manager';
  const id = crypto.randomBytes(12).toString('hex');
  const expiresAt = new Date(Date.now() + Number(durationHours) * 60 * 60 * 1000);

  const broadcast = await prisma.driverIncentiveBroadcast.create({
    data: {
      id,
      managerId,
      title: String(title),
      bonusAmount: Number(bonusAmount),
      targetZone: targetZone ? String(targetZone) : 'All City Zones',
      message: String(message),
      status: 'active',
      expiresAt,
    },
    include: {
      manager: { select: { id: true, name: true } },
    },
  });

  // Broadcast to all active drivers via socket.io
  if (req.io) {
    req.io.emit('driver:incentive_alert', {
      id: broadcast.id,
      title: broadcast.title,
      bonusAmount: broadcast.bonusAmount,
      targetZone: broadcast.targetZone,
      message: broadcast.message,
    });
  }

  res.status(201).json(new ApiResponse(201, broadcast, 'Incentive broadcast successfully published'));
});

/**
 * Get operations dispatch metrics and supply-demand ratio
 */
export const getOperationsMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const [activeRides, activeDrivers, totalZones, activeSurgeZones, completedCount, cancelledCount, durationAgg] = await Promise.all([
    prisma.ride.count({ where: { status: { in: ['pending', 'accepted', 'arrived', 'in_progress', 'ongoing', 'drop_arrived'] } } }),
    prisma.rider.count({ where: { isAvailable: true } }),
    prisma.cityZone.count(),
    prisma.cityZone.count({ where: { surgeMultiplier: { gt: 1.0 } } }),
    prisma.ride.count({ where: { status: 'completed' } }),
    prisma.ride.count({ where: { status: 'cancelled' } }),
    prisma.ride.aggregate({
      where: { status: { in: ['completed', 'ongoing', 'in_progress'] }, duration: { gt: 0 } },
      _avg: { duration: true },
    }),
  ]);

  const terminalRides = completedCount + cancelledCount;
  const fulfillmentRate = terminalRides > 0
    ? `${((completedCount / terminalRides) * 100).toFixed(1)}%`
    : '0.0%';
  const avgEtaMinutes = durationAgg._avg.duration
    ? Number(Number(durationAgg._avg.duration).toFixed(1))
    : 0;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        liveRidesCount: activeRides,
        activeSupplyDrivers: activeDrivers,
        activeCityZones: totalZones,
        avgEtaMinutes,
        fulfillmentRate,
        activeSurgeZones,
      },
      'Operations metrics fetched successfully'
    )
  );
});
