import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import i18n from '@/lib/i18n';
import { CheckCircle, ClipboardList, ShieldAlert } from 'lucide-react';

interface EmployeeTask {
  id: string;
  title: string;
  message: string;
  assignedTo: string;
  createdBy: string;
  status: string;
  createdAt: string | null;
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function TaskStatusBadge({ status }: { status: string }) {
  if (status === 'done')
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{i18n.t('done')}</Badge>;
  return <Badge variant="secondary">{i18n.t('pending')}</Badge>;
}

export default function EmployeeTasksPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  const isEmployee = isAuthenticated && user?.role === 'employee';

  const { data: tasks = [], isLoading } = useQuery<EmployeeTask[]>({
    queryKey: ['/api/tasks'],
    queryFn: () => fetch('/api/tasks').then(r => r.json()),
    enabled: isEmployee,
  });

  const doneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}/done`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: t('taskMarkedDone') });
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

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{t('myTasks')}</h1>
              <p className="text-sm text-muted-foreground">{t('loggedInAs')} {user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>{t('backToHome')}</Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-6">

        {/* Pending tasks */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{t('pending')}</h2>
            {pendingTasks.length > 0 && (
              <Badge variant="secondary">{pendingTasks.length}</Badge>
            )}
          </div>

          {isLoading
            ? [1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)
            : pendingTasks.length === 0
            ? <p className="text-sm text-muted-foreground py-4 text-center">{t('noTasksAssigned')}</p>
            : pendingTasks.map(task => (
              <Card key={task.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{task.title}</p>
                        <TaskStatusBadge status={task.status} />
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{task.message}</p>
                      <p className="text-xs text-muted-foreground">{fmt(task.createdAt)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20 shrink-0"
                      disabled={doneMutation.isPending}
                      onClick={() => doneMutation.mutate(task.id)}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      {t('markAsDone')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </section>

        {/* Done tasks */}
        {doneTasks.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold text-muted-foreground">{t('done')}</h2>
            {doneTasks.map(task => (
              <Card key={task.id} className="opacity-60">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium line-through">{task.title}</p>
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <p className="text-sm text-muted-foreground line-through whitespace-pre-wrap break-words">{task.message}</p>
                  <p className="text-xs text-muted-foreground">{fmt(task.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
