import type { AxiosResponse } from 'axios';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

/** Do not attach JWT — backend treats these as public; old tokens caused confusing sessions during signup/resend. */
const PUBLIC_AUTH_PATHS = ['/auth/signup', '/auth/login'] as const;

function isPublicAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((p) => url === p || url.startsWith(`${p}?`) || url.startsWith(`${p}&`));
}

/** Dev: leave unset to use `/api` (Vite proxy). If proxy fails, set `VITE_API_BASE_URL=http://127.0.0.1:8001/api` in `frontend/.env`. */
function apiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!raw) return '/api';
  const u = raw.replace(/\/$/, '');
  return u.endsWith('/api') ? u : `${u}/api`;
}

const client = axios.create({
  baseURL: apiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000,
});

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isPublicAuthPath(config.url)) {
    delete (config.headers as Record<string, unknown>).Authorization;
    return config;
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const skip =
        !!(error.config as { skipAuthRedirect?: boolean })?.skipAuthRedirect;
      if (!skip) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default client;
