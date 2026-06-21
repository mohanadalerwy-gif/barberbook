import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar, Navigation, CheckCircle, Star, Home, MapPin } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { openMapsApp } from '@/lib/maps-utils';

export interface Booking {
  id: string;
  bookingId: string;
  barberId: string;
  barberName: string;
  barberAddress: string;
  barberLat: string | null;
  barberLng: string | null;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'accepted' | 'declined' | 'completed' | 'cancelled' | 'traveling' | 'arrived';
  duration: number;
  price: number;
  rating: number | null;
  review: string | null;
  bookingType?: string | null;
  customerAddress?: string | null;
}

const statusBadgeClass: Record<string, string> = {
  confirmed: 'badge-ds badge-confirmed',
  accepted:  'badge-ds badge-confirmed',
  completed: 'badge-ds badge-completed',
  traveling: 'badge-ds badge-traveling',
  arrived:   'badge-ds badge-arrived',
  pending:   'badge-ds badge-pending',
  declined:  'badge-ds badge-declined',
  cancelled: 'badge-ds badge-cancelled',
};

export default function BookingCard({ booking }: { booking: Booking }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isCompleted = booking.status === 'completed';
  const isHomeService = booking.bookingType === 'home';
  const showReviewForm = isCompleted && !booking.rating && !submitted;
  const showSubmittedThanks = isCompleted && (!!booking.rating || submitted);

  const handleSubmitReview = async () => {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await apiRequest('POST', `/api/bookings/${booking.id}/review`, { rating: selected, review: comment });
      setSubmitted(true);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      }, 2500);
    } catch {
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="appointment-card">
      {/* Row 1: barber name + status badge */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="font-bold text-sm leading-tight" style={{ color: 'var(--ds-text-primary)' }}>
          {booking.barberName}
        </p>
        <span className={statusBadgeClass[booking.status] ?? 'badge-ds badge-pending'}>
          {(booking.status === 'confirmed' || booking.status === 'accepted') && (
            <CheckCircle className="h-3 w-3" />
          )}
          {t(booking.status)}
        </span>
      </div>

      {/* Service name */}
      <p className="font-semibold mb-2.5">{booking.serviceName}</p>

      {/* Date / time */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ds-gold-primary)' }} />
        <span>{format(parseISO(booking.date), 'EEE, MMM d')} {t('at')} {booking.time}</span>
      </div>

      {/* Location + price row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isHomeService ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Home className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ds-gold-primary)' }} />
              <span className="truncate">{booking.customerAddress || t('homeService', 'Home Service')}</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ds-gold-primary)' }} />
                <span className="truncate">{booking.barberAddress || '—'}</span>
              </div>
              {booking.barberAddress && (
                <button
                  className="flex items-center gap-1 text-xs mt-1 ms-5 transition-opacity active:opacity-60"
                  style={{ color: 'var(--ds-gold-primary)' }}
                  onClick={() => {
                    const lat = parseFloat(booking.barberLat ?? '');
                    const lng = parseFloat(booking.barberLng ?? '');
                    if (!isNaN(lat) && !isNaN(lng)) {
                      openMapsApp({ lat, lng, name: booking.barberName });
                    } else {
                      window.open(`https://www.google.com/maps/search/?q=${encodeURIComponent(booking.barberAddress)}`, '_blank');
                    }
                  }}
                >
                  <Navigation className="h-3 w-3" />
                  {t('openLocation', 'Open Location')}
                </button>
              )}
            </div>
          )}
        </div>
        <p className="text-base font-bold shrink-0" style={{ color: 'var(--ds-gold-primary)' }}>
          {booking.price} <span className="text-sm font-medium">{t('sar')}</span>
        </p>
      </div>

      {/* Review form */}
      {showReviewForm && (
        <div className="border-t mt-3 pt-3 space-y-2" style={{ borderColor: 'var(--ds-bg-tertiary)' }}>
          <p className="text-sm font-medium">{t('rateYourVisit', 'Rate your visit')}</p>
          <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setSelected(star)}
                onMouseEnter={() => setHovered(star)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className="h-6 w-6"
                  fill={(hovered || selected) >= star ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  style={{ color: (hovered || selected) >= star ? '#f59e0b' : '#d1d5db' }}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder={t('leaveComment', 'Leave a comment (optional)')}
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <Button
            size="sm"
            onClick={handleSubmitReview}
            disabled={!selected || submitting}
            className="w-full"
          >
            {submitting ? t('loading', 'Submitting…') : t('submitReview', 'Submit review')}
          </Button>
        </div>
      )}

      {showSubmittedThanks && (
        <div className="border-t mt-3 pt-3 flex items-center gap-2 text-sm text-muted-foreground"
             style={{ borderColor: 'var(--ds-bg-tertiary)' }}>
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          {t('reviewSubmitted', 'Thanks for your review!')}
        </div>
      )}
    </div>
  );
}
