import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import type { Customer } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  customer: Customer;
  onSubmit: (amount: number, note?: string, paymentMethod?: 'cash' | 'account') => void;
  onWhatsApp?: (paymentDetails: {
    amountPaid: number;
    paymentDate: string;
    remainingBalance: number;
  }) => void;
}

export function PaymentForm({ customer, onSubmit, onWhatsApp }: PaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'account'>('cash');
  const [error, setError] = useState('');
  const [paymentSummary, setPaymentSummary] = useState<{
    amountPaid: number;
    paymentDate: string;
    remainingBalance: number;
  } | null>(null);
  const [ctaError, setCtaError] = useState('');
  const currency = customer.currency || 'THB';

  const quickAmounts = [100, 200, 500, 1000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (amt > customer.balance) {
      setError(`Amount exceeds outstanding balance of ${formatCurrency(customer.balance, currency)}.`);
      return;
    }

    const nextSummary = {
      amountPaid: amt,
      paymentDate: new Date().toISOString(),
      remainingBalance: Math.max(customer.balance - amt, 0),
    };

    onSubmit(amt, note.trim() || undefined, paymentMethod);
    setAmount('');
    setNote('');
    setPaymentMethod('cash');
    setError('');
    setCtaError('');
    setPaymentSummary(nextSummary);
  };

  const handleWhatsAppClick = () => {
    if (!paymentSummary || !onWhatsApp) return;

    try {
      onWhatsApp(paymentSummary);
      setCtaError('');
    } catch (error) {
      setCtaError(
        error instanceof Error ? error.message : 'Phone number is missing or invalid.'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="rounded-[26px] border border-[#d4af37]/15 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02),rgba(59,130,246,0.12))] p-4 shadow-inner shadow-slate-900/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">Customer</p>
            <h3 className="mt-2 text-lg font-bold text-white">{customer.name}</h3>
          </div>
          <div className="rounded-full border border-[#d4af37]/20 bg-[#0b1d31] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5d78a]">
            {customer.currency || 'THB'}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/5 bg-[#0b1d31]/80 p-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Outstanding</p>
            <p className="mt-1 text-base font-bold text-[#f5d78a]">{formatCurrency(customer.balance, currency)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Phone</p>
            <p className="mt-1 truncate text-base font-semibold text-white">{customer.phone || 'No phone'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#d4af37]/15 bg-[#0b1d31] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Payment Details</p>
          <span className="rounded-full bg-[#f5d78a]/10 px-2 py-1 text-[10px] font-medium text-[#f5d78a]">{currency === 'RUB' ? '₽' : '฿'} currency</span>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Amount received
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#f5d78a]">
              {currency === 'RUB' ? '₽' : '฿'}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              placeholder="0.00"
              className="w-full rounded-2xl border border-[#d4af37]/15 bg-[#102742] py-3 pl-10 pr-4 text-lg font-bold text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition"
              autoFocus
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(String(amt))}
                className="rounded-xl border border-[#d4af37]/15 bg-[#0b1d31] px-2 py-2 text-sm font-semibold text-[#f5d78a] transition hover:border-[#d4af37]/35 hover:bg-[#122a45] active:scale-95"
              >
                {currency === 'RUB' ? '₽' : '฿'}{amt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(String(customer.balance))}
              className="rounded-xl bg-gradient-to-r from-[#f5d78a] via-[#d4af37] to-[#b98c1e] px-2 py-2 text-sm font-bold text-[#071521] shadow-[0_12px_20px_rgba(212,175,55,0.18)] transition hover:brightness-105 active:scale-95 sm:col-span-1"
            >
              Full
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Payment method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'account')}
            className="w-full rounded-2xl border border-[#d4af37]/15 bg-[#102742] px-4 py-3 text-sm font-medium text-white focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition"
          >
            <option value="cash">Cash</option>
            <option value="account">Account</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Reference
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="UPI / transfer / notes"
            className="w-full rounded-2xl border border-[#d4af37]/15 bg-[#102742] px-4 py-3 text-sm font-medium text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 animate-fade-in">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-[#f5d78a] via-[#d4af37] to-[#b98c1e] py-3.5 text-base font-bold text-[#071521] shadow-[0_18px_35px_rgba(212,175,55,0.26)] transition hover:brightness-105 active:scale-[0.98]"
      >
        Record Payment
      </button>

      {paymentSummary && (
        <div className="space-y-2 pt-1">
          <div className="rounded-2xl border border-[#d4af37]/15 bg-[#f5d78a]/8 px-3 py-3 text-sm text-[#f5d78a] shadow-sm shadow-[#d4af37]/10">
            <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-slate-300">
              <span>Payment summary</span>
              <span>{new Date(paymentSummary.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300">Received</span>
                <span className="font-bold text-white">{formatCurrency(paymentSummary.amountPaid, customer.currency || 'THB')}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300">Remaining</span>
                <span className="font-bold text-white">{formatCurrency(paymentSummary.remainingBalance, customer.currency || 'THB')}</span>
              </div>
            </div>
          </div>

          {onWhatsApp && (
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d4af37]/20 bg-gradient-to-r from-[#f5d78a] via-[#d4af37] to-[#b98c1e] px-4 py-3 text-sm font-bold text-[#071521] shadow-[0_16px_32px_rgba(212,175,55,0.28)] transition hover:brightness-105 active:scale-[0.98]"
            >
              <MessageCircle size={17} />
              Message on WhatsApp
            </button>
          )}

          {ctaError && (
            <p className="text-sm font-medium text-rose-300">{ctaError}</p>
          )}
        </div>
      )}
    </form>
  );
}
