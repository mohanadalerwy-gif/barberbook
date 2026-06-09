import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import i18n from '@/lib/i18n';
import {
  Users, Scissors, MessageSquare, ShieldAlert,
  CheckCircle, XCircle, Star, Calendar, Clock,
  DollarSign, TrendingUp, ChevronDown, ChevronUp,
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
  createdAt: string | null;
  user: { email: string | null; firstName: string | null; lastName: string | null };
}

interface AdminTicket {
  id: string;
  userId: string;
  category: string;
  message: string;
  photoUrl: string | null;
  status: string;
  createdAt: string | null;
  userEmail: string | null;
  userName: string | null;
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string | null;
}

interface AdminStats {
  total: number;
  today: number;
  totalRevenue: number;
  monthlyRevenue: number;
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

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function currency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

// ── small components ───────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xl font-bold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
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

function TicketCategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    price_change: i18n.t('priceChange'),
    technical_issue: i18n.t('technicalIssue'),
    general_question: i18n.t('generalQuestion'),
  };
  return <Badge variant="outline">{labels[category] ?? category}</Badge>;
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin')
    return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">{i18n.t('admin')}</Badge>;
  if (role === 'barber')
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{i18n.t('barber')}</Badge>;
  return <Badge variant="secondary">{i18n.t('customer')}</Badge>;
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  const px = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={px}
          fill={s <= rating ? '#f59e0b' : 'none'}
          stroke={s <= rating ? '#f59e0b' : '#d1d5db'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// ── reviews sub-component (lazy-loaded per barber) ─────────────────────────

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
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? t('hide') : t('show')} {count} {count === 1 ? t('review') : t('reviews')}
      </button>

      {open && (
        <div className="mt-2 space-y-3 border-t pt-3">
          {isLoading ? (
            [1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)
          ) : (
            reviews.map((r, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <StarRow rating={r.rating} size="xs" />
                  <span className="text-xs font-medium">{r.customerName || t('anonymous')}</span>
                  <span className="text-xs text-muted-foreground">{fmt(r.createdAt)}</span>
                </div>
                {r.review && <p className="text-xs text-muted-foreground leading-relaxed">{r.review}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [approveError, setApproveError] = useState<Record<string, string>>({});

  const isAdmin = isAuthenticated && user?.role === 'admin';

  const { data: barbers = [], isLoading: barbersLoading } = useQuery<AdminBarber[]>({
    queryKey: ['/api/admin/barbers'],
    enabled: isAdmin,
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<AdminTicket[]>({
    queryKey: ['/api/admin/support-tickets'],
    enabled: isAdmin,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: isAdmin,
  });

  const { data: priceRequests = [], isLoading: priceRequestsLoading } = useQuery<AdminPriceRequest[]>({
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

  const ticketMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/support-tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] }),
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

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] }),
  });

  // ── access gates ──────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">{t('pleaseLogInAdmin')}</p>
            <Button onClick={() => navigate('/login')}>{t('signIn')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
            <p className="font-semibold">{t('accessDenied')}</p>
            <p className="text-sm text-muted-foreground">{t('noAdminPrivileges')}</p>
            <Button variant="outline" onClick={() => navigate('/')}>{t('goHome')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dash = (v: number | undefined, isLoading: boolean, fmt?: (n: number) => string) =>
    isLoading ? <span className="text-muted-foreground text-base">—</span>
              : fmt ? fmt(v ?? 0) : (v ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">{t('adminDashboard')}</h1>
            <p className="text-sm text-muted-foreground">{t('loggedInAs')} {user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>{t('backToApp')}</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Stats — 4 columns on desktop, 2 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Scissors className="h-7 w-7 text-primary shrink-0" />}       label={t('barbers')}          value={dash(barbers.length, barbersLoading)} />
          <StatCard icon={<MessageSquare className="h-7 w-7 text-primary shrink-0" />}  label={t('tickets')}          value={dash(tickets.length, ticketsLoading)} />
          <StatCard icon={<Users className="h-7 w-7 text-primary shrink-0" />}          label={t('users')}            value={dash(users.length, usersLoading)} />
          <StatCard icon={<DollarSign className="h-7 w-7 text-amber-600 shrink-0" />}   label={t('pendingPriceReqs')} value={dash(priceRequests.filter(r => r.status === 'pending').length, priceRequestsLoading)} />
          <StatCard icon={<Calendar className="h-7 w-7 text-primary shrink-0" />}       label={t('totalBookings')}    value={dash(stats?.total, statsLoading)} />
          <StatCard icon={<Clock className="h-7 w-7 text-primary shrink-0" />}          label={t('todaysBookings')}   value={dash(stats?.today, statsLoading)} />
          <StatCard icon={<DollarSign className="h-7 w-7 text-green-600 shrink-0" />}   label={t('totalRevenue')}     value={dash(stats?.totalRevenue, statsLoading, currency)} />
          <StatCard icon={<TrendingUp className="h-7 w-7 text-green-600 shrink-0" />}   label={t('monthlyRevenue')}   value={dash(stats?.monthlyRevenue, statsLoading, currency)} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="barbers">
          <TabsList className="mb-4">
            <TabsTrigger value="barbers" className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              {t('barbers')}
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('tickets')}
            </TabsTrigger>
            <TabsTrigger value="price-requests" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('priceRequests')}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('users')}
            </TabsTrigger>
          </TabsList>

          {/* ── Barbers ── */}
          <TabsContent value="barbers" className="space-y-3">
            {barbersLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)
            ) : barbers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('noBarbersRegistered')}</p>
            ) : (
              barbers.map(barber => (
                <Card key={barber.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{barber.shopName || t('unnamedShop')}</p>
                          <StatusBadge approved={barber.isApproved} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {[barber.user.firstName, barber.user.lastName].filter(Boolean).join(' ') || t('noName')}
                          {' '}&middot;{' '}{barber.user.email || t('noEmail')}
                        </p>
                        {barber.address && (
                          <p className="text-sm text-muted-foreground truncate">{barber.address}</p>
                        )}
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
                        {approveError[barber.id] && (
                          <p className="text-xs text-destructive">{approveError[barber.id]}</p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {barber.isApproved !== true ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                            disabled={approveMutation.isPending}
                            onClick={() => {
                              setApproveError(prev => ({ ...prev, [barber.id]: '' }));
                              approveMutation.mutate({ id: barber.id, isApproved: true });
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('approve')}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                            disabled={approveMutation.isPending}
                            onClick={() => {
                              setApproveError(prev => ({ ...prev, [barber.id]: '' }));
                              approveMutation.mutate({ id: barber.id, isApproved: false });
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t('reject')}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-2">
                      <BarberReviewsSection barberId={barber.id} reviewCount={barber.reviewCount} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ── Support Tickets ── */}
          <TabsContent value="tickets" className="space-y-3">
            {ticketsLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)
            ) : tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('noSupportTickets')}</p>
            ) : (
              tickets.map(ticket => (
                <Card key={ticket.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TicketCategoryBadge category={ticket.category} />
                        <TicketStatusBadge status={ticket.status} />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{fmt(ticket.createdAt)}</span>
                    </div>

                    <p className="text-sm whitespace-pre-wrap break-words">{ticket.message}</p>

                    {ticket.photoUrl && (
                      <a
                        href={ticket.photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline"
                      >
                        {t('viewAttachment')}
                      </a>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1 border-t">
                      <p className="text-xs text-muted-foreground">
                        {t('from')}: {ticket.userName || ticket.userEmail || ticket.userId}
                      </p>
                      {ticket.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                          disabled={ticketMutation.isPending}
                          onClick={() => ticketMutation.mutate({ id: ticket.id, status: 'approved' })}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          {t('markAsResolved')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ── Price Requests ── */}
          <TabsContent value="price-requests" className="space-y-3">
            {priceRequestsLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)
            ) : priceRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('noPriceChangeRequests')}</p>
            ) : (
              priceRequests.map(req => (
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
                          <span className="line-through text-muted-foreground">${req.oldHaircutPrice}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-semibold text-green-700 dark:text-green-400">${req.newHaircutPrice}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t('beardTrim')}</p>
                        <p>
                          <span className="line-through text-muted-foreground">${req.oldBeardPrice}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-semibold text-green-700 dark:text-green-400">${req.newBeardPrice}</span>
                        </p>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-2">
                        "{req.notes}"
                      </p>
                    )}

                    {req.status === 'pending' && (
                      <div className="flex gap-2 pt-1 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                          disabled={priceRequestMutation.isPending}
                          onClick={() => priceRequestMutation.mutate({ id: req.id, status: 'approved' })}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          {t('approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                          disabled={priceRequestMutation.isPending}
                          onClick={() => priceRequestMutation.mutate({ id: req.id, status: 'rejected' })}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          {t('reject')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ── Users ── */}
          <TabsContent value="users" className="space-y-3">
            {usersLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('noUsersFound')}</p>
            ) : (
              users.map(u => (
                <Card key={u.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{u.email || t('noEmail')}</p>
                          <RoleBadge role={u.role} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || t('noName')}
                          {' '}&middot;{' '}{t('joined')} {fmt(u.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {u.role !== 'admin' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-900/20"
                            disabled={roleMutation.isPending}
                            onClick={() => roleMutation.mutate({ id: u.id, role: 'admin' })}
                          >
                            {t('makeAdmin')}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={u.email === user?.email || roleMutation.isPending}
                            onClick={() => roleMutation.mutate({ id: u.id, role: 'customer' })}
                          >
                            {t('removeAdmin')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
