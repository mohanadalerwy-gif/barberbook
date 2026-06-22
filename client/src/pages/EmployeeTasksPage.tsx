import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ClipboardList, ShieldAlert } from 'lucide-react';
import logo from '../assets/logo.png';
import { apiRequest, toAbsoluteUrl } from '@/lib/queryClient';

interface EmployeeTask {
  id: string;
  title: string;
  message: string;
  assignedTo: string;
  createdBy: string;
  status: string;
  createdAt: string | null;
}

type FilterTab = 'all' | 'pending' | 'done';

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function EmployeeTasksPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterTab>('all');

  const isEmployee = isAuthenticated && user?.role === 'employee';

  const { data: tasks = [], isLoading } = useQuery<EmployeeTask[]>({
    queryKey: ['/api/tasks'],
    queryFn: () => fetch(toAbsoluteUrl('/api/tasks'), { credentials: 'include' }).then(r => r.json()),
    enabled: isEmployee,
  });

  const doneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', `/api/tasks/${id}/done`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: t('taskMarkedDone') });
    },
    onError: () => {
      toast({ title: t('errorOccurred'), variant: 'destructive' });
    },
  });

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

  if (!isEmployee) {
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

  const totalCount = tasks.length;
  const doneCount = tasks.filter(task => task.status === 'done').length;
  const pendingCount = tasks.filter(task => task.status === 'pending').length;
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  });

  const filteredTasks =
    filter === 'all' ? sortedTasks
    : filter === 'done' ? sortedTasks.filter(task => task.status === 'done')
    : sortedTasks.filter(task => task.status === 'pending');

  const stats = [
    { label: t('totalTasks'), value: totalCount, colorClass: 'text-primary' },
    { label: t('completedTasks'), value: doneCount, colorClass: 'text-green-500' },
    { label: t('remainingTasks'), value: pendingCount, colorClass: 'text-amber-500' },
    { label: t('completionRate'), value: `${completionPct}%`, colorClass: 'text-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="SHVI"
              style={{ height: 36, width: 'auto', objectFit: 'contain', background: 'transparent' }}
            />
            <div>
              <h1 className="text-base font-bold leading-tight">{t('employeeDashboard')}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await fetch(toAbsoluteUrl('/api/logout'), { method: 'POST', credentials: 'include' });
              } catch (_) {}
              queryClient.clear();
              navigate('/login');
            }}
          >
            {t('signOut')}
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="border bg-muted/30">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.colorClass}`}>
                  {isLoading ? '—' : stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress bar */}
        {!isLoading && totalCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('completionRate')}</span>
              <span>{completionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              {t('filterAll')}{totalCount > 0 ? ` (${totalCount})` : ''}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1">
              {t('filterPending')}{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </TabsTrigger>
            <TabsTrigger value="done" className="flex-1">
              {t('filterCompleted')}{doneCount > 0 ? ` (${doneCount})` : ''}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tasks list */}
        <section className="space-y-3">
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">{t('noTasksAssigned')}</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const isDone = task.status === 'done';
              return (
                <Card key={task.id} className={isDone ? 'opacity-55' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          {isDone ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                              {t('done')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">{t('pending')}</Badge>
                          )}
                        </div>
                        {task.message && (
                          <p className={`text-sm whitespace-pre-wrap break-words ${isDone ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                            {task.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{fmt(task.createdAt)}</p>
                      </div>

                      {isDone ? (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                          disabled={doneMutation.isPending}
                          onClick={() => doneMutation.mutate(task.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 ml-1.5" />
                          {t('markAsDone')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
