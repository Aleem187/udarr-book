import type { Customer, CurrencyCode } from '@/types';

export function formatCurrency(amount: number, currency: CurrencyCode = 'THB'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (currency === 'RUB') return `₽${formatted}`;
  if (currency === 'THB') return `฿${formatted}`;
  return `฿${formatted}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getLocalDateTimeInputValue(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const palette = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-fuchsia-500',
  'bg-pink-500',
];

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

export function isDueToday(customer: Customer): boolean {
  const latestCredit = [...customer.transactions]
    .filter((txn) => txn.type === 'credit')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (!latestCredit || customer.balance <= 0) return false;

  const dueDate = new Date(latestCredit.date);
  const today = new Date();

  return (
    dueDate.getFullYear() === today.getFullYear() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getDate() === today.getDate()
  );
}

export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    throw new Error('Phone number is missing or invalid');
  }

  if (digits.startsWith('00')) {
    return digits.slice(2);
  }

  if (digits.startsWith('92') && digits.length >= 12) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `92${digits}`;
  }

  if (digits.length > 10 && !digits.startsWith('0')) {
    return digits.startsWith('92') ? digits : `92${digits}`;
  }

  throw new Error('Phone number is missing or invalid');
}

export function buildWhatsAppLink(
  phone: string,
  name: string,
  balance: number,
  givenDate?: string,
  currency: CurrencyCode = 'THB',
  paymentDetails?: {
    amountPaid: number;
    paymentDate?: string;
    remainingBalance: number;
  }
): string {
  const digits = normalizePhoneForWhatsApp(phone);

  const label = givenDate
    ? new Date(givenDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'the recorded date';

  const dueToday = givenDate
    ? new Date(givenDate).toDateString() === new Date().toDateString()
    : false;

  const message = paymentDetails
    ? `Hi ${name},\n\nThank you for your payment. We have received ${formatCurrency(paymentDetails.amountPaid, currency)} on ${new Date(paymentDetails.paymentDate ?? new Date().toISOString()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.\n\nAmount received: ${formatCurrency(paymentDetails.amountPaid, currency)}\nRemaining balance: ${formatCurrency(paymentDetails.remainingBalance, currency)}\n\nThank you for staying with us.`
    : `Hi ${name},\n\nThis is a friendly reminder from your store. Your outstanding balance is *${formatCurrency(balance, currency)}* and it was given on *${label}*.${dueToday ? '\n\nThis payment is due today. Kindly clear it as soon as possible.' : '\n\nKindly clear the dues at your earliest convenience.'}\n\nThank you!`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function sortByRecent(customers: Customer[]): Customer[] {
  return [...customers].sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;
  return items.slice(start, start + safePageSize);
}
