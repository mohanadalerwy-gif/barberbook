import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  ChevronLeft,
  MapPin,
  Home,
  Star,
} from 'lucide-react';
import logo from '../assets/logo.png';

export default function AboutPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            aria-label="رجوع"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-8 space-y-8 max-w-lg mx-auto pb-12">

        {/* Logo + App name + Taglines */}
        <div className="flex flex-col items-center gap-4 text-center">
          <img src={logo} alt="SHVI" style={{ maxWidth: 180, height: 'auto', objectFit: 'contain', background: 'transparent', border: 'none', boxShadow: 'none' }} />

          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">
              وقتك أغلى من الانتظار
            </p>
            <p className="text-sm text-muted-foreground">
              Your time is worth more than waiting
            </p>
          </div>
        </div>

        <Separator />

        {/* من نحن */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold">من نحن</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-muted-foreground leading-relaxed text-right">
                شيفي منصة سعودية لحجز مواعيد الحلاقين بسهولة وسرعة. سواء تجي للصالون أو نجيب الحلاق لك — كل شيء بضغطة واحدة. ما تحتاج تنتظر دورك، ولا تتصل، ولا تتساءل.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed text-left" dir="ltr">
                SHVI connects you with nearby barbers in seconds. Book a salon visit or get a barber to come to you. No waiting, no calls, no guessing.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-medium leading-tight text-muted-foreground">
                حلاقين قريبين
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Home className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-medium leading-tight text-muted-foreground">
                خدمة منزلية
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-medium leading-tight text-muted-foreground">
                تقييمات حقيقية
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Links */}
        <Card>
          <CardContent className="p-0">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors rounded-t-lg"
              onClick={() => navigate('/privacy')}
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">سياسة الخصوصية</span>
            </button>

            <Separator />

            <button
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              onClick={() => navigate('/terms')}
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">شروط الاستخدام</span>
            </button>

            <Separator />

            <a
              href="mailto:support@shvi.app"
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors rounded-b-lg"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">تواصل معنا</span>
            </a>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-1 pt-2">
          <p className="text-sm text-muted-foreground">الإصدار 1.0.0</p>
          <p className="text-xs text-muted-foreground">© 2025 SHVI</p>
        </div>

      </main>
    </div>
  );
}
