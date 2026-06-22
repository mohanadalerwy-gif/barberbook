import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Users, Scissors, Sparkles, Home } from 'lucide-react';

function DecorativeAccent() {
  return (
    <div className="flex justify-center py-3">
      <div className="flex items-center gap-2 opacity-40">
        <div
          className="h-px w-8"
          style={{ background: 'linear-gradient(to right, transparent, var(--ds-gold-primary))' }}
        />
        <Sparkles className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
        <Scissors className="h-5 w-5 rotate-45" style={{ color: 'var(--ds-gold-primary)' }} />
        <Sparkles className="h-4 w-4" style={{ color: 'var(--ds-gold-primary)' }} />
        <div
          className="h-px w-8"
          style={{ background: 'linear-gradient(to left, transparent, var(--ds-gold-primary))' }}
        />
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
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-40 backdrop-blur-md px-4 py-4 bg-[#FAF8F5]/90 dark:bg-[#121212]/90"
        style={{ borderBottom: '1px solid rgba(176,132,66,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ds-gold-primary)' }}>
            {t('bookAppointment')}
          </h1>
        </div>
      </header>

      <DecorativeAccent />

      <main className="px-4 py-6 space-y-6">
        <section>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--ds-gold-primary)' }}>
            {t('howToBook')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('chooseBookingMethod')}
          </p>

          <div className="space-y-3">
            <div
              className="ds-card p-5 cursor-pointer hover-elevate"
              onClick={() => navigate('/nearby')}
              role="button"
              data-testid="button-book-by-location"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(176,132,66,0.10)' }}
                >
                  <MapPin className="h-7 w-7" style={{ color: 'var(--ds-gold-primary)' }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{t('bookByLocation')}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t('bookByLocationDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="ds-card p-5 cursor-pointer hover-elevate"
              onClick={() => navigate('/book-by-barber')}
              role="button"
              data-testid="button-book-by-barber"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(176,132,66,0.10)' }}
                >
                  <Users className="h-7 w-7" style={{ color: 'var(--ds-gold-primary)' }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{t('bookByBarber')}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t('bookByBarberDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="ds-card p-5 cursor-pointer hover-elevate"
              onClick={() => navigate('/home-service')}
              role="button"
              data-testid="button-book-home-service"
              style={{ borderColor: 'rgba(176,132,66,0.30)' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(176,132,66,0.10)' }}
                >
                  <Home className="h-7 w-7" style={{ color: 'var(--ds-gold-primary)' }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{t('homeService')}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t('homeServiceDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
