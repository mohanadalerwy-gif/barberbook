import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { WorkingHours } from '@/lib/types';

interface WorkingHoursEditorProps {
  hours: WorkingHours[];
  onChange?: (hours: WorkingHours[]) => void;
  onSave?: (hours: WorkingHours[]) => void;
}

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat();

export default function WorkingHoursEditor({ hours, onChange, onSave }: WorkingHoursEditorProps) {
  const [localHours, setLocalHours] = useState(hours);

  const handleToggle = (index: number) => {
    const updated = [...localHours];
    updated[index] = { ...updated[index], isWorking: !updated[index].isWorking };
    setLocalHours(updated);
    onChange?.(updated);
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...localHours];
    updated[index] = { ...updated[index], [field]: value };
    setLocalHours(updated);
    onChange?.(updated);
  };

  return (
    <Card data-testid="working-hours-editor">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Working Hours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {localHours.map((day, index) => (
          <div 
            key={day.day} 
            className="flex items-center gap-4"
            data-testid={`working-hours-${day.day.toLowerCase()}`}
          >
            <div className="w-24">
              <Label className="text-sm font-medium">{day.day}</Label>
            </div>
            <Switch
              checked={day.isWorking}
              onCheckedChange={() => handleToggle(index)}
              data-testid={`switch-${day.day.toLowerCase()}`}
            />
            {day.isWorking && (
              <div className="flex items-center gap-2 flex-1">
                <Select
                  value={day.startTime}
                  onValueChange={(value) => handleTimeChange(index, 'startTime', value)}
                >
                  <SelectTrigger className="w-24" data-testid={`select-start-${day.day.toLowerCase()}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">to</span>
                <Select
                  value={day.endTime}
                  onValueChange={(value) => handleTimeChange(index, 'endTime', value)}
                >
                  <SelectTrigger className="w-24" data-testid={`select-end-${day.day.toLowerCase()}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!day.isWorking && (
              <span className="text-sm text-muted-foreground">Day off</span>
            )}
          </div>
        ))}
        <Button 
          onClick={() => onSave?.(localHours)} 
          className="w-full mt-4"
          data-testid="button-save-hours"
        >
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
