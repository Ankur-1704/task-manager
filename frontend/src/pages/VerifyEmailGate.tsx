import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VerifyEmail from './VerifyEmail';

/** Dedicated route after signup so `/verify-email` always has explicit email state for resend. */
export default function VerifyEmailGate() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const state = location.state as
    | { email?: string; devOtp?: string | null; emailSent?: boolean | null }
    | undefined;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.is_verified) return <Navigate to="/dashboard" replace />;

  const email = (state?.email ?? user.email).trim().toLowerCase();
  return (
    <VerifyEmail
      email={email}
      initialDevOtp={state?.devOtp ?? undefined}
      initialSignupEmailSent={state?.emailSent}
    />
  );
}
