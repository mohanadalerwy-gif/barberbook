import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Check,
  X,
  CheckCircle,
  Settings,
  Loader2,
  TrendingUp,
  Navigation,
  MapPin,
  Home,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, parseISO, isToday, isFuture, isSameMonth } from 'date-fns';

interface Booking {
  id: string;
  bookingId: string;
  barberId: string;
  customerId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled' | 'traveling' | 'arrived';
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  duration: number;
  price: number;
  bookingType?: string;
  customerLocation?: string;
  customerAddress?: string;
}

interface WorkingHoursData {
  id?: string;
  barberId?: string;
  day: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

const emptyWorkingHours: WorkingHoursData[] = [];

export default function BarberDashboard() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('today');
  const [hours, setHours] = useState<WorkingHoursData[]>(emptyWorkingHours);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [homeServiceEnabled, setHomeServiceEnabled] = useState(false);

  const barberId = user?.barber?.id;

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'barber')) {
      toast({
        title: t('accessDenied'),
        description: t('barberAccessRequired'),
        variant: "destructive",
      });
      navigate('/profile');
    }
  }, [authLoading, isAuthenticated, user, navigate, toast, t]);

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    enabled: isAuthenticated && user?.role === 'barber',
    refetchInterval: 30_000,
  });

  const { data: workingHoursData, isLoading: hoursLoading } = useQuery<WorkingHoursData[]>({
    queryKey: ['/api/barbers', barberId, 'working-hours'],
    queryFn: async () => {
      if (!barberId) return [];
      const res = await fetch(`/api/barbers/${barberId}/working-hours`);
      if (!res.ok) throw new Error('Failed to fetch working hours');
      return res.json();
    },
    enabled: !!barberId,
  });

  useEffect(() => {
    if (workingHoursData && workingHoursData.length > 0) {
      setHours(workingHoursData);
      setHasUnsavedChanges(false);
    }
  }, [workingHoursData]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest('PATCH', `/api/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: t('success'),
        description: t('bookingUpdated'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToUpdate'),
        variant: "destructive",
      });
    },
  });

  const saveHoursMutation = useMutation({
    mutationFn: async (hoursData: WorkingHoursData[]) => {
      if (!barberId) throw new Error('No barber ID');
      return apiRequest('PUT', `/api/barbers/${barberId}/working-hours`, { hours: hoursData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/barbers', barberId, 'working-hours'] });
      setHasUnsavedChanges(false);
      toast({ title: t('success'), description: t('hoursSaved') });
    },
    onError: () => {
      toast({ title: t('error'), description: t('failedToSaveHours'), variant: "destructive" });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!barberId) throw new Error('No barber ID');
      return apiRequest('PATCH', `/api/barbers/${barberId}`, {
        homeServiceEnabled,
      });
    },
    onSuccess: () => {
      toast({ title: t('success'), description: t('settingsSaved') });
    },
    onError: () => {
      toast({ title: t('error'), description: t('failedToSaveSettings'), variant: "destructive" });
    },
  });

  // Initialize home service settings from barber data
  useEffect(() => {
    if (user?.barber) {
      const barber = user.barber as any;
      setHomeServiceEnabled(barber.homeServiceEnabled ?? false);
    }
  }, [user?.barber]);

  const handleAccept = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'confirmed' });
  };

  const handleDecline = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'declined' });
  };

  const handleComplete = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'completed' });
  };

  const handleTraveling = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'traveling' });
  };

  const handleArrived = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'arrived' });
  };

  const toggleDay = (index: number) => {
    setHours(prev => 
      prev.map((h, i) => i === index ? { ...h, isWorking: !h.isWorking } : h)
    );
    setHasUnsavedChanges(true);
  };

  const updateStartTime = (index: number, time: string) => {
    setHours(prev =>
      prev.map((h, i) => i === index ? { ...h, startTime: time } : h)
    );
    setHasUnsavedChanges(true);
  };

  const updateEndTime = (index: number, time: string) => {
    setHours(prev =>
      prev.map((h, i) => i === index ? { ...h, endTime: time } : h)
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveHours = () => {
    saveHoursMutation.mutate(hours);
  };

  const todayBookings = bookings.filter(b =>
    isToday(parseISO(b.date)) && b.status !== 'declined' && b.status !== 'cancelled'
  );
  const upcomingBookings = bookings.filter(b =>
    isFuture(parseISO(b.date)) && !isToday(parseISO(b.date)) && b.status !== 'declined' && b.status !== 'cancelled'
  );
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pendingHomeBookings = pendingBookings.filter(b => b.bookingType === 'home');
  const pendingSalonBookings = pendingBookings.filter(b => b.bookingType !== 'home');

  const completedBookings = bookings.filter(b => b.status === 'completed');
  const now = new Date();

  const todayEarnings = completedBookings
    .filter(b => isToday(parseISO(b.date)))
    .reduce((sum, b) => sum + b.price, 0);

  const monthEarnings = completedBookings
    .filter(b => isSameMonth(parseISO(b.date), now))
    .reduce((sum, b) => sum + b.price, 0);

  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.price, 0);

  const earningsByDay = completedBookings.reduce((acc, b) => {
    const day = b.date.split('T')[0];
    acc[day] = (acc[day] || 0) + b.price;
    return acc;
  }, {} as Record<string, number>);
  const bestDayEarnings = Object.values(earningsByDay).length > 0
    ? Math.max(...Object.values(earningsByDay))
    : 0;

  const earningsByMonth = completedBookings.reduce((acc, b) => {
    const month = b.date.substring(0, 7);
    acc[month] = (acc[month] || 0) + b.price;
    return acc;
  }, {} as Record<string, number>);
  const bestMonthEarnings = Object.values(earningsByMonth).length > 0
    ? Math.max(...Object.values(earningsByMonth))
    : 0;

  const todayProgressPct = bestDayEarnings > 0 ? Math.min(100, Math.round((todayEarnings / bestDayEarnings) * 100)) : 0;
  const monthProgressPct = bestMonthEarnings > 0 ? Math.min(100, Math.round((monthEarnings / bestMonthEarnings) * 100)) : 0;

  const actionableBookings = bookings.filter(b => ['confirmed', 'completed', 'declined'].includes(b.status));
  const acceptedBookings = bookings.filter(b => ['confirmed', 'completed'].includes(b.status));
  const acceptanceRate = actionableBookings.length > 0
    ? Math.round((acceptedBookings.length / actionableBookings.length) * 100)
    : 0;

  const motivationalLabel = (() => {
    if (todayProgressPct >= 100) return t('newRecord');
    if (todayProgressPct >= 80) return t('almostThere');
    if (todayProgressPct >= 40) return t('greatProgress');
    return t('keepPushing');
  })();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-6">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-6 w-24" />
          </div>
        </header>
        <main className="px-4 py-6 space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </main>
      </div>
    );
  }

  const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : t('barber');

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-6">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/profile')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('dashboard')}</h1>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || ''} alt={userName} />
            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Earnings Stats */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold">{t('myEarnings')}</span>
              <span className="text-xs text-muted-foreground ml-auto">{t('completedJobs')}</span>
            </div>

            {/* Today + This Month */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('todayEarnings')}</p>
                <p className="text-2xl font-bold text-primary">${todayEarnings}</p>
                <div className="space-y-1">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${todayProgressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {todayProgressPct}% {t('ofBestDay')}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('monthEarnings')}</p>
                <p className="text-2xl font-bold">${monthEarnings}</p>
                <div className="space-y-1">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-700"
                      style={{ width: `${monthProgressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {monthProgressPct}% {t('ofBestMonth')}
                  </p>
                </div>
              </div>
            </div>

            {/* Motivational message */}
            {completedBookings.length > 0 && (
              <p className="text-center text-sm font-medium text-primary">{motivationalLabel}</p>
            )}

            {/* All-time + Acceptance Rate */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">{t('allTimeEarnings')}</p>
                <p className="font-semibold">${totalEarnings}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t('acceptanceRate')}</p>
                <p className="font-semibold">
                  {actionableBookings.length > 0 ? `${acceptanceRate}%` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {bookingsLoading && (
          <Card className="border-amber-500/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-36" />
              </div>
              {[1, 2].map(i => (
                <div key={i} className="bg-muted rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Home service pending requests */}
        {!bookingsLoading && pendingHomeBookings.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Home className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">
                  {t('homeServiceRequests')}
                </span>
                <div className="relative inline-flex items-center ml-1">
                  <Badge className="bg-primary text-white font-bold px-2.5 z-10 relative">
                    {pendingHomeBookings.length}
                  </Badge>
                  <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                </div>
                <Badge variant="outline" className="ml-auto text-xs border-primary/40 text-primary">
                  {t('newHomeRequest')}
                </Badge>
              </div>
              <div className="space-y-3">
                {pendingHomeBookings.map((booking) => (
                  <div key={booking.id} className="bg-background rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{booking.customerName}</p>
                        {booking.customerPhone && (
                          <a
                            href={`tel:${booking.customerPhone}`}
                            className="flex items-center gap-1 text-sm text-primary"
                          >
                            <Phone className="h-3 w-3" />
                            {booking.customerPhone}
                          </a>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {booking.serviceName} · {format(parseISO(booking.date), 'EEE, MMM d')} {t('at')} {booking.time}
                        </p>
                        {booking.customerAddress && (
                          <p className="text-xs text-muted-foreground mt-1">{booking.customerAddress}</p>
                        )}
                        {booking.customerLocation && (
                          <a
                            href={`https://maps.google.com/?q=${booking.customerLocation}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary mt-1"
                          >
                            <MapPin className="h-3 w-3" />
                            {t('openInMaps')}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(booking)}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-decline-${booking.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(booking)}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-accept-${booking.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regular pending requests */}
        {!bookingsLoading && pendingSalonBookings.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-400">
                  {t('pendingRequests')}
                </span>
                <div className="relative inline-flex items-center ml-1">
                  <Badge className="bg-amber-500 text-white font-bold px-2.5 z-10 relative">
                    {pendingSalonBookings.length}
                  </Badge>
                  <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
                </div>
              </div>
              <div className="space-y-3">
                {pendingSalonBookings.map((booking) => (
                  <div key={booking.id} className="bg-background rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.serviceName} - {format(parseISO(booking.date), 'EEE, MMM d')} {t('at')} {booking.time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(booking)}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-decline-${booking.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(booking)}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-accept-${booking.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today" data-testid="tab-today">
              {t('today')} ({todayBookings.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              {t('upcoming')} ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="hours" data-testid="tab-hours">
              {t('hours')}
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              {t('serviceSettings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4 space-y-3">
            {bookingsLoading ? (
              [1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : todayBookings.length > 0 ? (
              todayBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onComplete={handleComplete}
                  onTraveling={handleTraveling}
                  onArrived={handleArrived}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  {t('noAppointmentsToday')}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {bookingsLoading ? (
              [1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onComplete={handleComplete}
                  onTraveling={handleTraveling}
                  onArrived={handleArrived}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  {t('noUpcomingAppointments')}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hours" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t('workingHours')}</span>
                </div>
                {hoursLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  hours.map((day, index) => (
                    <div 
                      key={day.day} 
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={day.isWorking}
                          onCheckedChange={() => toggleDay(index)}
                          data-testid={`switch-${day.day.toLowerCase()}`}
                        />
                        <Label className="font-medium">{t(day.day.toLowerCase())}</Label>
                      </div>
                      {day.isWorking ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Select 
                            value={day.startTime}
                            onValueChange={(value) => updateStartTime(index, value)}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['08:00', '09:00', '10:00', '11:00'].map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-muted-foreground">{t('to')}</span>
                          <Select 
                            value={day.endTime}
                            onValueChange={(value) => updateEndTime(index, value)}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['16:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">{t('dayOff')}</span>
                      )}
                    </div>
                  ))
                )}
                <Button
                  className="w-full mt-4"
                  onClick={handleSaveHours}
                  disabled={saveHoursMutation.isPending || !hasUnsavedChanges}
                  data-testid="button-save-hours"
                >
                  {saveHoursMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('saving')}
                    </>
                  ) : (
                    t('saveChanges')
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t('homeService')}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('homeServiceEnabled')}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('homeServiceEnabledDesc')}</p>
                  </div>
                  <Switch
                    checked={homeServiceEnabled}
                    onCheckedChange={setHomeServiceEnabled}
                    data-testid="switch-home-service"
                  />
                </div>

                <p className="text-sm text-muted-foreground">{t('pricesSetByAdmin')}</p>

                <Button
                  className="w-full"
                  onClick={() => saveSettingsMutation.mutate()}
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {saveSettingsMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('saving')}</>
                  ) : (
                    t('saveSettings')
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function BookingCard({
  booking,
  onComplete,
  onTraveling,
  onArrived,
  isUpdating = false,
}: {
  booking: Booking;
  onComplete?: (booking: Booking) => void;
  onTraveling?: (booking: Booking) => void;
  onArrived?: (booking: Booking) => void;
  isUpdating?: boolean;
}) {
  const { t } = useTranslation();
  const isConfirmed = booking.status === 'confirmed';
  const isTraveling = booking.status === 'traveling';
  const isArrived = booking.status === 'arrived';
  const isHomeService = booking.bookingType === 'home';

  const statusClass = (() => {
    switch (booking.status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'traveling': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'arrived': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return '';
    }
  })();

  return (
    <Card data-testid={`booking-${booking.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              {isHomeService ? <Home className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="font-medium">{booking.customerName}</p>
              {booking.customerPhone && (
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="flex items-center gap-1 text-sm text-primary"
                >
                  <Phone className="h-3 w-3" />
                  <span>{booking.customerPhone}</span>
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="secondary" className={statusClass}>
              {(isConfirmed || isArrived) && <CheckCircle className="h-3 w-3 mr-1" />}
              {isTraveling && <Navigation className="h-3 w-3 mr-1" />}
              {t(booking.status)}
            </Badge>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t text-sm space-y-2">
          <p className="font-medium">{booking.serviceName}</p>
          <p className="text-muted-foreground">
            {format(parseISO(booking.date), 'EEE, MMM d')} {t('at')} {booking.time}
          </p>

          {/* Home service: location link and address */}
          {isHomeService && booking.customerLocation && (
            <a
              href={`https://maps.google.com/?q=${booking.customerLocation}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary font-medium"
            >
              <MapPin className="h-4 w-4" />
              {t('openInMaps')}
            </a>
          )}
          {isHomeService && booking.customerAddress && (
            <p className="text-muted-foreground text-xs">{booking.customerAddress}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap pt-1">
            {/* Home service: traveling → arrived → complete */}
            {isHomeService && isConfirmed && onTraveling && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onTraveling(booking)}
                disabled={isUpdating}
                data-testid={`button-traveling-${booking.id}`}
              >
                <Navigation className="h-3 w-3 mr-1" />
                {t('traveling')}
              </Button>
            )}
            {isHomeService && isTraveling && onArrived && (
              <Button
                size="sm"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onArrived(booking)}
                disabled={isUpdating}
                data-testid={`button-arrived-${booking.id}`}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {t('markAsArrived')}
              </Button>
            )}
            {((!isHomeService && isConfirmed) || (isHomeService && isArrived)) && onComplete && (
              <Button
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onComplete(booking)}
                disabled={isUpdating}
                data-testid={`button-complete-${booking.id}`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('complete')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
