import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatApiErrorDetail } from '../lib/apiError';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Please fill in all fields');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        formatApiErrorDetail(
          err.response?.data?.detail,
          err.response?.status === 403
            ? 'Please verify your email before signing in.'
            : 'Invalid email or password',
        ),
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
      <div className="absolute top-[-100px] left-[-80px] w-96 h-96 rounded-full opacity-30 animate-blob"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)', animationDelay: '0s' }} />
      <div className="absolute bottom-[-80px] right-[-60px] w-80 h-80 rounded-full opacity-25 animate-blob"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)', animationDelay: '2s' }} />
      <div className="absolute top-[40%] right-[20%] w-56 h-56 rounded-full opacity-20 animate-blob"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', animationDelay: '4s' }} />

      <div className="relative w-full max-w-sm px-1 sm:px-0">
        <div className="text-center mb-8 animate-fade-in-down">
          <div
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl shadow-2xl mb-5 animate-float"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-purple-300/80 mt-2 text-sm">Sign in to your TaskFlow account</p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-in-up delay-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-900 text-sm rounded-2xl px-4 py-3 animate-fade-in leading-relaxed">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all active:scale-[0.98] mt-2 shadow-lg"
              style={{ background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Need to verify your email?{' '}
            <Link
              to={email ? `/resume-verification?email=${encodeURIComponent(email)}` : '/resume-verification'}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Send a code
            </Link>
          </p>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
