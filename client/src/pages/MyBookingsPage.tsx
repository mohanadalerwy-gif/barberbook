import { useState } from 'react';
import Header from '@/components/Header';
import AppointmentCard from '@/components/AppointmentCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { mockBookings, mockBarbers } from '@/lib/mock-data';
import type { User, Booking } from '@/lib/types';

interface MyBookingsPageProps {
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function MyBookingsPage({ user, onLogin, onLogout }: MyBookingsPageProps) {
  const [, navigate] = useLocation();
  const [bookings, setBookings] = useState(mockBookings);

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed'
  );
  const cancelledBookings = bookings.filter(
    (b) => b.status === 'cancelled' || b.status === 'declined'
  );

  const handleCancel = (booking: Booking) => {
    setBookings(prev => 
      prev.map(b => b.id === booking.id ? { ...b, status: 'cancelled' as const } : b)
    );
    console.log('Cancelled booking:', booking.id);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onLogin={onLogin} onLogout={onLogout} />
        <main className="py-16 px-4">
          <div className="mx-auto max-w-md text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view bookings</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to view and manage your appointments
            </p>
            <Button onClick={onLogin} data-testid="button-sign-in">
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogin={onLogin} onLogout={onLogout} />
      
      <main className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
              <p className="text-muted-foreground">
                Manage your upcoming and past appointments
              </p>
            </div>
            <Button onClick={() => navigate('/barbers')} data-testid="button-book-new">
              Book New Appointment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="upcoming" data-testid="tab-upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past" data-testid="tab-past">
                Past ({pastBookings.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" data-testid="tab-cancelled">
                Cancelled ({cancelledBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <AppointmentCard
                      key={booking.id}
                      booking={booking}
                      userRole="customer"
                      barberAvatar={mockBarbers.find(b => b.id === booking.barberId)?.avatar}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No upcoming appointments"
                  description="Book your next haircut and it will appear here"
                  actionLabel="Find a Barber"
                  onAction={() => navigate('/barbers')}
                />
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastBookings.length > 0 ? (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <AppointmentCard
                      key={booking.id}
                      booking={booking}
                      userRole="customer"
                      barberAvatar={mockBarbers.find(b => b.id === booking.barberId)?.avatar}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No past appointments"
                  description="Your completed appointments will appear here"
                />
              )}
            </TabsContent>

            <TabsContent value="cancelled">
              {cancelledBookings.length > 0 ? (
                <div className="space-y-4">
                  {cancelledBookings.map((booking) => (
                    <AppointmentCard
                      key={booking.id}
                      booking={booking}
                      userRole="customer"
                      barberAvatar={mockBarbers.find(b => b.id === booking.barberId)?.avatar}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No cancelled appointments"
                  description="Cancelled or declined appointments will appear here"
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction 
}: { 
  title: string; 
  description: string; 
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-12 px-4 border border-dashed rounded-lg">
      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} data-testid="button-empty-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
