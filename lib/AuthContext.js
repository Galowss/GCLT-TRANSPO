'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext({});
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to build user object from Firebase user + Firestore profile
  const buildUserObject = async (firebaseUser) => {
    let userData = {};
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      userData = userDoc.exists() ? userDoc.data() : {};
    } catch (err) {
      // Firestore read may fail if rules aren't set yet — use Auth data only
      console.warn('Could not read user profile from Firestore:', err.message);
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      displayName: firebaseUser.displayName || userData.displayName || 'User',
      photoURL: firebaseUser.photoURL || userData.photoURL || null,
      role: userData.role || 'user',
      location: userData.location || 'SBMA / Olongapo Port Region',
      phone: userData.phone || '',
      company: userData.company || '',
    };
  };

  // Helper to save user profile to Firestore (with error handling)
  const saveUserProfile = async (uid, data) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Could not save user profile to Firestore:', err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const u = await buildUserObject(firebaseUser);
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const u = await buildUserObject(credential.user);
    setUser(u);
    return u;
  };

  const register = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name in Firebase Auth
    await updateProfile(credential.user, { displayName: name });

    // Send email verification
    await sendEmailVerification(credential.user);

    // Save user profile to Firestore
    await saveUserProfile(credential.user.uid, {
      displayName: name,
      email: email,
      role: 'user',
      location: 'SBMA / Olongapo Port Region',
      phone: '',
      company: '',
      createdAt: serverTimestamp(),
    });

    const u = {
      uid: credential.user.uid,
      email: email,
      emailVerified: false,
      displayName: name,
      photoURL: null,
      role: 'user',
      location: 'SBMA / Olongapo Port Region',
    };
    setUser(u);
    return u;
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    // Check if user already exists in Firestore
    const existingDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (existingDoc.exists()) {
      // Existing user — update display info only, preserve role
      await saveUserProfile(firebaseUser.uid, {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      });
    } else {
      // New user — set default role
      await saveUserProfile(firebaseUser.uid, {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        role: 'user',
        location: 'SBMA / Olongapo Port Region',
        createdAt: serverTimestamp(),
      });
    }

    const u = await buildUserObject(firebaseUser);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const u = await buildUserObject(auth.currentUser);
      setUser(u);
      return u;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, resendVerification, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
