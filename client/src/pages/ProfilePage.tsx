import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { 
  User as UserIcon, 
  Phone, 
  Calendar, 
  Settings, 
  Clock,
  CheckCircle,
} from 'lucide-react';
import { SiApple, SiGoogle } from 'react-icons/si';
import { mockBookings } from '@/lib/mock-data';
import type { User, Booking } from '@/lib/types';
import { format, parseISO, isPast } from 'date-fns';

interface ProfilePageProps {
  user: User | null;
  onLogin: (method: 'phone' | 'apple' | 'google') => void;
  onLogout: () => void;
}

export default function ProfilePage({ user, onLogin, onLogout }: ProfilePageProps) {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();

  useEffect(() => {
    if (searchString.includes('booked=true')) {
      toast({
        title: 'Booking Confirmed!',
        description: 'Your appointment has been booked successfully.',
      });
    }
  }, [searchString, toast]);

  const upcomingBookings = mockBookings.filter(
    b => !isPast(parseISO(b.date)) && (b.status === 'pending' || b.status === 'confirmed')
  );
  const pastBookings = mockBookings.filter(
    b => isPast(parseISO(b.date)) || b.status === 'completed'
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
          <h1 className="text-xl font-bold">Profile</h1>
        </header>

        <main className="px-4 py-6 space-y-6">
          <div className="text-center py-8">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Sign in to continue</h2>
            <p className="text-sm text-muted-foreground mb-6">
              View your appointments and manage your profile
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full h-12" 
              variant="outline"
              onClick={() => onLogin('phone')}
              data-testid="button-login-phone"
            >
              <Phone className="h-5 w-5 mr-3" />
              Continue with Phone
            </Button>
            <Button 
              className="w-full h-12 bg-black hover:bg-black/90 text-white" 
              onClick={() => onLogin('apple')}
              data-testid="button-login-apple"
            >
              <SiApple className="h-5 w-5 mr-3" />
              Continue with Apple
            </Button>
            <Button 
              className="w-full h-12" 
              variant="outline"
              onClick={() => onLogin('google')}
              data-testid="button-login-google"
            >
              <SiGoogle className="h-5 w-5 mr-3" />
              Continue with Google
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
              Settings
            </Button>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Profile</h1>
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
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.phone || user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Appointments
          </h3>
          {upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No upcoming appointments
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Past Appointments
          </h3>
          {pastBookings.length > 0 ? (
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} isPast />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No past appointments
              </CardContent>
            </Card>
          )}
        </section>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={onLogout}
          data-testid="button-logout"
        >
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}

function BookingCard({ booking, isPast }: { booking: Booking; isPast?: boolean }) {
  return (
    <Card className={isPast ? "opacity-70" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{booking.serviceName}</p>
            <p className="text-sm text-muted-foreground">with {booking.barberName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {format(parseISO(booking.date), 'EEE, MMM d')} at {booking.time}
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
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
            <p className="text-sm font-medium mt-2">${booking.price}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
