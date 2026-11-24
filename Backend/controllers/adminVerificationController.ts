import { Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import sandboxVerificationService from '../services/sandboxVerificationService.js';

const generateId = (): string => crypto.randomBytes(12).toString('hex');

/**
 * 1. List all driver registrations with stats and filters
 * GET /api/admin/driver-verifications
 */
export const listDriverRegistrations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, docType, search, startDate, endDate } = req.query;

  const whereClause: any = {};

  if (status && status !== 'all') {
    whereClause.overallStatus = String(status);
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(String(startDate));
    if (endDate) whereClause.createdAt.lte = new Date(String(endDate));
  }

  if (search) {
    whereClause.driver = {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ],
    };
  }

  const [totalCount, pendingCount, verifiedCount, rejectedCount, incompleteCount, registrations] =
    await Promise.all([
      prisma.driverOnboarding.count(),
      prisma.driverOnboarding.count({ where: { overallStatus: 'pending_review' } }),
      prisma.driverOnboarding.count({ where: { overallStatus: { in: ['approved', 'verified'] } } }),
      prisma.driverOnboarding.count({ where: { overallStatus: 'rejected' } }),
      prisma.driverOnboarding.count({ where: { overallStatus: 'in_progress' } }),
      prisma.driverOnboarding.findMany({
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
            },
          },
          documents: true,
          coach: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

  const formatted = registrations.map((r) => {
    const docs = r.documents || [];
    const dlDoc = docs.find((d) => d.documentType === 'DRIVING_LICENSE');
    const panDoc = docs.find((d) => d.documentType === 'PAN');
    const aadharDoc = docs.find((d) => d.documentType === 'AADHAAR');
    const rcDoc = docs.find((d) => d.documentType === 'RC');
    const insDoc = docs.find((d) => d.documentType === 'INSURANCE');

    return {
      id: r.id,
      driverId: r.driverId,
      driverName: r.driver.name,
      driverPhone: r.driver.phone,
      driverEmail: r.driver.email,
      vehicleType: r.driver.vehicleType,
      vehicleInfo: r.driver.vehicle,
      currentStep: r.currentStep,
      overallStatus: r.overallStatus,
      dlStatus: dlDoc?.verificationStatus || r.dlStatus,
      panStatus: panDoc?.verificationStatus || r.panStatus,
      aadharStatus: aadharDoc?.verificationStatus || r.aadharStatus,
      rcStatus: rcDoc?.verificationStatus || r.rcStatus,
      insuranceStatus: insDoc?.verificationStatus || r.insuranceStatus,
      documentsCount: docs.length,
      coachName: r.coach?.name || 'Unassigned',
      submissionDate: r.submissionDate || r.createdAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        metrics: {
          total: totalCount,
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount,
          incomplete: incompleteCount,
        },
        registrations: formatted,
      },
      'Driver registrations fetched successfully'
    )
  );
});

/**
 * 2. Get detailed driver registration view with all 7 step sections
 * GET /api/admin/driver-verifications/:driverId
 */
export const getDriverRegistrationDetails = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const driverId = String(req.params.driverId);

    const onboarding = await prisma.driverOnboarding.findFirst({
      where: {
        OR: [{ driverId }, { id: driverId }],
      },
      include: {
        driver: true,
        documents: {
          include: {
            reviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        audits: {
          include: {
            admin: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        coach: { select: { id: true, name: true, email: true } },
        inspections: { orderBy: { inspectedAt: 'desc' } },
      },
    });

    if (!onboarding) {
      throw new ApiError(404, 'Driver registration record not found');
    }

    const stepData = (onboarding.stepData as Record<string, any>) || {};

    // Group documents by documentType for easy frontend rendering
    const docsGrouped: Record<string, any> = {};
    for (const doc of onboarding.documents) {
      docsGrouped[doc.documentType] = doc;
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          onboardingId: onboarding.id,
          driverId: onboarding.driverId,
          driver: {
            id: onboarding.driver.id,
            name: onboarding.driver.name,
            phone: onboarding.driver.phone,
            email: onboarding.driver.email,
            vehicleType: onboarding.driver.vehicleType,
            vehicle: onboarding.driver.vehicle,
            rating: onboarding.driver.rating,
            walletBalance: onboarding.driver.walletBalance,
            isAvailable: onboarding.driver.isAvailable,
          },
          overallStatus: onboarding.overallStatus,
          currentStep: onboarding.currentStep,
          stepData: {
            personal: stepData.step1 || {},
            contact: stepData.step2 || {},
            dl: stepData.step3 || {},
            aadhaar: stepData.step4 || {},
            pan: stepData.step5 || {},
            vehicle: stepData.step6 || {},
            review: stepData.step7 || {},
          },
          documents: onboarding.documents,
          documentsGrouped: docsGrouped,
          audits: onboarding.audits,
          coach: onboarding.coach,
          submissionDate: onboarding.submissionDate || onboarding.createdAt,
          approvedAt: onboarding.approvedAt,
          rejectionReason: onboarding.rejectionReason,
        },
        'Driver verification details fetched'
      )
    );
  }
);

/**
 * 3. List documents filtered by type (DL, Aadhaar, PAN, RC, Insurance)
 * GET /api/admin/documents/by-type/:type
 */
export const listDocumentsByType = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const typeParam = String(req.params.type || '').toUpperCase();
  const { status, search } = req.query;

  const whereClause: any = {
    documentType: typeParam,
  };

  if (status && status !== 'all') {
    whereClause.verificationStatus = String(status);
  }

  if (search) {
    whereClause.onboarding = {
      driver: {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' } },
          { phone: { contains: String(search), mode: 'insensitive' } },
        ],
      },
    };
  }

  const documents = await prisma.driverDocument.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      onboarding: {
        include: {
          driver: {
            select: { id: true, name: true, phone: true, email: true, vehicleType: true },
          },
        },
      },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });

  const formatted = documents.map((d) => ({
    id: d.id,
    driverId: d.driverId,
    driverName: d.onboarding?.driver?.name || 'Driver',
    driverPhone: d.onboarding?.driver?.phone || 'N/A',
    documentType: d.documentType,
    documentNumber: d.documentNumber,
    verificationStatus: d.verificationStatus,
    verificationProvider: d.verificationProvider,
    providerReferenceId: d.providerReferenceId,
    expiryDate: d.expiryDate,
    verifiedAt: d.verifiedAt,
    rejectionReason: d.rejectionReason,
    adminNotes: d.adminNotes,
    reviewedBy: d.reviewer?.name || null,
    frontImageUrl: d.frontImageUrl,
    backImageUrl: d.backImageUrl,
    createdAt: d.createdAt,
  }));

  res.status(200).json(new ApiResponse(200, formatted, `${typeParam} documents fetched`));
});

/**
 * 4. Consolidated Pending Reviews Queue
 * GET /api/admin/verifications/pending
 */
export const getPendingReviewsQueue = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const pendingDocs = await prisma.driverDocument.findMany({
    where: {
      verificationStatus: { in: ['MANUAL_REVIEW', 'PENDING'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      onboarding: {
        include: {
          driver: {
            select: { id: true, name: true, phone: true, email: true, vehicleType: true },
          },
        },
      },
    },
  });

  const formatted = pendingDocs.map((doc) => ({
    documentId: doc.id,
    onboardingId: doc.onboardingId,
    driverId: doc.driverId,
    driverName: doc.onboarding?.driver?.name || 'Driver Applicant',
    driverPhone: doc.onboarding?.driver?.phone || 'N/A',
    documentType: doc.documentType,
    documentNumber: doc.documentNumber,
    verificationStatus: doc.verificationStatus,
    verificationProvider: doc.verificationProvider,
    frontImageUrl: doc.frontImageUrl,
    backImageUrl: doc.backImageUrl,
    submissionDate: doc.createdAt,
    reasonForManualReview:
      doc.verificationStatus === 'MANUAL_REVIEW'
        ? 'Automated provider response requires administrative sign-off'
        : 'Newly submitted document awaiting verification',
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'Pending reviews queue retrieved'));
});

/**
 * 5. Approve a document (Manual Admin Action)
 * POST /api/admin/documents/:documentId/approve
 */
export const approveDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const documentId = String(req.params.documentId);
  const adminId = req.user?.id || req.user?._id;
  const { notes } = req.body;

  const doc = await prisma.driverDocument.findUnique({
    where: { id: documentId },
    include: { onboarding: { include: { documents: true } } },
  });

  if (!doc) {
    throw new ApiError(404, 'Document record not found');
  }

  const previousStatus = doc.verificationStatus;

  const updatedDoc = await prisma.driverDocument.update({
    where: { id: documentId },
    data: {
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      adminNotes: notes || 'Approved by Master Administrator',
      reviewedByAdminId: adminId,
    },
  });

  // Record Audit Trail
  await prisma.driverVerificationAudit.create({
    data: {
      id: generateId(),
      onboardingId: doc.onboardingId,
      documentId: doc.id,
      adminId,
      action: 'ADMIN_APPROVED',
      previousStatus,
      newStatus: 'VERIFIED',
      reason: notes || 'Document verified and approved manually',
    },
  });

  // Check if all core documents are now VERIFIED
  const allDocs = await prisma.driverDocument.findMany({
    where: { onboardingId: doc.onboardingId },
  });

  const hasVerifiedDl = allDocs.some((d) => d.documentType === 'DRIVING_LICENSE' && d.verificationStatus === 'VERIFIED');
  const hasVerifiedPan = allDocs.some((d) => d.documentType === 'PAN' && d.verificationStatus === 'VERIFIED');
  const hasVerifiedRc = allDocs.some((d) => d.documentType === 'RC' && d.verificationStatus === 'VERIFIED');

  if (hasVerifiedDl && hasVerifiedPan && hasVerifiedRc) {
    // Automatically approve overall driver onboarding and enable ride availability
    await prisma.driverOnboarding.update({
      where: { id: doc.onboardingId },
      data: {
        overallStatus: 'approved',
        approvedAt: new Date(),
      },
    });

    await prisma.rider.update({
      where: { id: doc.driverId },
      data: {
        isAvailable: true,
      },
    });
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { document: updatedDoc, isFullyVerified: hasVerifiedDl && hasVerifiedPan && hasVerifiedRc },
      'Document successfully approved'
    )
  );
});

/**
 * 6. Reject a document (Mandatory Rejection Reason)
 * POST /api/admin/documents/:documentId/reject
 */
export const rejectDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const documentId = String(req.params.documentId);
  const adminId = req.user?.id || req.user?._id;
  const { reason, notes } = req.body;

  if (!reason) {
    throw new ApiError(400, 'Rejection reason is mandatory when rejecting a driver document.');
  }

  const doc = await prisma.driverDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) {
    throw new ApiError(404, 'Document record not found');
  }

  const previousStatus = doc.verificationStatus;

  const updatedDoc = await prisma.driverDocument.update({
    where: { id: documentId },
    data: {
      verificationStatus: 'REJECTED',
      rejectionReason: reason,
      adminNotes: notes || null,
      reviewedByAdminId: adminId,
    },
  });

  // Set overall onboarding status to rejected
  await prisma.driverOnboarding.update({
    where: { id: doc.onboardingId },
    data: {
      overallStatus: 'rejected',
      rejectionReason: reason,
    },
  });

  // Record Audit Trail
  await prisma.driverVerificationAudit.create({
    data: {
      id: generateId(),
      onboardingId: doc.onboardingId,
      documentId: doc.id,
      adminId,
      action: 'ADMIN_REJECTED',
      previousStatus,
      newStatus: 'REJECTED',
      reason,
    },
  });

  res.status(200).json(new ApiResponse(200, updatedDoc, 'Document rejected successfully'));
});

/**
 * 7. Request document re-upload
 * POST /api/admin/documents/:documentId/request-reupload
 */
export const requestDocumentReupload = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const documentId = String(req.params.documentId);
  const adminId = req.user?.id || req.user?._id;
  const { reason } = req.body;

  const doc = await prisma.driverDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) throw new ApiError(404, 'Document not found');

  const updated = await prisma.driverDocument.update({
    where: { id: documentId },
    data: {
      verificationStatus: 'NOT_SUBMITTED',
      rejectionReason: reason || 'Document blurry or unreadable. Please re-upload.',
      reviewedByAdminId: adminId,
    },
  });

  await prisma.driverVerificationAudit.create({
    data: {
      id: generateId(),
      onboardingId: doc.onboardingId,
      documentId: doc.id,
      adminId,
      action: 'REUPLOAD_REQUESTED',
      previousStatus: doc.verificationStatus,
      newStatus: 'NOT_SUBMITTED',
      reason: reason || 'Document re-upload requested by admin',
    },
  });

  res.status(200).json(new ApiResponse(200, updated, 'Re-upload request sent to driver'));
});

/**
 * 8. Retry automated sandbox verification on a document
 * POST /api/admin/documents/:documentId/retry-verification
 */
export const retryDocumentVerification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const documentId = String(req.params.documentId);
  const adminId = req.user?.id || req.user?._id;

  const doc = await prisma.driverDocument.findUnique({
    where: { id: documentId },
    include: { onboarding: { include: { driver: true } } },
  });

  if (!doc) throw new ApiError(404, 'Document not found');

  // Driving Licence Retry (Sandbox Gateway + Computer Vision OCR)
  if (doc.documentType === 'DRIVING_LICENSE') {
    const rawDl = doc.documentNumber || '';
    const verification = await sandboxVerificationService.verifyDrivingLicense(
      rawDl,
      undefined,
      doc.expiryDate ? doc.expiryDate.toISOString() : undefined,
      doc.frontImageUrl || undefined,
      doc.backImageUrl || undefined
    );

    const updated = await prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: verification.status,
        providerReferenceId: verification.providerReferenceId,
        providerResponseRaw: verification.details ? (verification.details as any) : undefined,
        verifiedAt: verification.status === 'VERIFIED' ? new Date() : undefined,
      },
    });

    await prisma.driverOnboarding.update({
      where: { id: doc.onboardingId },
      data: {
        dlStatus: verification.status,
      },
    });

    await prisma.driverVerificationAudit.create({
      data: {
        id: generateId(),
        onboardingId: doc.onboardingId,
        documentId: doc.id,
        adminId,
        action: 'RETRY_TRIGGERED',
        previousStatus: doc.verificationStatus,
        newStatus: verification.status,
        reason: 'Automated Driving Licence verification retried via Sandbox & OCR',
      },
    });

    return res.status(200).json(new ApiResponse(200, { verification, document: updated }, 'DL verification retried'));
  }

  // PAN Card Retry (Sandbox KYC API)
  if (doc.documentType === 'PAN' && doc.documentNumber) {
    const rawPan = doc.documentNumber.replace(/\*/g, '');
    const driverName = doc.onboarding?.driver?.name || 'Driver';

    const verification = await sandboxVerificationService.verifyPan(rawPan, driverName);

    const updated = await prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: verification.status,
        providerResponseRaw: verification.rawResponse || undefined,
        verifiedAt: verification.status === 'VERIFIED' ? new Date() : undefined,
      },
    });

    await prisma.driverVerificationAudit.create({
      data: {
        id: generateId(),
        onboardingId: doc.onboardingId,
        documentId: doc.id,
        adminId,
        action: 'RETRY_TRIGGERED',
        previousStatus: doc.verificationStatus,
        newStatus: verification.status,
        reason: 'Automated PAN verification retried via Sandbox.co.in API',
      },
    });

    return res.status(200).json(new ApiResponse(200, { verification, document: updated }, 'Verification retried'));
  }

  // Vehicle RC Retry
  if (doc.documentType === 'RC' && doc.documentNumber) {
    const rawPlate = doc.documentNumber;
    const verification = await sandboxVerificationService.verifyVehicleRc(rawPlate);

    const updated = await prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: verification.status,
        providerReferenceId: verification.providerReferenceId,
        providerResponseRaw: verification.details ? (verification.details as any) : undefined,
        verifiedAt: verification.status === 'VERIFIED' ? new Date() : undefined,
      },
    });

    await prisma.driverOnboarding.update({
      where: { id: doc.onboardingId },
      data: {
        rcStatus: verification.status,
      },
    });

    await prisma.driverVerificationAudit.create({
      data: {
        id: generateId(),
        onboardingId: doc.onboardingId,
        documentId: doc.id,
        adminId,
        action: 'RETRY_TRIGGERED',
        previousStatus: doc.verificationStatus,
        newStatus: verification.status,
        reason: 'Vehicle RC verification retried',
      },
    });

    return res.status(200).json(new ApiResponse(200, { verification, document: updated }, 'RC verification retried'));
  }

  throw new ApiError(400, `Automated retry is not directly supported for ${doc.documentType}`);
});

/**
 * 9. Secure Document File Viewer / Streamer
 * GET /api/admin/documents/:documentId/file
 */
export const getSecureDocumentFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const documentId = String(req.params.documentId);
  const side = req.query.side === 'back' ? 'back' : 'front';

  const doc = await prisma.driverDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) throw new ApiError(404, 'Document not found');

  const imageUrl = side === 'back' ? doc.backImageUrl : doc.frontImageUrl;
  if (!imageUrl) {
    throw new ApiError(404, `No ${side} image on file for this document`);
  }

  // 1. If stored as base64 data URI
  if (imageUrl.startsWith('data:image')) {
    const parts = imageUrl.split(';base64,');
    const contentType = parts[0].replace('data:', '');
    const imgBuffer = Buffer.from(parts[1], 'base64');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.send(imgBuffer);
  }

  // 2. If stored as local disk upload path
  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
    const cleanRel = imageUrl.replace(/^\/+/, '');
    const filename = path.basename(cleanRel);
    const candidatePaths = [
      path.resolve(process.cwd(), cleanRel),
      path.resolve(process.cwd(), 'Backend', cleanRel),
      path.resolve(process.cwd(), 'uploads/documents', filename),
      path.resolve(process.cwd(), 'Backend/uploads/documents', filename),
      path.join(process.cwd(), '../Backend/uploads/documents', filename),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        res.setHeader('Cache-Control', 'private, max-age=3600');
        return res.sendFile(p);
      }
    }
  }

  // 3. Otherwise return secure URL
  res.status(200).json(new ApiResponse(200, { url: imageUrl }, 'Secure document reference'));
});
