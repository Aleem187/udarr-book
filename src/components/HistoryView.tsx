import type { Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface HistoryViewProps {
  customer: Customer;
}

export function HistoryView({ customer }: HistoryViewProps) {
  return (
    <div className="pt-2 space-y-3">
      <div className="bg-slate-50 rounded-2xl p-4 text-center">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
          Current Balance
        </p>
        <p className={`text-3xl font-bold ${customer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatCurrency(customer.balance, customer.currency || 'INR')}
        </p>
        <p className="text-sm text-slate-500 mt-1">{customer.name}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
          Transaction History
        </p>
        {customer.transactions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {customer.transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    txn.type === 'credit'
                      ? 'bg-rose-50 text-rose-500'
                      : 'bg-emerald-50 text-emerald-500'
                  }`}
                >
                  {txn.type === 'credit' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7 7 7-7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {txn.type === 'credit' ? 'Udhaar given' : 'Payment received'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(txn.date)}
                    {txn.note ? ` • ${txn.note}` : ''}
                  </p>
                </div>
                <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {txn.type === 'credit' ? '+' : '−'}
                  {formatCurrency(txn.amount, customer.currency || 'INR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
