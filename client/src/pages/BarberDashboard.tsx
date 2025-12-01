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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, parseISO, isToday, isFuture } from 'date-fns';

interface Booking {
  id: string;
  bookingId: string;
  barberId: string;
  customerId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  duration: number;
  price: number;
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
      toast({
        title: t('success'),
        description: t('hoursSaved'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToSaveHours'),
        variant: "destructive",
      });
    },
  });

  const handleAccept = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'confirmed' });
  };

  const handleDecline = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'declined' });
  };

  const handleComplete = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'completed' });
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
        {pendingBookings.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-400">
                  {pendingBookings.length} {t('pendingRequests')}
                </span>
              </div>
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" data-testid="tab-today">
              {t('today')} ({todayBookings.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              {t('upcoming')} ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="hours" data-testid="tab-hours">
              {t('hours')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4 space-y-3">
            {bookingsLoading ? (
              <Card>
                <CardContent className="py-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ) : todayBookings.length > 0 ? (
              todayBookings.map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking}
                  onComplete={handleComplete}
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
              <Card>
                <CardContent className="py-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ) : upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
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
        </Tabs>
      </main>
    </div>
  );
}

function BookingCard({ 
  booking, 
  onComplete,
  isUpdating = false
}: { 
  booking: Booking; 
  onComplete?: (booking: Booking) => void;
  isUpdating?: boolean;
}) {
  const { t } = useTranslation();
  const isConfirmed = booking.status === 'confirmed';

  return (
    <Card data-testid={`booking-${booking.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{booking.customerName}</p>
              {booking.customerPhone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{booking.customerPhone}</span>
                </div>
              )}
            </div>
          </div>
          <Badge 
            variant="secondary"
            className={
              booking.status === 'confirmed' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                : ''
            }
          >
            {booking.status === 'confirmed' && <CheckCircle className="h-3 w-3 mr-1" />}
            {t(booking.status)}
          </Badge>
        </div>
        
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium">{booking.serviceName}</p>
            <p className="text-muted-foreground">
              {format(parseISO(booking.date), 'EEE, MMM d')} {t('at')} {booking.time}
            </p>
          </div>
          {isConfirmed && onComplete && (
            <Button 
              size="sm"
              onClick={() => onComplete(booking)}
              disabled={isUpdating}
              data-testid={`button-complete-${booking.id}`}
            >
              {t('complete')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
