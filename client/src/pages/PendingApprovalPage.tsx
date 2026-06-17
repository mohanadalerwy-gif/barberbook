import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '../assets/logo.png';

export default function PendingApprovalPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    queryClient.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" dir="rtl">
      <div className="flex flex-col items-center text-center max-w-sm w-full gap-6">
        <img
          src={logo}
          alt="SHVI"
          style={{ maxWidth: 160, height: 'auto', objectFit: 'contain' }}
        />

        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <Clock className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {t('pendingApprovalTitle')}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t('pendingApprovalMessage')}
          </p>
        </div>

        <Button variant="outline" onClick={handleLogout} className="w-full">
          {t('logout', 'تسجيل الخروج')}
        </Button>
      </div>
    </div>
  );
}
