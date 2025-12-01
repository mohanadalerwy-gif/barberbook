export type UserRole = 'customer' | 'barber' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface BarberShop {
  id: string;
  name: string;
  address: string;
  phone: string;
  image?: string;
}

export interface Barber {
  id: string;
  name: string;
  shopId: string;
  shopName: string;
  avatar: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  bio: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  image?: string;
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
