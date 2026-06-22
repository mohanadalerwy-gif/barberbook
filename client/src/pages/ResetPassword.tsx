import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { toAbsoluteUrl } from '@/lib/queryClient';
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="ds-card w-full max-w-sm"
        style={{
          borderRadius: 'var(--ds-radius-lg)',
          padding: '32px 24px 28px',
          borderTop: '3px solid var(--ds-gold-primary)',
        }}
      >
        {/* Icon badge */}
        <div className="flex justify-center mb-4">
          <div
            style={{
              background: 'rgba(176, 132, 66, 0.12)',
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Scissors style={{ width: 24, height: 24, color: 'var(--ds-gold-primary)' }} />
          </div>
        </div>

        <h2
          className="text-xl font-semibold text-center mb-1"
          style={{ color: 'var(--ds-gold-primary)' }}
        >
          {t('resetPasswordTitle')}
        </h2>
        <p className="text-sm text-center text-muted-foreground mb-6">{t('resetPasswordSubtitle')}</p>

        {success ? (
          <div className="space-y-4 text-center">
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(176, 132, 66, 0.08)',
                border: '1px solid var(--ds-bg-tertiary)',
              }}
            >
              <p className="text-sm text-muted-foreground">{t('passwordResetSuccess')}</p>
            </div>
            <button type="button" className="btn-primary w-full py-3" onClick={() => navigate('/login')}>
              {t('signIn')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="token">{t('resetCode')}</Label>
              <input
                id="token"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                className="ds-input w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 text-center tracking-widest"
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
                placeholder={t('enterResetCode')}
                autoComplete="one-time-code"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <input
                id="newPassword"
                type="password"
                required
                className="ds-input w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="ds-input w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? t('loading') : t('resetPassword')}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                className="underline-offset-4 hover:underline"
                style={{ color: 'var(--ds-gold-primary)' }}
                onClick={() => navigate('/forgot-password')}
              >
                {t('forgotPassword')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
