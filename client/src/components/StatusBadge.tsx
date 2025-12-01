import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Check, X, CheckCircle, Ban } from 'lucide-react';
import type { Booking } from '@/lib/types';

interface StatusBadgeProps {
  status: Booking['status'];
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  confirmed: {
    label: 'Confirmed',
    icon: Check,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  declined: {
    label: 'Declined',
    icon: X,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: Ban,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="secondary"
      className={cn(
        "gap-1 font-medium no-default-hover-elevate no-default-active-elevate",
        config.className,
        className
      )}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
