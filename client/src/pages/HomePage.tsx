import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isToday, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import PromoCarousel from '@/components/PromoCarousel';
import ErrorBoundary from '@/components/ErrorBoundary';
import BookingCard, { type Booking } from '@/components/BookingCard';
import { type BarberBooking } from '@/components/BarberBookingCard';
import {
  Calendar, Navigation, Bell, TrendingUp, Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logo from '../assets/logo.png';

export default function HomePage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (user?.role === 'employee') navigate('/employee');
  }, [user?.role]);

  const isBarber   = isAuthenticated && user?.role === 'barber';
  const isCustomer = isAuthenticated && user?.role !== 'barber';

  // ── Customer bookings (unchanged) ────────────────────────────────────────
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    enabled: isCustomer,
    refetchInterval: 30_000,
  });

  // ── Barber bookings — same cache key; server already returns incoming ────
  const { data: barberBookings = [], isLoading: barberLoading } = useQuery<BarberBooking[]>({
    queryKey: ['/api/bookings'],
    enabled: isBarber,
    refetchInterval: 30_000,
  });

  const upcomingBookings = bookings.filter(
    b =>
      b.status === 'pending' || b.status === 'confirmed' || b.status === 'accepted' ||
      b.status === 'traveling' || b.status === 'arrived' ||
      (b.status === 'completed' && !b.rating),
  );

  const greeting = user?.firstName ? `مرحباً، ${user.firstName}` : 'مرحباً بك';

  // ── Barber summary calculations (same logic as BarberDashboard) ──────────
  const earning = (b: BarberBooking) => b.barberEarning ?? b.price;
  const completedToday = barberBookings.filter(
    b => b.status === 'completed' && isToday(parseISO(b.date)),
  );
  const todayEarnings = completedToday.reduce((sum, b) => sum + earning(b), 0);
  const pendingCount  = barberBookings.filter(b => b.status === 'pending').length;

  return (
    <div className="min-h-full">

      {/* ══════════════════ BARBER HOME ══════════════════ */}
      {isBarber && (
        <>
          {/* Header strip — same height as customer hero top */}
          <section className="hero-section hero-extend-top relative">
            <div className="flex items-center justify-between px-5 pt-4">
              <button
                className="p-2.5 rounded-xl transition-opacity active:opacity-60"
                aria-label="Notifications"
                style={{ background: 'rgba(176,132,66,0.10)' }}
              >
                <Bell className="h-5 w-5" style={{ color: 'var(--ds-gold-primary)' }} />
              </button>
            </div>

            {/* Greeting */}
            <div className="flex flex-col items-center px-5 pt-3 pb-8">
              <p
                className="text-2xl font-bold text-center"
                style={{ color: 'var(--ds-gold-primary)' }}
              >
                {greeting}
              </p>
              <p className="mt-1 text-sm text-center text-muted-foreground">
                إليك ملخص يومك
              </p>
            </div>
          </section>

          <main className="px-4 pt-4 pb-8 space-y-4">
            {barberLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : (
              <>
                {/* ── Today's earnings card ── */}
                <div
                  className="ds-card"
                  style={{ padding: '20px 16px', borderTop: '3px solid var(--ds-gold-primary)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(176,132,66,0.12)' }}
                    >
                      <TrendingUp className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
                    </span>
                    <span className="font-semibold text-sm">أرباح اليوم</span>
                  </div>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: 'var(--ds-gold-primary)' }}
                  >
                    {todayEarnings}
                    <span className="text-base font-medium ms-1.5 text-muted-foreground">{t('sar')}</span>
                  </p>
                  {completedToday.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {completedToday.length} {completedToday.length === 1 ? 'موعد مكتمل' : 'مواعيد مكتملة'} اليوم
                    </p>
                  )}
                </div>

                {/* ── Pending requests card (tappable → /my-appointments) ── */}
                <button
                  className="ds-card w-full text-start"
                  style={{ padding: '16px', display: 'block' }}
                  onClick={() => navigate('/my-appointments')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(176,132,66,0.12)' }}
                      >
                        <Clock className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
                      </span>
                      <div>
                        <p className="font-semibold text-sm">الطلبات الجديدة</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pendingCount > 0
                            ? `${pendingCount} ${pendingCount === 1 ? 'طلب ينتظر موافقتك' : 'طلبات تنتظر موافقتك'}`
                            : 'لا توجد طلبات جديدة'}
                        </p>
                      </div>
                    </div>
                    {pendingCount > 0 && (
                      <span
                        className="h-7 min-w-7 px-2 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'var(--ds-gold-primary)' }}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </div>
                </button>
              </>
            )}
          </main>
        </>
      )}

      {/* ══════════════════ CUSTOMER / GUEST HOME (unchanged) ══════════════════ */}
      {!isBarber && (
        <>
          {/* ── Hero ──────────────────────────────────── */}
          <section className="hero-section hero-extend-top relative">
            {/* Icon row */}
            <div className="flex items-center justify-between px-5 pt-4">
              <button
                className="p-2.5 rounded-xl transition-opacity active:opacity-60"
                aria-label="Notifications"
                style={{ background: 'rgba(176,132,66,0.10)' }}
              >
                <Bell className="h-5 w-5" style={{ color: 'var(--ds-gold-primary)' }} />
              </button>
            </div>

            {/* Logo + tagline + CTA buttons */}
            <div className="flex flex-col items-center px-5 pt-4 pb-7">
              <img
                src={logo}
                alt="SHVI"
                className="hero-logo"
                style={{ height: 220, maxWidth: '80%', width: 'auto', objectFit: 'contain', opacity: 1 }}
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
                  className="flex-1 btn-secondary h-12 flex items-center justify-center gap-2"
                  onClick={() => navigate('/book')}
                  data-testid="button-book-appointment"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{t('bookAppointment')}</span>
                </button>
                <button
                  className="flex-1 btn-secondary h-12 flex items-center justify-center gap-2"
                  onClick={() => navigate('/nearby')}
                  data-testid="button-nearby-barbers"
                >
                  <Navigation className="h-4 w-4" />
                  <span>اقرب حلاق</span>
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

            {isCustomer && !bookingsLoading && upcomingBookings.length === 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(176,132,66,0.12)' }}
                  >
                    <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--ds-gold-primary)' }} />
                  </span>
                  {t('upcomingAppointments')}
                </h2>
                <div
                  className="rounded-2xl py-8 text-center"
                  style={{ border: '1px solid rgba(176,132,66,0.15)', background: 'rgba(176,132,66,0.03)' }}
                >
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2.5"
                    style={{ background: 'rgba(176,132,66,0.10)' }}
                  >
                    <Calendar className="h-6 w-6" style={{ color: 'var(--ds-gold-primary)' }} />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('noUpcomingAppointments')}</p>
                </div>
              </section>
            )}

            {isCustomer && !bookingsLoading && upcomingBookings.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(176,132,66,0.12)' }}
                  >
                    <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--ds-gold-primary)' }} />
                  </span>
                  {t('upcomingAppointments')}
                </h2>
                <div className="space-y-3">
                  {upcomingBookings.map((b, idx) => (
                    <div key={b.id} className="animate-fade-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
                      <BookingCard booking={b} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Promo carousel ──────────────────────── */}
            <ErrorBoundary>
              <PromoCarousel />
            </ErrorBoundary>
          </main>
        </>
      )}

    </div>
  );
}
