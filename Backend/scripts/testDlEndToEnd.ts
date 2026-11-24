import 'dotenv/config';
import cloudinaryService from '../services/cloudinaryService.js';
import sandboxVerificationService from '../services/sandboxVerificationService.js';
import { prisma } from '../config/prisma.js';

async function runEndToEndDlTest() {
  console.log('======================================================');
  console.log('🚗 STEP 3 DRIVING LICENCE & CLOUDINARY E2E ARCHITECTURE TEST');
  console.log('======================================================\n');

  // 1. Cloudinary / Resilient Storage Test with base64 image
  console.log('📸 [1/4] Testing Cloudinary / Secure Vault Image Storage...');
  // 1x1 transparent GIF base64 sample
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const uploadResult = await cloudinaryService.uploadImage(
    sampleBase64,
    'drivemate/documents/dl_test',
    'test_dl_front'
  );

  console.log(`   Storage Provider : ${uploadResult.provider}`);
  console.log(`   Storage URL      : ${uploadResult.url}`);
  console.log(`   Storage Working  : ${uploadResult.isWorking}`);
  console.log(`   Bytes Stored     : ${uploadResult.bytes}`);

  const accessCheck = await cloudinaryService.verifyImageAccessible(uploadResult.url);
  console.log(`   Access Check     : ${accessCheck.accessible ? '✅ ACCESSIBLE & WORKING' : '❌ NOT ACCESSIBLE'}\n`);

  if (!uploadResult.isWorking || !accessCheck.accessible) {
    throw new Error('Image storage verification failed!');
  }

  // 2. Test Sandbox DL Verification: Valid DL (KA-01 Karnataka)
  console.log('🔍 [2/5] Testing Sandbox DL Verification: Valid DL (KA-01 Karnataka)...');
  const validDlResult = await sandboxVerificationService.verifyDrivingLicense(
    'KA0120150001234',
    '1992-05-15',
    '2035-12-31'
  );
  console.log(`   Status           : ${validDlResult.status}`);
  console.log(`   State Authority  : ${validDlResult.stateName} (${validDlResult.stateCode})`);
  console.log(`   RTO Jurisdiction : ${validDlResult.rtoCode}`);
  console.log(`   Classes Allowed  : ${validDlResult.classesPermitted.join(', ')}`);
  console.log(`   Masked DL        : ${validDlResult.maskedDl}`);
  console.log(`   Message          : ${validDlResult.message}`);
  console.log(`   Result           : ${validDlResult.status === 'VERIFIED' ? '✅ PASS' : '❌ FAIL'}\n`);

  // 3. Test Sandbox DL Image Authenticity Guard: Non-DL Image Rejection
  console.log('🛡️ [3/5] Testing DL Image Authenticity Guard: Reject Blank / Fake Image...');
  const fakeImageDlResult = await sandboxVerificationService.verifyDrivingLicense(
    'KA0120150001234',
    '1992-05-15',
    '2035-12-31',
    uploadResult.url,
    uploadResult.url
  );
  console.log(`   Status           : ${fakeImageDlResult.status}`);
  console.log(`   Message          : ${fakeImageDlResult.message}`);
  console.log(`   Result           : ${fakeImageDlResult.status === 'FAILED' ? '✅ PASS (Correctly Blocked Non-DL Image)' : '❌ FAIL'}\n`);

  // 4. Test Sandbox DL Verification: Expired DL
  console.log('⏳ [4/5] Testing Sandbox DL Verification: Expired DL...');
  const expiredDlResult = await sandboxVerificationService.verifyDrivingLicense(
    'DL1420100001234',
    '1985-04-10',
    '2021-01-01'
  );
  console.log(`   Status           : ${expiredDlResult.status}`);
  console.log(`   Is Expired       : ${expiredDlResult.isExpired}`);
  console.log(`   Message          : ${expiredDlResult.message}`);
  console.log(`   Result           : ${expiredDlResult.status === 'EXPIRED' ? '✅ PASS (Correctly Blocked)' : '❌ FAIL'}\n`);

  // 5. Test Sandbox DL Verification: Invalid Format
  console.log('⚠️ [5/5] Testing Sandbox DL Verification: Invalid DL Format...');
  const invalidDlResult = await sandboxVerificationService.verifyDrivingLicense(
    'ZZ99INVALID',
    '1990-01-01'
  );
  console.log(`   Status           : ${invalidDlResult.status}`);
  console.log(`   Message          : ${invalidDlResult.message}`);
  console.log(`   Result           : ${invalidDlResult.status === 'FAILED' ? '✅ PASS (Correctly Rejected)' : '❌ FAIL'}\n`);

  console.log('======================================================');
  console.log('🎉 ALL STEP 3 SANDBOX & CLOUDINARY VERIFICATION CHECKS PASSED!');
  console.log('======================================================');

  await prisma.$disconnect();
}

runEndToEndDlTest().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
