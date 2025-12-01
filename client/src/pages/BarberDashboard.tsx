import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { mockBarbers, mockBarberBookings, mockWorkingHours } from '@/lib/mock-data';
import type { Booking, WorkingHours } from '@/lib/types';
import { format, parseISO, isToday, isFuture } from 'date-fns';

export default function BarberDashboard() {
  const [, navigate] = useLocation();
  const [bookings, setBookings] = useState(mockBarberBookings);
  const [hours, setHours] = useState(mockWorkingHours);
  const [activeTab, setActiveTab] = useState('today');

  const barber = mockBarbers[0];

  const todayBookings = bookings.filter(b => 
    isToday(parseISO(b.date)) && b.status !== 'declined' && b.status !== 'cancelled'
  );
  const upcomingBookings = bookings.filter(b => 
    isFuture(parseISO(b.date)) && !isToday(parseISO(b.date)) && b.status !== 'declined' && b.status !== 'cancelled'
  );
  const pendingBookings = bookings.filter(b => b.status === 'pending');

  const handleAccept = (booking: Booking) => {
    setBookings(prev => 
      prev.map(b => b.id === booking.id ? { ...b, status: 'confirmed' as const } : b)
    );
  };

  const handleDecline = (booking: Booking) => {
    setBookings(prev => 
      prev.map(b => b.id === booking.id ? { ...b, status: 'declined' as const } : b)
    );
  };

  const handleComplete = (booking: Booking) => {
    setBookings(prev => 
      prev.map(b => b.id === booking.id ? { ...b, status: 'completed' as const } : b)
    );
  };

  const toggleDay = (index: number) => {
    setHours(prev => 
      prev.map((h, i) => i === index ? { ...h, isWorking: !h.isWorking } : h)
    );
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={barber.avatar} alt={barber.name} />
            <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
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
                  {pendingBookings.length} Pending Request{pendingBookings.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="bg-background rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.serviceName} - {format(parseISO(booking.date), 'EEE, MMM d')} at {booking.time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDecline(booking)}
                          data-testid={`button-decline-${booking.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleAccept(booking)}
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
              Today ({todayBookings.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="hours" data-testid="tab-hours">
              Hours
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4 space-y-3">
            {todayBookings.length > 0 ? (
              todayBookings.map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking}
                  onComplete={handleComplete}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  No appointments today
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  No upcoming appointments
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hours" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Working Hours</span>
                </div>
                {hours.map((day, index) => (
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
                      <Label className="font-medium">{day.day}</Label>
                    </div>
                    {day.isWorking ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Select defaultValue={day.startTime}>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['08:00', '09:00', '10:00', '11:00'].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">to</span>
                        <Select defaultValue={day.endTime}>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['16:00', '17:00', '18:00', '19:00', '20:00'].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Day off</span>
                    )}
                  </div>
                ))}
                <Button className="w-full mt-4" data-testid="button-save-hours">
                  Save Changes
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
  onComplete 
}: { 
  booking: Booking; 
  onComplete?: (booking: Booking) => void;
}) {
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
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{booking.customerPhone}</span>
              </div>
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
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
        
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium">{booking.serviceName}</p>
            <p className="text-muted-foreground">
              {format(parseISO(booking.date), 'EEE, MMM d')} at {booking.time}
            </p>
          </div>
          {isConfirmed && onComplete && (
            <Button 
              size="sm"
              onClick={() => onComplete(booking)}
              data-testid={`button-complete-${booking.id}`}
            >
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
