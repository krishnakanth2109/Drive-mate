import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDYIcRFaQgURTQ3OzTRC8ywlXD_frxzlHg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cms-vgs.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cms-vgs',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'cms-vgs.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '111241357996',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:111241357996:web:d7a86f87e5b22b2713e8a4',
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Trigger Google Sign-In popup via Firebase Auth
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
      },
      idToken,
    };
  } catch (error) {
    console.error('Firebase Google Sign-In error:', error);
    return {
      success: false,
      error: error.message || 'Google sign-in was cancelled or failed.',
    };
  }
}

export { signInWithPopup, sendEmailVerification };
export default app;
