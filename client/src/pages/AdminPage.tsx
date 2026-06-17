import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import i18n from '@/lib/i18n';
import {
  Users, Scissors, MessageSquare, ShieldAlert,
  CheckCircle, Calendar, Clock,
  DollarSign, TrendingUp, ClipboardList, Plus, ChevronRight,
} from 'lucide-react';

interface AdminStats {
  total: number;
  today: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCommission: number;
  totalCustomerPayments: number;
  totalBarberPayments: number;
  monthlyCommission: number;
  barberCount: number;
  userCount: number;
  ticketCount: number;
  pendingPriceReqCount: number;
  pendingTaskCount: number;
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

interface AdminTask {
  id: string;
  title: string;
  message: string;
  assignedTo: string;
  createdBy: string;
  status: string;
  createdAt: string | null;
  employeeName: string;
  employeeEmail: string | null;
  createdByName: string;
}

interface Employee {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function sar(amount: number) {
  return `${amount.toLocaleString('ar-SA')} ريال`;
}

function StatCard({
  icon, label, value, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
}) {
  const base = (
    <CardContent className="py-4 flex items-center gap-3">
      {icon}
      <div className="flex-1">
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
    </CardContent>
  );
  if (onClick) {
    return (
      <Card className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={onClick}>
        {base}
      </Card>
    );
  }
  return <Card>{base}</Card>;
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

function TaskStatusBadge({ status }: { status: string }) {
  if (status === 'done')
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{i18n.t('done')}</Badge>;
  return <Badge variant="secondary">{i18n.t('pending')}</Badge>;
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskMessage, setTaskMessage] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  const isAdmin = isAuthenticated && user?.role === 'admin';

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: isAdmin,
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<AdminTicket[]>({
    queryKey: ['/api/admin/support-tickets'],
    enabled: isAdmin,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<AdminTask[]>({
    queryKey: ['/api/admin/tasks'],
    queryFn: () => fetch('/api/admin/tasks').then(r => r.json()),
    enabled: isAdmin,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/admin/employees'],
    queryFn: () => fetch('/api/admin/employees').then(r => r.json()),
    enabled: isAdmin,
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

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; assignedTo: string }) => {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setTaskTitle('');
      setTaskMessage('');
      setTaskAssignee('');
      setShowTaskForm(false);
      toast({ title: t('taskCreated') });
    },
    onError: () => toast({ title: t('failedToCreateTask'), variant: 'destructive' }),
  });

  const handleCreateTask = () => {
    if (!taskTitle.trim() || !taskMessage.trim() || !taskAssignee) return;
    createTaskMutation.mutate({ title: taskTitle.trim(), message: taskMessage.trim(), assignedTo: taskAssignee });
  };

  // ── access gates ─────────────────────────────────────────────────────────

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

  const dash = (v: number | undefined, fmt2?: (n: number) => string) =>
    statsLoading
      ? <span className="text-muted-foreground text-base">—</span>
      : fmt2 ? fmt2(v ?? 0) : (v ?? 0);

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
          <StatCard
            icon={<Scissors className="h-7 w-7 text-primary shrink-0" />}
            label={t('barbers')}
            value={dash(stats?.barberCount)}
            onClick={() => navigate('/admin/barbers')}
          />
          <StatCard
            icon={<MessageSquare className="h-7 w-7 text-primary shrink-0" />}
            label={t('tickets')}
            value={dash(stats?.ticketCount)}
          />
          <StatCard
            icon={<Users className="h-7 w-7 text-primary shrink-0" />}
            label={t('users')}
            value={dash(stats?.userCount)}
            onClick={() => navigate('/admin/users')}
          />
          <StatCard
            icon={<DollarSign className="h-7 w-7 text-amber-600 shrink-0" />}
            label={t('pendingPriceReqs')}
            value={dash(stats?.pendingPriceReqCount)}
            onClick={() => navigate('/admin/barbers')}
          />
          <StatCard
            icon={<Calendar className="h-7 w-7 text-primary shrink-0" />}
            label={t('totalBookings')}
            value={dash(stats?.total)}
            onClick={() => navigate('/admin/bookings')}
          />
          <StatCard
            icon={<Clock className="h-7 w-7 text-primary shrink-0" />}
            label={t('todaysBookings')}
            value={dash(stats?.today)}
          />
          <StatCard
            icon={<DollarSign className="h-7 w-7 text-green-600 shrink-0" />}
            label={t('totalCommission')}
            value={dash(stats?.totalCommission, sar)}
          />
          <StatCard
            icon={<TrendingUp className="h-7 w-7 text-green-600 shrink-0" />}
            label={t('monthlyCommission')}
            value={dash(stats?.monthlyCommission, sar)}
          />
        </div>

        {/* Revenue breakdown */}
        {!statsLoading && (stats?.totalCustomerPayments ?? 0) > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{t('revenueBreakdown')}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="space-y-1 bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{t('totalCustomerPayments')}</p>
                  <p className="font-bold text-base">{sar(stats?.totalCustomerPayments ?? 0)}</p>
                </div>
                <div className="space-y-1 bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{t('totalBarberPayments')}</p>
                  <p className="font-bold text-base">{sar(stats?.totalBarberPayments ?? 0)}</p>
                </div>
                <div className="space-y-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{t('totalCommission')}</p>
                  <p className="font-bold text-base text-green-700 dark:text-green-400">{sar(stats?.totalCommission ?? 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Tickets + Tasks */}
        <Tabs defaultValue="tickets">
          <TabsList className="mb-4">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('tickets')}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              {t('tasks')}
              {(stats?.pendingTaskCount ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats?.pendingTaskCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Support Tickets ── */}
          <TabsContent value="tickets" className="space-y-3">
            {ticketsLoading
              ? [1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)
              : tickets.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">{t('noSupportTickets')}</p>
              : tickets.map(ticket => (
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
                      <a href={ticket.photoUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary underline">
                        {t('viewAttachment')}
                      </a>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1 border-t">
                      <p className="text-xs text-muted-foreground">
                        {t('from')}: {ticket.userName || ticket.userEmail || ticket.userId}
                      </p>
                      {ticket.status === 'pending' && (
                        <Button size="sm" variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                          disabled={ticketMutation.isPending}
                          onClick={() => ticketMutation.mutate({ id: ticket.id, status: 'approved' })}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          {t('markAsResolved')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          {/* ── Tasks ── */}
          <TabsContent value="tasks" className="space-y-4">

            {/* Create task button / form */}
            {!showTaskForm ? (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setShowTaskForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('createTask')}
              </Button>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <p className="font-semibold">{t('createTask')}</p>

                  <div className="space-y-1">
                    <Label htmlFor="task-assignee">{t('assignTo')}</Label>
                    {employees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('noEmployeesFound')}</p>
                    ) : (
                      <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                        <SelectTrigger id="task-assignee">
                          <SelectValue placeholder={t('selectEmployee')} />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {[emp.firstName, emp.lastName].filter(Boolean).join(' ') || emp.email || emp.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="task-title">{t('taskTitle')}</Label>
                    <Input
                      id="task-title"
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      placeholder={t('taskTitle')}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="task-message">{t('taskMessage')}</Label>
                    <Textarea
                      id="task-message"
                      value={taskMessage}
                      onChange={e => setTaskMessage(e.target.value)}
                      placeholder={t('taskMessage')}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!taskTitle.trim() || !taskMessage.trim() || !taskAssignee || createTaskMutation.isPending}
                      onClick={handleCreateTask}
                    >
                      {createTaskMutation.isPending ? t('submitting') : t('submitRequest')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setShowTaskForm(false);
                      setTaskTitle('');
                      setTaskMessage('');
                      setTaskAssignee('');
                    }}>
                      {t('cancelled')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tasks list */}
            {tasksLoading
              ? [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)
              : tasks.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">{t('noTasksFound')}</p>
              : tasks.map(task => (
                <Card key={task.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{task.title}</p>
                          <TaskStatusBadge status={task.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('assignedTo')}: <span className="font-medium text-foreground">{task.employeeName}</span>
                          {task.employeeEmail && ` · ${task.employeeEmail}`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{task.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{fmt(task.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
