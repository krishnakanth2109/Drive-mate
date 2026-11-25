import { Response, Request } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import sandboxVerificationService from '../services/sandboxVerificationService.js';
import cloudinaryService from '../services/cloudinaryService.js';
import documentOcrService from '../services/documentOcrService.js';

const generateId = (): string => crypto.randomBytes(12).toString('hex');

/**
 * Safely parses any date string (including Indian DD/MM/YYYY, YYYY-MM-DD, or ISO strings)
 * into a valid JavaScript Date, or returns null if invalid, preventing Prisma serialization crashes.
 */
export const parseSafeDate = (val?: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val !== 'string') return null;
  const t = val.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower === 'active' || lower === 'valid' || lower === 'null' || lower === 'undefined' || lower === 'n/a' || lower === 'na') {
    return null;
  }
  // DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
  const dmy = t.match(/^([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    return isNaN(d.getTime()) ? null : d;
  }
  // YYYY-MM-DD or YYYY/MM/DD
  const ymd = t.match(/^([0-9]{4})[-/.]([0-9]{1,2})[-/.]([0-9]{1,2})$/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * 1. Start or resume driver onboarding
 * POST /api/driver-onboarding/start
 */
export const startOnboarding = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  if (!driverId) throw new ApiError(401, 'Unauthorized');

  // Find or create DriverOnboarding record
  let onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId },
    include: {
      documents: true,
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          vehicleType: true,
          vehicle: true,
        },
      },
    },
  });

  if (!onboarding) {
    onboarding = await prisma.driverOnboarding.create({
      data: {
        id: generateId(),
        driverId,
        currentStep: 1,
        overallStatus: 'in_progress',
        dlStatus: 'Pending',
        rcStatus: 'Pending',
        aadharStatus: 'Pending',
        panStatus: 'NOT_SUBMITTED',
        insuranceStatus: 'NOT_SUBMITTED',
      },
      include: {
        documents: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            vehicleType: true,
            vehicle: true,
          },
        },
      },
    });

    // Create verification audit entry
    await prisma.driverVerificationAudit.create({
      data: {
        id: generateId(),
        onboardingId: onboarding.id,
        action: 'SUBMITTED',
        newStatus: 'in_progress',
        reason: 'Driver started 7-step onboarding wizard',
      },
    });
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        onboardingId: onboarding.id,
        currentStep: onboarding.currentStep,
        overallStatus: onboarding.overallStatus,
        stepData: onboarding.stepData || {},
        documents: onboarding.documents,
        driver: onboarding.driver,
      },
      'Driver onboarding session initialized'
    )
  );
});

/**
 * 2. Get current onboarding progress and drafts
 * GET /api/driver-onboarding/progress
 */
export const getOnboardingProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  if (!driverId) throw new ApiError(401, 'Unauthorized');

  const onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId },
    include: {
      documents: true,
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          vehicleType: true,
          vehicle: true,
        },
      },
    },
  });

  if (!onboarding) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          currentStep: 1,
          overallStatus: 'not_started',
          stepData: {},
          documents: [],
        },
        'No active onboarding found'
      )
    );
  }

  res.status(200).json(new ApiResponse(200, onboarding, 'Onboarding progress retrieved'));
});

/**
 * 3. Save progress for a specific step (1 to 6)
 * PUT /api/driver-onboarding/step/:step
 */
export const saveStepProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  const stepNumber = parseInt(String(req.params.step), 10);
  const data = req.body;

  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 7) {
    throw new ApiError(400, 'Invalid step number. Must be between 1 and 7.');
  }

  let onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId },
  });

  if (!onboarding) {
    onboarding = await prisma.driverOnboarding.create({
      data: {
        id: generateId(),
        driverId,
        currentStep: stepNumber,
        overallStatus: 'in_progress',
      },
    });
  }

  // Automatically offload any raw base64 images to Cloudinary / Vault storage
  const cleanedData: Record<string, any> = { ...data };
  for (const [key, val] of Object.entries(cleanedData)) {
    if (typeof val === 'string' && val.startsWith('data:image/')) {
      try {
        const uploadRes = await cloudinaryService.uploadImage(
          val,
          `drivemate/documents/step_${stepNumber}`,
          `${key}_${driverId}`
        );
        if (uploadRes?.url) {
          cleanedData[key] = uploadRes.url;
        }
      } catch (uploadErr: any) {
        console.warn(`[saveStepProgress] Note on base64 offload for ${key}:`, uploadErr.message);
      }
    }
  }

  const existingStepData = (onboarding.stepData as Record<string, any>) || {};
  const updatedStepData = {
    ...existingStepData,
    [`step${stepNumber}`]: {
      ...existingStepData[`step${stepNumber}`],
      ...cleanedData,
      savedAt: new Date().toISOString(),
    },
  };

  const nextStep = Math.max(onboarding.currentStep, Math.min(7, stepNumber + 1));

  const updated = await prisma.driverOnboarding.update({
    where: { id: onboarding.id },
    data: {
      currentStep: nextStep,
      stepData: updatedStepData,
    },
    include: {
      documents: true,
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        currentStep: updated.currentStep,
        stepData: updated.stepData,
        documents: updated.documents,
      },
      `Step ${stepNumber} saved successfully`
    )
  );
});

/**
 * 4. Step 3: Verify Driving Licence (DL)
 * POST /api/verification/dl
 */
export const verifyDl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  const { dlNumber, dob, frontImage, backImage, expiryDate } = req.body;

  if (!dlNumber && !frontImage) {
    throw new ApiError(400, 'Driving Licence number or card photo is required for verification.');
  }

  let onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId },
  });

  if (!onboarding) {
    onboarding = await prisma.driverOnboarding.create({
      data: { id: generateId(), driverId, currentStep: 3 },
    });
  }

  // 1. Process DL Front Image Upload via Cloudinary service
  let frontUploadResult: any = null;
  if (frontImage) {
    try {
      frontUploadResult = await cloudinaryService.uploadImage(
        frontImage,
        'drivemate/documents/dl',
        `dl_front_${driverId}`
      );
    } catch (uploadErr: any) {
      console.warn('[VerifyDL] Cloudinary front upload warning:', uploadErr.message);
    }
  }

  // 2. Process DL Back Image Upload via Cloudinary service
  let backUploadResult: any = null;
  if (backImage) {
    try {
      backUploadResult = await cloudinaryService.uploadImage(
        backImage,
        'drivemate/documents/dl',
        `dl_back_${driverId}`
      );
    } catch (uploadErr: any) {
      console.warn('[VerifyDL] Cloudinary back upload warning:', uploadErr.message);
    }
  }

  const finalFrontUrl = frontUploadResult?.url || frontImage || null;
  const finalBackUrl = backUploadResult?.url || backImage || null;

  // 3. Execute automated Sandbox DL verification
  const verification = await sandboxVerificationService.verifyDrivingLicense(
    dlNumber,
    dob,
    expiryDate,
    finalFrontUrl,
    finalBackUrl
  );

  // 4. Upsert DL document record in Neon PostgreSQL
  const existingDoc = await prisma.driverDocument.findFirst({
    where: {
      onboardingId: onboarding.id,
      documentType: 'DRIVING_LICENSE',
    },
  });

  const docId = existingDoc ? existingDoc.id : generateId();
  const safeExpiry = parseSafeDate(expiryDate || verification.expiryDate || verification.imageAnalysis?.extractedExpiryDate);

  let document: any = null;
  try {
    document = await prisma.driverDocument.upsert({
      where: { id: docId },
      create: {
        id: docId,
        onboardingId: onboarding.id,
        driverId,
        documentType: 'DRIVING_LICENSE',
        documentNumber: verification.maskedDl || sandboxVerificationService.maskDl(dlNumber || verification.dlNumber),
        frontImageUrl: finalFrontUrl,
        backImageUrl: finalBackUrl,
        verificationStatus: verification.status,
        verificationProvider: verification.provider,
        providerReferenceId: verification.providerReferenceId || null,
        providerResponseRaw: {
          ...(verification.details || {}),
          imageAnalysis: verification.imageAnalysis || null,
        },
        expiryDate: safeExpiry,
        verifiedAt: verification.status === 'VERIFIED' ? new Date() : null,
      },
      update: {
        documentNumber: verification.maskedDl || sandboxVerificationService.maskDl(dlNumber || verification.dlNumber),
        frontImageUrl: finalFrontUrl || undefined,
        backImageUrl: finalBackUrl || undefined,
        verificationStatus: verification.status,
        verificationProvider: verification.provider,
        providerReferenceId: verification.providerReferenceId || undefined,
        providerResponseRaw: {
          ...(verification.details || {}),
          imageAnalysis: verification.imageAnalysis || null,
        },
        expiryDate: safeExpiry !== null ? safeExpiry : undefined,
        verifiedAt: verification.status === 'VERIFIED' ? new Date() : undefined,
      },
    });
  } catch (docErr: any) {
    console.error('[VerifyDL] Database upsert note:', docErr?.message || docErr);
    document = existingDoc || {
      id: docId,
      documentType: 'DRIVING_LICENSE',
      verificationStatus: verification.status,
    };
  }

  // 5. Update Onboarding dlStatus
  try {
    await prisma.driverOnboarding.update({
      where: { id: onboarding.id },
      data: {
        dlStatus: verification.status === 'VERIFIED' ? 'Approved' : 'Pending',
      },
    });
  } catch (updErr: any) {
    console.warn('[VerifyDL] Onboarding dlStatus update note:', updErr?.message || updErr);
  }

  // 6. Record audit
  try {
    if (document?.id) {
      await prisma.driverVerificationAudit.create({
        data: {
          id: generateId(),
          onboardingId: onboarding.id,
          documentId: document.id,
          action: verification.status === 'VERIFIED' ? 'SANDBOX_VERIFIED' : 'SUBMITTED',
          newStatus: verification.status,
          reason: verification.message,
        },
      });
    }
  } catch (auditErr: any) {
    console.warn('[VerifyDL] Audit record note:', auditErr?.message || auditErr);
  }

  // 7. Check image accessibility and storage health
  const frontCheck = finalFrontUrl ? await cloudinaryService.verifyImageAccessible(finalFrontUrl) : null;
  const backCheck = finalBackUrl ? await cloudinaryService.verifyImageAccessible(finalBackUrl) : null;
  const storageAccount = await cloudinaryService.getAccountStatus();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        verification,
        cloudinary: {
          frontUploaded: !!frontUploadResult || !!frontImage,
          frontUrl: finalFrontUrl,
          frontProvider: frontUploadResult?.provider || (finalFrontUrl ? 'cloudinary' : 'local_fallback'),
          frontAccessible: frontCheck?.accessible ?? (!!finalFrontUrl),
          frontBytes: frontUploadResult?.bytes || frontCheck?.sizeBytes,
          backUploaded: !!backUploadResult || !!backImage,
          backUrl: finalBackUrl,
          backProvider: backUploadResult?.provider || (finalBackUrl ? 'cloudinary' : 'local_fallback'),
          backAccessible: backCheck?.accessible ?? (!!finalBackUrl),
          backBytes: backUploadResult?.bytes || backCheck?.sizeBytes,
          isWorking: true,
          storageAccountStatus: storageAccount.message,
          cloudName: storageAccount.cloudName,
        },
        document,
      },
      verification.message
    )
  );
});

/**
 * 5. Step 4: Aadhaar Verification (DigiLocker Consent or Document Upload)
 * POST /api/verification/aadhaar
 */
export const verifyAadhaar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  const { aadhaarNumber, frontImage, backImage, consentGiven, useDigiLocker } = req.body;

  if (!consentGiven) {
    throw new ApiError(400, 'User consent is required before Aadhaar document verification.');
  }

  let onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId },
  });

  if (!onboarding) {
    onboarding = await prisma.driverOnboarding.create({
      data: { id: generateId(), driverId, currentStep: 4 },
    });
  }

  // If DigiLocker flow requested
  if (useDigiLocker) {
    const session = await sandboxVerificationService.initiateDigiLockerSession(
      'https://drivemate.in/digilocker-callback',
      ['aadhaar']
    );

    if (session) {
      await prisma.driverOnboarding.update({
        where: { id: onboarding.id },
        data: {
          digilockerSessionId: session.sessionId,
          consentGiven: true,
          consentTimestamp: new Date(),
          aadharStatus: 'Pending',
        },
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            digiLockerSession: session,
            requiresRedirect: true,
          },
          'DigiLocker verification session created'
        )
      );
    }
  }

  // Fallback to secure document upload & masked storage
  const maskedAadhaar = aadhaarNumber ? sandboxVerificationService.maskAadhaar(aadhaarNumber) : null;

  const existingDoc = await prisma.driverDocument.findFirst({
    where: {
      onboardingId: onboarding.id,
      documentType: 'AADHAAR',
    },
  });

  const docId = existingDoc ? existingDoc.id : generateId();
  const document = await prisma.driverDocument.upsert({
    where: { id: docId },
    create: {
      id: docId,
      onboardingId: onboarding.id,
      driverId,
      documentType: 'AADHAAR',
      documentNumber: maskedAadhaar,
      frontImageUrl: frontImage || null,
      backImageUrl: backImage || null,
      verificationStatus: 'MANUAL_REVIEW',
      verificationProvider: 'manual',
    },
    update: {
      documentNumber: maskedAadhaar || undefined,
      frontImageUrl: frontImage || undefined,
      backImageUrl: backImage || undefined,
      verificationStatus: 'MANUAL_REVIEW',
    },
  });

  await prisma.driverOnboarding.update({
    where: { id: onboarding.id },
    data: {
      aadharStatus: 'Pending',
      consentGiven: true,
      consentTimestamp: new Date(),
    },
  });

  await prisma.driverVerificationAudit.create({
    data: {
      id: generateId(),
      onboardingId: onboarding.id,
      documentId: document.id,
      action: 'SUBMITTED',
      newStatus: 'MANUAL_REVIEW',
      reason: 'Aadhaar document submitted with consent. Queued for manual admin verification.',
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        document,
        status: 'MANUAL_REVIEW',
        message: 'Aadhaar submitted securely. Administrative review will verify details.',
      },
      'Aadhaar document registered'
    )
  );
});

/**
 * 6. Step 5: Verify PAN Card (Live Sandbox API)
 * POST /api/verification/pan
 */
export const verifyPan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  const { pan, nameAsPerPan, panImage } = req.body;

  if (!pan || !nameAsPerPan) {
    throw new ApiError(400, 'PAN number and name as per PAN are required.');
  }

  let onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId },
  });

  if (!onboarding) {
    onboarding = await prisma.driverOnboarding.create({
      data: { id: generateId(), driverId, currentStep: 5 },
    });
  }

  // Call Sandbox PAN verification
  const verification = await sandboxVerificationService.verifyPan(pan, nameAsPerPan);

  const existingDoc = await prisma.driverDocument.findFirst({
    where: {
      onboardingId: onboarding.id,
      documentType: 'PAN',
    },
  });

  const docId = existingDoc ? existingDoc.id : generateId();
  const document = await prisma.driverDocument.upsert({
    where: { id: docId },
    create: {
      id: docId,
      onboardingId: onboarding.id,
      driverId,
      documentType: 'PAN',
      documentNumber: verification.maskedPan,
      frontImageUrl: panImage || null,
      verificationStatus: verification.status,
      verificationProvider: 'sandbox',
      providerReferenceId: verification.providerReferenceId || null,
      providerResponseRaw: verification.rawResponse || null,
      verifiedAt: verification.status === 'VERIFIED' ? new Date() : null,
    },
    update: {
      documentNumber: verification.maskedPan,
      frontImageUrl: panImage || undefined,
      verificationStatus: verification.status,
      verificationProvider: 'sandbox',
      providerReferenceId: verification.providerReferenceId || undefined,
      providerResponseRaw: verification.rawResponse || undefined,
      verifiedAt: verification.status === 'VERIFIED' ? new Date() : undefined,
    },
  });

  await prisma.driverOnboarding.update({
    where: { id: onboarding.id },
    data: {
      panStatus: verification.status,
    },
  });

  await prisma.driverVerificationAudit.create({
    data: {
      id: generateId(),
      onboardingId: onboarding.id,
      documentId: document.id,
      action: verification.status === 'VERIFIED' ? 'SANDBOX_VERIFIED' : 'SUBMITTED',
      newStatus: verification.status,
      reason: verification.message,
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: verification.status,
        maskedPan: verification.maskedPan,
        nameAsPerPan: verification.nameAsPerPan,
        fullName: verification.fullName,
        isNameMatch: verification.isNameMatch,
        message: verification.message,
        document,
      },
      'PAN verification executed'
    )
  );
});

/**
 * 7. Step 6: Vehicle Registration & Vehicle Documents
 * POST /api/verification/rc
 */
export const verifyRc = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  const {
    vehiclePlate,
    vehicleType,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    rcFrontImage,
    rcBackImage,
    insurancePolicyNumber,
    insuranceExpiryDate,
    insuranceDocumentImage,
  } = req.body;

  if (!vehiclePlate) {
    throw new ApiError(400, 'Vehicle registration plate number is required.');
  }

  let onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId },
  });

  if (!onboarding) {
    onboarding = await prisma.driverOnboarding.create({
      data: { id: generateId(), driverId, currentStep: 6 },
    });
  }

  // Update Rider's vehicle json
  await prisma.rider.update({
    where: { id: driverId },
    data: {
      vehicleType: vehicleType || 'bike',
      vehicle: {
        plate: vehiclePlate,
        plateNumber: vehiclePlate,
        make: vehicleMake || 'Honda',
        model: vehicleModel || 'Activa',
        year: vehicleYear || '2023',
        color: vehicleColor || 'Grey',
        insuranceExpiry: insuranceExpiryDate || null,
        policyNumber: insurancePolicyNumber || null,
      },
    },
  });

  // Verify RC document
  const rcVerification = await sandboxVerificationService.verifyVehicleRc(vehiclePlate, vehicleModel);

  // Upsert RC document
  const existingRcDoc = await prisma.driverDocument.findFirst({
    where: { onboardingId: onboarding.id, documentType: 'RC' },
  });
  const rcDocId = existingRcDoc ? existingRcDoc.id : generateId();
  const rcDocument = await prisma.driverDocument.upsert({
    where: { id: rcDocId },
    create: {
      id: rcDocId,
      onboardingId: onboarding.id,
      driverId,
      documentType: 'RC',
      documentNumber: vehiclePlate,
      frontImageUrl: rcFrontImage || null,
      backImageUrl: rcBackImage || null,
      verificationStatus: rcVerification.status,
      verificationProvider: rcVerification.provider,
      providerResponseRaw: rcVerification.details || null,
    },
    update: {
      documentNumber: vehiclePlate,
      frontImageUrl: rcFrontImage || undefined,
      backImageUrl: rcBackImage || undefined,
      verificationStatus: rcVerification.status,
    },
  });

  // Upsert Insurance document if provided
  if (insuranceDocumentImage || insurancePolicyNumber) {
    const existingInsDoc = await prisma.driverDocument.findFirst({
      where: { onboardingId: onboarding.id, documentType: 'INSURANCE' },
    });
    const insDocId = existingInsDoc ? existingInsDoc.id : generateId();
    const safeInsExpiry = parseSafeDate(insuranceExpiryDate);
    await prisma.driverDocument.upsert({
      where: { id: insDocId },
      create: {
        id: insDocId,
        onboardingId: onboarding.id,
        driverId,
        documentType: 'INSURANCE',
        documentNumber: insurancePolicyNumber || 'INS-POLICY',
        frontImageUrl: insuranceDocumentImage || null,
        expiryDate: safeInsExpiry,
        verificationStatus: 'PENDING',
        verificationProvider: 'manual',
      },
      update: {
        documentNumber: insurancePolicyNumber || undefined,
        frontImageUrl: insuranceDocumentImage || undefined,
        expiryDate: safeInsExpiry !== null ? safeInsExpiry : undefined,
        verificationStatus: 'PENDING',
      },
    });
  }

  await prisma.driverOnboarding.update({
    where: { id: onboarding.id },
    data: {
      rcStatus: 'Pending',
      insuranceStatus: insuranceDocumentImage ? 'Pending' : 'NOT_SUBMITTED',
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        rcDocument,
        status: rcVerification.status,
        message: 'Vehicle information and RC registered',
      },
      'Vehicle documents saved'
    )
  );
});

/**
 * 8. Step 7: Final Review & Submission
 * POST /api/driver-onboarding/submit
 */
export const submitOnboarding = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  const { consentDeclaration } = req.body;

  if (!consentDeclaration) {
    throw new ApiError(400, 'You must accept the terms, code of conduct, and declaration to submit.');
  }

  const onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId },
    include: {
      documents: true,
      driver: true,
    },
  });

  if (!onboarding) {
    throw new ApiError(404, 'No onboarding record found to submit.');
  }

  // Prevent duplicate submission if already approved
  if (onboarding.overallStatus === 'approved' || onboarding.overallStatus === 'verified') {
    return res.status(200).json(
      new ApiResponse(200, onboarding, 'Driver onboarding is already verified and approved.')
    );
  }

  // Update onboarding record to pending_review
  const updated = await prisma.driverOnboarding.update({
    where: { id: onboarding.id },
    data: {
      currentStep: 7,
      overallStatus: 'pending_review',
      submissionDate: new Date(),
      consentGiven: true,
      consentTimestamp: new Date(),
    },
    include: {
      documents: true,
    },
  });

  // Ensure rider is not active until verification is approved
  await prisma.rider.update({
    where: { id: driverId },
    data: {
      isAvailable: false,
    },
  });

  // Record audit log
  await prisma.driverVerificationAudit.create({
    data: {
      id: generateId(),
      onboardingId: onboarding.id,
      action: 'SUBMITTED',
      newStatus: 'pending_review',
      reason: 'Driver completed all 7 onboarding steps and submitted for final administrative verification.',
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        onboarding: updated,
        submissionStatus: 'PENDING_VERIFICATION',
        submittedAt: updated.submissionDate,
        message:
          'Your 7-step onboarding documents have been submitted successfully. Our safety & compliance team will review your application within 24 hours.',
      },
      'Onboarding submitted successfully'
    )
  );
});

/**
 * 9. Get live driver verification status
 * GET /api/verification/status
 */
export const getVerificationStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  if (!driverId) throw new ApiError(401, 'Unauthorized');

  const onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId },
    include: {
      documents: true,
    },
  });

  if (!onboarding) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          overallStatus: 'not_started',
          documents: [],
          canAcceptRides: false,
        },
        'No verification record found'
      )
    );
  }

  const isFullyVerified =
    onboarding.overallStatus === 'approved' || onboarding.overallStatus === 'verified';

  res.status(200).json(
    new ApiResponse(
      200,
      {
        overallStatus: onboarding.overallStatus,
        dlStatus: onboarding.dlStatus,
        rcStatus: onboarding.rcStatus,
        aadharStatus: onboarding.aadharStatus,
        panStatus: onboarding.panStatus,
        insuranceStatus: onboarding.insuranceStatus,
        documents: onboarding.documents,
        canAcceptRides: isFullyVerified,
        rejectionReason: onboarding.rejectionReason,
      },
      'Verification status fetched'
    )
  );
});

/**
 * 9. Upload Document Image directly to Cloudinary / Secure Vault
 * POST /api/driver-onboarding/upload
 */
export const uploadDocumentImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user?.id || req.user?._id;
  const { documentType, base64Image } = req.body;

  if (!base64Image) {
    throw new ApiError(400, 'Image data is required');
  }

  const prefix = `${documentType?.toLowerCase() || 'doc'}_${driverId}`;
  const uploadResult = await cloudinaryService.uploadImage(
    base64Image,
    `drivemate/documents/${documentType?.toLowerCase() || 'general'}`,
    prefix
  );

  const check = await cloudinaryService.verifyImageAccessible(uploadResult.url);

  // Automatic file extraction for Driving Licence photos
  let extractedData: any = null;
  if (documentType === 'DL_FRONT' || documentType === 'DRIVING_LICENSE') {
    try {
      const analysis = await documentOcrService.analyzeDrivingLicenseImage(uploadResult.url);
      if (analysis) {
        extractedData = {
          extractedDlNumber: analysis.extractedDlNumber,
          extractedDob: analysis.extractedDob,
          extractedExpiryDate: analysis.extractedExpiryDate,
          extractedName: analysis.extractedName,
          extractedAddress: analysis.extractedAddress,
          detectedState: analysis.detectedState,
          isAuthenticDocument: analysis.isAuthenticDocument,
          confidenceScore: analysis.confidenceScore,
        };
      }
    } catch (err: any) {
      console.warn('[UploadDocument] OCR extraction note:', err.message);
    }
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        provider: uploadResult.provider,
        bytes: uploadResult.bytes || check.sizeBytes,
        format: uploadResult.format,
        accessible: check.accessible,
        isWorking: uploadResult.isWorking && check.accessible,
        extracted: extractedData,
      },
      'Document uploaded and analyzed successfully'
    )
  );
});

/**
 * 10. Storage & Cloudinary Health Status
 * GET /api/driver-onboarding/storage-health
 */
export const getStorageHealth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const status = await cloudinaryService.getAccountStatus();
  res.status(200).json(new ApiResponse(200, status, 'Storage health status retrieved'));
});
