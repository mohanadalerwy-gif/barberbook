import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BookingDialog from '../BookingDialog';
import { mockBarbers, mockServices } from '@/lib/mock-data';

export default function BookingDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)} data-testid="button-open-booking">
        Open Booking Dialog
      </Button>
      <BookingDialog
        open={open}
        onOpenChange={setOpen}
        barber={mockBarbers[0]}
        services={mockServices}
        onConfirm={(data) => console.log('Booking confirmed:', data)}
      />
    </div>
  );
}
