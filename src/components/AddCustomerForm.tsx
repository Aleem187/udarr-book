import { useEffect, useState } from 'react';
import { getLocalDateTimeInputValue } from '@/lib/utils';

interface AddCustomerFormProps {
  onSubmit: (name: string, phone: string, amount: number, date?: string, currency?: 'RUB' | 'THB') => void;
  existingNames: string[];
}

export function AddCustomerForm({ onSubmit, existingNames }: AddCustomerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [givenDate, setGivenDate] = useState(() => getLocalDateTimeInputValue(new Date()));
  const [currency, setCurrency] = useState<'RUB' | 'THB'>('THB');
  const [error, setError] = useState('');
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    if (!name.trim()) {
      setIsExisting(false);
      return;
    }
    const match = existingNames.some(
      (n) => n.toLowerCase() === name.trim().toLowerCase()
    );
    setIsExisting(match);
  }, [name, existingNames]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name.trim()) {
      setError('Please enter a customer name.');
      return;
    }
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    onSubmit(name.trim(), phone.trim(), amt, givenDate, currency);
    setName('');
    setPhone('');
    setAmount('');
    setGivenDate(getLocalDateTimeInputValue(new Date()));
    setCurrency('THB');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {isExisting && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#f5d78a]/25 bg-[#f5d78a]/8 px-3 py-2.5 text-sm text-[#f5d78a] shadow-sm shadow-[#d4af37]/10 animate-fade-in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>This customer already exists — the amount will be added to their balance.</span>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          Customer Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="e.g. Ramesh Kumar"
          className="w-full rounded-2xl border border-[#d4af37]/20 bg-[#102742] px-4 py-3 text-sm font-medium text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:bg-[#102742] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition"
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          Phone Number
        </label>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 98765 43210"
          className="w-full rounded-2xl border border-[#d4af37]/20 bg-[#102742] px-4 py-3 text-sm font-medium text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:bg-[#102742] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          Amount (฿ / ₽)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          placeholder="e.g. 500"
          className="w-full rounded-2xl border border-[#d4af37]/20 bg-[#102742] px-4 py-3 text-lg font-bold text-white placeholder:text-slate-400 placeholder:font-normal focus:border-[#d4af37] focus:bg-[#102742] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          Date & Time Given
        </label>
        <input
          type="datetime-local"
          value={givenDate}
          onChange={(e) => { setGivenDate(e.target.value); setError(''); }}
          className="w-full rounded-2xl border border-[#d4af37]/20 bg-[#102742] px-4 py-3 text-sm font-medium text-white focus:border-[#d4af37] focus:bg-[#102742] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          Currency
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as 'RUB' | 'THB')}
          className="w-full rounded-2xl border border-[#d4af37]/20 bg-[#102742] px-4 py-3 text-sm font-medium text-white focus:border-[#d4af37] focus:bg-[#102742] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition"
        >
          <option value="THB">Thai Baht (฿)</option>
          <option value="RUB">Rubles (₽)</option>
        </select>
      </div>

      {error && (
        <p className="text-sm font-medium text-rose-300 animate-fade-in">{error}</p>
      )}

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-[#f5d78a] via-[#d4af37] to-[#b98c1e] py-3.5 text-base font-bold text-[#071521] shadow-[0_16px_32px_rgba(212,175,55,0.3)] transition hover:brightness-105 active:scale-[0.98]"
      >
        {isExisting ? 'Add to Balance' : 'Add Customer'}
      </button>
    </form>
  );
}
