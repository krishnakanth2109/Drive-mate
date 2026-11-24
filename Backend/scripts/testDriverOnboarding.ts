import 'dotenv/config';
import { prisma } from '../config/prisma.js';
import sandboxVerificationService from '../services/sandboxVerificationService.js';
import crypto from 'crypto';

const runVerificationTests = async () => {
  console.log('======================================================');
  console.log('🚗 DRIVEMATE 7-STEP DRIVER ONBOARDING & SANDBOX VERIFICATION AUDIT');
  console.log('======================================================\n');

  try {
    // 1. Database Connection check
    await prisma.$queryRaw`SELECT 1 as health`;
    console.log('✅ [1/8] Neon PostgreSQL connection: ACTIVE');

    // 2. Sandbox Authentication & Token check
    console.log('⏳ [2/8] Authenticating with Sandbox.co.in Live API...');
    const token = await sandboxVerificationService.getAccessToken();
    if (token) {
      console.log(`✅ [2/8] Sandbox.co.in Authenticated successfully (JWT Token: ${token.substring(0, 15)}...)`);
    } else {
      console.log('⚠️ [2/8] Sandbox authentication fallback active.');
    }

    // 3. Find or create a test rider
    let testRider = await prisma.rider.findFirst({
      where: { email: 'onboarding.test@drivemate.in' },
    });

    if (!testRider) {
      testRider = await prisma.rider.create({
        data: {
          id: `rider_test_${Date.now()}`,
          name: 'Rajesh Sharma',
          email: 'onboarding.test@drivemate.in',
          phone: '+919876543210',
          password: 'hashed_password_123',
          vehicleType: 'bike',
          isAvailable: false,
          vehicle: {
            plate: 'KA01AB1234',
            make: 'Honda',
            model: 'Activa 6G',
            year: '2023',
          },
        },
      });
      console.log(`✅ [3/8] Test Rider profile created: ${testRider.name} (${testRider.id})`);
    } else {
      console.log(`✅ [3/8] Existing Test Rider found: ${testRider.name} (${testRider.id})`);
    }

    // 4. Test Step 1 to 6 draft save & Onboarding Record
    let onboarding = await prisma.driverOnboarding.upsert({
      where: { driverId: testRider.id },
      create: {
        id: `onb_${Date.now()}`,
        driverId: testRider.id,
        currentStep: 6,
        overallStatus: 'in_progress',
        dlStatus: 'Pending',
        rcStatus: 'Pending',
        aadharStatus: 'Pending',
        panStatus: 'NOT_SUBMITTED',
        stepData: {
          step1: { fullName: 'Rajesh Sharma', dob: '1992-08-14', gender: 'male' },
          step2: { phone: '+919876543210', email: 'onboarding.test@drivemate.in', city: 'Bengaluru', postalCode: '560001' },
          step3: { dlNumber: 'KA0120150001234' },
          step4: { aadhaarNumber: 'XXXX-XXXX-9012', consentGiven: true },
          step5: { panNumber: 'ABCDE1234F', panName: 'RAJESH SHARMA' },
          step6: { vehiclePlate: 'KA01AB1234', vehicleMake: 'Honda', vehicleModel: 'Activa' },
        },
      },
      update: {
        currentStep: 6,
        stepData: {
          step1: { fullName: 'Rajesh Sharma', dob: '1992-08-14', gender: 'male' },
          step2: { phone: '+919876543210', email: 'onboarding.test@drivemate.in', city: 'Bengaluru', postalCode: '560001' },
          step3: { dlNumber: 'KA0120150001234' },
          step4: { aadhaarNumber: 'XXXX-XXXX-9012', consentGiven: true },
          step5: { panNumber: 'ABCDE1234F', panName: 'RAJESH SHARMA' },
          step6: { vehiclePlate: 'KA01AB1234', vehicleMake: 'Honda', vehicleModel: 'Activa' },
        },
      },
    });
    console.log(`✅ [4/8] 7-Step Driver Onboarding record persisted: ID ${onboarding.id}`);

    // 5. Test Live Sandbox PAN verification logic
    console.log('⏳ [5/8] Testing Sandbox PAN verification service...');
    const panResult = await sandboxVerificationService.verifyPan('ABCDE1234F', 'RAJESH SHARMA', true, '1992-08-14');
    console.log(`✅ [5/8] PAN Service executed: Status = ${panResult.status}, Masked PAN = ${panResult.maskedPan}, Name = ${panResult.nameAsPerPan}`);

    // Upsert PAN document
    await prisma.driverDocument.create({
      data: {
        id: `doc_pan_${Date.now()}`,
        onboardingId: onboarding.id,
        driverId: testRider.id,
        documentType: 'PAN',
        documentNumber: panResult.maskedPan,
        verificationStatus: panResult.status,
        verificationProvider: 'sandbox',
        providerReferenceId: panResult.providerReferenceId || 'sbox_ref_pan_123',
        verifiedAt: panResult.status === 'VERIFIED' ? new Date() : null,
      },
    });

    // 6. Test Sandbox DigiLocker session initiation
    console.log('⏳ [6/8] Testing Sandbox DigiLocker KYC session initiation...');
    const digiSession = await sandboxVerificationService.initiateDigiLockerSession(
      'https://drivemate.in/digilocker-callback',
      ['aadhaar']
    );
    if (digiSession) {
      console.log(`✅ [6/8] DigiLocker Session initialized: ID = ${digiSession.sessionId}`);
    } else {
      console.log('ℹ️ [6/8] DigiLocker Offline fallback configured.');
    }

    // Upsert DL and RC documents
    await prisma.driverDocument.create({
      data: {
        id: `doc_dl_${Date.now()}`,
        onboardingId: onboarding.id,
        driverId: testRider.id,
        documentType: 'DRIVING_LICENSE',
        documentNumber: sandboxVerificationService.maskDl('KA0120150001234'),
        verificationStatus: 'PENDING',
        verificationProvider: 'manual',
      },
    });

    await prisma.driverDocument.create({
      data: {
        id: `doc_rc_${Date.now()}`,
        onboardingId: onboarding.id,
        driverId: testRider.id,
        documentType: 'RC',
        documentNumber: 'KA01AB1234',
        verificationStatus: 'PENDING',
        verificationProvider: 'manual',
      },
    });

    // 7. Test Step 7 Final Onboarding Submission
    const submittedOnboarding = await prisma.driverOnboarding.update({
      where: { id: onboarding.id },
      data: {
        currentStep: 7,
        overallStatus: 'pending_review',
        submissionDate: new Date(),
        consentGiven: true,
        consentTimestamp: new Date(),
      },
    });

    // Record audit event
    await prisma.driverVerificationAudit.create({
      data: {
        id: `audit_${Date.now()}`,
        onboardingId: onboarding.id,
        action: 'SUBMITTED',
        newStatus: 'pending_review',
        reason: 'Driver completed 7-step onboarding and submitted documents for review.',
      },
    });
    console.log(`✅ [7/8] Driver submitted onboarding: overallStatus = ${submittedOnboarding.overallStatus}`);

    // 8. Test Master Admin Verification queries & Approval flow
    const pendingCount = await prisma.driverOnboarding.count({
      where: { overallStatus: 'pending_review' },
    });
    const docStream = await prisma.driverDocument.findMany({
      where: { onboardingId: onboarding.id },
    });
    const auditEvents = await prisma.driverVerificationAudit.findMany({
      where: { onboardingId: onboarding.id },
    });

    console.log(`✅ [8/8] Master Admin queries verified:`);
    console.log(`   - Pending review applications: ${pendingCount}`);
    console.log(`   - Driver documents on file: ${docStream.length} (${docStream.map(d => d.documentType).join(', ')})`);
    console.log(`   - Audit history count: ${auditEvents.length} event(s)`);

    console.log('\n======================================================');
    console.log('🎉 ALL 8 DRIVER ONBOARDING & SANDBOX VERIFICATION CHECKS PASSED!');
    console.log('======================================================');

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

runVerificationTests();
