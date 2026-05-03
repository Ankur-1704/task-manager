import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatApiErrorDetail } from '../lib/apiError';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation_token') ?? undefined;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email || !password) return setError('Please fill in all fields');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setIsLoading(true);
    try {
      await register(name.trim(), email, password, invitationToken);
      toast.success('Account created. Welcome!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(
        formatApiErrorDetail(err.response?.data?.detail, 'Registration failed. Please try again.'),
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
      <div className="absolute top-[-80px] right-[-60px] w-96 h-96 rounded-full opacity-30 animate-blob"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)', animationDelay: '0s' }} />
      <div className="absolute bottom-[-100px] left-[-80px] w-80 h-80 rounded-full opacity-25 animate-blob"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)', animationDelay: '2.5s' }} />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-in-down">
          <div
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl shadow-2xl mb-5 animate-float"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="text-purple-300/80 mt-2 text-sm">
            {invitationToken ? "Accept your invitation to get started" : "Start managing your team's work today"}
          </p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-in-up delay-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-900 text-sm rounded-2xl px-4 py-3 animate-fade-in leading-relaxed">
                {error}
              </div>
            )}

            {[
              { label: 'Full Name', value: name, onChange: setName, type: 'text', placeholder: 'John Smith', autoComplete: 'name' },
              { label: 'Email Address', value: email, onChange: setEmail, type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
              { label: 'Password', value: password, onChange: setPassword, type: 'password', placeholder: 'Min. 6 characters', autoComplete: 'new-password' },
            ].map(({ label, value, onChange, type, placeholder, autoComplete }) => (
              <div key={label} className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all active:scale-[0.98] mt-1 shadow-lg"
              style={{ background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
