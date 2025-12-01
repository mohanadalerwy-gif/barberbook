import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BarberCard from '@/components/BarberCard';
import BottomNav from '@/components/BottomNav';
import { MapPin, Calendar, Navigation } from 'lucide-react';
import { getNearbyBarbers } from '@/lib/mock-data';
import heroImage from '@assets/generated_images/barber_shop_hero_image.png';

export default function HomePage() {
  const [, navigate] = useLocation();
  const nearbyBarbers = getNearbyBarbers(5);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Current Location</span>
        </div>
        <h1 className="text-xl font-bold mt-1">Find Your Barber</h1>
      </header>

      <main className="space-y-6">
        <div className="w-full h-48 overflow-hidden rounded-b-lg">
          <img 
            src={heroImage} 
            alt="Barber Shop" 
            className="w-full h-full object-cover"
            data-testid="hero-image"
          />
        </div>

        <div className="px-4 space-y-6">
          <div className="grid grid-cols-2 gap-3">
          <Button 
            size="lg" 
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/book')}
            data-testid="button-book-appointment"
          >
            <Calendar className="h-6 w-6" />
            <span>Book Appointment</span>
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/nearby')}
            data-testid="button-nearby-barbers"
          >
            <Navigation className="h-6 w-6" />
            <span>Nearby Barbers</span>
          </Button>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Barbers Near You</h2>
            <span className="text-sm text-muted-foreground">
              Within 5 km
            </span>
          </div>

          {nearbyBarbers.length > 0 ? (
            <div className="space-y-3">
              {nearbyBarbers.map((barber) => (
                <BarberCard
                  key={barber.id}
                  barber={barber}
                  onClick={() => navigate(`/barber/${barber.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No barbers found within 5 km
                </p>
              </CardContent>
            </Card>
          )}
        </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
