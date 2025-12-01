import type { Barber, Service, Booking, TimeSlot, BarberShop, WorkingHours } from './types';

import barber1 from '@assets/generated_images/barber_profile_photo_1.png';
import barber2 from '@assets/generated_images/barber_profile_photo_2.png';
import barber3 from '@assets/generated_images/barber_profile_photo_3.png';
import haircutImage from '@assets/generated_images/haircut_service_image.png';
import beardImage from '@assets/generated_images/beard_grooming_service_image.png';

// todo: remove mock functionality
export const mockBarberShops: BarberShop[] = [
  { id: '1', name: 'Classic Cuts', address: '123 Main St, Downtown', phone: '(555) 123-4567' },
  { id: '2', name: 'The Gentleman\'s Den', address: '456 Oak Ave, Midtown', phone: '(555) 234-5678' },
  { id: '3', name: 'Sharp & Clean', address: '789 Elm Blvd, Uptown', phone: '(555) 345-6789' },
];

// todo: remove mock functionality
export const mockBarbers: Barber[] = [
  {
    id: '1',
    name: 'Marcus Johnson',
    shopId: '1',
    shopName: 'Classic Cuts',
    avatar: barber1,
    specialty: 'Fades & Modern Styles',
    rating: 4.9,
    reviewCount: 127,
    bio: 'With over 10 years of experience, I specialize in precision fades and contemporary styles.',
  },
  {
    id: '2',
    name: 'David Chen',
    shopId: '2',
    shopName: 'The Gentleman\'s Den',
    avatar: barber2,
    specialty: 'Classic Cuts & Beard Grooming',
    rating: 4.8,
    reviewCount: 89,
    bio: 'Master barber trained in traditional techniques with a modern touch.',
  },
  {
    id: '3',
    name: 'Sarah Williams',
    shopId: '3',
    shopName: 'Sharp & Clean',
    avatar: barber3,
    specialty: 'Creative Styles & Coloring',
    rating: 4.7,
    reviewCount: 156,
    bio: 'Award-winning stylist passionate about creative expression through hair.',
  },
];

// todo: remove mock functionality
export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Classic Haircut',
    description: 'Traditional haircut with consultation, wash, and style',
    duration: 30,
    price: 35,
    image: haircutImage,
  },
  {
    id: '2',
    name: 'Beard Trim',
    description: 'Professional beard shaping, trim, and conditioning',
    duration: 20,
    price: 20,
    image: beardImage,
  },
  {
    id: '3',
    name: 'Full Grooming',
    description: 'Complete package: haircut, beard trim, hot towel, and styling',
    duration: 60,
    price: 65,
    image: haircutImage,
  },
];

// todo: remove mock functionality
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

// todo: remove mock functionality
export const mockBookings: Booking[] = [
  {
    id: '1',
    customerId: 'c1',
    customerName: 'John Smith',
    barberId: '1',
    barberName: 'Marcus Johnson',
    serviceId: '1',
    serviceName: 'Classic Haircut',
    date: '2024-12-02',
    time: '10:00',
    status: 'pending',
    duration: 30,
    price: 35,
  },
  {
    id: '2',
    customerId: 'c2',
    customerName: 'Mike Brown',
    barberId: '1',
    barberName: 'Marcus Johnson',
    serviceId: '3',
    serviceName: 'Full Grooming',
    date: '2024-12-02',
    time: '14:00',
    status: 'confirmed',
    duration: 60,
    price: 65,
  },
  {
    id: '3',
    customerId: 'c3',
    customerName: 'Alex Turner',
    barberId: '2',
    barberName: 'David Chen',
    serviceId: '2',
    serviceName: 'Beard Trim',
    date: '2024-12-03',
    time: '11:30',
    status: 'pending',
    duration: 20,
    price: 20,
  },
];

// todo: remove mock functionality
export const mockWorkingHours: WorkingHours[] = [
  { day: 'Monday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Tuesday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Wednesday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Thursday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Friday', startTime: '09:00', endTime: '18:00', isWorking: true },
  { day: 'Saturday', startTime: '10:00', endTime: '16:00', isWorking: true },
  { day: 'Sunday', startTime: '00:00', endTime: '00:00', isWorking: false },
];
