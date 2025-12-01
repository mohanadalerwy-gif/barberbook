import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BottomNav from '@/components/BottomNav';
import { 
  ArrowLeft, 
  Globe, 
  Info, 
  HelpCircle, 
  Scissors,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
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
          <h1 className="text-xl font-bold">Settings</h1>
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
                <span>Dark Mode</span>
              </div>
              <span className="text-muted-foreground text-sm">
                {theme === 'dark' ? 'On' : 'Off'}
              </span>
            </button>
            <Separator />
            <button 
              className="w-full flex items-center justify-between p-4 hover-elevate"
              data-testid="button-language"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span>Language</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">English</span>
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
                <span>About</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <Separator />
            <button 
              className="w-full flex items-center justify-between p-4 hover-elevate rounded-b-lg"
              data-testid="button-support"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span>Support</span>
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
                <div className="text-left">
                  <p className="font-medium">Barber Registration</p>
                  <p className="text-sm text-muted-foreground">
                    Join as a barber and manage your bookings
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Version 1.0.0
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
