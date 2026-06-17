import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import BarberCard from '@/components/BarberCard';
import { MapPin, Calendar, Navigation, Scissors, Sparkles, CheckCircle, Star, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { openMapsApp } from '@/lib/maps-utils';
import type { Barber } from '@/lib/types';
import lightBg from '@assets/light_background.png';
import darkBg from '@assets/dark_background.png';
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

function DecorativeAccent() {
  return (
    <div className="flex justify-center py-2">
      <div className="flex items-center gap-2 opacity-40">
        <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/50" />
        <Sparkles className="h-4 w-4 text-primary" />
        <Scissors className="h-5 w-5 text-primary rotate-45" />
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/50" />
      </div>
    </div>
  );
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
    console.log('[review] submitting', { bookingId: booking.id, rating: selected, review: comment });
    try {
      await apiRequest('POST', `/api/bookings/${booking.id}/review`, { rating: selected, review: comment });
      console.log('[review] success');
      setSubmitted(true);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      }, 2500);
    } catch (err) {
      console.error('[review] error', err);
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Main booking info */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-medium">{booking.serviceName}</p>
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
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
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
              className={
                booking.status === 'confirmed' || booking.status === 'accepted'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : booking.status === 'completed'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : booking.status === 'traveling'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : booking.status === 'arrived'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                  : ''
              }
            >
              {(booking.status === 'confirmed' || booking.status === 'accepted') && <CheckCircle className="h-3 w-3 mr-1" />}
              {t(booking.status)}
            </Badge>
            <p className="text-sm font-medium mt-2">{booking.price} {t('sar')}</p>
          </div>
        </div>

        {/* Review form for completed, unreviewed bookings */}
        {showReviewForm && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-sm font-medium">{t('rateYourVisit', 'Rate your visit')}</p>
            <div
              className="flex gap-1"
              onMouseLeave={() => setHovered(0)}
            >
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
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
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

        {/* Thank-you message after review is saved */}
        {showSubmittedThanks && (
          <div className="border-t pt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            {t('reviewSubmitted', 'Thanks for your review!')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          setLocation({ lat: 25.2048, lng: 55.2708 });
        }
      );
    } else {
      setLocation({ lat: 25.2048, lng: 55.2708 });
    }
  }, []);

  const { data: nearbyBarbers = [], isLoading: barbersLoading } = useQuery<Barber[]>({
    queryKey: ['/api/barbers/nearby', location?.lat, location?.lng],
    queryFn: async () => {
      if (!location) return [];
      const res = await fetch(`/api/barbers/nearby?lat=${location.lat}&lng=${location.lng}&radius=5`);
      if (!res.ok) throw new Error('Failed to fetch barbers');
      return res.json();
    },
    enabled: !!location,
    refetchInterval: 30_000,
  });

  // Show bookings for any authenticated non-barber (customers and admins)
  const isCustomer = isAuthenticated && user?.role !== 'barber';

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    enabled: isCustomer,
    refetchInterval: 30_000,
  });

  // Show any active booking: pending/confirmed/accepted/traveling/arrived
  // Also show completed bookings without a review so the customer can rate
  const upcomingBookings = bookings.filter(
    b => b.status === 'pending' || b.status === 'confirmed' || b.status === 'accepted' ||
         b.status === 'traveling' || b.status === 'arrived' ||
         (b.status === 'completed' && !b.rating)
  );

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${isDarkMode ? darkBg : lightBg})` }}
    >
      <div className="min-h-screen bg-background/70 backdrop-blur-[2px]">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
          <div className="flex items-center justify-center">
            <img src={logo} alt="SHVI" style={{ maxHeight: 80, width: 'auto', objectFit: 'contain', background: 'transparent', border: 'none', boxShadow: 'none' }} />
          </div>
        </header>

        <DecorativeAccent />

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

          {isCustomer && bookingsLoading && (
            <section className="space-y-3">
              <Skeleton className="h-7 w-52" />
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="space-y-2 items-end flex flex-col">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {isCustomer && !bookingsLoading && upcomingBookings.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {t('upcomingAppointments')}
              </h2>
              <div className="space-y-3">
                {upcomingBookings.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('barbersNearYou')}</h2>
              <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-gradient-to-r from-primary/5 to-transparent">
                {t('within5km')}
              </span>
            </div>

            {barbersLoading ? (
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
                    <BarberCard barber={barber} onClick={() => navigate(`/barber/${barber.id}`)} />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="py-8 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('noBarbersFound')}</p>
                </CardContent>
              </Card>
            )}
          </section>
        </main>

      </div>
    </div>
  );
}
