import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin } from 'lucide-react';
import type { Barber } from '@/lib/types';

interface BarberCardProps {
  barber: Barber;
  onClick?: () => void;
}

export default function BarberCard({ barber, onClick }: BarberCardProps) {
  return (
    <Card 
      className="hover-elevate cursor-pointer" 
      onClick={onClick}
      data-testid={`card-barber-${barber.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={barber.avatar} alt={barber.name} />
            <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{barber.name}</h3>
            
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{barber.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{barber.distance} km</span>
              </div>
            </div>
            
            <p className="text-sm font-medium text-primary mt-1">
              {barber.priceRange}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
