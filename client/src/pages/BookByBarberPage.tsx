import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Star, Scissors, Store } from 'lucide-react';
import type { Barber } from '@/lib/types';
import { toAbsoluteUrl } from '@/lib/queryClient';

const GOLD = 'var(--ds-gold-primary, #B08442)';
const BG_PRIMARY = 'var(--ds-bg-primary, #FAF8F5)';
const BG_SECONDARY = 'var(--ds-bg-secondary, #F3EFE8)';
const TEXT_PRIMARY = 'var(--ds-text-primary, #1A1A1A)';
const TEXT_SECONDARY = 'var(--ds-text-secondary, #8B7355)';
const GOLD_BORDER = 'rgba(176, 132, 66, 0.22)';
const GOLD_SHADOW = '0 2px 10px rgba(176, 132, 66, 0.10)';
const GOLD_SHADOW_HOVER = '0 4px 18px rgba(176, 132, 66, 0.22)';
const GOLD_BORDER_HOVER = 'rgba(176, 132, 66, 0.46)';
const BG_HOVER = '#EDE5D6';

export default function BookByBarberPage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const { data: barbers = [], isLoading } = useQuery<Barber[]>({
    queryKey: ['/api/barbers'],
    queryFn: async () => {
      const res = await fetch(toAbsoluteUrl('/api/barbers'));
      if (!res.ok) throw new Error('Failed to fetch barbers');
      return res.json();
    },
  });

  return (
    <div
      className="min-h-screen backdrop-blur-sm"
      style={{ background: 'rgba(250, 248, 245, 0.82)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b px-4 py-4"
        style={{
          background: 'rgba(250, 248, 245, 0.92)',
          borderColor: GOLD_BORDER,
        }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
            style={{ color: GOLD }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1
            className="text-xl font-bold"
            style={{ color: GOLD, fontFamily: 'Tajawal, sans-serif' }}
          >
            {t('bookByBarber')}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        <p className="text-sm mb-4" style={{ color: TEXT_SECONDARY }}>
          {t('selectBarberToBook')}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: BG_SECONDARY,
                  border: `1px solid ${GOLD_BORDER}`,
                  boxShadow: GOLD_SHADOW,
                }}
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : barbers.length > 0 ? (
          <div className="space-y-3">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="rounded-xl p-4 cursor-pointer transition-all duration-150 active:scale-[0.985]"
                onClick={() => navigate(`/barber/${barber.id}`)}
                data-testid={`barber-card-${barber.id}`}
                style={{
                  background: BG_SECONDARY,
                  border: `1px solid ${GOLD_BORDER}`,
                  boxShadow: GOLD_SHADOW,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = GOLD_SHADOW_HOVER;
                  el.style.borderColor = GOLD_BORDER_HOVER;
                  el.style.background = BG_HOVER;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = GOLD_SHADOW;
                  el.style.borderColor = GOLD_BORDER;
                  el.style.background = BG_SECONDARY;
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(176,132,66,0.14)';
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = BG_HOVER;
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarImage src={barber.avatar} alt={barber.name} />
                    <AvatarFallback
                      style={{
                        background: 'rgba(176, 132, 66, 0.14)',
                        color: GOLD,
                        fontWeight: 700,
                        fontSize: '1.3rem',
                        fontFamily: 'Tajawal, sans-serif',
                      }}
                    >
                      {barber.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-bold text-base truncate"
                      style={{ color: TEXT_PRIMARY, fontFamily: 'Tajawal, sans-serif' }}
                      data-testid={`text-barber-name-${barber.id}`}
                    >
                      {barber.name}
                    </h3>

                    {barber.shopName && (
                      <div
                        className="flex items-center gap-1.5 text-sm mt-0.5"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        <Store className="h-3.5 w-3.5 flex-shrink-0" />
                        <span
                          className="truncate"
                          data-testid={`text-shop-name-${barber.id}`}
                        >
                          {barber.shopName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm" style={{ color: TEXT_SECONDARY }}>
                          {barber.rating || 0}
                        </span>
                      </div>

                      {(barber.haircutPrice || barber.beardPrice) && (
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          {barber.haircutPrice && (
                            <span
                              className="flex items-center gap-1 font-medium"
                              style={{ color: GOLD }}
                            >
                              <Scissors className="h-3 w-3" />
                              {barber.haircutPrice} {t('sar')}
                            </span>
                          )}
                          {barber.beardPrice && (
                            <span style={{ color: TEXT_SECONDARY }}>
                              {t('beard')}: {barber.beardPrice} {t('sar')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl py-8 text-center"
            style={{
              background: BG_SECONDARY,
              border: `1px solid ${GOLD_BORDER}`,
              boxShadow: GOLD_SHADOW,
            }}
          >
            <Scissors
              className="h-12 w-12 mx-auto mb-3"
              style={{ color: 'rgba(176, 132, 66, 0.45)' }}
            />
            <p style={{ color: TEXT_SECONDARY }}>{t('noBarbers')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
