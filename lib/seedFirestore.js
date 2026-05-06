'use client';

import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Seeds Firestore with initial data. 
 * Call this once from the admin panel or browser console.
 * It checks if data already exists to avoid duplicates.
 */
export async function seedFirestore() {
  const results = [];

  // ====== FLEET TYPES ======
  const fleetTypes = [
    { id: 'closed-van', name: 'Closed Van', capacity: '2,000kg - 4,000kg', icon: '🚐', description: '6-Wheeler Closed Van ideal for general cargo and dry goods', pricePerKm: 85 },
    { id: 'flatbed-truck', name: 'Flatbed Truck', capacity: '10,000kg+', icon: '🚛', description: 'Heavy-duty flatbed for construction materials and oversized cargo', pricePerKm: 120 },
    { id: 'refrigerated', name: 'Refrigerated', capacity: '3,000kg - 5,000kg', icon: '❄️', description: 'Temperature-controlled transport for perishable goods', pricePerKm: 150 },
    { id: 'prime-mover', name: 'Prime Mover', capacity: '20,000kg+', icon: '🚚', description: 'Heavy-duty tractor head for container hauling and port operations', pricePerKm: 200 },
  ];

  const fleetSnap = await getDocs(collection(db, 'fleetTypes'));
  if (fleetSnap.empty) {
    for (const ft of fleetTypes) {
      await setDoc(doc(db, 'fleetTypes', ft.id), ft);
    }
    results.push(`✅ Seeded ${fleetTypes.length} fleet types`);
  } else {
    results.push(`⏭ Fleet types already exist (${fleetSnap.size})`);
  }

  // ====== TRUCKS FOR SALE ======
  const trucksForSale = [
    {
      id: 'truck-001', name: 'Isuzu Giga 10-Wheeler Wing Van', type: 'Wing Van', typeColor: '#F5A623',
      year: 2018, price: 2850000, location: 'SBMA, Subic Bay', mileage: '45,000 km', engine: '6UZ1 Diesel',
      condition: 'Excellent Cond.', image: '/trucks/wing-van.jpg',
      specs: { transmission: 'Manual 6-Speed', fuelType: 'Diesel', horsepower: '360 HP', gvw: '25,000 kg', dimensions: '32ft x 8ft x 8ft (cargo area)', features: ['Air Suspension', 'Power Steering', 'Air Brake System', 'Wing-type cargo doors'] },
      description: 'Well-maintained Isuzu Giga 10-Wheeler Wing Van. Perfect for logistics operations within SBMA and Olongapo area. Regular maintenance at authorized service center. All documents complete.',
    },
    {
      id: 'truck-002', name: 'Hino 700 Series Dump Truck', type: 'Dump Truck', typeColor: '#E8451C',
      year: 2019, price: 3400000, location: 'Olongapo City', mileage: '32,000 km', engine: 'E13C Engine',
      condition: 'Excellent Cond.', image: '/trucks/dump-truck.jpg',
      specs: { transmission: 'Manual 7-Speed', fuelType: 'Diesel', horsepower: '410 HP', gvw: '30,000 kg', dimensions: '20ft x 8ft x 5ft (dump bed)', features: ['Hydraulic Dump System', 'Power Steering', 'Exhaust Brake', 'Heavy-duty chassis'] },
      description: 'Powerful Hino 700 Series Dump Truck. Ideal for construction and quarry operations in the SBMA industrial zone. Low mileage, excellent mechanical condition.',
    },
    {
      id: 'truck-003', name: 'Fuso Super Great Tractor Head', type: 'Hauler', typeColor: '#27AE60',
      year: 2017, price: 2150000, location: 'SBMA, Industrial Park', mileage: '58,000 km', engine: '6M70 Turbo',
      condition: 'Excellent Cond.', image: '/trucks/tractor-head.jpg',
      specs: { transmission: 'Manual 9-Speed', fuelType: 'Diesel', horsepower: '380 HP', gvw: '45,000 kg (GCW)', dimensions: 'Tractor Head Configuration', features: ['Turbo Intercooler', 'Air Suspension Cab', 'Fifth Wheel Coupling', 'Retarder Brake'] },
      description: 'Reliable Fuso Super Great Tractor Head for container hauling from SBMA Port. Well-suited for heavy-duty port-to-warehouse operations.',
    },
    {
      id: 'truck-004', name: 'Scania R-Series Fuel Tanker', type: 'Tanker', typeColor: '#F5A623',
      year: 2020, price: 4200000, location: 'Olongapo, East Bajac-Bajac', mileage: '18,500 km', engine: 'DC13 13-Litre',
      condition: 'Excellent Cond.', image: '/trucks/fuel-tanker.jpg',
      specs: { transmission: 'Automated Manual (Opticruise)', fuelType: 'Diesel', horsepower: '450 HP', gvw: '35,000 kg', dimensions: '20,000L tank capacity', features: ['ADR Compliant', 'Bottom Loading', 'Vapor Recovery System', 'Emergency Shutoff'] },
      description: 'Premium Scania R-Series Fuel Tanker. Low mileage, complete with all safety certifications for fuel transport operations.',
    },
    {
      id: 'truck-005', name: 'Isuzu Elf Dropside Truck', type: 'Hauler', typeColor: '#27AE60',
      year: 2015, price: 980000, location: 'SBMA, Naval Supply', mileage: '72,000 km', engine: '4JJ1 Diesel',
      condition: 'Excellent Cond.', image: '/trucks/dropside.jpg',
      specs: { transmission: 'Manual 5-Speed', fuelType: 'Diesel', horsepower: '150 HP', gvw: '8,500 kg', dimensions: '14ft x 7ft x 2ft (flatbed)', features: ['Dropside Panels', 'Power Steering', 'ABS Brakes', 'Dual Rear Wheels'] },
      description: 'Versatile Isuzu Elf Dropside Truck. Great for medium-duty hauling within SBMA and surrounding Olongapo areas.',
    },
    {
      id: 'truck-006', name: 'Hino Ranger Wing Van', type: 'Wing Van', typeColor: '#F5A623',
      year: 2016, price: 1650000, location: 'Olongapo City Center', mileage: '65,000 km', engine: 'J08E Engine',
      condition: 'Excellent Cond.', image: '/trucks/hino-wing.jpg',
      specs: { transmission: 'Manual 6-Speed', fuelType: 'Diesel', horsepower: '260 HP', gvw: '15,000 kg', dimensions: '24ft x 8ft x 8ft (cargo area)', features: ['Wing-type Doors', 'Aluminum Body', 'Power Gate', 'GPS Tracking Ready'] },
      description: 'Reliable Hino Ranger Wing Van for logistics and distribution operations. Perfect for Olongapo CBD deliveries.',
    },
  ];

  const trucksSnap = await getDocs(collection(db, 'trucksForSale'));
  if (trucksSnap.empty) {
    for (const truck of trucksForSale) {
      await setDoc(doc(db, 'trucksForSale', truck.id), truck);
    }
    results.push(`✅ Seeded ${trucksForSale.length} trucks for sale`);
  } else {
    results.push(`⏭ Trucks already exist (${trucksSnap.size})`);
  }

  // ====== BOOKINGS ======
  const bookings = [
    { id: 'GCLT-SB-9021', truckRoute: 'Heavy Duty Flatbed', pickup: 'Subic Port Pier 15 (SBMA)', delivery: 'to Olongapo Industrial Estate', date: 'Oct 24, 2024', status: 'In Transit', statusColor: '#F5A623', paymentMethod: 'stripe', userId: 'user-001' },
    { id: 'GCLT-SB-8851', truckRoute: 'Container Hauler', pickup: 'Tipo Gate Logistics Center', delivery: 'to Argorint Warehouse, SBMA', date: 'Oct 25, 2024', status: 'In Transit', statusColor: '#1565D8', paymentMethod: 'cod', userId: 'user-001' },
    { id: 'GCLT-SB-8712', truckRoute: 'Refrigerated Van', pickup: 'Rizal Highway Hub', delivery: 'to Subic Freeport Zone Market', date: 'Oct 26, 2024', status: 'Scheduled', statusColor: '#6B7280', paymentMethod: 'stripe', userId: 'user-001' },
    { id: 'GCLT-SB-8600', truckRoute: 'Box Truck (10 Wheeler)', pickup: 'Halawen Tech Park', delivery: 'to Olongapo City Proper', date: 'Oct 28, 2024', status: 'Scheduled', statusColor: '#6B7280', paymentMethod: 'cod', userId: 'user-001' },
    { id: 'GCLT-SB-8591', truckRoute: 'Car Carrier', pickup: 'Subic International Terminal', delivery: 'to Ford Olongapo Showroom', date: 'Nov 01, 2024', status: 'Scheduled', statusColor: '#6B7280', paymentMethod: 'stripe', userId: 'user-001' },
  ];

  const bookingsSnap = await getDocs(collection(db, 'bookings'));
  if (bookingsSnap.empty) {
    for (const b of bookings) {
      await setDoc(doc(db, 'bookings', b.id), { ...b, createdAt: serverTimestamp() });
    }
    results.push(`✅ Seeded ${bookings.length} bookings`);
  } else {
    results.push(`⏭ Bookings already exist (${bookingsSnap.size})`);
  }


  // ====== NOTIFICATIONS ======
  const notifs = [
    { id: 'notif-001', type: 'booking', icon: '🚛', title: 'Booking Confirmed', message: 'Your transport request from SBMA Port Terminal 3 to Olongapo Industrial Park has been approved. A driver will be assigned shortly.', location: 'SBMA Wharf Terminal 3', time: '10 mins ago', isNew: true, actions: ['View Details', 'Mark as Read'], userId: 'user-001' },
    { id: 'notif-002', type: 'appointment', icon: '📋', title: 'Viewing Scheduled', message: 'Your appointment to inspect the 2022 Isuzu Giga is confirmed at our Olongapo Main Hub. Please bring your valid ID.', location: 'GCLT Olongapo Main Hub', time: '2 hours ago', isNew: true, actions: ['View Details', 'Mark as Read'], userId: 'user-001' },
    { id: 'notif-003', type: 'payment', icon: '✅', title: 'Payment Received', message: 'Receipt #GCLT-8829 for the SBMA-Olongapo freight service has been generated and sent to your email.', time: '5 hours ago', isNew: false, actions: ['View Details'], userId: 'user-001' },
    { id: 'notif-004', type: 'system', icon: '🔴', title: 'Route Delay Alert', message: 'Severe traffic congestion reported near the Olongapo City entrance. Expect a 30-minute delay for all incoming SBMA deliveries.', location: 'Olongapo Gateway', time: 'Yesterday', isNew: false, actions: ['View Details'], userId: 'user-001' },
    { id: 'notif-005', type: 'system', icon: '🔔', title: 'Profile Updated', message: 'Your business address has been successfully updated to 122 Rizal Ave, Olongapo City.', time: '2 days ago', isNew: false, actions: ['View Details'], userId: 'user-001' },
    { id: 'notif-006', type: 'booking', icon: '🚛', title: 'Service Completed', message: 'The delivery from SBMA Free Trade Zone to Olongapo Distribution Center was successfully completed by driver Juan Dela Cruz.', location: 'SBMA Free Trade Zone', time: '3 days ago', isNew: false, actions: ['View Details'], userId: 'user-001' },
  ];

  const notifSnap = await getDocs(collection(db, 'notifications'));
  if (notifSnap.empty) {
    for (const n of notifs) {
      await setDoc(doc(db, 'notifications', n.id), { ...n, createdAt: serverTimestamp() });
    }
    results.push(`✅ Seeded ${notifs.length} notifications`);
  } else {
    results.push(`⏭ Notifications already exist (${notifSnap.size})`);
  }

  // ====== CUSTOMERS ======
  const customers = [
    { id: 'C-001', name: 'Robert Santos', email: 'robert.s@logistics.ph', phone: '+63 917 123 4567', bookings: 12, status: 'Active' },
    { id: 'C-002', name: 'Llena Garcia', email: 'llena.g@trade.ph', phone: '+63 918 234 5678', bookings: 8, status: 'Active' },
    { id: 'C-003', name: 'Michael Chen', email: 'michael.c@import.ph', phone: '+63 919 345 6789', bookings: 15, status: 'Active' },
    { id: 'C-004', name: 'Sarah Villa', email: 'sarah.v@fresh.ph', phone: '+63 920 456 7890', bookings: 3, status: 'Inactive' },
    { id: 'C-005', name: 'David Lopez', email: 'david.l@export.ph', phone: '+63 921 567 8901', bookings: 6, status: 'Active' },
  ];

  const custSnap = await getDocs(collection(db, 'customers'));
  if (custSnap.empty) {
    for (const c of customers) {
      await setDoc(doc(db, 'customers', c.id), { ...c, createdAt: serverTimestamp() });
    }
    results.push(`✅ Seeded ${customers.length} customers`);
  } else {
    results.push(`⏭ Customers already exist (${custSnap.size})`);
  }

  // ====== APPOINTMENTS ======
  const appointments = [
    { id: 'APT-001', truck: 'Isuzu Giga 10-Wheeler Wing Van', location: 'SBMA, Subic Bay', date: 'Oct 30, 2024', time: '10:00 AM', status: 'Confirmed', customer: 'Robert Santos', userId: 'user-001' },
    { id: 'APT-002', truck: 'Hino 700 Series Dump Truck', location: 'Olongapo City', date: 'Nov 02, 2024', time: '2:00 PM', status: 'Pending', customer: 'Llena Garcia', userId: 'user-001' },
    { id: 'APT-003', truck: 'Scania R-Series Fuel Tanker', location: 'Olongapo, East Bajac-Bajac', date: 'Nov 05, 2024', time: '9:00 AM', status: 'Confirmed', customer: 'Michael Chen', userId: 'user-001' },
  ];

  const aptSnap = await getDocs(collection(db, 'appointments'));
  if (aptSnap.empty) {
    for (const a of appointments) {
      await setDoc(doc(db, 'appointments', a.id), { ...a, createdAt: serverTimestamp() });
    }
    results.push(`✅ Seeded ${appointments.length} appointments`);
  } else {
    results.push(`⏭ Appointments already exist (${aptSnap.size})`);
  }

  return results;
}
