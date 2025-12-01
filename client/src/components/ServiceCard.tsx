import { Card, CardContent } from '@/components/ui/card';
import { Clock, DollarSign, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service } from '@/lib/types';

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onSelect?: (service: Service) => void;
}

export default function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover-elevate",
        selected && "ring-2 ring-primary"
      )}
      onClick={() => onSelect?.(service)}
      data-testid={`card-service-${service.id}`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-4">
          {service.image && (
            <div className="sm:w-32 h-32 sm:h-auto flex-shrink-0">
              <img 
                src={service.image} 
                alt={service.name}
                className="w-full h-full object-cover rounded-t-md sm:rounded-l-md sm:rounded-tr-none"
              />
            </div>
          )}
          <div className="flex-1 p-4 sm:pl-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg">{service.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {service.description}
                </p>
              </div>
              {selected && (
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{service.duration} min</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                <span>{service.price}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
