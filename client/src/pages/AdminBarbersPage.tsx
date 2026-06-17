import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import i18n from '@/lib/i18n';
import {
  ArrowLeft, CheckCircle, XCircle, Star,
  ChevronDown, ChevronUp, ShieldAlert, Pencil, X, Trash2,
} from 'lucide-react';

interface AdminBarber {
  id: string;
  userId: string;
  shopName: string | null;
  phone: string | null;
  address: string | null;
  rating: string | null;
  reviewCount: number | null;
  isApproved: boolean | null;
  isDemo: boolean | null;
  createdAt: string | null;
  haircutPrice: string | null;
  beardPrice: string | null;
  homeServicePrice: number | null;
  homeServiceEnabled: boolean | null;
  user: { email: string | null; firstName: string | null; lastName: string | null };
}

interface AdminPriceRequest {
  id: string;
  barberId: string;
  barberName: string;
  barberShopName: string | null;
  oldHaircutPrice: string;
  oldBeardPrice: string;
  newHaircutPrice: string;
  newBeardPrice: string;
  notes: string | null;
  status: string;
  createdAt: string | null;
}

interface BarberReview {
  rating: number;
  review: string | null;
  customerName: string | null;
  date: string;
  createdAt: string | null;
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ approved }: { approved: boolean | null }) {
  if (approved === true)
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{i18n.t('approved')}</Badge>;
  return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{i18n.t('pending')}</Badge>;
}

function TicketStatusBadge({ status }: { status: string }) {
  if (status === 'approved')
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{i18n.t('resolved')}</Badge>;
  if (status === 'rejected')
    return <Badge variant="destructive">{i18n.t('rejected')}</Badge>;
  return <Badge variant="secondary">{i18n.t('pending')}</Badge>;
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

function BarberReviewsSection({ barberId, reviewCount }: { barberId: string; reviewCount: number | null }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const { data: reviews = [], isLoading } = useQuery<BarberReview[]>({
    queryKey: ['/api/admin/barbers', barberId, 'reviews'],
    queryFn: () => fetch(`/api/admin/barbers/${barberId}/reviews`).then(r => r.json()),
    enabled: open,
  });

  const count = reviewCount ?? 0;
  if (count === 0) return <p className="text-xs text-muted-foreground">{t('noReviewsYet')}</p>;

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-xs text-primary hover:underline">
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? t('hide') : t('show')} {count} {count === 1 ? t('review') : t('reviews')}
      </button>
      {open && (
        <div className="mt-2 space-y-3 border-t pt-3">
          {isLoading
            ? [1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)
            : reviews.map((r, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <StarRow rating={r.rating} />
                  <span className="text-xs font-medium">{r.customerName || t('anonymous')}</span>
                  <span className="text-xs text-muted-foreground">{fmt(r.createdAt)}</span>
                </div>
                {r.review && <p className="text-xs text-muted-foreground leading-relaxed">{r.review}</p>}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

interface AdminService {
  id: string;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  duration: number;
  price: number;
  displayPrice: number | null;
  customerPrice: number | null;
  barberPrice: number | null;
}

function ServicePriceRow({ svc, barberId }: { svc: AdminService; barberId: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [displayPrice, setDisplayPrice] = useState(String(svc.displayPrice ?? svc.price));
  const [customerPrice, setCustomerPrice] = useState(String(svc.customerPrice ?? svc.price));
  const [barberPrice, setBarberPrice] = useState(String(svc.barberPrice ?? svc.price));

  const commission = (parseInt(customerPrice) || 0) - (parseInt(barberPrice) || 0);
  const warn = parseInt(customerPrice) < parseInt(barberPrice);

  const mut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', `/api/admin/services/${svc.id}`, {
        displayPrice: parseInt(displayPrice),
        customerPrice: parseInt(customerPrice),
        barberPrice: parseInt(barberPrice),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/barbers', barberId, 'services'] });
      toast({ title: t('success'), description: t('pricesSaved') });
    },
    onError: (err: Error) => {
      toast({ title: t('error'), description: err.message || t('failedToSavePrices'), variant: 'destructive' });
    },
  });

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-1.5 items-center text-xs py-1.5 border-b last:border-0">
      <span className="font-medium truncate">{svc.nameAr || svc.name}</span>
      <div className="flex flex-col items-end gap-0.5">
        <label className="text-[10px] text-muted-foreground">{t('displayPriceLabel')}</label>
        <input type="number" min="0" value={displayPrice} onChange={e => setDisplayPrice(e.target.value)}
          className="w-16 h-7 rounded border border-input bg-background px-1.5 text-xs text-center" />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <label className="text-[10px] text-muted-foreground">{t('customerPriceLabel')}</label>
        <input type="number" min="0" value={customerPrice} onChange={e => setCustomerPrice(e.target.value)}
          className="w-16 h-7 rounded border border-input bg-background px-1.5 text-xs text-center" />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <label className="text-[10px] text-muted-foreground">{t('barberPriceLabel')}</label>
        <input type="number" min="0" value={barberPrice} onChange={e => setBarberPrice(e.target.value)}
          className="w-16 h-7 rounded border border-input bg-background px-1.5 text-xs text-center" />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <label className="text-[10px] text-muted-foreground">{t('commissionLabel')}</label>
        <span className={`font-semibold ${warn ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
          {commission} {t('sar')}
        </span>
      </div>
      <Button size="sm" className="h-7 text-xs px-2" disabled={mut.isPending || warn} onClick={() => mut.mutate()}>
        {mut.isPending ? '...' : t('save')}
      </Button>
    </div>
  );
}

function BarberServicesEditor({ barber }: { barber: AdminBarber }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data: services = [], isLoading } = useQuery<AdminService[]>({
    queryKey: ['/api/barbers', barber.id, 'services'],
    queryFn: () => fetch(`/api/barbers/${barber.id}/services`).then(r => r.json()),
    enabled: open,
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
        <Pencil className="h-3 w-3" />
        {t('editServicePrices')}
      </button>
    );
  }

  return (
    <div className="mt-2 border rounded-lg p-3 bg-muted/20 space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">{t('editServicePrices')}</span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {isLoading
        ? <p className="text-xs text-muted-foreground py-2">{t('loading')}</p>
        : services.map(svc => <ServicePriceRow key={svc.id} svc={svc} barberId={barber.id} />)
      }
    </div>
  );
}

export default function AdminBarbersPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [approveError, setApproveError] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = isAuthenticated && user?.role === 'admin';

  const { data: barbers = [], isLoading: barbersLoading } = useQuery<AdminBarber[]>({
    queryKey: ['/api/admin/barbers'],
    enabled: isAdmin,
  });

  const { data: priceRequests = [], isLoading: priceLoading } = useQuery<AdminPriceRequest[]>({
    queryKey: ['/api/admin/price-change-requests'],
    enabled: isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const res = await fetch(`/api/admin/barbers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/barbers'] }),
    onError: (err: Error, vars) => setApproveError(prev => ({ ...prev, [vars.id]: err.message })),
  });

  const priceRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/price-change-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/price-change-requests'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/barbers/${id}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/barbers'] });
      setDeletingId(null);
    },
    onError: () => setDeletingId(null),
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

  const pendingPriceRequests = priceRequests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-6 py-4">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('backToAdmin')}
          </Button>
          <h1 className="text-xl font-bold">{t('allBarbers')}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-8">

        {/* Barbers list */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs">
            {t('barbers')} ({barbers.length})
          </h2>
          {barbersLoading
            ? [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)
            : barbers.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-8">{t('noBarbersRegistered')}</p>
            : barbers.map(barber => (
              <Card key={barber.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{barber.shopName || t('unnamedShop')}</p>
                        <StatusBadge approved={barber.isApproved} />
                        {barber.isDemo && (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                            {t('demoBarber')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {[barber.user.firstName, barber.user.lastName].filter(Boolean).join(' ') || t('noName')}
                        {' · '}{barber.user.email || t('noEmail')}
                      </p>
                      {barber.address && <p className="text-sm text-muted-foreground truncate">{barber.address}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {(barber.reviewCount ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 stroke-amber-400" />
                            {barber.rating ?? '0'} ({barber.reviewCount} {t('reviews')})
                          </span>
                        )}
                        {barber.phone && <span>{barber.phone}</span>}
                        <span>{t('registered')} {fmt(barber.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {barber.haircutPrice && <span>{t('haircut')}: {barber.haircutPrice} SAR</span>}
                        {barber.beardPrice && <span>{t('beardTrim')}: {barber.beardPrice} SAR</span>}
                        {barber.homeServiceEnabled && barber.homeServicePrice != null && (
                          <span>{t('homeService')}: {barber.homeServicePrice} SAR</span>
                        )}
                      </div>
                      {approveError[barber.id] && (
                        <p className="text-xs text-destructive">{approveError[barber.id]}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col gap-1 items-end">
                      {barber.isApproved !== true ? (
                        <Button size="sm" variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                          disabled={approveMutation.isPending}
                          onClick={() => {
                            setApproveError(prev => ({ ...prev, [barber.id]: '' }));
                            approveMutation.mutate({ id: barber.id, isApproved: true });
                          }}>
                          <CheckCircle className="h-4 w-4 mr-1" />{t('approve')}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline"
                          className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                          disabled={approveMutation.isPending}
                          onClick={() => {
                            setApproveError(prev => ({ ...prev, [barber.id]: '' }));
                            approveMutation.mutate({ id: barber.id, isApproved: false });
                          }}>
                          <XCircle className="h-4 w-4 mr-1" />{t('reject')}
                        </Button>
                      )}
                      {barber.isDemo && (
                        deletingId === barber.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(barber.id)}>
                              {deleteMutation.isPending ? t('deleting') : t('confirmDelete')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingId(barber.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-1" />{t('deleteBarber')}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    <BarberReviewsSection barberId={barber.id} reviewCount={barber.reviewCount} />
                    <BarberServicesEditor barber={barber} />
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </section>

        {/* Price change requests */}
        {(pendingPriceRequests.length > 0 || priceLoading) && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs">
              {t('pendingPriceChanges')} ({pendingPriceRequests.length})
            </h2>
            {priceLoading
              ? [1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)
              : pendingPriceRequests.map(req => (
                <Card key={req.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold">{req.barberShopName || t('unnamedShop')}</p>
                        <p className="text-sm text-muted-foreground">{req.barberName}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <TicketStatusBadge status={req.status} />
                        <span className="text-xs text-muted-foreground">{fmt(req.createdAt)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t('haircut')}</p>
                        <p>
                          <span className="line-through text-muted-foreground">{req.oldHaircutPrice} {t('sar')}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-semibold text-green-700 dark:text-green-400">{req.newHaircutPrice} {t('sar')}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t('beardTrim')}</p>
                        <p>
                          <span className="line-through text-muted-foreground">{req.oldBeardPrice} {t('sar')}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-semibold text-green-700 dark:text-green-400">{req.newBeardPrice} {t('sar')}</span>
                        </p>
                      </div>
                    </div>
                    {req.notes && (
                      <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-2">"{req.notes}"</p>
                    )}
                    <div className="flex gap-2 pt-1 border-t">
                      <Button size="sm" variant="outline"
                        className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                        disabled={priceRequestMutation.isPending}
                        onClick={() => priceRequestMutation.mutate({ id: req.id, status: 'approved' })}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />{t('approve')}
                      </Button>
                      <Button size="sm" variant="outline"
                        className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                        disabled={priceRequestMutation.isPending}
                        onClick={() => priceRequestMutation.mutate({ id: req.id, status: 'rejected' })}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />{t('reject')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </section>
        )}
      </main>
    </div>
  );
}
