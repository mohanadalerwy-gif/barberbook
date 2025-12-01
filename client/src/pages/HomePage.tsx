import { useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import BarberCard from '@/components/BarberCard';
import ServiceCard from '@/components/ServiceCard';
import BookingDialog from '@/components/BookingDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockBarbers, mockServices } from '@/lib/mock-data';
import type { User, Barber } from '@/lib/types';
import { Scissors, Calendar, Star, ArrowRight } from 'lucide-react';

interface HomePageProps {
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function HomePage({ user, onLogin, onLogout }: HomePageProps) {
  const [, navigate] = useLocation();
  const [bookingBarber, setBookingBarber] = useState<Barber | null>(null);

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
      
      <main>
        <HeroSection 
          onSearch={() => navigate('/barbers')}
          onBrowseBarbers={() => navigate('/barbers')}
        />

        <section className="py-16 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Book your next haircut in three simple steps
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Scissors, title: 'Choose Your Barber', desc: 'Browse our curated selection of professional barbers' },
                { icon: Calendar, title: 'Pick a Time', desc: 'Select a service and find an available time slot' },
                { icon: Star, title: 'Get Groomed', desc: 'Show up and enjoy a professional grooming experience' },
              ].map((step, index) => (
                <Card key={step.title} className="text-center hover-elevate">
                  <CardContent className="pt-8 pb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-sm font-medium text-primary mb-2">Step {index + 1}</div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
              <div>
                <h2 className="text-3xl font-bold mb-2">Top Rated Barbers</h2>
                <p className="text-muted-foreground">Discover the best barbers in your area</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/barbers')} data-testid="button-view-all-barbers">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockBarbers.map((barber) => (
                <BarberCard
                  key={barber.id}
                  barber={barber}
                  onBook={handleBook}
                  onViewProfile={() => navigate(`/barbers/${barber.id}`)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Professional grooming services tailored to your needs
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-4">
              {mockServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t py-12 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Scissors className="h-6 w-6 text-primary" />
                  <span className="text-xl font-semibold">BarberBook</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your trusted platform for finding and booking professional barbers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/barbers" className="hover:text-foreground transition-colors">Find Barbers</a></li>
                  <li><a href="/services" className="hover:text-foreground transition-colors">Services</a></li>
                  <li><a href="/my-bookings" className="hover:text-foreground transition-colors">My Bookings</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">For Barbers</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Join as Barber</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Barber Dashboard</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Resources</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
              2024 BarberBook. All rights reserved.
            </div>
          </div>
        </footer>
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
