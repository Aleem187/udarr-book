import { MessageCircle, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import type { Customer } from '@/types';
import { avatarColor, buildWhatsAppLink, formatCurrency, formatDate, initials, isDueToday } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  onWhatsApp: () => void;
  onPay: () => void;
  onDetails: () => void;
  onDelete: () => void;
}

export function CustomerCard({ customer, onWhatsApp, onPay, onDetails, onDelete }: CustomerCardProps) {
  const hasDebt = customer.balance > 0;
  const dueToday = isDueToday(customer);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/70 animate-fade-in">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${avatarColor(customer.id)} text-sm font-bold text-white shadow-sm`}
          >
            {initials(customer.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-bold text-slate-900">{customer.name}</h3>
              <button
                onClick={onDelete}
                className="shrink-0 rounded-full p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-rose-500 active:scale-90"
                aria-label="Delete customer"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <span>{customer.phone || 'No phone'}</span>
              <span className="text-slate-300">•</span>
              <span>{formatDate(customer.updatedAt)}</span>
            </p>
            {dueToday && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                <AlertCircle size={12} />
                Payment due today
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Balance</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${hasDebt ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(customer.balance, customer.currency || 'INR')}
            </p>
          </div>
          <button
            onClick={onDetails}
            className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-95"
          >
            History
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="flex border-t border-slate-100 bg-slate-50/80">
        <button
          onClick={onWhatsApp}
          disabled={!customer.phone || !hasDebt}
          className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 active:bg-emerald-100 disabled:text-slate-300 disabled:hover:bg-transparent"
        >
          <MessageCircle size={16} />
          Remind
        </button>
        <div className="w-px bg-slate-200" />
        <button
          onClick={onPay}
          disabled={!hasDebt}
          className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 active:bg-blue-100 disabled:text-slate-300 disabled:hover:bg-transparent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
          Payment
        </button>
      </div>
    </div>
  );
}
