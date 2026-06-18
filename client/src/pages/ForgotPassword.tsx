import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { toAbsoluteUrl } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('forgotPasswordTitle')}</CardTitle>
          <CardDescription>{t('forgotPasswordSubtitle')}</CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">{t('resetCodeSent')}</p>

              {devToken && (
                <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground">{t('resetCodeDevHint')}</p>
                  <p className="text-2xl font-bold tracking-widest text-primary">{devToken}</p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => navigate('/reset-password')}
              >
                {t('resetPassword')}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
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
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loading') : t('sendResetCode')}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => navigate('/login')}
                >
                  {t('backToLogin')}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
