import { useState, useMemo, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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

  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'service' | 'time' | 'confirm' | 'success'>('service');
  const [bookingId, setBookingId] = useState<string>('');

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.customerPrice ?? Math.round(parseFloat(String(s.price)))), 0),
    [selectedServices]
  );
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.duration, 0),
    [selectedServices]
  );

  const toggleService = (service: ServiceType) => {
    setSelectedServices(prev =>
      prev.some(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const { data: barber, isLoading } = useQuery<BarberData>({
    queryKey: ['/api/barbers', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/barbers/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch barber');
      return res.json();
    },
    enabled: !!params.id,
    refetchInterval: 30_000,
  });

  const { data: bookedSlots = [] } = useQuery<string[]>({
    queryKey: ['/api/barbers', params.id, 'booked-slots', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await fetch(`/api/barbers/${params.id}/booked-slots?date=${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!res.ok) throw new Error('Failed to fetch booked slots');
      return res.json();
    },
    enabled: !!params.id,
    refetchInterval: 30_000,
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
          title: "غير مصرح",
          description: "يجب تسجيل الدخول لحجز موعد.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      toast({
        title: "خطأ",
        description: "فشل إنشاء الحجز. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const daysOffSet = useMemo(() => {
    if (!barber?.workingHours?.length) return new Set<string>();
    return new Set(
      barber.workingHours.filter((h: any) => !h.isWorking).map((h: any) => h.day as string)
    );
  }, [barber?.workingHours]);

  // If the current selectedDate falls on a day off (e.g. today is Friday and barber doesn't work Fridays),
  // advance to the next working day so the picker never opens on an invalid state.
  useEffect(() => {
    if (!barber?.workingHours?.length) return;
    if (daysOffSet.has(format(selectedDate, 'EEEE'))) {
      for (let i = 1; i <= 14; i++) {
        const candidate = addDays(new Date(), i);
        if (!daysOffSet.has(format(candidate, 'EEEE'))) {
          setSelectedDate(candidate);
          setSelectedTime(null);
          break;
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barber?.workingHours]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  }, []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push({ id: `slot-${time}`, time, available: !bookedSlots.includes(time) });
      }
    }
    return slots;
  }, [bookedSlots]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--ds-bg-primary)' }}>
        <header
          className="sticky top-0 z-40 backdrop-blur-md px-4 py-4 bg-[#FAF8F5]/90 dark:bg-[#121212]/90"
          style={{ borderBottom: '1px solid rgba(176,132,66,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-7 w-32" />
          </div>
        </header>
        <main className="px-4 py-6 space-y-6">
          <div className="ds-card p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--ds-bg-primary)' }}>
        <div className="flex items-center justify-center h-full pt-20">
          <p className="text-muted-foreground">{t('barberNotFound')}</p>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يرجى تسجيل الدخول لحجز موعد.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    const id = generateBookingId();
    try {
      await createBookingMutation.mutateAsync({
        bookingId: id,
        barberId: barber.id,
        serviceId: selectedServices[0]?.id,
        serviceIds: selectedServices.map(s => s.id),
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
    const serviceLabel = selectedServices.map(s => s.name).join(' + ');
    return (
      <div className="min-h-screen" style={{ background: 'var(--ds-bg-primary)' }}>
        <header
          className="sticky top-0 z-40 backdrop-blur-md px-4 py-4 bg-[#FAF8F5]/90 dark:bg-[#121212]/90"
          style={{ borderBottom: '1px solid rgba(176,132,66,0.15)' }}
        >
          <h1 className="text-xl font-bold text-center" style={{ color: 'var(--ds-gold-primary)' }}>
            {t('appointmentBooked')}
          </h1>
        </header>

        <main className="px-4 py-12 text-center">
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(176,132,66,0.12)' }}
          >
            <CheckCircle className="h-10 w-10" style={{ color: 'var(--ds-gold-primary)' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('appointmentBooked')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('appointmentConfirmed', { barberName: barber.name })}
          </p>

          <div className="ds-card text-left mb-6 p-4 space-y-3">
            <div
              className="rounded-lg p-3 text-center"
              style={{ background: 'rgba(176,132,66,0.10)' }}
            >
              <p className="text-xs text-muted-foreground mb-1">{t('bookingId')}</p>
              <p
                className="text-lg font-bold font-mono"
                style={{ color: 'var(--ds-gold-primary)' }}
                data-testid="text-booking-id"
              >
                {bookingId}
              </p>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('service')}</span>
                <span className="font-medium text-right max-w-[60%]">{serviceLabel}</span>
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
                <span className="text-muted-foreground">{t('total')}</span>
                <span className="font-medium">{totalPrice} {t('sar')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              className="btn-secondary w-full h-11 flex items-center justify-center gap-2"
              onClick={() => openMapsApp({ lat: barber.lat, lng: barber.lng, name: barber.name })}
              data-testid="button-open-location"
            >
              <Navigation className="h-4 w-4" />
              {t('openLocation')}
            </button>
            <button
              className="btn-primary w-full h-12 text-base"
              onClick={() => navigate('/profile')}
              data-testid="button-view-bookings"
            >
              {t('viewMyBookings')}
            </button>
            <button
              className="btn-secondary w-full h-11 flex items-center justify-center gap-2"
              onClick={() => navigate('/')}
              data-testid="button-go-home"
            >
              {t('backToHome')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ds-bg-primary)' }}>
      <header
        className="sticky top-0 z-40 backdrop-blur-md px-4 py-4 bg-[#FAF8F5]/90 dark:bg-[#121212]/90"
        style={{ borderBottom: '1px solid rgba(176,132,66,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (step === 'time') setStep('service');
              else if (step === 'confirm') setStep('time');
              else window.history.back();
            }}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ds-gold-primary)' }}>
            {step === 'service' && t('selectService')}
            {step === 'time' && t('selectTime')}
            {step === 'confirm' && t('confirmBooking')}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Barber header card */}
        <div className="ds-card p-4">
          <div className="flex items-center gap-4">
            <Avatar
              className="h-16 w-16"
              style={{ ring: '2px solid rgba(176,132,66,0.4)' }}
            >
              <AvatarImage src={barber.avatar} alt={barber.name} />
              <AvatarFallback style={{ background: 'rgba(176,132,66,0.15)', color: 'var(--ds-gold-primary)' }}>
                {barber.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--ds-text-primary)' }}>
                {barber.name}
              </h2>
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
        </div>

        {/* Step: service selection */}
        {step === 'service' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                {t('services')}
              </h3>
              <span className="text-xs text-muted-foreground">اختر خدمة واحدة أو أكثر</span>
            </div>

            {barber.services && barber.services.length > 0 ? (
              barber.services.map((service) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <div
                    key={service.id}
                    className="cursor-pointer transition-all rounded-xl p-4"
                    style={isSelected ? {
                      background: 'rgba(176,132,66,0.08)',
                      border: '2px solid var(--ds-gold-primary)',
                      boxShadow: 'var(--ds-shadow-sm)',
                    } : {
                      background: 'var(--ds-bg-secondary)',
                      border: '1px solid var(--ds-bg-tertiary)',
                      boxShadow: 'var(--ds-shadow-sm)',
                      borderRadius: 'var(--ds-radius-md)',
                    }}
                    onClick={() => toggleService(service)}
                    data-testid={`service-${service.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Gold checkbox indicator */}
                        <div
                          className="h-5 w-5 rounded flex items-center justify-center shrink-0 transition-all"
                          style={isSelected ? {
                            background: 'var(--ds-gold-primary)',
                            border: '2px solid var(--ds-gold-primary)',
                          } : {
                            border: '2px solid var(--ds-bg-tertiary)',
                            background: 'transparent',
                          }}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                            {i18n.language === 'ar' ? (service.nameAr || service.name) : (service.nameEn || service.name)}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{service.duration} {t('min')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        {service.displayPrice != null && service.customerPrice != null && service.displayPrice !== service.customerPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {service.displayPrice} {t('sar')}
                          </span>
                        )}
                        <span
                          className="font-semibold"
                          style={{ color: isSelected ? 'var(--ds-gold-primary)' : 'var(--ds-text-primary)' }}
                        >
                          {service.customerPrice ?? Math.round(parseFloat(String(service.price)))} {t('sar')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className="rounded-xl p-6 text-center text-muted-foreground"
                style={{ background: 'var(--ds-bg-secondary)', border: '1px solid var(--ds-bg-tertiary)' }}
              >
                لا توجد خدمات متاحة
              </div>
            )}

            {/* Live total summary */}
            {selectedServices.length > 0 && (
              <div
                className="rounded-xl p-3 flex items-center justify-between"
                style={{
                  background: 'rgba(176,132,66,0.08)',
                  border: '1px solid rgba(176,132,66,0.25)',
                }}
              >
                <span className="text-sm text-muted-foreground">
                  {selectedServices.length} {selectedServices.length === 1 ? 'خدمة' : 'خدمات'} · {totalDuration} دقيقة
                </span>
                <span className="font-semibold" style={{ color: 'var(--ds-gold-primary)' }}>
                  {totalPrice} {t('sar')}
                </span>
              </div>
            )}

            <button
              className="btn-primary w-full h-12 text-base mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedServices.length === 0}
              onClick={() => setStep('time')}
              data-testid="button-continue"
            >
              {t('continue')}
            </button>
          </section>
        )}

        {/* Step: date & time selection */}
        {step === 'time' && (
          <section className="space-y-4">
            <div>
              <h3
                className="font-medium mb-3 flex items-center gap-2"
                style={{ color: 'var(--ds-text-primary)' }}
              >
                <Clock className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
                {t('selectDate')}
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {weekDays.map((day) => {
                  const isOff = daysOffSet.has(format(day, 'EEEE'));
                  const isSelected = isSameDay(day, selectedDate) && !isOff;
                  return (
                    <button
                      key={day.toISOString()}
                      disabled={isOff}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedTime(null);
                      }}
                      className={cn(
                        'flex flex-col items-center p-3 rounded-xl border min-w-[60px] transition-all',
                        isSelected
                          ? 'border-transparent text-white'
                          : isOff
                          ? 'opacity-40 cursor-not-allowed border-border'
                          : 'border-border hover:border-[rgba(176,132,66,0.5)]'
                      )}
                      style={isSelected
                        ? { background: 'var(--ds-gold-primary)' }
                        : { background: 'var(--ds-bg-secondary)' }
                      }
                      data-testid={`date-${format(day, 'yyyy-MM-dd')}`}
                    >
                      <span className="text-xs opacity-80">{format(day, 'EEE')}</span>
                      <span className="text-lg font-semibold">{format(day, 'd')}</span>
                      {isOff && (
                        <span className="text-xs leading-none opacity-70">{t('dayOff')}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3
                className="font-medium mb-3 flex items-center gap-2"
                style={{ color: 'var(--ds-text-primary)' }}
              >
                <Clock className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
                {t('selectTime')}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={cn(
                      'py-2 rounded-lg border text-sm transition-all',
                      selectedTime === slot.time
                        ? 'border-transparent text-white font-semibold'
                        : !slot.available
                        ? 'opacity-40 cursor-not-allowed border-border'
                        : 'border-border hover:border-[rgba(176,132,66,0.5)]'
                    )}
                    style={selectedTime === slot.time
                      ? { background: 'var(--ds-gold-primary)' }
                      : { background: 'var(--ds-bg-secondary)' }
                    }
                    data-testid={`time-${slot.time.replace(':', '-')}`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary w-full h-12 text-base mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedTime}
              onClick={() => setStep('confirm')}
              data-testid="button-continue"
            >
              {t('continue')}
            </button>
          </section>
        )}

        {/* Step: confirm */}
        {step === 'confirm' && selectedServices.length > 0 && (
          <section className="space-y-4">
            <div className="ds-card p-4 space-y-3">
              <h3 className="font-medium" style={{ color: 'var(--ds-gold-primary)' }}>
                {t('bookingSummary')}
              </h3>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('barber')}</span>
                  <span className="font-medium">{barber.name}</span>
                </div>

                {/* List each selected service */}
                {selectedServices.map((s, i) => {
                  const custPrice = s.customerPrice ?? Math.round(parseFloat(String(s.price)));
                  const dispPrice = s.displayPrice ?? custPrice;
                  return (
                    <div key={s.id} className="flex justify-between items-center gap-2">
                      <span className="text-muted-foreground">
                        {i === 0 ? t('service') : ''}
                      </span>
                      <span className="font-medium flex items-center gap-1.5 flex-wrap justify-end">
                        {i18n.language === 'ar' ? (s.nameAr || s.name) : (s.nameEn || s.name)}
                        {' — '}
                        {dispPrice !== custPrice && (
                          <span className="text-xs text-muted-foreground line-through">{dispPrice}</span>
                        )}
                        <span style={{ color: 'var(--ds-gold-primary)' }}>{custPrice} {t('sar')}</span>
                      </span>
                    </div>
                  );
                })}

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
                  <span className="font-medium">{totalDuration} {t('min')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-medium">{t('total')}</span>
                  <span className="font-bold" style={{ color: 'var(--ds-gold-primary)' }}>
                    {totalPrice} {t('sar')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {t('confirmAppointment')}
            </p>

            <button
              className="btn-primary w-full h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirm}
              disabled={createBookingMutation.isPending}
              data-testid="button-confirm"
            >
              {createBookingMutation.isPending ? t('loading') : t('confirmBookingBtn')}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
