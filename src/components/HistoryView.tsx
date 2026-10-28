import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import type { Customer } from '@/types';
import { formatCurrency, formatDateTime, buildTransactionShareLink } from '@/lib/utils';

interface HistoryViewProps {
  customer: Customer;
}

export function HistoryView({ customer }: HistoryViewProps) {
  const [shareError, setShareError] = useState('');

  return (
    <div className="pt-2 space-y-3">
      <div className="bg-slate-50 rounded-2xl p-4 text-center">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
          Current Balance
        </p>
        <p className={`text-3xl font-bold ${customer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatCurrency(customer.balance, customer.currency || 'KZT')}
        </p>
        <p className="text-sm text-slate-500 mt-1">{customer.name}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
          Transaction History
        </p>
        {shareError && (
          <p className="mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
            {shareError}
          </p>
        )}
        {customer.transactions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {customer.transactions.map((txn) => (
              <div
                key={txn.id}
                className="bg-white border border-slate-100 rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
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
                      {formatDateTime(txn.date)}
                      {txn.note ? ` • ${txn.note}` : ''}
                    </p>
                    {txn.type === 'debit' && txn.recordedBy && (
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                        Recorded by {txn.recordedBy}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {txn.type === 'credit' ? '+' : '−'}
                      {formatCurrency(txn.amount, customer.currency || 'KZT')}
                    </p>
                    {txn.type === 'debit' && txn.paymentMethod && (
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        {txn.paymentMethod === 'cash' ? 'Cash' : txn.paymentMethod === 'card' ? 'Card' : 'Account'}
                      </p>
                    )}
                  </div>
                </div>

                {(txn.receiptUrl || customer.phone) && (
                  <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                    {txn.receiptUrl && (
                      <a href={txn.receiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <img
                          src={txn.receiptUrl}
                          alt="Receipt"
                          className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                        />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const link = buildTransactionShareLink(
                            customer.phone,
                            customer.name,
                            txn,
                            customer.currency || 'KZT'
                          );
                          window.open(link, '_blank', 'noopener,noreferrer');
                          setShareError('');
                        } catch (err) {
                          setShareError(
                            err instanceof Error ? err.message : 'Phone number is missing or invalid.'
                          );
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                    >
                      <MessageCircle size={13} />
                      Share on WhatsApp
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
