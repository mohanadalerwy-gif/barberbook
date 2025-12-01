import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BarberCard from '@/components/BarberCard';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Scissors, Clock, Star, MapPin } from 'lucide-react';
import type { Barber } from '@/lib/types';

export default function BookPage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: 25.2048, lng: 55.2708 });
        }
      );
    } else {
      setUserLocation({ lat: 25.2048, lng: 55.2708 });
    }
  }, []);

  const { data: barbers = [], isLoading } = useQuery<Barber[]>({
    queryKey: ['/api/barbers/nearby', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) return [];
      const res = await fetch(`/api/barbers/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5`);
      if (!res.ok) throw new Error('Failed to fetch barbers');
      return res.json();
    },
    enabled: !!userLocation,
  });

  const popularServices = [
    { name: 'Haircut', icon: Scissors, duration: '30 min' },
    { name: 'Beard Trim', icon: Scissors, duration: '15 min' },
    { name: 'Full Service', icon: Star, duration: '45 min' },
  ];

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t('bookAppointment')}</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <section>
          <h2 className="font-semibold mb-3">{t('quickBook')}</h2>
          <div className="grid grid-cols-3 gap-3">
            {popularServices.map((service) => (
              <Card 
                key={service.name}
                className="cursor-pointer hover-elevate"
                onClick={() => barbers.length > 0 && navigate(`/barber/${barbers[0].id}`)}
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
          <h2 className="font-semibold mb-3">{t('availableBarbers')}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('selectBarberToBook')}
          </p>
          
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : barbers.length > 0 ? (
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
