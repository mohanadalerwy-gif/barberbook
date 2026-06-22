import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Navigation,
  MapPin,
  Home,
  User,
  Phone,
  Check,
  X,
} from 'lucide-react';

export interface BarberBooking {
  id: string;
  bookingId: string;
  barberId: string;
  customerId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled' | 'traveling' | 'arrived';
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  duration: number;
  price: number;
  barberEarning?: number;
  bookingType?: string;
  customerLocation?: string;
  customerAddress?: string;
}

export default function BarberBookingCard({
  booking,
  onAccept,
  onDecline,
  onComplete,
  onTraveling,
  onArrived,
  isUpdating = false,
}: {
  booking: BarberBooking;
  onAccept?: (booking: BarberBooking) => void;
  onDecline?: (booking: BarberBooking) => void;
  onComplete?: (booking: BarberBooking) => void;
  onTraveling?: (booking: BarberBooking) => void;
  onArrived?: (booking: BarberBooking) => void;
  isUpdating?: boolean;
}) {
  const { t } = useTranslation();
  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isTraveling = booking.status === 'traveling';
  const isArrived = booking.status === 'arrived';
  const isHomeService = booking.bookingType === 'home';

  const statusClass = (() => {
    switch (booking.status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'traveling': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'arrived':   return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return '';
    }
  })();

  return (
    <Card data-testid={`booking-${booking.id}`}>
      <CardContent className="p-4">
        {/* Top row: customer info + status/actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              {isHomeService
                ? <Home className="h-5 w-5 text-primary" />
                : <User className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="font-medium">{booking.customerName}</p>
              {booking.customerPhone && (
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="flex items-center gap-1 text-sm text-primary"
                >
                  <Phone className="h-3 w-3" />
                  <span>{booking.customerPhone}</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {/* Pending: accept / decline buttons */}
            {isPending && onAccept && onDecline && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecline(booking)}
                  disabled={isUpdating}
                  data-testid={`button-decline-${booking.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAccept(booking)}
                  disabled={isUpdating}
                  data-testid={`button-accept-${booking.id}`}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Non-pending: status badge */}
            {!isPending && (
              <Badge variant="secondary" className={statusClass}>
                {(isConfirmed || isArrived) && <CheckCircle className="h-3 w-3 mr-1" />}
                {isTraveling && <Navigation className="h-3 w-3 mr-1" />}
                {t(booking.status)}
              </Badge>
            )}
          </div>
        </div>

        {/* Detail row */}
        <div className="mt-3 pt-3 border-t text-sm space-y-2">
          <p className="font-medium">{booking.serviceName}</p>
          <p className="text-muted-foreground">
            {format(parseISO(booking.date), 'EEE, MMM d')} {t('at')} {booking.time}
          </p>

          {/* Home service: maps link + address */}
          {isHomeService && booking.customerLocation && (
            <a
              href={`https://maps.google.com/?q=${booking.customerLocation}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary font-medium"
            >
              <MapPin className="h-4 w-4" />
              {t('openInMaps')}
            </a>
          )}
          {isHomeService && booking.customerAddress && (
            <p className="text-muted-foreground text-xs">{booking.customerAddress}</p>
          )}

          {/* Progress action buttons for confirmed/active bookings */}
          <div className="flex gap-2 flex-wrap pt-1">
            {isHomeService && isConfirmed && onTraveling && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onTraveling(booking)}
                disabled={isUpdating}
                data-testid={`button-traveling-${booking.id}`}
              >
                <Navigation className="h-3 w-3 mr-1" />
                {t('traveling')}
              </Button>
            )}
            {isHomeService && isTraveling && onArrived && (
              <Button
                size="sm"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onArrived(booking)}
                disabled={isUpdating}
                data-testid={`button-arrived-${booking.id}`}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {t('markAsArrived')}
              </Button>
            )}
            {((!isHomeService && isConfirmed) || (isHomeService && isArrived)) && onComplete && (
              <Button
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onComplete(booking)}
                disabled={isUpdating}
                data-testid={`button-complete-${booking.id}`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('complete')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
