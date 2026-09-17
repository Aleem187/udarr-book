import { useEffect, useState } from 'react';

interface AddCustomerFormProps {
  onSubmit: (name: string, phone: string, amount: number, date?: string, currency?: 'INR' | 'RUB') => void;
  existingNames: string[];
}

export function AddCustomerForm({ onSubmit, existingNames }: AddCustomerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [givenDate, setGivenDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState<'INR' | 'RUB'>('INR');
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
    setGivenDate(new Date().toISOString().slice(0, 10));
    setCurrency('INR');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {isExisting && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-amber-700 animate-fade-in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>This customer already exists — the amount will be added to their balance.</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Customer Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="e.g. Ramesh Kumar"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Phone Number
        </label>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 98765 43210"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Amount (₹ / ₽)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          placeholder="e.g. 500"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Date Given
        </label>
        <input
          type="date"
          value={givenDate}
          onChange={(e) => { setGivenDate(e.target.value); setError(''); }}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Currency
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as 'INR' | 'RUB')}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition"
        >
          <option value="INR">Rupees (₹)</option>
          <option value="RUB">Rubles (₽)</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-rose-600 font-medium animate-fade-in">{error}</p>
      )}

      <button
        type="submit"
        className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 active:scale-[0.98] hover:bg-slate-800 transition"
      >
        {isExisting ? 'Add to Balance' : 'Add Customer'}
      </button>
    </form>
  );
}
