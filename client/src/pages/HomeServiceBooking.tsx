import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      <div className="min-h-screen flex flex-col">
        <header
          className="sticky top-0 z-40 backdrop-blur-md px-4 py-4 bg-[#FAF8F5]/90 dark:bg-[#121212]/90"
          style={{ borderBottom: '1px solid rgba(176,132,66,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold" style={{ color: 'var(--ds-gold-primary)' }}>
              {t('homeService')}
            </h1>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center gap-6">
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(176,132,66,0.12)' }}
          >
            <Check className="h-10 w-10" style={{ color: 'var(--ds-gold-primary)' }} />
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
          <button
            className="btn-primary w-full max-w-xs h-12 text-base"
            onClick={() => navigate('/profile')}
          >
            {t('viewMyBookings')}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <header
        className="sticky top-0 z-40 backdrop-blur-md px-4 py-4 bg-[#FAF8F5]/90 dark:bg-[#121212]/90"
        style={{ borderBottom: '1px solid rgba(176,132,66,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ds-gold-primary)' }}>
            {t('homeServiceTitle')}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground">{t('homeServiceSubtitle')}</p>

        {/* Service Type */}
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Scissors className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
            {t('selectServiceType')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {SERVICE_TYPES.map(({ key, labelKey, icon }) => {
              const isSelected = serviceType === key;
              return (
                <button
                  key={key}
                  onClick={() => setServiceType(key)}
                  className={cn(
                    'rounded-xl p-3 text-center transition-all',
                    isSelected
                      ? 'border-2 font-semibold'
                      : 'border border-border hover:border-[rgba(176,132,66,0.5)]'
                  )}
                  style={isSelected ? {
                    borderColor: 'var(--ds-gold-primary)',
                    background: 'rgba(176,132,66,0.10)',
                    color: 'var(--ds-gold-primary)',
                  } : {
                    background: 'var(--ds-bg-secondary)',
                  }}
                >
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs">{t(labelKey)}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Date */}
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
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
                    isSelected
                      ? 'border-transparent text-white'
                      : 'border-border hover:border-[rgba(176,132,66,0.5)]'
                  )}
                  style={isSelected
                    ? { background: 'var(--ds-gold-primary)' }
                    : { background: 'var(--ds-bg-secondary)' }
                  }
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
            <Clock className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
            {t('selectTime')}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map(slot => {
              const isSelected = selectedTime === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={cn(
                    'py-2 rounded-lg border text-sm transition-all',
                    isSelected
                      ? 'border-transparent text-white font-semibold'
                      : 'border-border hover:border-[rgba(176,132,66,0.5)]'
                  )}
                  style={isSelected
                    ? { background: 'var(--ds-gold-primary)' }
                    : { background: 'var(--ds-bg-secondary)' }
                  }
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
            {t('shareYourLocation')}
          </h2>
          <button
            className="btn-secondary w-full h-11 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={getLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{t('gettingLocation')}</>
            ) : location ? (
              <><Navigation className="h-4 w-4 text-green-500" />{t('locationShared')} ✓</>
            ) : (
              <><Navigation className="h-4 w-4" />{t('shareLocation')}</>
            )}
          </button>
          {location && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          )}
        </section>

        {/* Address Description */}
        <section>
          <h2 className="font-semibold mb-2 text-sm">{t('addressDescription')}</h2>
          <textarea
            className="ds-input w-full resize-none p-3"
            placeholder={t('addressDescriptionPlaceholder')}
            value={addressDescription}
            onChange={e => setAddressDescription(e.target.value)}
            rows={2}
          />
        </section>

        {/* Submit */}
        <button
          className="btn-primary w-full h-12 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => bookingMutation.mutate()}
          disabled={bookingMutation.isPending || !serviceType || !selectedTime || !location}
        >
          {bookingMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{t('findingBarbers')}</>
          ) : (
            <><Phone className="h-4 w-4" />{t('sendRequestToBarbers')}</>
          )}
        </button>
      </main>
    </div>
  );
}
