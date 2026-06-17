import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '../assets/logo.png';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      const url = mode === 'login' ? '/api/login' : '/api/register';
      const body: Record<string, string> = { email, password, lang: i18n.language };
      if (mode === 'register') {
        if (firstName) body.firstName = firstName;
        if (lastName) body.lastName = lastName;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message === 'EMAIL_NOT_VERIFIED' && data.userId) {
          sessionStorage.setItem('pendingVerifyUserId', data.userId);
          navigate('/verify-email');
          return;
        }
        setError(data.message ?? 'Something went wrong');
        return;
      }

      if (data.requiresVerification) {
        sessionStorage.setItem('pendingVerifyUserId', data.userId);
        navigate('/verify-email');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      navigate('/');
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
            <img src={logo} alt="SHVI" style={{ maxWidth: 180, height: 'auto' }} />
          </div>
          <CardTitle className="text-2xl">
            {mode === 'login' ? t('signIn') : t('createAccount', 'Create account')}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName">{t('firstName', 'First name')}</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Ali"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">{t('lastName', 'Last name')}</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Hassan"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email">{t('email', 'Email')}</Label>
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

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('password', 'Password')}</Label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="text-xs text-primary underline-offset-4 hover:underline"
                    onClick={() => navigate('/forgot-password')}
                  >
                    {t('forgotPassword', 'Forgot password?')}
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">{t('confirmPassword', 'Confirm password')}</Label>
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
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t('loading', 'Loading…')
                : mode === 'login'
                  ? t('signIn')
                  : t('createAccount', 'Create account')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                {t('noAccount', "Don't have an account?")}{' '}
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => { setMode('register'); setError(''); }}
                >
                  {t('signUp', 'Sign up')}
                </button>
              </>
            ) : (
              <>
                {t('haveAccount', 'Already have an account?')}{' '}
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => { setMode('login'); setError(''); }}
                >
                  {t('signIn')}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
