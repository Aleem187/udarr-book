import { useMemo, useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { sortByRecent, buildWhatsAppLink, isDueToday } from '@/lib/utils';
import type { Customer } from '@/types';
import { Header, SearchBar } from '@/components/Header';
import { CustomerCard } from '@/components/CustomerCard';
import { BottomSheet } from '@/components/BottomSheet';
import { AddCustomerForm } from '@/components/AddCustomerForm';
import { PaymentForm } from '@/components/PaymentForm';
import { HistoryView } from '@/components/HistoryView';
import { BookOpen, Users } from 'lucide-react';

type SheetState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'pay'; customer: Customer }
  | { type: 'history'; customer: Customer };

export default function App() {
  const { customers, addOrUpdateCustomer, recordPayment, deleteCustomer } = useCustomers();
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<SheetState>({ type: 'none' });
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);

  const totalBalance = useMemo(
    () => customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0),
    [customers]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = sortByRecent(customers);
    if (!q) return sorted;
    return sorted.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, search]);

  const existingNames = useMemo(() => customers.map((c) => c.name), [customers]);
  const dueTodayCount = useMemo(() => customers.filter((c) => isDueToday(c)).length, [customers]);

  const handleAdd = (name: string, phone: string, amount: number, date?: string, currency?: Customer['currency']) => {
    addOrUpdateCustomer(name, phone, amount, date, currency || 'INR');
    setSheet({ type: 'none' });
  };

  const handlePay = (amount: number, note?: string) => {
    if (sheet.type === 'pay') {
      recordPayment(sheet.customer.id, amount, note);
      setSheet({ type: 'none' });
    }
  };

  const handleWhatsApp = (customer: Customer) => {
    if (!customer.phone) return;
    const givenDate = customer.transactions.find((txn) => txn.type === 'credit')?.date ?? customer.createdAt;
    window.open(buildWhatsAppLink(customer.phone, customer.name, customer.balance, givenDate, customer.currency || 'INR'), '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl pb-10">
        <Header
          totalBalance={totalBalance}
          customerCount={customers.length}
          onAddClick={() => setSheet({ type: 'add' })}
        />

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-5 mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Outstanding</p>
              <p className="mt-2 text-xl font-bold text-slate-900">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(totalBalance)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Customers</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{customers.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Due Today</p>
              <p className="mt-2 text-xl font-bold text-amber-600">{dueTodayCount}</p>
            </div>
          </div>

          <SearchBar value={search} onChange={setSearch} />

          <main className="flex-1 pb-28">
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-16 text-center px-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 shadow-inner shadow-slate-200">
                  <BookOpen size={36} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No customers yet</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  Tap the + button above to add your first customer and start tracking their udhaar.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-16 text-center px-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 shadow-inner shadow-slate-200">
                  <Users size={36} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No matches found</h3>
                <p className="text-sm text-slate-400">
                  No customer named "{search}". Try a different search.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filtered.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onWhatsApp={() => handleWhatsApp(customer)}
                    onPay={() => setSheet({ type: 'pay', customer })}
                    onDetails={() => setSheet({ type: 'history', customer })}
                    onDelete={() => setConfirmDelete(customer)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Add Button */}
      {customers.length > 0 && (
        <button
          onClick={() => setSheet({ type: 'add' })}
          className="fixed bottom-6 right-4 sm:right-1/2 sm:translate-x-[194px] w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-2xl shadow-slate-900/30 flex items-center justify-center active:scale-90 hover:bg-slate-800 transition z-30 safe-bottom"
          aria-label="Add customer"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      {/* Add Customer Sheet */}
      <BottomSheet
        open={sheet.type === 'add'}
        onClose={() => setSheet({ type: 'none' })}
        title="Add Customer"
      >
        <AddCustomerForm onSubmit={handleAdd} existingNames={existingNames} />
      </BottomSheet>

      {/* Payment Sheet */}
      <BottomSheet
        open={sheet.type === 'pay'}
        onClose={() => setSheet({ type: 'none' })}
        title="Record Payment"
      >
        {sheet.type === 'pay' && (
          <PaymentForm customer={sheet.customer} onSubmit={handlePay} />
        )}
      </BottomSheet>

      {/* History Sheet */}
      <BottomSheet
        open={sheet.type === 'history'}
        onClose={() => setSheet({ type: 'none' })}
        title="Transaction History"
      >
        {sheet.type === 'history' && <HistoryView customer={sheet.customer} />}
      </BottomSheet>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 safe-bottom animate-slide-up sm:animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete customer?</h3>
            <p className="text-sm text-slate-500 mb-5">
              This will permanently remove <span className="font-semibold text-slate-700">{confirmDelete.name}</span> and all their transaction history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteCustomer(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
