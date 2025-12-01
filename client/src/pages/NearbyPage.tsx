import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import BarberCard from '@/components/BarberCard';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, MapPin } from 'lucide-react';
import { getNearbyBarbers } from '@/lib/mock-data';

export default function NearbyPage() {
  const [, navigate] = useLocation();
  const [maxDistance, setMaxDistance] = useState(5);
  const barbers = getNearbyBarbers(maxDistance);

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
          <h1 className="text-xl font-bold">Nearby Barbers</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Distance</span>
              <span className="text-sm text-muted-foreground">{maxDistance} km</span>
            </div>
            <Slider
              value={[maxDistance]}
              onValueChange={([value]) => setMaxDistance(value)}
              max={10}
              min={1}
              step={0.5}
              data-testid="slider-distance"
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {barbers.length} barber{barbers.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {barbers.length > 0 ? (
          <div className="space-y-3">
            {barbers.map((barber) => (
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
                No barbers found within {maxDistance} km
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
