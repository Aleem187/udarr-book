import { useState } from 'react';

interface LoginScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>;
}

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSignIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#071521] px-4 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[28px] border border-[#d4af37]/20 bg-[#0d1d33] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.5)]"
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Whitehills Sports</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Staff Sign In</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-[#d4af37]/20 bg-[#102742] px-4 py-3 text-sm font-medium text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20"
            placeholder="you@example.com"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-[#d4af37]/20 bg-[#102742] px-4 py-3 text-sm font-medium text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#f5d78a] via-[#d4af37] to-[#b98c1e] py-3 text-sm font-bold text-[#071521] shadow-[0_18px_35px_rgba(212,175,55,0.26)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-[11px] text-slate-400">
          Access is by invitation only. Contact an admin if you need an account.
        </p>
      </form>
    </div>
  );
}
