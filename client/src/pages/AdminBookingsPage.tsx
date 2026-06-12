import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import i18n from '@/lib/i18n';
import { ArrowLeft, ShieldAlert, Star } from 'lucide-react';

interface AdminBooking {
  id: string;
  bookingId: string;
  date: string;
  time: string;
  status: string;
  rating: number | null;
  review: string | null;
  createdAt: string | null;
  customerName: string;
  customerEmail: string | null;
  barberName: string;
  barberShopName: string | null;
  serviceName: string;
  servicePrice: string;
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function currency(amount: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(parseFloat(amount));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    declined: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  const label = i18n.t(status) || status;
  return <Badge className={map[status] ?? ''}>{label}</Badge>;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className="h-3 w-3"
          fill={s <= rating ? '#f59e0b' : 'none'}
          stroke={s <= rating ? '#f59e0b' : '#d1d5db'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function AdminBookingsPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const isAdmin = isAuthenticated && user?.role === 'admin';

  const { data: bookings = [], isLoading } = useQuery<AdminBooking[]>({
    queryKey: ['/api/admin/bookings'],
    queryFn: () => fetch('/api/admin/bookings').then(r => r.json()),
    enabled: isAdmin,
  });

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
            <p className="font-semibold">{t('accessDenied')}</p>
            <Button variant="outline" onClick={() => navigate('/')}>{t('goHome')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-6 py-4">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('backToAdmin')}
          </Button>
          <h1 className="text-xl font-bold">{t('allBookingsHistory')}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-3">
        <p className="text-sm text-muted-foreground">{bookings.length} {t('totalBookings').toLowerCase()}</p>

        {isLoading
          ? [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)
          : bookings.length === 0
          ? <p className="text-sm text-muted-foreground text-center py-8">{t('noBookingsFound')}</p>
          : bookings.map(b => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={b.status} />
                      <span className="text-xs text-muted-foreground">{b.date} {t('at')} {b.time}</span>
                      <span className="text-xs text-muted-foreground">#{b.bookingId}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">{t('customerName')}: </span>
                        <span className="font-medium">{b.customerName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">{t('barberName')}: </span>
                        <span className="font-medium">{b.barberShopName || b.barberName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">{t('service')}: </span>
                        <span className="font-medium">{b.serviceName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">{t('price')}: </span>
                        <span className="font-medium">{currency(b.servicePrice)}</span>
                      </div>
                    </div>

                    {b.rating !== null && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <StarRow rating={b.rating} />
                        {b.review && <span className="text-xs text-muted-foreground italic">"{b.review}"</span>}
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground shrink-0">{fmt(b.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </main>
    </div>
  );
}
