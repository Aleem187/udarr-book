import { Bell, Plus, Search } from 'lucide-react';
import type { UserProfile } from '@/types';

interface HeaderProps {
  totalBalance: number;
  customerCount: number;
  currentUser: UserProfile;
  users: UserProfile[];
  unreadCount: number;
  onAddClick: () => void;
  onToggleNotifications: () => void;
  onUserChange: (userId: string) => void;
}

export function Header({
  totalBalance,
  customerCount,
  currentUser,
  users,
  unreadCount,
  onAddClick,
  onToggleNotifications,
  onUserChange,
}: HeaderProps) {
  return (
    <header className="safe-top overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.2),_transparent_30%),linear-gradient(140deg,_#071521_0%,_#0b1d31_35%,_#112a46_100%)] text-white shadow-[0_26px_80px_rgba(2,6,23,0.4)]">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f5d78a] via-[#d4af37] to-[#b98c1e] shadow-[0_12px_26px_rgba(212,175,55,0.38)] ring-1 ring-white/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z" />
                <path d="M4 9h16M9 4v5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Khata Book</h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Udhaar Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleNotifications}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d4af37]/40 bg-white/5 text-white shadow-lg shadow-[#020817]/30 backdrop-blur-sm transition hover:bg-white/10 active:scale-95"
              aria-label="View notifications"
              type="button"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d4af37] px-1 text-[10px] font-bold text-[#071521] shadow-sm shadow-[#d4af37]/40">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <label className="relative hidden sm:block">
              <select
                value={currentUser.id}
                onChange={(event) => onUserChange(event.target.value)}
                aria-label="Select active user"
                className="appearance-none rounded-2xl border border-[#d4af37]/30 bg-white/5 px-3 py-2.5 pr-9 text-sm font-medium text-white shadow-lg shadow-[#020817]/20 outline-none backdrop-blur-sm transition hover:bg-white/10"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id} className="text-slate-900">
                    {user.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#f5d78a]">▾</span>
            </label>

            <button
              onClick={onAddClick}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#f5d78a] via-[#d4af37] to-[#b98c1e] text-[#071521] shadow-[0_14px_28px_rgba(212,175,55,0.35)] transition hover:scale-[1.02] hover:shadow-[0_16px_32px_rgba(212,175,55,0.42)] active:scale-95"
              aria-label="Add customer"
              type="button"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="rounded-[30px] border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_50px_rgba(2,6,23,0.3)] backdrop-blur-md sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
              Total Outstanding
            </p>
            <span className="rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5d78a]">
              {customerCount} {customerCount === 1 ? 'customer' : 'customers'}
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              ฿{new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(totalBalance)}
            </span>
            <div className="hidden rounded-full border border-[#d4af37]/20 bg-[#081827]/60 px-3 py-1.5 text-[11px] font-medium text-[#f5d78a] sm:block">
              Live overview
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
    <div className="relative -mt-4 mb-3 px-4">
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search customer by name..."
          className="w-full rounded-2xl border border-[#d4af37]/20 bg-[#f8fafc] py-3 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.12)] placeholder:text-slate-400 transition focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20"
        />
      </div>
    </div>
  );
}
