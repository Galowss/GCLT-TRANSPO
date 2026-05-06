import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// ==============================
// FLEET TYPES (Available trucks for booking)
// ==============================
export async function getFleetTypes() {
  const snapshot = await getDocs(collection(db, 'fleetTypes'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function addFleetType(data) {
  const docRef = await addDoc(collection(db, 'fleetTypes'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateFleetType(id, data) {
  const docRef = doc(db, 'fleetTypes', id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteFleetType(id) {
  const docRef = doc(db, 'fleetTypes', id);
  await deleteDoc(docRef);
}


// ==============================
// TRUCKS FOR SALE
// ==============================
export async function getTrucksForSale() {
  const snapshot = await getDocs(collection(db, 'trucksForSale'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getTruckById(truckId) {
  const docRef = doc(db, 'trucksForSale', truckId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function addTruck(truckData) {
  const docRef = await addDoc(collection(db, 'trucksForSale'), {
    ...truckData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTruck(truckId, truckData) {
  const docRef = doc(db, 'trucksForSale', truckId);
  await updateDoc(docRef, { ...truckData, updatedAt: serverTimestamp() });
}

export async function deleteTruck(truckId) {
  const docRef = doc(db, 'trucksForSale', truckId);
  await deleteDoc(docRef);
}

// ==============================
// BOOKINGS
// ==============================

/**
 * Get bookings for a specific user.
 * Uses a simple where() query WITHOUT orderBy to avoid requiring a composite index.
 * Results are sorted client-side instead.
 */
export async function getBookings(userId) {
  if (!userId) {
    console.warn('[getBookings] No userId provided, returning empty array');
    return [];
  }
  try {
    // Query by userId only — no orderBy to avoid composite index requirement
    const q = query(collection(db, 'bookings'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort client-side by createdAt descending
    results.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    console.log(`[getBookings] Fetched ${results.length} bookings for user ${userId}`);
    return results;
  } catch (err) {
    console.error('[getBookings] Firestore query failed:', err.message, err.code);
    // If the error is about a missing index, try fallback without ordering
    throw err;
  }
}

/**
 * Get recent bookings for a specific user (for dashboard).
 * Same approach: where() only, sort + limit client-side.
 */
export async function getRecentBookings(userId, count = 5) {
  if (!userId) {
    console.warn('[getRecentBookings] No userId provided, returning empty array');
    return [];
  }
  try {
    const q = query(collection(db, 'bookings'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort client-side by createdAt descending, then limit
    results.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    console.log(`[getRecentBookings] Fetched ${results.length} bookings, returning ${Math.min(count, results.length)}`);
    return results.slice(0, count);
  } catch (err) {
    console.error('[getRecentBookings] Firestore query failed:', err.message, err.code);
    throw err;
  }
}

/**
 * Get ALL bookings (admin only). No userId filter needed.
 */
export async function getAllBookings() {
  try {
    const snapshot = await getDocs(collection(db, 'bookings'));
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    results.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    console.log(`[getAllBookings] Fetched ${results.length} bookings total`);
    return results;
  } catch (err) {
    console.error('[getAllBookings] Firestore query failed:', err.message, err.code);
    throw err;
  }
}

export async function addBooking(bookingData) {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...bookingData,
    createdAt: serverTimestamp(),
  });
  console.log(`[addBooking] Created booking ${docRef.id}`);
  return docRef.id;
}

export async function updateBookingStatus(bookingId, status) {
  const docRef = doc(db, 'bookings', bookingId);
  await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
  console.log(`[updateBookingStatus] Booking ${bookingId} -> ${status}`);
}

export async function updateBooking(bookingId, data) {
  const docRef = doc(db, 'bookings', bookingId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  console.log(`[updateBooking] Booking ${bookingId} updated:`, Object.keys(data));
}

// ==============================
// PURCHASE REQUESTS (Truck Sales)
// ==============================
export async function addPurchaseRequest(data) {
  const docRef = await addDoc(collection(db, 'purchaseRequests'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPurchaseRequests() {
  const snapshot = await getDocs(collection(db, 'purchaseRequests'));
  const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
  return results;
}

// ==============================
// APPOINTMENTS
// ==============================
export async function getAppointments(userId) {
  try {
    let q;
    if (userId) {
      // User-specific: no orderBy to avoid composite index
      q = query(collection(db, 'appointments'), where('userId', '==', userId));
    } else {
      // Admin: fetch all
      q = query(collection(db, 'appointments'));
    }
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    results.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    return results;
  } catch (err) {
    console.error('[getAppointments] Firestore query failed:', err.message, err.code);
    throw err;
  }
}

export async function addAppointment(appointmentData) {
  const docRef = await addDoc(collection(db, 'appointments'), {
    ...appointmentData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ==============================
// NOTIFICATIONS
// ==============================

/** Get notifications for a specific user */
export async function getNotifications(userId) {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    results.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    return results;
  } catch (err) {
    console.error('[getNotifications] Query failed:', err.message);
    throw err;
  }
}

/** Get admin-targeted notifications (booking/appointment submissions) */
export async function getAdminNotifications() {
  try {
    const q = query(collection(db, 'notifications'), where('forAdmin', '==', true));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    results.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    return results;
  } catch (err) {
    console.error('[getAdminNotifications] Query failed:', err.message);
    throw err;
  }
}

export async function addNotification(notifData) {
  const docRef = await addDoc(collection(db, 'notifications'), {
    ...notifData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function markNotificationRead(notifId) {
  const docRef = doc(db, 'notifications', notifId);
  await updateDoc(docRef, { isNew: false });
}

export async function markAllNotificationsRead(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isNew', '==', true)
  );
  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((d) => updateDoc(d.ref, { isNew: false }));
  await Promise.all(updates);
}

export async function deleteNotification(notifId) {
  const docRef = doc(db, 'notifications', notifId);
  await deleteDoc(docRef);
}

export async function deleteAllUserNotifications(userId) {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const deletions = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletions);
}


// ==============================
// USER PROFILE
// ==============================
export async function getUserProfile(uid) {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateUserProfile(uid, data) {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ==============================
// USER MANAGEMENT (Admin)
// ==============================
export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateUserRole(uid, role) {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, { role, updatedAt: serverTimestamp() });
}
