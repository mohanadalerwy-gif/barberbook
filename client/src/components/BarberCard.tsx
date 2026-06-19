import { useTranslation } from 'react-i18next';
import { Star, MapPin, Store, Scissors, ChevronLeft } from 'lucide-react';
import type { Barber } from '@/lib/types';

interface BarberCardProps {
  barber: Barber;
  onClick?: () => void;
}

export default function BarberCard({ barber, onClick }: BarberCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="rounded-2xl bg-card cursor-pointer transition-transform active:scale-[0.98] hover-elevate overflow-hidden"
      style={{
        border: '1px solid rgba(176,132,66,0.18)',
        boxShadow: '0 2px 14px rgba(0,0,0,0.06)',
      }}
      onClick={onClick}
      data-testid={`card-barber-${barber.id}`}
    >
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="h-16 w-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold"
            style={{
              background: 'rgba(176,132,66,0.1)',
              border: '2px solid rgba(176,132,66,0.22)',
              color: 'var(--gold)',
            }}
          >
            {barber.avatar ? (
              <img src={barber.avatar} alt={barber.name} className="h-full w-full object-cover" />
            ) : (
              barber.name.charAt(0)
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base truncate leading-tight">{barber.name}</h3>
              <ChevronLeft className="h-4 w-4 shrink-0 mt-0.5 opacity-35 text-muted-foreground" />
            </div>

            {barber.shopName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Store className="h-3 w-3 shrink-0" />
                <span className="truncate">{barber.shopName}</span>
              </div>
            )}

            {/* Rating + distance */}
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold">{barber.rating}</span>
                {barber.reviewCount > 0 && (
                  <span className="text-xs text-muted-foreground">({barber.reviewCount})</span>
                )}
              </div>
              {barber.distance !== undefined && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{barber.distance} {t('km')}</span>
                </div>
              )}
            </div>

            {/* Price pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {barber.haircutPrice ? (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(176,132,66,0.12)', color: 'var(--gold)' }}
                >
                  <Scissors className="h-2.5 w-2.5" />
                  {barber.haircutPrice} {t('sar')}
                </span>
              ) : null}
              {barber.beardPrice ? (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(176,132,66,0.08)', color: 'var(--gold)' }}
                >
                  {t('beard')}: {barber.beardPrice} {t('sar')}
                </span>
              ) : null}
              {!barber.haircutPrice && !barber.beardPrice && barber.priceRange && (
                <span className="text-xs font-medium" style={{ color: 'var(--gold)' }}>
                  {barber.priceRange}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
