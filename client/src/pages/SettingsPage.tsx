import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Globe,
  Info,
  HeadphonesIcon,
  Scissors,
  ChevronRight,
  Moon,
  Sun,
  DollarSign,
} from 'lucide-react';

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };

  const toggleLanguage = () => {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t('settings')}</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-0">
            <button
              className="w-full flex items-center justify-between p-4 hover-elevate rounded-t-lg"
              onClick={toggleTheme}
              data-testid="button-theme"
            >
              <div className="flex items-center gap-3">
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <span>{t('darkMode')}</span>
              </div>
              <span className="text-muted-foreground text-sm">
                {theme === 'dark' ? t('on') : t('off')}
              </span>
            </button>
            <Separator />
            <button
              className="w-full flex items-center justify-between p-4 hover-elevate"
              onClick={toggleLanguage}
              data-testid="button-language"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span>{t('language')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm font-medium">
                  {currentLang === 'ar' ? 'العربية' : 'English'}
                </span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
            <Separator />
            <button
              className="w-full flex items-center justify-between p-4 hover-elevate"
              data-testid="button-about"
            >
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-muted-foreground" />
                <span>{t('about')}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <Separator />
            <button
              className="w-full flex items-center justify-between p-4 hover-elevate rounded-b-lg"
              onClick={() => navigate('/support')}
              data-testid="button-support"
            >
              <div className="flex items-center gap-3">
                <HeadphonesIcon className="h-5 w-5 text-muted-foreground" />
                <span>{t('supportCenter')}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardContent className="p-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => navigate('/barber-register')}
              data-testid="button-barber-registration"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scissors className="h-5 w-5 text-primary" />
                </div>
                <div className="text-start">
                  <p className="font-medium">{t('barberRegistration')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('barberRegistrationTagline')}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {isAuthenticated && user?.role === 'barber' && (
          <Card>
            <CardContent className="p-0">
              <button
                className="w-full flex items-center justify-between p-4 hover-elevate rounded-lg"
                onClick={() => navigate('/price-change-request')}
                data-testid="button-price-change-request"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span>{t('requestPriceChange')}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t('version')}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
