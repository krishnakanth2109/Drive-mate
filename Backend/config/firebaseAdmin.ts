import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp: App | null = null;
let firebaseAuth: Auth | null = null;

export function getFirebaseAdminApp(): App {
  if (firebaseApp) return firebaseApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'cms-vgs';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  try {
    if (projectId && clientEmail && privateKey) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('🔥 Firebase Admin initialized successfully for project:', projectId);
    } else {
      console.warn('⚠️ Firebase credentials incomplete, initializing with default project ID');
      firebaseApp = initializeApp({ projectId });
    }
  } catch (err: any) {
    console.error('⚠️ Firebase Admin initialization notice:', err.message);
    const apps = getApps();
    if (apps.length > 0) {
      firebaseApp = apps[0];
    } else {
      throw err;
    }
  }

  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuth) return firebaseAuth;
  const app = getFirebaseAdminApp();
  firebaseAuth = getAuth(app);
  return firebaseAuth;
}

// Backwards compatibility helper
export function getFirebaseAdmin() {
  const auth = getFirebaseAuth();
  return {
    auth: () => auth,
  };
}

export default getFirebaseAuth;
