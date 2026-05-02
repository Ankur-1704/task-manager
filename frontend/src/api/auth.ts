import type { InternalAxiosRequestConfig } from 'axios';
import client from './client';
import type { TokenResponse, User } from '../types';

export type OtpResendResult = {
  message: string;
  email_sent: boolean;
  dev_otp?: string | null;
};

/** POST /auth/resend-otp must return JSON with a boolean email_sent. HTML/text means the request missed FastAPI. */
function parseOtpResendPayload(raw: unknown): OtpResendResult {
  if (typeof raw === 'string') {
    const t = raw.trim();
    const preview = t.slice(0, 120).replace(/\s+/g, ' ');
    if (t.startsWith('<') || /<html[\s>/]/i.test(t)) {
      throw new Error(
        'Resend got HTML instead of JSON — /api probably did not reach FastAPI (proxy off, wrong port, or static host serving index.html). Open DevTools Network: POST must be …/api/auth/resend-otp with Content-Type JSON.',
      );
    }
    throw new Error(`Resend got plain text instead of JSON (starts: "${preview}${t.length > 120 ? '…' : ''}").`);
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(
      `Resend body must be a JSON object; got ${raw === null ? 'null' : Array.isArray(raw) ? 'array' : typeof raw}.`,
    );
  }
  const o = raw as Record<string, unknown>;
  const eb = o.email_sent ?? o.emailSent;
  let email_sent: boolean;
  if (typeof eb === 'boolean') {
    email_sent = eb;
  } else {
    /** Some proxies strip booleans but leave `message` (matches `app/api/routes/auth.py`). */
    const msg = typeof o.message === 'string' ? o.message.trim() : '';
    if (msg === 'OTP sent successfully') {
      email_sent = true;
    } else if (msg.startsWith('SMTP failed - use dev_otp')) {
      email_sent = false;
    } else {
      throw new Error(
        `Resend JSON has no boolean email_sent (camelCase emailSent also accepted) and message did not match a known OTP response. Keys: ${Object.keys(o).join(', ') || '(none)'}.`,
      );
    }
    if (import.meta.env.DEV) {
      console.warn(
        '[api] POST /auth/resend-otp: inferred email_sent from message; upstream may be stripping booleans:',
        Object.keys(o),
      );
    }
  }
  const dr = o.dev_otp ?? o.devOtp;
  const dev_otp =
    dr === undefined || dr === null
      ? dr
      : typeof dr === 'string'
        ? dr
        : String(dr);
  return {
    message: typeof o.message === 'string' ? o.message : '',
    email_sent,
    dev_otp,
  };
}

function parseSignupResponse(raw: unknown): TokenResponse {
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('<') || /<html[\s>/]/i.test(t)) {
      throw new Error(
        'Signup returned HTML instead of JSON — /api probably did not reach FastAPI (check VITE_API_BASE_URL or Vite proxy to port 8001).',
      );
    }
    throw new Error('Signup returned non-JSON.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Signup response must be a JSON object.');
  }
  const o = raw as Record<string, unknown>;
  const tok = typeof o.access_token === 'string' ? o.access_token : null;
  if (!tok)
    throw new Error('Signup response missing access_token. Open DevTools Network and confirm POST hits your FastAPI (JSON body, not an HTML page).');
  const type = typeof o.token_type === 'string' ? o.token_type : 'bearer';
  const ivRaw = o.is_verified ?? o.isVerified;
  const is_verified = typeof ivRaw === 'boolean' ? ivRaw : false;
  const es = o.email_sent ?? o.emailSent;
  let email_sent: boolean | undefined;
  if (typeof es === 'boolean') email_sent = es;
  const dRaw = o.dev_otp ?? o.devOtp;
  const dev_otp =
    dRaw === undefined || dRaw === null ? dRaw : typeof dRaw === 'string' ? dRaw : String(dRaw);
  return {
    access_token: tok,
    token_type: type,
    is_verified,
    email_sent,
    dev_otp,
  };
}

export const signup = (data: {
  name: string;
  email: string;
  password: string;
  invitation_token?: string;
}) => client.post<unknown>('/auth/signup', data).then((r) => parseSignupResponse(r.data));

export const login = (data: { email: string; password: string }) =>
  client.post<TokenResponse>('/auth/login', data).then((r) => r.data);

export const verifyEmail = (data: { email: string; otp_code: string }) =>
  client
    .post<{ access_token: string; token_type: string; user: User }>('/auth/verify-email', data)
    .then((r) => r.data);

export const resendOtp = (email: string) =>
  client.post<unknown>('/auth/resend-otp', { email }).then((r) => parseOtpResendPayload(r.data));

export const getMe = (skipAuthRedirectOn401 = false) =>
  skipAuthRedirectOn401
    ? client
        .get<User>(
          '/auth/me',
          { skipAuthRedirect: true } as InternalAxiosRequestConfig & { skipAuthRedirect?: boolean },
        )
        .then((r) => r.data)
    : client.get<User>('/auth/me').then((r) => r.data);
