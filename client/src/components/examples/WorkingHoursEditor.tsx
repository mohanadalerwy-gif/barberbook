import WorkingHoursEditor from '../WorkingHoursEditor';
import { mockWorkingHours } from '@/lib/mock-data';

export default function WorkingHoursEditorExample() {
  return (
    <div className="max-w-md">
      <WorkingHoursEditor 
        hours={mockWorkingHours}
        onChange={(hours) => console.log('Hours changed:', hours)}
        onSave={(hours) => console.log('Saving hours:', hours)}
      />
    </div>
  );
}
