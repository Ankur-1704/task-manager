import type { InternalAxiosRequestConfig } from 'axios';
import client from './client';
import type { TokenResponse, User } from '../types';

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
    throw new Error(
      'Signup response missing access_token. Open DevTools Network and confirm POST hits your FastAPI (JSON body, not an HTML page).',
    );
  const type = typeof o.token_type === 'string' ? o.token_type : 'bearer';
  const ivRaw = o.is_verified ?? o.isVerified;
  const is_verified = typeof ivRaw === 'boolean' ? ivRaw : true;
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

export const getMe = (skipAuthRedirectOn401 = false) =>
  skipAuthRedirectOn401
    ? client
        .get<User>(
          '/auth/me',
          { skipAuthRedirect: true } as InternalAxiosRequestConfig & { skipAuthRedirect?: boolean },
        )
        .then((r) => r.data)
    : client.get<User>('/auth/me').then((r) => r.data);
