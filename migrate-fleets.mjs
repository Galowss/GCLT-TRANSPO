import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const envStr = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envStr.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  }
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  const snapshot = await getDocs(collection(db, 'fleetTypes'));
  console.log('Total fleetTypes:', snapshot.docs.length);
  for (const d of snapshot.docs) {
    const data = d.data();
    if (data.category !== 'Trailer') {
      console.log('Updating fleetType category to Trailer for:', d.id);
      await updateDoc(doc(db, 'fleetTypes', d.id), { category: 'Trailer' });
    }
  }
  console.log('Migration complete');
  process.exit(0);
}

migrate();
