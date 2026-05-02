import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { resendOtp } from '../api/auth';
import { formatApiErrorDetail } from '../lib/apiError';
import { isAxiosError } from 'axios';

interface Props {
  email: string;
  /** Shown when API is run with DEV_EXPOSE_OTP_IN_RESPONSE (e.g. resume-verification flow). */
  initialDevOtp?: string | null;
  /** From signup response when user lands via /verify-email (SMTP handoff failed). */
  initialSignupEmailSent?: boolean | null;
}

export default function VerifyEmail({ email, initialDevOtp, initialSignupEmailSent }: Props) {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromRegister = (location.state as { devOtp?: string } | undefined)?.devOtp;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [devOtpShown, setDevOtpShown] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return setError('Please enter all 6 digits');
    setError('');
    setResendSuccess(null);
    setIsLoading(true);
    try {
      await verifyEmail(email, code);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Invalid or expired code. Try again.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setError('');
    setResendSuccess(null);
    setResendLoading(true);
    const baseHintDev = import.meta.env.DEV
      ? ` Axios baseURL is ${JSON.stringify(client.defaults.baseURL ?? '/api')} (vite must proxy /api → FastAPI).`
      : '';
    try {
      const normalized = email.trim().toLowerCase();
      const data = await resendOtp(normalized);
      const sent = data.email_sent;

      setDevOtpShown(data.dev_otp ?? null);
      setResendCooldown(60);

      if (sent === true) {
        toast.success(
          `Request OK: OTP email handed off for ${normalized}. If nothing arrives, check Spam and Gmail Sent (sender mailbox).`,
          { duration: 8000 },
        );
        setResendSuccess(
          'A new code was sent. If you do not see it in a minute, open Spam (Gmail often filters verification mail), Promotions, then All Mail.',
        );
      } else if (data.dev_otp) {
        toast.error(
          `SMTP did not accept mail for ${normalized}. The API is in dev fallback (DEV_EXPOSE_OTP_IN_RESPONSE); use the code shown below.`,
          { duration: 10000 },
        );
        setResendSuccess(
          'SMTP failed; use the dev code below to verify. For real email, fix MAIL_* and turn off DEV_EXPOSE_OTP_IN_RESPONSE in production.',
        );
      } else {
        toast.error(
          `SMTP did not accept mail for ${normalized}. Call GET /api/health/email on the same host as this request (not only on /docs) and fix MAIL_*.${baseHintDev}`,
          { duration: 12000 },
        );
        setResendSuccess(
          'The server reported email_sent=false without dev_otp; check uvicorn logs for [EMAIL] and [AUTH] resend_otp lines.',
        );
      }
    } catch (err: unknown) {
      if (!(isAxiosError(err)) && err instanceof Error) {
        setError(err.message);
        toast.error(`${err.message}${baseHintDev}`, { duration: 14000 });
        return;
      }
      const ax = err as { response?: { status?: number; data?: { detail?: unknown } } };
      const status = ax.response?.status;
      const fallback =
        status === 429
          ? 'Too many resend attempts. Wait a minute and try again.'
          : status === 404
            ? 'No account found for this email. Use the same address you registered with.'
            : status === 503
              ? 'Mail server rejected sending (check API logs and MAIL_* in .env).'
              : 'Failed to resend. Please try again.';
      const msg = formatApiErrorDetail(ax.response?.data?.detail, fallback);
      setError(msg);
      toast.error(`${msg}${baseHintDev}`, { duration: 7000 });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      <div className="absolute top-[-80px] right-[-60px] w-96 h-96 rounded-full opacity-30 animate-blob"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      <div className="absolute bottom-[-100px] left-[-80px] w-80 h-80 rounded-full opacity-25 animate-blob"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)', animationDelay: '2.5s' }} />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl shadow-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Check your email</h1>
          <p className="text-purple-300/80 mt-2 text-sm">
            We sent a 6-digit code to<br />
            <span className="text-white font-semibold">{email}</span>
          </p>
          <p className="text-purple-300/60 mt-3 text-xs max-w-xs mx-auto leading-relaxed">
            Gmail often puts the first message in <strong className="text-purple-200/90">Spam</strong>. Open Spam,
            choose <strong className="text-purple-200/90">Report not spam</strong>, and future codes usually land in
            Inbox. Also check Promotions and search “Team Task Manager”. If you use Gmail SMTP as sender, open that
            account’s <strong className="text-purple-200/90">Sent</strong> — if the message is there, the server handed it off successfully.
          </p>
        </div>

        {initialSignupEmailSent === false && (
          <div className="mb-4 rounded-2xl border border-orange-400/40 bg-orange-500/15 px-4 py-3 text-sm text-orange-100">
            Signup reports the server did not successfully hand mail to SMTP (<code className="text-xs">email_sent:</code>{' '}
            false). Check <code className="text-xs">MAIL_*</code> in the API .env, restart uvicorn, then tap Resend code.
          </div>
        )}



        <div className="glass rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {resendSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-400/30 text-emerald-100 text-sm rounded-2xl px-4 py-3">
                {resendSuccess}
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-300 text-sm rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white/90 text-gray-900 focus:outline-none focus:border-indigo-500 transition-all"
                  style={{ borderColor: digit ? '#6366f1' : '#e5e7eb' }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.join('').length < 6}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Didn't receive a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading
                ? 'Sending…'
                : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend code'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
