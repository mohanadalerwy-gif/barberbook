import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BarberCard from '@/components/BarberCard';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Scissors, Clock, Star } from 'lucide-react';
import { getNearbyBarbers } from '@/lib/mock-data';

export default function BookPage() {
  const [, navigate] = useLocation();
  const barbers = getNearbyBarbers(5);

  const popularServices = [
    { name: 'Haircut', icon: Scissors, duration: '30 min' },
    { name: 'Beard Trim', icon: Scissors, duration: '15 min' },
    { name: 'Full Service', icon: Star, duration: '45 min' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Book Appointment</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <section>
          <h2 className="font-semibold mb-3">Quick Book</h2>
          <div className="grid grid-cols-3 gap-3">
            {popularServices.map((service) => (
              <Card 
                key={service.name}
                className="cursor-pointer hover-elevate"
                onClick={() => navigate(`/barber/1`)}
              >
                <CardContent className="p-3 text-center">
                  <service.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.duration}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-3">Available Barbers</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select a barber to view their services and book
          </p>
          <div className="space-y-3">
            {barbers.map((barber) => (
              <BarberCard
                key={barber.id}
                barber={barber}
                onClick={() => navigate(`/barber/${barber.id}`)}
              />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
