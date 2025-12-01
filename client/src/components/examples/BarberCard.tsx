import BarberCard from '../BarberCard';
import { mockBarbers } from '@/lib/mock-data';

export default function BarberCardExample() {
  return (
    <div className="max-w-sm">
      <BarberCard 
        barber={mockBarbers[0]} 
        onBook={(barber) => console.log('Book:', barber.name)}
        onViewProfile={(barber) => console.log('View profile:', barber.name)}
      />
    </div>
  );
}
