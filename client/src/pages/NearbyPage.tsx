import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import BarberCard from '@/components/BarberCard';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { Barber } from '@/lib/types';

export default function NearbyPage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const [maxDistance, setMaxDistance] = useState(5);
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
    queryKey: ['/api/barbers/nearby', userLocation?.lat, userLocation?.lng, maxDistance],
    queryFn: async () => {
      if (!userLocation) return [];
      const res = await fetch(`/api/barbers/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${maxDistance}`);
      if (!res.ok) throw new Error('Failed to fetch barbers');
      return res.json();
    },
    enabled: !!userLocation,
    refetchInterval: 30_000,
  });

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t('nearbyBarbers')}</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">{t('distance')}</span>
              <span className="text-sm text-muted-foreground">{maxDistance} {t('km')}</span>
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
            {barbers.length} {barbers.length === 1 ? t('barber') : t('nearbyBarbers')}
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
      </main>

    </div>
  );
}
