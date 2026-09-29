import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/types';

interface ManageUsersViewProps {
  roster: AppUser[];
  currentUserId: string;
  onChanged: () => void;
}

export function ManageUsersView({ roster, currentUserId, onChanged }: ManageUsersViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const atCapacity = roster.length >= 6;
  const adminCount = roster.filter((u) => u.isAdmin).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Enter a name, email, and a password of at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: invokeError } = await supabase.functions.invoke('admin-create-user', {
        body: { name: name.trim(), email: email.trim(), password, isAdmin },
      });
      if (invokeError) throw invokeError;

      setName('');
      setEmail('');
      setPassword('');
      setIsAdmin(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (user.id === currentUserId) {
      setError('You cannot delete your own account.');
      return;
    }
    if (user.isAdmin && adminCount <= 1) {
      setError('Cannot delete the last remaining admin.');
      return;
    }

    setError('');
    setDeletingId(user.id);
    try {
      const { error: invokeError } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: user.id },
      });
      if (invokeError) throw invokeError;
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        {roster.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#d4af37]/15 bg-[#0b1d31] px-4 py-3"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                {user.name}
                {user.isAdmin && (
                  <span className="rounded-full bg-[#f5d78a]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f5d78a]">
                    Admin
                  </span>
                )}
                {user.id === currentUserId && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                    You
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(user)}
              disabled={deletingId === user.id || user.id === currentUserId}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Delete ${user.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-[#d4af37]/15 bg-[#0b1d31] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          <UserPlus size={14} /> Add staff user {atCapacity && '(limit reached)'}
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          disabled={atCapacity}
          className="w-full rounded-2xl border border-[#d4af37]/15 bg-[#102742] px-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 disabled:opacity-50"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={atCapacity}
          className="w-full rounded-2xl border border-[#d4af37]/15 bg-[#102742] px-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 disabled:opacity-50"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Temporary password (min 6 chars)"
          disabled={atCapacity}
          className="w-full rounded-2xl border border-[#d4af37]/15 bg-[#102742] px-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 disabled:opacity-50"
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            disabled={atCapacity}
          />
          Grant admin (can manage users)
        </label>

        {error && <p className="text-sm font-medium text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting || atCapacity}
          className="w-full rounded-2xl bg-gradient-to-r from-[#f5d78a] via-[#d4af37] to-[#b98c1e] py-2.5 text-sm font-bold text-[#071521] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create user'}
        </button>
      </form>
    </div>
  );
}
