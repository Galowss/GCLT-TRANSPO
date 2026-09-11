import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app = null;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (e) {
  console.warn('[firebase] Could not initialize app:', e.message);
}

let firestoreDb = null;
if (app) {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    // If already initialized (e.g., in hot reload), fallback to getFirestore
    try {
      firestoreDb = getFirestore(app);
    } catch (e2) {
      console.warn('[firebase] Could not initialize Firestore:', e2.message);
    }
  }
}

// Auth/Storage fail (e.g. invalid API key) must never crash hydration.
// Guarded so getAuth()/getStorage() don't throw at module load.
const clientOnly = (fn) => {
  if (typeof window === 'undefined' || !app) return null;
  try {
    return fn();
  } catch (e) {
    console.warn('[firebase] Init skipped:', e.message);
    return null;
  }
};

export const db = firestoreDb;
export const auth = clientOnly(() => getAuth(app));
export const storage = clientOnly(() => getStorage(app));
export default app;
