import { useState } from 'react';
import Header from '@/components/Header';
import BarberCard from '@/components/BarberCard';
import BookingDialog from '@/components/BookingDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { mockBarbers, mockServices, mockBarberShops } from '@/lib/mock-data';
import type { User, Barber } from '@/lib/types';

interface BarbersPageProps {
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function BarbersPage({ user, onLogin, onLogout }: BarbersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [bookingBarber, setBookingBarber] = useState<Barber | null>(null);

  const filteredBarbers = mockBarbers
    .filter((barber) => {
      const matchesSearch = barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        barber.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesShop = selectedShop === 'all' || barber.shopId === selectedShop;
      return matchesSearch && matchesShop;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      return a.name.localeCompare(b.name);
    });

  const handleBook = (barber: Barber) => {
    if (!user) {
      onLogin?.();
      return;
    }
    setBookingBarber(barber);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogin={onLogin} onLogout={onLogout} />
      
      <main className="py-8 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Find Your Barber</h1>
            <p className="text-muted-foreground">
              Browse our selection of professional barbers and book your next appointment
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-barbers"
              />
            </div>
            <Select value={selectedShop} onValueChange={setSelectedShop}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-shop">
                <SelectValue placeholder="All Shops" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shops</SelectItem>
                {mockBarberShops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredBarbers.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBarbers.map((barber) => (
                <BarberCard
                  key={barber.id}
                  barber={barber}
                  onBook={handleBook}
                  onViewProfile={() => console.log('View profile:', barber.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <SlidersHorizontal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No barbers found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(''); setSelectedShop('all'); }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>

      {bookingBarber && (
        <BookingDialog
          open={!!bookingBarber}
          onOpenChange={(open) => !open && setBookingBarber(null)}
          barber={bookingBarber}
          services={mockServices}
          onConfirm={(data) => {
            console.log('Booking confirmed:', data);
            setBookingBarber(null);
          }}
        />
      )}
    </div>
  );
}
