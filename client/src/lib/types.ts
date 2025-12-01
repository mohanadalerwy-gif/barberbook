export type UserRole = 'customer' | 'barber';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: UserRole;
  avatar?: string;
}

export interface Barber {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  distance: number;
  priceRange: string;
  address: string;
  bio: string;
  isApproved: boolean;
}

export interface Service {
  id: string;
  barberId: string;
  name: string;
  duration: number;
  price: number;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  duration: number;
  price: number;
}

export interface WorkingHours {
  day: string;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export interface Location {
  lat: number;
  lng: number;
}
