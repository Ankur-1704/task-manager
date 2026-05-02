/** Turn FastAPI `detail` (string or validation error list) into a user-visible message. */
export function formatApiErrorDetail(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length) {
    const parts = detail
      .map((item) => (item && typeof item === 'object' && 'msg' in item ? String((item as { msg: string }).msg) : null))
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  return fallback;
}
