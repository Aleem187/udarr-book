import { useState } from 'react';
import type { Customer } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  customer: Customer;
  onSubmit: (amount: number, note?: string) => void;
}

export function PaymentForm({ customer, onSubmit }: PaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const currency = customer.currency || 'INR';

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
    onSubmit(amt, note.trim() || undefined);
    setAmount('');
    setNote('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="bg-slate-50 rounded-2xl p-4 text-center">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
          Outstanding Balance
        </p>
        <p className="text-3xl font-bold text-rose-600">{formatCurrency(customer.balance, currency)}</p>
        <p className="text-sm text-slate-500 mt-1">{customer.name}</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Amount Received ({currency === 'RUB' ? '₽' : '₹'})
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          placeholder="Enter amount"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition"
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmount(String(amt))}
              className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 active:scale-95 transition"
            >
              {currency === 'RUB' ? '₽' : '₹'}{amt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount(String(customer.balance))}
            className="flex-1 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 active:scale-95 transition"
          >
            Full
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Cash, UPI, etc."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-600 font-medium animate-fade-in">{error}</p>
      )}

      <button
        type="submit"
        className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] hover:bg-blue-700 transition"
      >
        Record Payment
      </button>
    </form>
  );
}
