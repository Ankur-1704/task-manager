import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resendOtp } from '../api/auth';
import { formatApiErrorDetail } from '../lib/apiError';
import VerifyEmail from './VerifyEmail';

/** For users who signed up but need the code again — no login token required. */
export default function ResumeVerification() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [resendDevOtp, setResendDevOtp] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  if (showCodeStep && normalizedEmail) {
    return <VerifyEmail email={normalizedEmail} initialDevOtp={resendDevOtp} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return setError('Enter your email address');
    setIsLoading(true);
    try {
      const data = await resendOtp(trimmed);
      setResendDevOtp(data.dev_otp ?? null);
      setShowCodeStep(true);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: unknown } } };
      setError(
        formatApiErrorDetail(ax.response?.data?.detail, 'Could not send code. Try again shortly.'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Resume verification</h1>
          <p className="text-purple-300/80 mt-2 text-sm">
            Enter the email you registered with. We will send a new 6-digit code.
          </p>
        </div>
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-900 text-sm rounded-2xl px-4 py-3 leading-relaxed">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              {isLoading ? 'Sending…' : 'Send verification code'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
