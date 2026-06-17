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
  distance?: number;
  priceRange: string;
  address: string;
  bio: string;
  isApproved: boolean;
  lat: number;
  lng: number;
  shopName?: string;
  phone?: string;
  haircutPrice?: number;
  beardPrice?: number;
}

export interface Service {
  id: string;
  barberId: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  duration: number;
  price: number;
  displayPrice?: number | null;
  customerPrice?: number | null;
  barberPrice?: number | null;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface Booking {
  id: string;
  bookingId: string;
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
