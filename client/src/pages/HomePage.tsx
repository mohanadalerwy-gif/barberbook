import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BarberCard from '@/components/BarberCard';
import BottomNav from '@/components/BottomNav';
import { MapPin, Calendar, Navigation, Scissors } from 'lucide-react';
import type { Barber } from '@/lib/types';

export default function HomePage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setLocation({ lat: 25.2048, lng: 55.2708 });
        }
      );
    } else {
      setLocation({ lat: 25.2048, lng: 55.2708 });
    }
  }, []);

  const { data: nearbyBarbers = [], isLoading } = useQuery<Barber[]>({
    queryKey: ['/api/barbers/nearby', location?.lat, location?.lng],
    queryFn: async () => {
      if (!location) return [];
      const res = await fetch(`/api/barbers/nearby?lat=${location.lat}&lng=${location.lng}&radius=5`);
      if (!res.ok) throw new Error('Failed to fetch barbers');
      return res.json();
    },
    enabled: !!location,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{t('currentLocation')}</span>
            </div>
            <h1 className="text-xl font-bold mt-1">{t('findYourBarber')}</h1>
          </div>
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-sm">
            <Scissors className="h-5 w-5 text-primary" />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            size="lg" 
            className="h-20 flex-col gap-2 shadow-md hover-elevate"
            onClick={() => navigate('/book')}
            data-testid="button-book-appointment"
          >
            <Calendar className="h-6 w-6" />
            <span>{t('bookAppointment')}</span>
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-20 flex-col gap-2 shadow-md hover-elevate"
            onClick={() => navigate('/nearby')}
            data-testid="button-nearby-barbers"
          >
            <Navigation className="h-6 w-6" />
            <span>{t('nearbyBarbers')}</span>
          </Button>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('barbersNearYou')}</h2>
            <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-gradient-to-r from-primary/5 to-transparent">
              {t('within5km')}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : nearbyBarbers.length > 0 ? (
            <div className="space-y-3">
              {nearbyBarbers.map((barber) => (
                <div key={barber.id} className="shadow-sm hover-elevate rounded-lg transition-all">
                  <BarberCard
                    barber={barber}
                    onClick={() => navigate(`/barber/${barber.id}`)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="py-8 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {t('noBarbersFound')}
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
