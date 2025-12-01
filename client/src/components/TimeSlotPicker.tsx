import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import type { TimeSlot } from '@/lib/types';
import { generateTimeSlots } from '@/lib/mock-data';

interface TimeSlotPickerProps {
  selectedDate?: Date;
  selectedTime?: string;
  onSelect?: (date: Date, time: string) => void;
}

export default function TimeSlotPicker({ selectedDate, selectedTime, onSelect }: TimeSlotPickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [activeDate, setActiveDate] = useState<Date>(selectedDate || new Date());

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const timeSlots = useMemo(() => {
    // todo: remove mock functionality - replace with API call
    return generateTimeSlots(activeDate);
  }, [activeDate]);

  const handlePrevWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleDateSelect = (date: Date) => {
    setActiveDate(date);
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (slot.available) {
      onSelect?.(activeDate, slot.time);
    }
  };

  return (
    <Card data-testid="time-slot-picker">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Select Date & Time</CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handlePrevWeek}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[140px] text-center">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleNextWeek}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDays.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => handleDateSelect(day)}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-colors",
                isSameDay(day, activeDate) 
                  ? "bg-primary text-primary-foreground" 
                  : "hover-elevate"
              )}
              data-testid={`button-date-${format(day, 'yyyy-MM-dd')}`}
            >
              <span className="text-xs font-medium opacity-70">{format(day, 'EEE')}</span>
              <span className="text-lg font-semibold">{format(day, 'd')}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {timeSlots.map((slot) => (
            <Button
              key={slot.id}
              variant={selectedTime === slot.time && isSameDay(activeDate, selectedDate || new Date()) ? "default" : "outline"}
              size="sm"
              disabled={!slot.available}
              className={cn(
                "h-10",
                !slot.available && "opacity-50"
              )}
              onClick={() => handleTimeSelect(slot)}
              data-testid={`button-time-${slot.time.replace(':', '-')}`}
            >
              {slot.time}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
