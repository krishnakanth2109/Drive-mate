import { sendFirebaseEmailOtp } from './firebaseEmailService.js';

export { sendFirebaseEmailOtp };

/**
 * Re-export sendRegistrationOtp delegating to Firebase Auth services
 */
export async function sendRegistrationOtp(
  email: string,
  otp: string,
  firstName: string = 'Commuter'
) {
  return sendFirebaseEmailOtp(email, otp, firstName);
}
