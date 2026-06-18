import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { toAbsoluteUrl } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors } from 'lucide-react';

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(toAbsoluteUrl('/api/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message === 'Invalid or expired reset code' || data.message === 'Reset code has expired' || data.message === 'Reset code has already been used'
          ? t('invalidResetCode')
          : (data.message ?? t('networkError')));
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('resetPasswordTitle')}</CardTitle>
          <CardDescription>{t('resetPasswordSubtitle')}</CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">{t('passwordResetSuccess')}</p>
              <Button className="w-full" onClick={() => navigate('/login')}>
                {t('signIn')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="token">{t('resetCode')}</Label>
                <Input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={token}
                  onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('enterResetCode')}
                  autoComplete="one-time-code"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="newPassword">{t('newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loading') : t('resetPassword')}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => navigate('/forgot-password')}
                >
                  {t('forgotPassword')}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
