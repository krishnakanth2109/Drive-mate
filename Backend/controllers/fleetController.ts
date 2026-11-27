import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Get all driver onboarding applicants with verification & training status
 * Accessible by: Fleet Coach, Head of Fleet, Admin
 */
export const getOnboardingApplicants = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, trainingStatus, search } = req.query;

  const whereClause: any = {};
  if (status && status !== 'all') {
    whereClause.overallStatus = String(status);
  }
  if (trainingStatus && trainingStatus !== 'all') {
    whereClause.trainingStatus = String(trainingStatus);
  }

  const onboardings = await prisma.driverOnboarding.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          vehicleType: true,
          vehicle: true,
          rating: true,
          isAvailable: true,
        },
      },
      coach: {
        select: { id: true, name: true, email: true },
      },
      inspections: {
        orderBy: { inspectedAt: 'desc' },
        take: 1,
      },
    },
  });

  const formatted = onboardings.map((ob) => ({
    id: ob.id,
    _id: ob.id,
    driverId: ob.driverId,
    driverName: ob.driver.name,
    driverPhone: ob.driver.phone,
    driverEmail: ob.driver.email,
    vehicleType: ob.driver.vehicleType,
    vehicleDetails: ob.driver.vehicle,
    dlStatus: ob.dlStatus,
    rcStatus: ob.rcStatus,
    aadharStatus: ob.aadharStatus,
    policeVerificationStatus: ob.policeVerificationStatus,
    trainingStatus: ob.trainingStatus,
    trainingScore: ob.trainingScore,
    overallStatus: ob.overallStatus,
    coachName: ob.coach?.name || 'Unassigned',
    coachNotes: ob.coachNotes,
    latestInspection: ob.inspections[0] || null,
    createdAt: ob.createdAt,
    updatedAt: ob.updatedAt,
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'Driver onboarding applicants fetched successfully'));
});

/**
 * Get single onboarding applicant details
 */
export const getApplicantDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);

  const applicant = await prisma.driverOnboarding.findUnique({
    where: { id },
    include: {
      driver: true,
      coach: { select: { id: true, name: true, email: true } },
      inspections: {
        include: {
          inspector: { select: { id: true, name: true } },
        },
        orderBy: { inspectedAt: 'desc' },
      },
    },
  });

  if (!applicant) {
    throw new ApiError(404, 'Onboarding record not found');
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...applicant,
        _id: applicant.id,
      },
      'Applicant details fetched successfully'
    )
  );
});

/**
 * Update driver onboarding checklist, documents, training, and overall decision
 */
export const updateApplicantStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const {
    dlStatus,
    rcStatus,
    aadharStatus,
    policeVerificationStatus,
    trainingStatus,
    trainingScore,
    coachNotes,
    overallStatus,
    coachId,
  } = req.body;

  const applicant = await prisma.driverOnboarding.findUnique({ where: { id } });
  if (!applicant) {
    throw new ApiError(404, 'Onboarding record not found');
  }

  const updateData: any = {};
  if (dlStatus) updateData.dlStatus = String(dlStatus);
  if (rcStatus) updateData.rcStatus = String(rcStatus);
  if (aadharStatus) updateData.aadharStatus = String(aadharStatus);
  if (policeVerificationStatus) updateData.policeVerificationStatus = String(policeVerificationStatus);
  if (trainingStatus) updateData.trainingStatus = String(trainingStatus);
  if (trainingScore !== undefined) updateData.trainingScore = Number(trainingScore);
  if (coachNotes !== undefined) updateData.coachNotes = coachNotes ? String(coachNotes) : null;
  if (coachId) updateData.coachId = String(coachId);

  if (overallStatus) {
    updateData.overallStatus = String(overallStatus);
    if (overallStatus === 'approved') {
      updateData.approvedAt = new Date();
      // Also mark driver as active
      await prisma.rider.update({
        where: { id: applicant.driverId },
        data: { isAvailable: true },
      });
    }
  }

  const updated = await prisma.driverOnboarding.update({
    where: { id },
    data: updateData,
    include: {
      driver: { select: { id: true, name: true, phone: true } },
      coach: { select: { id: true, name: true } },
    },
  });

  res.status(200).json(new ApiResponse(200, { ...updated, _id: updated.id }, 'Onboarding status updated'));
});

/**
 * Submit vehicle safety and fitness inspection
 */
export const submitVehicleInspection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    onboardingId,
    riderId,
    vehiclePlate,
    vehicleModel,
    vehicleType,
    odometerReading,
    brakesCondition = 'Pass',
    tiresCondition = 'Pass',
    lightsCondition = 'Pass',
    insuranceValid = true,
    pollutionValid = true,
    inspectionPass = true,
    notes,
  } = req.body;

  if (!riderId || !vehiclePlate || !vehicleModel || !vehicleType) {
    throw new ApiError(400, 'Rider ID, vehicle plate, model, and vehicle type are required');
  }

  const inspectorId: string = req.user?.id ? String(req.user.id) : 'fleet_coach';
  const inspectionId = crypto.randomBytes(12).toString('hex');

  const inspection = await prisma.vehicleInspection.create({
    data: {
      id: inspectionId,
      onboardingId: onboardingId ? String(onboardingId) : null,
      riderId: String(riderId),
      inspectorId,
      vehiclePlate: String(vehiclePlate),
      vehicleModel: String(vehicleModel),
      vehicleType: String(vehicleType),
      odometerReading: odometerReading ? Number(odometerReading) : null,
      brakesCondition: String(brakesCondition),
      tiresCondition: String(tiresCondition),
      lightsCondition: String(lightsCondition),
      insuranceValid: Boolean(insuranceValid),
      pollutionValid: Boolean(pollutionValid),
      inspectionPass: Boolean(inspectionPass),
      notes: notes ? String(notes) : 'Standard 42-point safety check completed',
    },
    include: {
      inspector: { select: { id: true, name: true } },
      rider: { select: { id: true, name: true, phone: true } },
    },
  });

  res.status(201).json(new ApiResponse(201, { ...inspection, _id: inspection.id }, 'Vehicle inspection submitted'));
});

/**
 * Get all fleet zones and compliance rates
 */
export const getFleetZones = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const zones = await prisma.fleetZone.findMany({
    orderBy: { activeDrivers: 'desc' },
  });

  res.status(200).json(new ApiResponse(200, zones, 'Fleet zones fetched successfully'));
});

/**
 * Get high-level fleet metrics
 */
export const getFleetMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const [activeFleetDrivers, inOnboardingPipeline, inspectionsCount, passedInspections, ratingAgg] = await Promise.all([
    prisma.rider.count({ where: { isAvailable: true } }),
    prisma.driverOnboarding.count({ where: { overallStatus: { in: ['pending_review', 'in_progress'] } } }),
    prisma.vehicleInspection.count(),
    prisma.vehicleInspection.count({ where: { inspectionPass: true } }),
    prisma.rider.aggregate({
      where: { rating: { gt: 0 } },
      _avg: { rating: true },
    }),
  ]);

  const compliancePct = inspectionsCount > 0
    ? `${((passedInspections / inspectionsCount) * 100).toFixed(1)}%`
    : '0.0%';
  const avgDriverRating = ratingAgg._avg.rating ? Number(Number(ratingAgg._avg.rating).toFixed(2)) : 0;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        activeFleetDrivers,
        inOnboardingPipeline,
        inspectionsCount,
        fleetComplianceRate: compliancePct,
        avgDriverRating,
      },
      'Fleet metrics fetched successfully'
    )
  );
});
