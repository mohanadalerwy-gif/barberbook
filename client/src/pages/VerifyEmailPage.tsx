import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toAbsoluteUrl } from '@/lib/queryClient';
import { MailCheck } from 'lucide-react';

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRtl = i18n.language === 'ar';

  const userId = sessionStorage.getItem('pendingVerifyUserId') ?? '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }
    startCooldown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) { setError(t('otpEnterAll')); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(toAbsoluteUrl('/api/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message === 'Code expired' ? t('otpExpired') : data.message === 'Invalid code' ? t('otpInvalid') : data.message); return; }
      sessionStorage.removeItem('pendingVerifyUserId');
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      navigate('/profile');
    } catch {
      setError(t('networkError', 'Network error. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      const res = await fetch(toAbsoluteUrl('/api/resend-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lang: i18n.language }),
      });
      if (res.ok) startCooldown();
    } catch {
      setError(t('networkError', 'Network error. Please try again.'));
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
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
            <MailCheck style={{ width: 24, height: 24, color: 'var(--ds-gold-primary)' }} />
          </div>
        </div>

        <h2
          className="text-xl font-semibold text-center mb-1"
          style={{ color: 'var(--ds-gold-primary)' }}
        >
          {t('otpTitle')}
        </h2>
        <p className="text-sm text-center text-muted-foreground mb-6">{t('otpSubtitle')}</p>

        <form onSubmit={handleVerify} className="space-y-6">
          {/* OTP digit boxes */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                autoFocus={i === 0}
                className="ds-input text-center text-xl font-bold"
                style={{
                  width: 48,
                  height: 52,
                  padding: 0,
                  borderColor: d ? 'var(--ds-gold-primary)' : undefined,
                }}
              />
            ))}
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? t('loading') : t('otpVerify')}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {t('otpNoCode')}{' '}
          {cooldown > 0 ? (
            <span style={{ color: 'var(--ds-gold-primary)' }}>
              {t('otpResendIn', { seconds: cooldown })}
            </span>
          ) : (
            <button
              type="button"
              className="underline-offset-4 hover:underline disabled:opacity-50"
              style={{ color: 'var(--ds-gold-primary)' }}
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? t('loading') : t('otpResend')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
