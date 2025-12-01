import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { Booking } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface AppointmentCardProps {
  booking: Booking;
  userRole?: 'customer' | 'barber' | 'admin';
  barberAvatar?: string;
  onCancel?: (booking: Booking) => void;
  onAccept?: (booking: Booking) => void;
  onDecline?: (booking: Booking) => void;
  onComplete?: (booking: Booking) => void;
}

export default function AppointmentCard({ 
  booking, 
  userRole = 'customer',
  barberAvatar,
  onCancel, 
  onAccept, 
  onDecline,
  onComplete 
}: AppointmentCardProps) {
  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const canCancel = (isPending || isConfirmed) && userRole === 'customer';
  const canAcceptDecline = isPending && userRole === 'barber';
  const canComplete = isConfirmed && userRole === 'barber';

  return (
    <Card className="hover-elevate" data-testid={`card-appointment-${booking.id}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-start gap-3 flex-1">
            {barberAvatar && (
              <Avatar className="h-12 w-12">
                <AvatarImage src={barberAvatar} alt={booking.barberName} />
                <AvatarFallback>{booking.barberName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-semibold">{booking.serviceName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {userRole === 'customer' ? `with ${booking.barberName}` : `Client: ${booking.customerName}`}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(parseISO(booking.date), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{booking.time} ({booking.duration} min)</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{booking.price}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {canCancel && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onCancel?.(booking)}
                data-testid={`button-cancel-${booking.id}`}
              >
                Cancel
              </Button>
            )}
            {canAcceptDecline && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDecline?.(booking)}
                  data-testid={`button-decline-${booking.id}`}
                >
                  Decline
                </Button>
                <Button 
                  size="sm"
                  onClick={() => onAccept?.(booking)}
                  data-testid={`button-accept-${booking.id}`}
                >
                  Accept
                </Button>
              </>
            )}
            {canComplete && (
              <Button 
                size="sm"
                onClick={() => onComplete?.(booking)}
                data-testid={`button-complete-${booking.id}`}
              >
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
