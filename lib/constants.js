import { Truck, Container, Boxes, Bone, Package, Ship } from 'lucide-react';

export const FLEET_CATEGORIES = [
  { value: 'Trailer', label: 'Trailer', desc: 'Standard trailer combination for general freight and bulk cargo', placeholder: { name: 'Trailer', capacity: 'Varies' }, icon: Truck },
  { value: 'Flatbed', label: 'Flatbed', desc: 'Open flatbed truck for construction materials and oversized cargo', placeholder: { name: 'Flatbed', capacity: 'Varies' }, icon: Boxes },
  { value: 'Skeletal', label: 'Skeletal', desc: 'Skeletal trailer for container hauling and port operations', placeholder: { name: 'Skeletal', capacity: 'Varies' }, icon: Bone },
  { value: '20 footer', label: '20 Footer', desc: '20ft container truck for standard container transport', placeholder: { name: '20 Footer', capacity: 'Varies' }, icon: Container },
  { value: '40 footer', label: '40 Footer', desc: '40ft container truck for large container shipments', placeholder: { name: '40 Footer', capacity: 'Varies' }, icon: Ship },
];

export const TRUCK_TYPE_INFO = {
  'Heavy Duty': { desc: 'Heavy-duty trucks for full-load and industrial transport', icon: Truck },
  'Medium Duty': { desc: 'Medium-duty trucks for general freight and distribution', icon: Package },
  'Light Duty': { desc: 'Light-duty trucks for small and urgent deliveries', icon: Truck },
  'Dump Truck': { desc: 'Dump trucks for construction, quarry, and aggregates', icon: Truck },
  'Flatbed': { desc: 'Flatbed trucks for building materials and oversized loads', icon: Boxes },
  'Wing Van': { desc: 'Wing vans with side-opening doors for efficient loading', icon: Container },
  'Refrigerated Van': { desc: 'Refrigerated vans for perishable and temperature-controlled cargo', icon: Boxes },
  'Prime Mover': { desc: 'Prime movers for container hauling and port operations', icon: Truck },
};

export const TRUCK_TYPES = [
  'Heavy Duty',
  'Medium Duty',
  'Light Duty',
  'Dump Truck',
  'Flatbed',
  'Wing Van',
  'Refrigerated Van',
  'Prime Mover'
];