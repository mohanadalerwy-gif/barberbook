import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, DollarSign, Check } from 'lucide-react';
import ServiceCard from './ServiceCard';
import TimeSlotPicker from './TimeSlotPicker';
import type { Barber, Service } from '@/lib/types';
import { format } from 'date-fns';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber: Barber;
  services: Service[];
  onConfirm?: (data: { barberId: string; serviceId: string; date: Date; time: string }) => void;
}

type Step = 'service' | 'time' | 'confirm';

export default function BookingDialog({ 
  open, 
  onOpenChange, 
  barber, 
  services,
  onConfirm 
}: BookingDialogProps) {
  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (step === 'service' && selectedService) {
      setStep('time');
    } else if (step === 'time' && selectedDate && selectedTime) {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'time') {
      setStep('service');
    } else if (step === 'confirm') {
      setStep('time');
    }
  };

  const handleConfirm = () => {
    if (selectedService && selectedDate && selectedTime) {
      onConfirm?.({
        barberId: barber.id,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
      });
      onOpenChange(false);
      setStep('service');
      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'service':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose a service:</p>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                selected={selectedService?.id === service.id}
                onSelect={handleServiceSelect}
              />
            ))}
          </div>
        );

      case 'time':
        return (
          <TimeSlotPicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelect={handleTimeSelect}
          />
        );

      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={barber.avatar} alt={barber.name} />
                  <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{barber.name}</p>
                  <p className="text-sm text-muted-foreground">{barber.shopName}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{selectedTime} ({selectedService?.duration} min)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>${selectedService?.price}</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              By confirming, you agree to the booking terms. The barber will confirm your appointment shortly.
            </p>
          </div>
        );
    }
  };

  const canProceed = 
    (step === 'service' && selectedService) ||
    (step === 'time' && selectedDate && selectedTime) ||
    step === 'confirm';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="booking-dialog">
        <DialogHeader>
          <DialogTitle>
            {step === 'service' && 'Select Service'}
            {step === 'time' && 'Choose Time'}
            {step === 'confirm' && 'Confirm Booking'}
          </DialogTitle>
          <DialogDescription>
            Booking with {barber.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderStep()}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== 'service' && (
            <Button variant="outline" onClick={handleBack} data-testid="button-back">
              Back
            </Button>
          )}
          {step !== 'confirm' ? (
            <Button onClick={handleNext} disabled={!canProceed} data-testid="button-next">
              Continue
            </Button>
          ) : (
            <Button onClick={handleConfirm} data-testid="button-confirm-booking">
              Confirm Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
