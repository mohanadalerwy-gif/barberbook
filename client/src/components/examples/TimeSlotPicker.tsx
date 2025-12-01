import { useState } from 'react';
import TimeSlotPicker from '../TimeSlotPicker';

export default function TimeSlotPickerExample() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  return (
    <div className="max-w-2xl">
      <TimeSlotPicker 
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSelect={(date, time) => {
          setSelectedDate(date);
          setSelectedTime(time);
          console.log('Selected:', date, time);
        }}
      />
      {selectedDate && selectedTime && (
        <p className="mt-4 text-sm text-muted-foreground">
          Selected: {selectedDate.toLocaleDateString()} at {selectedTime}
        </p>
      )}
    </div>
  );
}
