import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { toAbsoluteUrl } from '@/lib/queryClient';
import { Label } from '@/components/ui/label';
import { Scissors } from 'lucide-react';

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(toAbsoluteUrl('/api/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang: i18n.language }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? t('networkError'));
        return;
      }

      setSent(true);
      if (data.token) {
        setDevToken(data.token);
      }
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
          {t('forgotPasswordTitle')}
        </h2>
        <p className="text-sm text-center text-muted-foreground mb-6">{t('forgotPasswordSubtitle')}</p>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">{t('resetCodeSent')}</p>

            {devToken && (
              <div
                className="rounded-xl p-4 text-center space-y-1"
                style={{
                  background: 'rgba(176, 132, 66, 0.08)',
                  border: '1px dashed var(--ds-gold-primary)',
                }}
              >
                <p className="text-xs text-muted-foreground">{t('resetCodeDevHint')}</p>
                <p
                  className="text-2xl font-bold tracking-widest"
                  style={{ color: 'var(--ds-gold-primary)' }}
                >
                  {devToken}
                </p>
              </div>
            )}

            <button
              type="button"
              className="btn-primary w-full py-3"
              onClick={() => navigate('/reset-password')}
            >
              {t('resetPassword')}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                className="underline-offset-4 hover:underline"
                style={{ color: 'var(--ds-gold-primary)' }}
                onClick={() => navigate('/login')}
              >
                {t('backToLogin')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">{t('email')}</Label>
              <input
                id="email"
                type="email"
                required
                className="ds-input w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? t('loading') : t('sendResetCode')}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                className="underline-offset-4 hover:underline"
                style={{ color: 'var(--ds-gold-primary)' }}
                onClick={() => navigate('/login')}
              >
                {t('backToLogin')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
