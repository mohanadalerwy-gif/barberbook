import { useState, useMemo } from 'react';
import { useLocation, useParams } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Star, MapPin, Clock, Check, CheckCircle, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockBarbers, mockServices, generateTimeSlots } from '@/lib/mock-data';
import { format, addDays, isSameDay } from 'date-fns';
import { generateBookingId } from '@/lib/booking-utils';
import { openMapsApp } from '@/lib/maps-utils';
import type { Service } from '@/lib/types';

export default function BarberProfilePage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const barber = mockBarbers.find(b => b.id === params.id);
  const services = mockServices[params.id || ''] || [];

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'service' | 'time' | 'confirm' | 'success'>('service');
  const [bookingId, setBookingId] = useState<string>('');

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  }, []);

  const timeSlots = useMemo(() => {
    return generateTimeSlots(selectedDate);
  }, [selectedDate]);

  if (!barber) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">{t('barberNotFound')}</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleConfirm = () => {
    const id = generateBookingId();
    setBookingId(id);
    console.log('Booking confirmed:', {
      bookingId: id,
      barber: barber.name,
      service: selectedService?.name,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
    });
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
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
                    <span>{barber.distance} {t('km')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {step === 'service' && (
          <section className="space-y-3">
            <h3 className="font-medium">{t('services')}</h3>
            {services.map((service) => (
              <Card 
                key={service.id}
                className={cn(
                  "cursor-pointer transition-all hover-elevate",
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
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

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
              data-testid="button-confirm"
            >
              {t('confirmBookingBtn')}
            </Button>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
