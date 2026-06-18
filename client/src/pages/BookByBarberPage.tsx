import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Star, Scissors, Store } from 'lucide-react';
import type { Barber } from '@/lib/types';
import { toAbsoluteUrl } from '@/lib/queryClient';

export default function BookByBarberPage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const { data: barbers = [], isLoading } = useQuery<Barber[]>({
    queryKey: ['/api/barbers'],
    queryFn: async () => {
      const res = await fetch(toAbsoluteUrl('/api/barbers'));
      if (!res.ok) throw new Error('Failed to fetch barbers');
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/book')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t('bookByBarber')}</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          {t('selectBarberToBook')}
        </p>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : barbers.length > 0 ? (
          <div className="space-y-3">
            {barbers.map((barber) => (
              <Card 
                key={barber.id}
                className="cursor-pointer hover-elevate"
                onClick={() => navigate(`/barber/${barber.id}`)}
                data-testid={`barber-card-${barber.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={barber.avatar} alt={barber.name} />
                      <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate" data-testid={`text-barber-name-${barber.id}`}>
                        {barber.name}
                      </h3>
                      {barber.shopName && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Store className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate" data-testid={`text-shop-name-${barber.id}`}>{barber.shopName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{barber.rating || 0}</span>
                        </div>
                        {(barber.haircutPrice || barber.beardPrice) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {barber.haircutPrice && (
                              <span className="flex items-center gap-1">
                                <Scissors className="h-3 w-3" />
                                ${barber.haircutPrice}
                              </span>
                            )}
                            {barber.beardPrice && (
                              <span>{t('beard')}: ${barber.beardPrice}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {t('noBarbers')}
              </p>
            </CardContent>
          </Card>
        )}
      </main>

    </div>
  );
}
