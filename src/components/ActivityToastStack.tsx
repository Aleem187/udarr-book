import { CreditCard, Wallet } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/utils';
import type { TransactionActivity } from '@/hooks/useTransactionActivity';

export interface ActivityToastItem extends TransactionActivity {
  toastId: string;
}

interface ActivityToastStackProps {
  toasts: ActivityToastItem[];
  onDismiss: (toastId: string) => void;
}

export function ActivityToastStack({ toasts, onDismiss }: ActivityToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <button
          key={toast.toastId}
          type="button"
          onClick={() => onDismiss(toast.toastId)}
          className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[#d4af37]/25 bg-[#0e233b] px-4 py-3 text-left shadow-[0_20px_50px_rgba(2,6,23,0.5)] transition hover:border-[#d4af37]/40"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5d78a]/15 text-[#f5d78a]">
            {toast.paymentMethod === 'card' ? <CreditCard size={16} /> : <Wallet size={16} />}
          </div>
          <p className="text-sm text-slate-100">
            <span className="font-bold text-white">{toast.performedByName}</span>{' '}
            {toast.type === 'debit' ? 'recorded a payment of' : 'added credit of'}{' '}
            <span className="font-bold text-[#f5d78a]">
              {getCurrencySymbol(toast.currency)}
              {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(toast.amount)}
            </span>{' '}
            for <span className="font-semibold text-white">{toast.customerName}</span>
          </p>
        </button>
      ))}
    </div>
  );
}
