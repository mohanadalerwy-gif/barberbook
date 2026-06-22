import { useState, useEffect, type ReactNode } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  User as UserIcon,
  Edit,
  Scissors,
  Moon,
  Sun,
  Globe,
  Info,
  Headphones,
  ChevronRight,
  LogOut,
  Lock,
  Tag,
  FileText,
  Shield,
} from 'lucide-react';
import { clearCsrfToken, toAbsoluteUrl } from '@/lib/queryClient';

// ── Gold constants ───────────────────────────────────────────────────────────

const GOLD = 'var(--ds-gold-primary)';
const GOLD_BG_10 = 'rgba(176,132,66,0.10)';
const GOLD_BG_12 = 'rgba(176,132,66,0.12)';
const GOLD_SEP = 'rgba(176,132,66,0.08)';
const GOLD_BORDER = 'rgba(176,132,66,0.18)';
const GOLD_CARD_BG = 'rgba(176,132,66,0.06)';

// ── Shared sub-components ────────────────────────────────────────────────────

function IOSToggle({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'relative inline-flex h-[31px] w-[51px] shrink-0 rounded-full',
        'transition-colors duration-200 ease-in-out',
        checked ? 'bg-[#B08442]' : 'bg-[#E5E5EA] dark:bg-[#3A3A3C]',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-[2px] left-[2px]',
          'h-[27px] w-[27px] rounded-full bg-white',
          'shadow-[0_2px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.12)]',
          'transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-[20px]' : 'translate-x-0',
        ].join(' ')}
      />
    </span>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold px-5 mb-2" style={{ color: GOLD }}>
      {label}
    </p>
  );
}

function MenuCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-4 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${GOLD_SEP}` }}
    >
      {children}
    </div>
  );
}

function MenuRow({
  icon,
  label,
  right,
  onClick,
  testId,
}: {
  icon: ReactNode;
  label: string;
  right?: ReactNode;
  onClick?: () => void;
  testId?: string;
}) {
  return (
    <button
      className="w-full flex items-center justify-between px-4 py-3.5 bg-card active:opacity-60 transition-opacity text-start"
      onClick={onClick}
      data-testid={testId}
    >
      <div className="flex items-center gap-3">
        <span
          className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: GOLD_BG_10 }}
        >
          {icon}
        </span>
        <span className="font-medium text-sm">{label}</span>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </button>
  );
}

function GoldSep() {
  return <Separator style={{ backgroundColor: GOLD_SEP }} />;
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const isArabic = i18n.language.startsWith('ar');

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (searchString.includes('booked=true')) {
      toast({ title: t('bookingConfirmed'), description: t('appointmentBookedSuccess') });
    }
  }, [searchString, toast, t]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', next);
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  const handleLogout = async () => {
    await fetch(toAbsoluteUrl('/api/logout'), { method: 'POST' });
    clearCsrfToken();
    await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    navigate('/');
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen pb-8">
        <div className="px-5 pt-6 pb-4">
          <div className="h-6 w-36 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="px-4">
          <div
            className="rounded-2xl p-4"
            style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_CARD_BG }}
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 rounded-lg bg-muted animate-pulse" />
                <div className="h-3 w-24 rounded-lg bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Sections shared between auth states ──────────────────────────────────
  const chevron = <ChevronRight className="h-4 w-4 text-muted-foreground" />;
  const gi = (icon: ReactNode) => (
    <span style={{ color: GOLD }} className="flex">{icon}</span>
  );

  const prefsSection = (
    <div className="space-y-2">
      <SectionLabel label="التفضيلات" />
      <MenuCard>
        <MenuRow
          icon={gi(theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />)}
          label={t('darkMode')}
          right={<IOSToggle checked={theme === 'dark'} />}
          onClick={toggleTheme}
          testId="button-theme"
        />
        <GoldSep />
        <MenuRow
          icon={gi(<Globe className="h-4 w-4" />)}
          label="العربية"
          right={<IOSToggle checked={isArabic} />}
          onClick={toggleLanguage}
          testId="button-language"
        />
      </MenuCard>
    </div>
  );

  const infoSection = (showBarberItems: boolean) => (
    <div className="space-y-2">
      <SectionLabel label="معلومات ومساعدة" />
      <MenuCard>
        <MenuRow
          icon={gi(<Headphones className="h-4 w-4" />)}
          label="مركز الدعم"
          right={chevron}
          onClick={() => navigate('/support')}
          testId="button-support"
        />
        <GoldSep />
        <MenuRow
          icon={gi(<Info className="h-4 w-4" />)}
          label="عن التطبيق"
          right={chevron}
          onClick={() => navigate('/about')}
          testId="button-about"
        />
        <GoldSep />
        <MenuRow
          icon={gi(<FileText className="h-4 w-4" />)}
          label="الشروط والأحكام"
          right={chevron}
          onClick={() => navigate('/terms')}
          testId="button-terms"
        />
        <GoldSep />
        <MenuRow
          icon={gi(<Shield className="h-4 w-4" />)}
          label="سياسة الخصوصية"
          right={chevron}
          onClick={() => navigate('/privacy')}
          testId="button-privacy"
        />
        {showBarberItems && (
          <>
            <GoldSep />
            <MenuRow
              icon={gi(<Tag className="h-4 w-4" />)}
              label="طلب تغيير السعر"
              right={chevron}
              onClick={() => navigate('/price-change-request')}
              testId="button-price-change"
            />
          </>
        )}
      </MenuCard>
    </div>
  );

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen pb-8 space-y-5">
        <div className="px-5 pt-6 pb-1">
          <h1 className="text-xl font-bold">الملف الشخصي</h1>
        </div>

        {/* Sign-in prompt */}
        <div className="px-4">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_CARD_BG }}
          >
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: GOLD_BG_12 }}
            >
              <UserIcon className="h-8 w-8" style={{ color: GOLD }} />
            </div>
            <p className="font-bold mb-1">{t('signInToContinue')}</p>
            <p className="text-sm text-muted-foreground mb-5">{t('viewAppointments')}</p>
            <button
              className="w-full h-11 rounded-xl font-bold text-sm text-white active:opacity-80 transition-opacity"
              style={{ background: GOLD }}
              onClick={() => navigate('/login')}
              data-testid="button-login"
            >
              {t('signIn')}
            </button>
          </div>
        </div>

        {prefsSection}
        {infoSection(false)}
      </div>
    );
  }

  // ── Authenticated ────────────────────────────────────────────────────────
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || t('user');
  const isBarber = user.role === 'barber';
  const isCustomer = user.role === 'customer';

  return (
    <div className="min-h-screen pb-8 space-y-5">
      <div className="px-5 pt-6 pb-1">
        <h1 className="text-xl font-bold">الملف الشخصي</h1>
      </div>

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <div className="px-4">
        <div
          className="rounded-2xl p-4"
          style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_CARD_BG }}
        >
          <div className="flex items-center gap-4">
            <Avatar
              className="h-16 w-16 shrink-0"
              style={{ border: '2px solid rgba(176,132,66,0.30)' }}
            >
              <AvatarImage src={user.profileImageUrl || ''} alt={userName} />
              <AvatarFallback
                style={{
                  background: GOLD_BG_12,
                  color: GOLD,
                  fontWeight: 700,
                  fontSize: '1.2rem',
                }}
              >
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-base leading-snug">{userName}</p>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {user.phone || user.email}
              </p>
              {isBarber && (
                <span
                  className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: GOLD_BG_12, color: GOLD }}
                >
                  <Scissors className="h-3 w-3" />
                  حلاق
                </span>
              )}
            </div>

            <button
              className="p-2.5 rounded-xl shrink-0 active:opacity-60 transition-opacity"
              style={{ background: GOLD_BG_10 }}
              onClick={() => navigate('/profile/edit')}
              data-testid="button-edit-profile"
            >
              <Edit className="h-4 w-4" style={{ color: GOLD }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Role CTA ─────────────────────────────────────────────────────── */}
      {isBarber && (
        <div className="px-4">
          <button
            className="w-full h-12 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
            style={{ background: GOLD }}
            onClick={() => navigate('/barber-dashboard')}
            data-testid="button-barber-dashboard"
          >
            <Scissors className="h-4 w-4" />
            لوحة الحلاق
          </button>
        </div>
      )}
      {isCustomer && (
        <div className="px-4">
          <button
            className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
            style={{ border: '1.5px solid rgba(176,132,66,0.40)', color: GOLD }}
            onClick={() => navigate('/barber-register')}
            data-testid="button-become-barber"
          >
            <Scissors className="h-4 w-4" />
            كن حلاقاً
          </button>
        </div>
      )}

      {/* ── Preferences ──────────────────────────────────────────────────── */}
      {prefsSection}

      {/* ── Info & Help ──────────────────────────────────────────────────── */}
      {infoSection(isBarber)}

      {/* ── Barber price notice ──────────────────────────────────────────── */}
      {isBarber && (
        <div className="px-4">
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: GOLD_CARD_BG, border: `1px solid ${GOLD_BG_12}` }}
          >
            <Lock className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
            <p className="text-sm text-muted-foreground">{t('pricesSetByAdmin')}</p>
          </div>
        </div>
      )}

      {/* ── Sign out ─────────────────────────────────────────────────────── */}
      <div className="px-4">
        <button
          className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          style={{ border: '1.5px solid rgba(220,38,38,0.35)', color: 'rgb(220,38,38)' }}
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>

      {/* ── Version ──────────────────────────────────────────────────────── */}
      <p className="text-center text-xs text-muted-foreground pb-2">{t('version')}</p>
    </div>
  );
}
