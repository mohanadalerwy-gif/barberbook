import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Users, Scissors, Sparkles, Home } from 'lucide-react';

function DecorativeAccent() {
  return (
    <div className="flex justify-center py-3">
      <div className="flex items-center gap-2 opacity-40">
        <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/50" />
        <Sparkles className="h-4 w-4 text-primary" />
        <Scissors className="h-5 w-5 text-primary rotate-45" />
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/50" />
      </div>
    </div>
  );
}

export default function BookPage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t('bookAppointment')}</h1>
        </div>
      </header>

      <DecorativeAccent />

      <main className="px-4 py-6 space-y-6">
        <section>
          <h2 className="font-semibold mb-2">{t('howToBook')}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('chooseBookingMethod')}
          </p>

          <div className="space-y-3">
            <Card 
              className="cursor-pointer hover-elevate"
              onClick={() => navigate('/nearby')}
              data-testid="button-book-by-location"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{t('bookByLocation')}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('bookByLocationDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover-elevate"
              onClick={() => navigate('/book-by-barber')}
              data-testid="button-book-by-barber"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{t('bookByBarber')}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('bookByBarberDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover-elevate border-primary/30"
              onClick={() => navigate('/home-service')}
              data-testid="button-book-home-service"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Home className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{t('homeService')}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('homeServiceDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

    </div>
  );
}
