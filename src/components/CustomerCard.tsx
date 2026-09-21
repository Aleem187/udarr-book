import { useState } from 'react';
import { MessageCircle, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import type { Customer } from '@/types';
import { avatarColor, formatCurrency, formatDate, formatDateTime, initials, isDueToday } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  onWhatsApp: () => void;
  onPay: () => void;
  onDetails: () => void;
  onDelete: () => void;
  onAddCredit: (amount: number) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

export function CustomerCard({ customer, onWhatsApp, onPay, onDetails, onDelete, onAddCredit, onDeleteTransaction }: CustomerCardProps) {
  const [creditAmount, setCreditAmount] = useState('');
  const hasDebt = customer.balance > 0;
  const dueToday = isDueToday(customer);
  const creditTransactions = customer.transactions.filter((txn) => txn.type === 'credit');

  const handleAddCredit = () => {
    const amount = Number.parseFloat(creditAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onAddCredit(amount);
    setCreditAmount('');
  };

  return (
    <div className="group overflow-hidden rounded-[28px] border border-[#d4af37]/15 bg-[#0d1d33] shadow-[0_20px_40px_rgba(2,6,23,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(2,6,23,0.38)] animate-fade-in">
      <div className="bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02),rgba(59,130,246,0.12))] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${avatarColor(customer.id)} text-sm font-bold text-white shadow-lg shadow-slate-900/40`}
          >
            {initials(customer.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-bold text-white">{customer.name}</h3>
              <button
                onClick={onDelete}
                className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-rose-300 active:scale-90"
                aria-label="Delete customer"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-300">
              <span>{customer.phone || 'No phone'}</span>
              <span className="text-slate-500">•</span>
              <span>{formatDate(customer.updatedAt)}</span>
            </p>
            {dueToday && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#f5d78a]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f5d78a] ring-1 ring-[#f5d78a]/20">
                <AlertCircle size={12} />
                Payment due today
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Balance</p>
            <p className={`mt-1 text-2xl font-black tracking-tight ${hasDebt ? 'text-rose-300' : 'text-[#f5d78a]'}`}>
              {formatCurrency(customer.balance, customer.currency || 'THB')}
            </p>
          </div>
          <button
            onClick={onDetails}
            className="inline-flex items-center gap-0.5 rounded-full border border-[#d4af37]/20 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-[#d4af37]/40 hover:text-white active:scale-95"
          >
            History
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="border-t border-[#d4af37]/10 bg-[#0a1b2d] p-3 sm:p-4">
        <div className="mb-3 flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            placeholder="Add amount"
            className="w-full rounded-2xl border border-[#d4af37]/15 bg-[#102742] px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20"
          />
          <button
            onClick={handleAddCredit}
            className="rounded-2xl bg-gradient-to-r from-[#f5d78a] via-[#d4af37] to-[#b98c1e] px-3.5 py-2.5 text-xs font-bold text-[#071521] shadow-[0_12px_22px_rgba(212,175,55,0.25)] transition hover:brightness-105 active:scale-95"
          >
            Add
          </button>
        </div>

        {creditTransactions.length > 0 && (
          <div className="mb-3 rounded-2xl border border-[#d4af37]/15 bg-[#102742] p-2.5 shadow-sm shadow-slate-950/30">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Credit Entries
            </p>
            <div className="space-y-2">
              {creditTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#d4af37]/10 bg-[#0b1d31] px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {formatCurrency(txn.amount, customer.currency || 'THB')}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(txn.date)}</p>
                  </div>
                  <button
                    onClick={() => onDeleteTransaction(txn.id)}
                    className="shrink-0 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-200 transition hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex overflow-hidden rounded-2xl border border-[#d4af37]/15 bg-[#102742]">
          <button
            onClick={onWhatsApp}
            disabled={!customer.phone || !hasDebt}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold text-[#f5d78a] transition hover:bg-white/5 active:bg-white/10 disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <MessageCircle size={16} />
            Remind
          </button>
          <div className="w-px bg-[#d4af37]/15" />
          <button
            onClick={onPay}
            disabled={!hasDebt}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold text-sky-300 transition hover:bg-white/5 active:bg-white/10 disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
            Payment
          </button>
        </div>
      </div>
    </div>
  );
}
