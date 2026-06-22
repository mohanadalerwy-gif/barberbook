import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { toAbsoluteUrl } from '@/lib/queryClient';
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
      const url = toAbsoluteUrl(mode === 'login' ? '/api/login' : '/api/register');
      const body: Record<string, string> = { email, password, lang: i18n.language };
      if (mode === 'register') {
        if (firstName) body.firstName = firstName;
        if (lastName) body.lastName = lastName;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
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
      const me = await queryClient.fetchQuery<{ role?: string; barber?: { isApproved?: boolean | null } | null }>({
        queryKey: ['/api/auth/user'],
        staleTime: 0,
      });
      if (me?.role === 'admin') {
        navigate('/panel-d37eb5xcwv');
      } else if (me?.role === 'employee') {
        navigate('/employee');
      } else if (me?.role === 'barber') {
        if (me.barber?.isApproved === true) {
          navigate('/barber-dashboard');
        } else {
          navigate('/pending-approval');
        }
      } else {
        navigate('/');
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
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="SHVI"
            className="hero-logo"
            style={{ width: 160, height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Title */}
        <h2
          className="text-xl font-semibold text-center mb-6"
          style={{ color: 'var(--ds-gold-primary)' }}
        >
          {mode === 'login' ? t('signIn') : t('createAccount', 'Create account')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">{t('firstName', 'First name')}</Label>
                <input
                  id="firstName"
                  className="ds-input w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Ali"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">{t('lastName', 'Last name')}</Label>
                <input
                  id="lastName"
                  className="ds-input w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Hassan"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">{t('email', 'Email')}</Label>
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

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('password', 'Password')}</Label>
              {mode === 'login' && (
                <button
                  type="button"
                  className="text-xs underline-offset-4 hover:underline"
                  style={{ color: 'var(--ds-gold-primary)' }}
                  onClick={() => navigate('/forgot-password')}
                >
                  {t('forgotPassword', 'Forgot password?')}
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              required
              className="ds-input w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">{t('confirmPassword', 'Confirm password')}</Label>
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
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={loading}
          >
            {loading
              ? t('loading', 'Loading…')
              : mode === 'login'
                ? t('signIn')
                : t('createAccount', 'Create account')}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              {t('noAccount', "Don't have an account?")}{' '}
              <button
                type="button"
                className="font-medium underline-offset-4 hover:underline"
                style={{ color: 'var(--ds-gold-primary)' }}
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
                className="font-medium underline-offset-4 hover:underline"
                style={{ color: 'var(--ds-gold-primary)' }}
                onClick={() => { setMode('login'); setError(''); }}
              >
                {t('signIn')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
