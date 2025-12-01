import AppointmentCard from '../AppointmentCard';
import { mockBookings, mockBarbers } from '@/lib/mock-data';

export default function AppointmentCardExample() {
  return (
    <div className="max-w-2xl space-y-4">
      {mockBookings.map((booking) => (
        <AppointmentCard 
          key={booking.id}
          booking={booking}
          barberAvatar={mockBarbers.find(b => b.id === booking.barberId)?.avatar}
          onCancel={(b) => console.log('Cancel:', b.id)}
          onAccept={(b) => console.log('Accept:', b.id)}
          onDecline={(b) => console.log('Decline:', b.id)}
          onComplete={(b) => console.log('Complete:', b.id)}
        />
      ))}
    </div>
  );
}
