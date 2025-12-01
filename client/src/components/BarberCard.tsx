import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';
import type { Barber } from '@/lib/types';

interface BarberCardProps {
  barber: Barber;
  onBook?: (barber: Barber) => void;
  onViewProfile?: (barber: Barber) => void;
}

export default function BarberCard({ barber, onBook, onViewProfile }: BarberCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-barber-${barber.id}`}>
      <CardContent className="p-0">
        <div className="aspect-[4/3] relative bg-muted">
          <img 
            src={barber.avatar} 
            alt={barber.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-1 text-white">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{barber.rating}</span>
              <span className="text-white/70 text-sm">({barber.reviewCount} reviews)</span>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-12 w-12 border-2 border-background -mt-8 relative z-10">
              <AvatarImage src={barber.avatar} alt={barber.name} />
              <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{barber.name}</h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{barber.shopName}</span>
              </div>
            </div>
          </div>
          
          <Badge variant="secondary" className="mb-3">
            {barber.specialty}
          </Badge>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {barber.bio}
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onViewProfile?.(barber)}
              data-testid={`button-view-profile-${barber.id}`}
            >
              View Profile
            </Button>
            <Button 
              className="flex-1"
              onClick={() => onBook?.(barber)}
              data-testid={`button-book-${barber.id}`}
            >
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
