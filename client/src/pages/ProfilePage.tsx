import { useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  User as UserIcon,
  Calendar,
  Settings,
  Clock,
  CheckCircle,
  Scissors,
  Edit,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Booking {
  id: string;
  bookingId: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  duration: number;
  price: number;
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (searchString.includes('booked=true')) {
      toast({
        title: t('bookingConfirmed'),
        description: t('appointmentBookedSuccess'),
      });
    }
  }, [searchString, toast, t]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    navigate('/');
  };

  const upcomingBookings = bookings.filter(
    b => b.status === 'pending' || b.status === 'confirmed' || b.status === 'accepted'
  );
  const pastBookings = bookings.filter(
    b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'declined'
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-20">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
          <h1 className="text-xl font-bold">{t('profile')}</h1>
        </header>
        <main className="px-4 py-6 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-20">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
          <h1 className="text-xl font-bold">{t('profile')}</h1>
        </header>

        <main className="px-4 py-6 space-y-6">
          <div className="text-center py-8">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">{t('signInToContinue')}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t('viewAppointments')}
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full h-12" 
              onClick={handleLogin}
              data-testid="button-login"
            >
              {t('signIn')}
            </Button>
          </div>

          <div className="text-center pt-4">
            <Button 
              variant="ghost" 
              className="text-muted-foreground"
              onClick={() => navigate('/settings')}
              data-testid="link-settings"
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('settings')}
            </Button>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || t('user');

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('profile')}</h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/settings')}
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profileImageUrl || ''} alt={userName} />
                <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold text-lg">{userName}</h2>
                <p className="text-sm text-muted-foreground">{user.phone || user.email}</p>
                {user.role === 'barber' && (
                  <Badge variant="secondary" className="mt-1">
                    <Scissors className="h-3 w-3 mr-1" />
                    {t('barber')}
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/profile/edit')}
                data-testid="button-edit-profile"
              >
                <Edit className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {user.role === 'barber' && (
          <Button 
            className="w-full"
            onClick={() => navigate('/barber-dashboard')}
            data-testid="button-barber-dashboard"
          >
            <Scissors className="h-4 w-4 mr-2" />
            {t('barberDashboard')}
          </Button>
        )}

        {user.role === 'customer' && (
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => navigate('/barber-register')}
            data-testid="button-become-barber"
          >
            <Scissors className="h-4 w-4 mr-2" />
            {t('becomeBarber')}
          </Button>
        )}

        <section>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('upcomingAppointments')}
          </h3>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                {t('noUpcoming')}
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('pastAppointments')}
          </h3>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i} className="opacity-70">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pastBookings.length > 0 ? (
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} isPast />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                {t('noPast')}
              </CardContent>
            </Card>
          )}
        </section>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          {t('signOut')}
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}

function BookingCard({ booking, isPast }: { booking: Booking; isPast?: boolean }) {
  const { t } = useTranslation();
  
  return (
    <Card className={isPast ? "opacity-70" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{booking.serviceName}</p>
            <p className="text-sm text-muted-foreground">{t('with')} {booking.barberName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {format(parseISO(booking.date), 'EEE, MMM d')} {t('at')} {booking.time}
            </p>
          </div>
          <div className="text-right">
            <Badge 
              variant="secondary"
              className={
                booking.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : booking.status === 'completed'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : ''
              }
            >
              {booking.status === 'confirmed' && <CheckCircle className="h-3 w-3 mr-1" />}
              {t(booking.status)}
            </Badge>
            <p className="text-sm font-medium mt-2">${booking.price}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
