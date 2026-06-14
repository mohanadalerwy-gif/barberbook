import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  MapPin,
  Scissors,
  Clock,
  Calendar,
  Check,
  Loader2,
  Navigation,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, addDays } from 'date-fns';
import { isUnauthorizedError } from '@/lib/authUtils';
import { cn } from '@/lib/utils';

const SERVICE_TYPES = [
  { key: 'haircut', labelKey: 'haircut', icon: '✂️' },
  { key: 'beard', labelKey: 'beardTrimService', icon: '🪒' },
  { key: 'both', labelKey: 'haircutAndBeard', icon: '✂️🪒' },
] as const;

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

export default function HomeServiceBooking() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [serviceType, setServiceType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [addressDescription, setAddressDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: t('error'), description: t('locationError'), variant: 'destructive' });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
        toast({ title: t('locationShared') });
      },
      () => {
        setGettingLocation(false);
        toast({ title: t('error'), description: t('locationError'), variant: 'destructive' });
      }
    );
  };

  const bookingMutation = useMutation<any[], Error>({
    mutationFn: async () => {
      if (!serviceType) throw new Error(t('serviceTypeRequired'));
      if (!selectedTime) throw new Error(t('dateTimeRequired'));
      if (!location) throw new Error(t('locationRequired'));

      const res = await apiRequest('POST', '/api/bookings/home-service', {
        lat: location.lat,
        lng: location.lng,
        customerAddress: addressDescription || undefined,
        serviceType,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
      });
      return res.json();
    },
    onSuccess: (data: any[]) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setBookingCount(data?.length || 1);
      setSubmitted(true);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        navigate('/login');
        return;
      }
      const msg = error?.message || t('error');
      toast({ title: t('error'), description: msg, variant: 'destructive' });
    },
  });

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const timeSlots = generateTimeSlots();

  if (submitted) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm flex flex-col">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('homeService')}</h1>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center gap-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('requestSent')}</h2>
            <p className="text-muted-foreground">
              {t('requestSentDesc', { count: bookingCount })}
            </p>
          </div>
          <Badge className="text-sm px-4 py-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-4 w-4 mr-2" />
            {t('waitingForBarber')}
          </Badge>
          <Button className="w-full max-w-xs" onClick={() => navigate('/profile')}>
            {t('viewMyBookings')}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm pb-8">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/book')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t('homeServiceTitle')}</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground">{t('homeServiceSubtitle')}</p>

        {/* Service Type */}
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" />
            {t('selectServiceType')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {SERVICE_TYPES.map(({ key, labelKey, icon }) => (
              <button
                key={key}
                onClick={() => setServiceType(key)}
                className={cn(
                  'border rounded-xl p-3 text-center transition-all',
                  serviceType === key
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs">{t(labelKey)}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Date */}
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {t('selectDate')}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map(date => {
              const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-xl border min-w-[60px] transition-all',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-xs">{format(date, 'EEE')}</span>
                  <span className="text-lg font-bold">{format(date, 'd')}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time */}
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {t('selectTime')}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={cn(
                  'py-2 rounded-lg border text-sm transition-all',
                  selectedTime === slot
                    ? 'border-primary bg-primary text-primary-foreground font-semibold'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {t('shareYourLocation')}
          </h2>
          <Button
            variant={location ? 'outline' : 'default'}
            className="w-full"
            onClick={getLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('gettingLocation')}</>
            ) : location ? (
              <><Navigation className="h-4 w-4 mr-2 text-green-500" />{t('locationShared')} ✓</>
            ) : (
              <><Navigation className="h-4 w-4 mr-2" />{t('shareLocation')}</>
            )}
          </Button>
          {location && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          )}
        </section>

        {/* Address Description */}
        <section>
          <h2 className="font-semibold mb-2 text-sm">{t('addressDescription')}</h2>
          <Textarea
            placeholder={t('addressDescriptionPlaceholder')}
            value={addressDescription}
            onChange={e => setAddressDescription(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </section>

        {/* Submit */}
        <Button
          className="w-full h-12 text-base"
          onClick={() => bookingMutation.mutate()}
          disabled={bookingMutation.isPending || !serviceType || !selectedTime || !location}
        >
          {bookingMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('findingBarbers')}</>
          ) : (
            <><Phone className="h-4 w-4 mr-2" />{t('sendRequestToBarbers')}</>
          )}
        </Button>
      </main>
    </div>
  );
}
