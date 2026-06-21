import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import BookingCard, { type Booking } from '@/components/BookingCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuth } from '@/hooks/useAuth';

function SectionEmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl py-7 text-center"
      style={{ border: '1px solid rgba(176,132,66,0.15)', background: 'rgba(176,132,66,0.03)' }}
    >
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center mx-auto mb-2"
        style={{ background: 'rgba(176,132,66,0.10)' }}
      >
        <Calendar className="h-5 w-5" style={{ color: 'var(--ds-gold-primary)' }} />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h2 className="text-base font-bold flex items-center gap-2">
      <span
        className="w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0"
        style={{ background: 'rgba(176,132,66,0.12)' }}
      >
        <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--ds-gold-primary)' }} />
      </span>
      {label}
    </h2>
  );
}

export default function MyAppointmentsPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const isCustomer = isAuthenticated && user?.role !== 'barber';

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
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

  const pastBookings = bookings.filter(
    b =>
      (b.status === 'completed' && !!b.rating) ||
      b.status === 'declined' ||
      b.status === 'cancelled',
  );

  return (
    <div className="min-h-full">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40" style={{ background: 'transparent' }}>
        <div className="flex items-center justify-center px-4 pt-1 pb-2.5">
          <h1
            className="text-sm font-bold"
            style={{ color: 'var(--ds-gold-primary)' }}
          >
            {t('myAppointments')}
          </h1>
        </div>
        <div style={{ height: 1, background: 'rgba(176,132,66,0.15)', marginInline: 16 }} />
      </header>

      <main className="px-4 pt-4 pb-8 space-y-6">
        {/* ── Loading skeletons ── */}
        {isLoading && (
          <>
            <section className="space-y-3">
              <Skeleton className="h-5 w-32 rounded-xl" />
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
          </>
        )}

        {!isLoading && (
          <>
            {/* ── Upcoming section ── */}
            <section className="space-y-3">
              <SectionHeader label={t('upcomingAppointments')} />
              {upcomingBookings.length === 0 ? (
                <SectionEmptyState message={t('noUpcomingAppointments')} />
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b, idx) => (
                    <ErrorBoundary key={b.id}>
                      <div className="animate-fade-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
                        <BookingCard booking={b} />
                      </div>
                    </ErrorBoundary>
                  ))}
                </div>
              )}
            </section>

            {/* ── Past section ── */}
            <section className="space-y-3">
              <SectionHeader label={t('pastAppointments')} />
              {pastBookings.length === 0 ? (
                <SectionEmptyState message={t('noPast')} />
              ) : (
                <div className="space-y-3">
                  {pastBookings.map((b, idx) => (
                    <ErrorBoundary key={b.id}>
                      <div className="animate-fade-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                        <BookingCard booking={b} />
                      </div>
                    </ErrorBoundary>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
