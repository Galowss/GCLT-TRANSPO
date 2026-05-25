import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDHE7qajqXY9uhZNV2kHeaY-7hTFR_nxQc",
  authDomain: "gclt-system.firebaseapp.com",
  projectId: "gclt-system",
  storageBucket: "gclt-system.firebasestorage.app",
  messagingSenderId: "42011079670",
  appId: "1:42011079670:web:726bfe7ddea5f568704dd7",
  measurementId: "G-5D6JW039P9",
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (e) {
  // If already initialized (e.g., in hot reload), fallback to getFirestore
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const auth = typeof window !== 'undefined' ? getAuth(app) : null;
export const storage = typeof window !== 'undefined' ? getStorage(app) : null;
export default app;
