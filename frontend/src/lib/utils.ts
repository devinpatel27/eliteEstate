import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined | null, pattern = 'dd/MM/yy'): string {
  if (!date) return '—';
  try {
    return format(new Date(date), pattern);
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'dd/MM/yy, hh:mm a');
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return initials || 'U';
}

export function getAvatarColor(name?: string | null): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-amber-500',
    'bg-indigo-500',
  ];
  const safeName = name && typeof name === 'string' ? name : 'User';
  const index = safeName.charCodeAt(0) % colors.length;
  return colors[index];
}

export function formatRoleName(roleName?: string | null): string {
  if (!roleName || typeof roleName !== 'string') return 'Unknown';
  return roleName.replace(/_/g, ' ');
}

export function getImageUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:5000';
  const normalized = path.replace(/^\/+/, '').replace(/^uploads\//, '');
  return `${base}/uploads/${normalized}`;
}

export function downloadCSV(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const STATUS_ALIASES: Record<string, string> = {
  new: 'open',
  contacted: 'open',
  open: 'open',
  pending: 'open',
  followup: 'open',
  'follow-up': 'open',
  follow_up: 'open',
  visit_scheduled: 'open',
  revisit_scheduled: 'open',
  negotiation: 'open',
  hold: 'hold',
  on_hold: 'hold',
  'on-hold': 'hold',
  booked: 'booked',
  book: 'booked',
  closed_won: 'booked',
  closed_lost: 'closed',
  closed: 'closed',
  close: 'closed',
};

const PRIORITY_ALIASES: Record<string, string> = {
  medium: 'warm',
  low: 'cold',
  high: 'hot',
};

export function normalizeLeadStatus(status?: string | null): string {
  if (!status) return '';
  const key = status.toLowerCase().replace(/\s+/g, '_');
  return STATUS_ALIASES[key] || key;
}

export function normalizeLeadPriority(priority?: string | null): string {
  if (!priority) return '';
  const key = priority.toLowerCase();
  return PRIORITY_ALIASES[key] || key;
}

export function formatLeadStatus(status?: string | null): string {
  if (!status) return 'Unknown';
  const normalized = normalizeLeadStatus(status);
  const found = ['open', 'hold', 'booked', 'closed'].includes(normalized);
  if (!found) {
    return normalized.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatLeadPriority(priority?: string | null): string {
  if (!priority) return '—';
  const normalized = normalizeLeadPriority(priority);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatLeadCategoryShort(category?: string | null): string {
  if (!category) return '—';
  const map: Record<string, string> = {
    buy_property: 'Buy',
    sell_property: 'Sell',
    rent_property: 'Rent',
  };
  return map[category] || category.replace(/_property/g, '').replace(/_/g, ' ');
}

export function formatIndianNumber(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

export function parseIndianNumber(value: string): number | undefined {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return undefined;
  const parsed = Number(digits);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function normalizeMobileInput(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}
