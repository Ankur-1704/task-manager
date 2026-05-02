import { clsx, type ClassValue } from 'clsx';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function isDateOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
};

export const PRIORITY_BORDER: Record<string, string> = {
  LOW: 'border-l-emerald-400',
  MEDIUM: 'border-l-amber-400',
  HIGH: 'border-l-red-500',
};

export const COLUMN_STYLES: Record<string, { header: string; dot: string }> = {
  TODO: { header: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' },
  IN_PROGRESS: { header: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  DONE: { header: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
};
