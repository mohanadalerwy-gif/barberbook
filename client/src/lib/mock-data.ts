import type { Barber, Service, Booking, TimeSlot, WorkingHours } from './types';

import barber1 from '@assets/generated_images/barber_profile_photo_1.png';
import barber2 from '@assets/generated_images/barber_profile_photo_2.png';
import barber3 from '@assets/generated_images/barber_profile_photo_3.png';

export const mockBarbers: Barber[] = [
  {
    id: '1',
    name: 'Marcus Johnson',
    avatar: barber1,
    rating: 4.9,
    reviewCount: 127,
    distance: 0.8,
    priceRange: '25-45 ريال',
    address: '123 Main St',
    bio: 'Professional barber with 10+ years of experience',
    isApproved: true,
    lat: 24.7136,
    lng: 46.6753,
  },
  {
    id: '2',
    name: 'David Chen',
    avatar: barber2,
    rating: 4.8,
    reviewCount: 89,
    distance: 1.2,
    priceRange: '20-40 ريال',
    address: '456 Oak Ave',
    bio: 'Specializing in classic cuts and beard grooming',
    isApproved: true,
    lat: 24.7251,
    lng: 46.6789,
  },
  {
    id: '3',
    name: 'Sarah Williams',
    avatar: barber3,
    rating: 4.7,
    reviewCount: 156,
    distance: 2.5,
    priceRange: '30-55 ريال',
    address: '789 Elm Blvd',
    bio: 'Creative stylist passionate about modern trends',
    isApproved: true,
    lat: 24.6988,
    lng: 46.6912,
  },
];

export const mockServices: Record<string, Service[]> = {
  '1': [
    { id: 's1', barberId: '1', name: 'Haircut', duration: 30, price: 25 },
    { id: 's2', barberId: '1', name: 'Beard Trim', duration: 15, price: 15 },
    { id: 's3', barberId: '1', name: 'Full Service', duration: 45, price: 45 },
  ],
  '2': [
    { id: 's4', barberId: '2', name: 'Haircut', duration: 30, price: 20 },
    { id: 's5', barberId: '2', name: 'Beard Trim', duration: 15, price: 12 },
    { id: 's6', barberId: '2', name: 'Full Service', duration: 45, price: 40 },
  ],
  '3': [
    { id: 's7', barberId: '3', name: 'Haircut', duration: 30, price: 30 },
    { id: 's8', barberId: '3', name: 'Styling', duration: 20, price: 25 },
    { id: 's9', barberId: '3', name: 'Full Service', duration: 60, price: 55 },
  ],
};

export const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 9;
  const endHour = 18;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push({
        id: `${date.toISOString().split('T')[0]}-${time}`,
        time,
        available: Math.random() > 0.3,
      });
    }
  }
  return slots;
};

export const mockBookings: Booking[] = [
  {
    id: '1',
    bookingId: 'SHVI-2024-000001',
    customerId: 'c1',
    customerName: 'John Smith',
    customerPhone: '+1 555-123-4567',
    barberId: '1',
    barberName: 'Marcus Johnson',
    serviceId: 's1',
    serviceName: 'Haircut',
    date: '2024-12-02',
    time: '10:00',
    status: 'confirmed',
    duration: 30,
    price: 25,
  },
  {
    id: '2',
    bookingId: 'SHVI-2024-000002',
    customerId: 'c1',
    customerName: 'John Smith',
    customerPhone: '+1 555-123-4567',
    barberId: '2',
    barberName: 'David Chen',
    serviceId: 's4',
    serviceName: 'Haircut',
    date: '2024-11-28',
    time: '14:00',
    status: 'completed',
    duration: 30,
    price: 20,
  },
];

export const mockBarberBookings: Booking[] = [
  {
    id: 'b1',
    bookingId: 'SHVI-2024-000003',
    customerId: 'c2',
    customerName: 'Mike Brown',
    customerPhone: '+1 555-234-5678',
    barberId: '1',
    barberName: 'Marcus Johnson',
    serviceId: 's1',
    serviceName: 'Haircut',
    date: '2024-12-01',
    time: '09:00',
    status: 'confirmed',
    duration: 30,
    price: 25,
  },
  {
    id: 'b2',
    bookingId: 'SHVI-2024-000004',
    customerId: 'c3',
    customerName: 'Alex Turner',
    customerPhone: '+1 555-345-6789',
    barberId: '1',
    barberName: 'Marcus Johnson',
    serviceId: 's3',
    serviceName: 'Full Service',
    date: '2024-12-01',
    time: '10:30',
    status: 'pending',
    duration: 45,
    price: 45,
  },
  {
    id: 'b3',
    bookingId: 'SHVI-2024-000005',
    customerId: 'c4',
    customerName: 'James Wilson',
    customerPhone: '+1 555-456-7890',
    barberId: '1',
    barberName: 'Marcus Johnson',
    serviceId: 's1',
    serviceName: 'Haircut',
    date: '2024-12-02',
    time: '11:00',
    status: 'pending',
    duration: 30,
    price: 25,
  },
];

export const mockWorkingHours: WorkingHours[] = [
  { day: 'Monday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Tuesday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Wednesday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Thursday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Friday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Saturday', startTime: '10:00', endTime: '16:00', isWorking: true },
  { day: 'Sunday', startTime: '00:00', endTime: '00:00', isWorking: false },
];

export const getNearbyBarbers = (maxDistance: number = 5): Barber[] => {
  return mockBarbers.filter(b => (b.distance ?? Infinity) <= maxDistance && b.isApproved);
};
