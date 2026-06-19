import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import BarberCard from '@/components/BarberCard';
import {
  MapPin, Calendar, Navigation, CheckCircle, Star, Home, Bell, Menu,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { openMapsApp } from '@/lib/maps-utils';
import type { Barber } from '@/lib/types';
import logo from '../assets/logo.png';

interface Booking {
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

function BookingCard({ booking }: { booking: Booking }) {
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

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    accepted:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    traveling: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    arrived:   'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div
      className="rounded-2xl bg-card overflow-hidden"
      style={{
        border: '1px solid rgba(176,132,66,0.15)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-semibold">{booking.serviceName}</p>
            <p className="text-sm text-muted-foreground">{t('with')} {booking.barberName}</p>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(booking.date), 'EEE, MMM d')} {t('at')} {booking.time}
            </p>
            {isHomeService ? (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Home className="h-3.5 w-3.5 shrink-0" />
                {booking.customerAddress || t('homeService', 'Home Service')}
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {booking.barberAddress || '—'}
                </p>
                {booking.barberAddress && (
                  <button
                    className="flex items-center gap-1 text-xs mt-0.5"
                    style={{ color: 'var(--gold)' }}
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
                    Open Location
                  </button>
                )}
              </>
            )}
          </div>
          <div className="text-right shrink-0">
            <Badge
              variant="secondary"
              className={statusColors[booking.status] ?? ''}
            >
              {(booking.status === 'confirmed' || booking.status === 'accepted') && (
                <CheckCircle className="h-3 w-3 mr-1" />
              )}
              {t(booking.status)}
            </Badge>
            <p className="text-sm font-semibold mt-2" style={{ color: 'var(--gold)' }}>
              {booking.price} {t('sar')}
            </p>
          </div>
        </div>

        {showReviewForm && (
          <div className="border-t pt-3 space-y-2" style={{ borderColor: 'rgba(176,132,66,0.15)' }}>
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
          <div className="border-t pt-3 flex items-center gap-2 text-sm text-muted-foreground"
               style={{ borderColor: 'rgba(176,132,66,0.15)' }}>
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            {t('reviewSubmitted', 'Thanks for your review!')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (user?.role === 'employee') navigate('/employee');
  }, [user?.role]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        ()  => setUserLocation({ lat: 25.2048, lng: 55.2708 }),
      );
    } else {
      setUserLocation({ lat: 25.2048, lng: 55.2708 });
    }
  }, []);

  const { data: nearbyBarbers = [], isLoading: barbersLoading } = useQuery<Barber[]>({
    queryKey: ['/api/barbers/nearby', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) return [];
      const res = await fetch(`/api/barbers/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5`);
      if (!res.ok) throw new Error('Failed to fetch barbers');
      return res.json();
    },
    enabled: !!userLocation,
    refetchInterval: 30_000,
  });

  const isCustomer = isAuthenticated && user?.role !== 'barber';

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    enabled: isCustomer,
    refetchInterval: 30_000,
  });

  const upcomingBookings = bookings.filter(
    b =>
      b.status === 'pending' || b.status === 'confirmed' || b.status === 'accepted' ||
      b.status === 'traveling' || b.status === 'arrived' ||
      (b.status === 'completed' && !b.rating),
  );

  const greeting = user?.firstName ? `مرحباً، ${user.firstName}` : 'مرحباً بك';

  return (
    <div className="min-h-full">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero-section safe-area-top relative">
        {/* Icon row */}
        <div className="flex items-center justify-between px-5 pt-4">
          <button
            className="p-2.5 rounded-xl transition-opacity active:opacity-60"
            aria-label="Notifications"
            style={{ background: 'rgba(176,132,66,0.10)' }}
          >
            <Bell className="h-5 w-5" style={{ color: 'var(--gold)' }} />
          </button>
          <button
            className="p-2.5 rounded-xl transition-opacity active:opacity-60"
            aria-label="Menu"
            style={{ background: 'rgba(176,132,66,0.10)' }}
          >
            <Menu className="h-5 w-5" style={{ color: 'var(--gold)' }} />
          </button>
        </div>

        {/* Logo + tagline + CTA buttons */}
        <div className="flex flex-col items-center px-5 pt-4 pb-7">
          <img
            src={logo}
            alt="SHVI"
            className="hero-logo"
            style={{ height: 120, width: 'auto', objectFit: 'contain', opacity: 1 }}
          />
          <p className="mt-3 text-sm font-semibold text-center text-foreground/85">
            {greeting}
          </p>
          <p className="mt-1 text-xs font-medium text-center hero-tagline">
            وقتك أغلى من الانتظار
          </p>

          {/* Two action buttons side by side */}
          <div className="mt-5 flex gap-3 w-full">
            <button
              className="flex-1 hero-book-btn h-12 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
              onClick={() => navigate('/book')}
              data-testid="button-book-appointment"
            >
              <Calendar className="h-4 w-4" />
              <span className="font-semibold text-sm">{t('bookAppointment')}</span>
            </button>
            <button
              className="flex-1 hero-nearby-btn h-12 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
              onClick={() => navigate('/nearby')}
              data-testid="button-nearby-barbers"
            >
              <Navigation className="h-4 w-4" />
              <span className="font-semibold text-sm">{t('nearbyBarbers')}</span>
            </button>
          </div>
        </div>
      </section>

      <main className="px-4 pt-4 pb-8 space-y-5">
        {/* ── Upcoming bookings ───────────────────── */}
        {isCustomer && bookingsLoading && (
          <section className="space-y-3">
            <Skeleton className="h-6 w-48 rounded-xl" />
            {[1, 2].map(i => (
              <div
                key={i}
                className="rounded-2xl bg-card p-4"
                style={{ border: '1px solid rgba(176,132,66,0.12)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {isCustomer && !bookingsLoading && upcomingBookings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0"
                style={{ background: 'rgba(176,132,66,0.12)' }}
              >
                <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />
              </span>
              {t('upcomingAppointments')}
            </h2>
            <div className="space-y-3">
              {upcomingBookings.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          </section>
        )}

        {/* ── Nearby barbers ──────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">{t('barbersNearYou')}</h2>
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: 'rgba(176,132,66,0.1)', color: 'var(--gold)' }}
            >
              {t('within5km')}
            </span>
          </div>

          {barbersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
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
          ) : nearbyBarbers.length > 0 ? (
            <div className="space-y-3">
              {nearbyBarbers.map((barber, idx) => (
                <div
                  key={barber.id}
                  className="animate-fade-slide-up"
                  style={{ animationDelay: `${idx * 65}ms` }}
                >
                  <BarberCard barber={barber} onClick={() => navigate(`/barber/${barber.id}`)} />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl py-10 text-center"
              style={{
                border: '1px solid rgba(176,132,66,0.15)',
                background: 'rgba(176,132,66,0.03)',
              }}
            >
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(176,132,66,0.1)' }}
              >
                <MapPin className="h-7 w-7" style={{ color: 'var(--gold)' }} />
              </div>
              <p className="text-sm text-muted-foreground">{t('noBarbersFound')}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
