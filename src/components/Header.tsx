import { Plus, Search } from 'lucide-react';

interface HeaderProps {
  totalBalance: number;
  customerCount: number;
  onAddClick: () => void;
}

export function Header({ totalBalance, customerCount, onAddClick }: HeaderProps) {
  return (
    <header className="safe-top bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),_transparent_32%),linear-gradient(135deg,_#0f172a_0%,_#111827_42%,_#0f172a_100%)] text-white shadow-lg shadow-slate-200/60">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z" />
                <path d="M4 9h16M9 4v5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Khata Book</h1>
              <p className="text-xs text-slate-300">Udhaar Manager</p>
            </div>
          </div>
          <button
            onClick={onAddClick}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-slate-950/20 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/15 active:scale-90"
            aria-label="Add customer"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/10 backdrop-blur-md sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
              Total Outstanding
            </p>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              {customerCount} {customerCount === 1 ? 'customer' : 'customers'}
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="text-3xl font-bold tracking-tight sm:text-4xl">
              ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(totalBalance)}
            </span>
            <div className="hidden rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 sm:block">
              Dashboard view
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative -mt-4 px-4 mb-3">
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search customer by name..."
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
        />
      </div>
    </div>
  );
}
