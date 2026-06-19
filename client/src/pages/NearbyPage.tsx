import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import BarberCard from '@/components/BarberCard';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import type { Barber } from '@/lib/types';

export default function NearbyPage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const [maxDistance, setMaxDistance] = useState(5);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const isRTL = i18n.language === 'ar';

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

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div className="min-h-full">
      {/* ── Header ─────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 safe-area-top"
        style={{
          background: 'var(--ds-bg-secondary)',
          borderBottom: '1px solid var(--ds-bg-tertiary)',
        }}
      >
        <div className="flex items-center px-4 py-3">
          <button
            className="p-2 rounded-xl transition-opacity active:opacity-60 shrink-0"
            style={{ background: 'rgba(176,132,66,0.10)' }}
            onClick={() => window.history.back()}
            aria-label="back"
            data-testid="button-back"
          >
            <BackIcon className="h-5 w-5" style={{ color: 'var(--ds-gold-primary)' }} />
          </button>
          <h1
            className="flex-1 text-center text-base font-bold"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            {t('nearbyBarbers')}
          </h1>
          {/* Spacer keeps the title visually centered */}
          <div className="w-9 h-9 shrink-0" />
        </div>
      </header>

      <main className="px-4 pt-5 pb-8 space-y-5">
        {/* ── Distance slider ─────────────────────── */}
        <div className="ds-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
              {t('distance')}
            </span>
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(176,132,66,0.12)', color: 'var(--ds-gold-primary)' }}
            >
              {maxDistance} {t('km')}
            </span>
          </div>
          <Slider
            value={[maxDistance]}
            onValueChange={([value]) => setMaxDistance(value)}
            max={10}
            min={1}
            step={0.5}
            data-testid="slider-distance"
          />
        </div>

        {/* ── Result count ────────────────────────── */}
        {!isLoading && (
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--ds-text-tertiary)' }}>
              {barbers.length} {barbers.length === 1 ? t('barber') : t('nearbyBarbers')}
            </span>
          </div>
        )}

        {/* ── Loading skeletons ───────────────────── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-card p-4 flex items-center gap-4"
                style={{ border: '1px solid rgba(176,132,66,0.12)' }}
              >
                <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>

        ) : barbers.length > 0 ? (
          /* ── Barber cards ──────────────────────── */
          <div className="space-y-3">
            {barbers.map((barber, idx) => (
              <div
                key={barber.id}
                className="animate-fade-slide-up"
                style={{ animationDelay: `${idx * 65}ms` }}
              >
                <BarberCard
                  barber={barber}
                  onClick={() => navigate(`/barber/${barber.id}`)}
                />
              </div>
            ))}
          </div>

        ) : (
          /* ── Empty state ───────────────────────── */
          <div
            className="rounded-2xl py-10 text-center"
            style={{
              border: '1px solid rgba(176,132,66,0.15)',
              background: 'rgba(176,132,66,0.03)',
            }}
          >
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(176,132,66,0.10)' }}
            >
              <MapPin className="h-7 w-7" style={{ color: 'var(--ds-gold-primary)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>
              {t('noBarbersFound')}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
