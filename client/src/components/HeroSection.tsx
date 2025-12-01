import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import heroImage from '@assets/generated_images/barber_shop_hero_image.png';

interface HeroSectionProps {
  onSearch?: (location: string) => void;
  onBrowseBarbers?: () => void;
}

export default function HeroSection({ onSearch, onBrowseBarbers }: HeroSectionProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
          Find Your Perfect Barber
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Book appointments with top-rated barbers in your area. Professional grooming, made simple.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Enter your location..."
              className="pl-10 h-12 bg-white/95 border-0"
              data-testid="input-location"
            />
          </div>
          <Button 
            size="lg" 
            className="h-12 px-8"
            onClick={() => onSearch?.('')}
            data-testid="button-search"
          >
            <Search className="mr-2 h-5 w-5" />
            Search
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button 
            variant="outline" 
            size="lg"
            className="bg-white/10 border-white/30 text-white backdrop-blur-sm"
            onClick={onBrowseBarbers}
            data-testid="button-browse-barbers"
          >
            Browse All Barbers
          </Button>
        </div>
        
        <div className="mt-12 flex items-center justify-center gap-8 text-white/80">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">500+</div>
            <div className="text-sm">Barbers</div>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">10k+</div>
            <div className="text-sm">Bookings</div>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">4.9</div>
            <div className="text-sm">Avg Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}
