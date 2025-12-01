import { useState, useMemo, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Star, MapPin, Clock, Check, CheckCircle, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, isSameDay } from 'date-fns';
import { generateBookingId } from '@/lib/booking-utils';
import { openMapsApp } from '@/lib/maps-utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import type { Service as ServiceType } from '@/lib/types';

interface BarberData {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  address: string;
  bio: string;
  isApproved: boolean;
  lat: number;
  lng: number;
  services: ServiceType[];
  workingHours: any[];
}

export default function BarberProfilePage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'service' | 'time' | 'confirm' | 'success'>('service');
  const [bookingId, setBookingId] = useState<string>('');

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const { data: barber, isLoading } = useQuery<BarberData>({
    queryKey: ['/api/barbers', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/barbers/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch barber');
      return res.json();
    },
    enabled: !!params.id,
  });

  const { data: bookedSlots = [] } = useQuery<string[]>({
    queryKey: ['/api/barbers', params.id, 'booked-slots', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await fetch(`/api/barbers/${params.id}/booked-slots?date=${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!res.ok) throw new Error('Failed to fetch booked slots');
      return res.json();
    },
    enabled: !!params.id,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest('POST', '/api/bookings', bookingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You need to sign in to book an appointment.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  }, []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push({
          id: `slot-${time}`,
          time,
          available: !bookedSlots.includes(time),
        });
      }
    }
    return slots;
  }, [bookedSlots]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-20">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/book')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-7 w-32" />
          </div>
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

  if (!barber) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-20">
        <div className="flex items-center justify-center h-full pt-20">
          <p className="text-muted-foreground">{t('barberNotFound')}</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to book an appointment.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    const id = generateBookingId();
    
    try {
      await createBookingMutation.mutateAsync({
        bookingId: id,
        barberId: barber.id,
        serviceId: selectedService?.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
      });
      
      setBookingId(id);
      setStep('success');
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-20">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
          <h1 className="text-xl font-bold text-center">{t('appointmentBooked')}</h1>
        </header>

        <main className="px-4 py-12 text-center">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('appointmentBooked')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('appointmentConfirmed', { barberName: barber.name })}
          </p>

          <Card className="text-left mb-6">
            <CardContent className="p-4 space-y-3">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('bookingId')}</p>
                <p className="text-lg font-bold text-primary font-mono" data-testid="text-booking-id">{bookingId}</p>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('service')}</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('date')}</span>
                <span className="font-medium">{format(selectedDate, 'EEE, MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('time')}</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('total')}</span>
                <span className="font-medium">${selectedService?.price}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              variant="outline"
              className="w-full" 
              onClick={() => openMapsApp({ lat: barber.lat, lng: barber.lng, name: barber.name })}
              data-testid="button-open-location"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {t('openLocation')}
            </Button>
            <Button 
              className="w-full" 
              onClick={() => navigate('/profile')}
              data-testid="button-view-bookings"
            >
              {t('viewMyBookings')}
            </Button>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={() => navigate('/')}
              data-testid="button-go-home"
            >
              {t('backToHome')}
            </Button>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (step === 'time') setStep('service');
              else if (step === 'confirm') setStep('time');
              else navigate('/book');
            }}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">
            {step === 'service' && t('selectService')}
            {step === 'time' && t('selectTime')}
            {step === 'confirm' && t('confirmBooking')}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={barber.avatar} alt={barber.name} />
                <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">{barber.name}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{barber.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{barber.address || t('nearby')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {step === 'service' && (
          <section className="space-y-3">
            <h3 className="font-medium">{t('services')}</h3>
            {barber.services && barber.services.length > 0 ? (
              barber.services.map((service) => (
                <Card 
                  key={service.id}
                  className={cn(
                    "cursor-pointer transition-colors hover-elevate",
                    selectedService?.id === service.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedService(service)}
                  data-testid={`service-${service.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{service.duration} {t('min')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">${service.price}</span>
                        {selectedService?.id === service.id && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  No services available
                </CardContent>
              </Card>
            )}

            <Button 
              className="w-full mt-4" 
              disabled={!selectedService}
              onClick={() => setStep('time')}
              data-testid="button-continue"
            >
              {t('continue')}
            </Button>
          </section>
        )}

        {step === 'time' && (
          <section className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">{t('selectDate')}</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {weekDays.map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg min-w-[60px] transition-colors",
                      isSameDay(day, selectedDate) 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover-elevate"
                    )}
                    data-testid={`date-${format(day, 'yyyy-MM-dd')}`}
                  >
                    <span className="text-xs opacity-70">{format(day, 'EEE')}</span>
                    <span className="text-lg font-semibold">{format(day, 'd')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">{t('selectTime')}</h3>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    size="sm"
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={cn(!slot.available && "opacity-50")}
                    data-testid={`time-${slot.time.replace(':', '-')}`}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full mt-4" 
              disabled={!selectedTime}
              onClick={() => setStep('confirm')}
              data-testid="button-continue"
            >
              {t('continue')}
            </Button>
          </section>
        )}

        {step === 'confirm' && selectedService && (
          <section className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium">{t('bookingSummary')}</h3>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('barber')}</span>
                    <span className="font-medium">{barber.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('service')}</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('date')}</span>
                    <span className="font-medium">{format(selectedDate, 'EEE, MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('time')}</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('duration')}</span>
                    <span className="font-medium">{selectedService.duration} {t('min')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base">
                    <span className="font-medium">{t('total')}</span>
                    <span className="font-bold">${selectedService.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground text-center">
              {t('confirmAppointment')}
            </p>

            <Button 
              className="w-full" 
              onClick={handleConfirm}
              disabled={createBookingMutation.isPending}
              data-testid="button-confirm"
            >
              {createBookingMutation.isPending ? t('loading') : t('confirmBookingBtn')}
            </Button>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
