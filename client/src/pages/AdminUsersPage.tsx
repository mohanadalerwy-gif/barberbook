import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import i18n from '@/lib/i18n';
import { ArrowLeft, ShieldAlert, Calendar } from 'lucide-react';

interface LastBooking {
  serviceName: string;
  date: string;
  barberName: string;
  barberShopName: string | null;
}

interface AdminUserDetailed {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string | null;
  lastBooking: LastBooking | null;
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin')
    return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">{i18n.t('admin')}</Badge>;
  if (role === 'barber')
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{i18n.t('barber')}</Badge>;
  if (role === 'employee')
    return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">{i18n.t('employee')}</Badge>;
  return <Badge variant="secondary">{i18n.t('customer')}</Badge>;
}

export default function AdminUsersPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const isAdmin = isAuthenticated && user?.role === 'admin';

  const { data: users = [], isLoading } = useQuery<AdminUserDetailed[]>({
    queryKey: ['/api/admin/users-detailed'],
    queryFn: () => fetch('/api/admin/users-detailed').then(r => r.json()),
    enabled: isAdmin,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/users-detailed'] }),
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
          <h1 className="text-xl font-bold">{t('allUsers')}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-3">
        <p className="text-sm text-muted-foreground">{users.length} {t('users').toLowerCase()}</p>

        {isLoading
          ? [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)
          : users.length === 0
          ? <p className="text-sm text-muted-foreground text-center py-8">{t('noUsersFound')}</p>
          : users.map(u => (
            <Card key={u.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{u.email || t('noEmail')}</p>
                      <RoleBadge role={u.role} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || t('noName')}
                      {' · '}{t('joined')} {fmt(u.createdAt)}
                    </p>

                    {u.lastBooking ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>
                          {t('lastBooking')}: <span className="font-medium text-foreground">{u.lastBooking.serviceName}</span>
                          {' '}{t('at')} {u.lastBooking.barberShopName || u.lastBooking.barberName}
                          {' · '}{u.lastBooking.date}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">{t('noBookingsYet')}</p>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col gap-1.5 items-end">
                    {/* Admin toggle */}
                    {u.role !== 'admin' ? (
                      <Button size="sm" variant="outline"
                        className="text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-900/20 text-xs h-7"
                        disabled={roleMutation.isPending}
                        onClick={() => roleMutation.mutate({ id: u.id, role: 'admin' })}>
                        {t('makeAdmin')}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline"
                        className="text-xs h-7"
                        disabled={u.email === user?.email || roleMutation.isPending}
                        onClick={() => roleMutation.mutate({ id: u.id, role: 'customer' })}>
                        {t('removeAdmin')}
                      </Button>
                    )}

                    {/* Employee toggle */}
                    {u.role === 'employee' ? (
                      <Button size="sm" variant="outline"
                        className="text-xs h-7"
                        disabled={roleMutation.isPending}
                        onClick={() => roleMutation.mutate({ id: u.id, role: 'customer' })}>
                        {t('removeEmployee')}
                      </Button>
                    ) : u.role !== 'admin' && u.role !== 'barber' ? (
                      <Button size="sm" variant="outline"
                        className="text-orange-700 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-900/20 text-xs h-7"
                        disabled={roleMutation.isPending}
                        onClick={() => roleMutation.mutate({ id: u.id, role: 'employee' })}>
                        {t('makeEmployee')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </main>
    </div>
  );
}
