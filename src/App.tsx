import { useEffect, useMemo, useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { sortByRecent, buildWhatsAppLink, isDueToday, paginateItems } from '@/lib/utils';
import type { Customer, NotificationItem, UserProfile } from '@/types';
import { Header, SearchBar } from '@/components/Header';
import { CustomerCard } from '@/components/CustomerCard';
import { BottomSheet } from '@/components/BottomSheet';
import { AddCustomerForm } from '@/components/AddCustomerForm';
import { PaymentForm } from '@/components/PaymentForm';
import { HistoryView } from '@/components/HistoryView';
import { Bell, BookOpen, Users } from 'lucide-react';

const USERS: UserProfile[] = [
  { id: 'user-nadia', name: 'Nadia' },
  { id: 'user-ali', name: 'Ali' },
  { id: 'user-hamza', name: 'Hamza' },
  { id: 'user-sara', name: 'Sara' },
];

const NOTIFICATION_STORAGE_PREFIX = 'udhaar-khata-notifications-v1';
const SELECTED_USER_STORAGE_KEY = 'udhaar-khata-selected-user-v1';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getNotificationKey(userId: string) {
  return `${NOTIFICATION_STORAGE_PREFIX}-${userId}`;
}

function loadNotifications(userId: string): NotificationItem[] {
  try {
    const raw = localStorage.getItem(getNotificationKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotifications(userId: string, items: NotificationItem[]) {
  localStorage.setItem(getNotificationKey(userId), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('udhaar:notification-update', { detail: { userId } }));
}

function loadSelectedUserId(): string {
  try {
    const value = localStorage.getItem(SELECTED_USER_STORAGE_KEY);
    return USERS.some((user) => user.id === value) ? value! : USERS[0].id;
  } catch {
    return USERS[0].id;
  }
}

function buildNotification(payload: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
  return {
    id: uid(),
    ...payload,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

type SheetState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'pay'; customer: Customer }
  | { type: 'history'; customer: Customer };

export default function App() {
  const { customers, addOrUpdateCustomer, recordPayment, deleteCustomer, deleteTransaction } = useCustomers();
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<SheetState>({ type: 'none' });
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>(() => loadSelectedUserId());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadNotifications(loadSelectedUserId()));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [whatsAppError, setWhatsAppError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const currentUser = USERS.find((user) => user.id === selectedUserId) ?? USERS[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    localStorage.setItem(SELECTED_USER_STORAGE_KEY, selectedUserId);
    setNotifications(loadNotifications(selectedUserId));
  }, [selectedUserId]);

  useEffect(() => {
    const syncNotifications = () => {
      setNotifications(loadNotifications(selectedUserId));
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key.startsWith(NOTIFICATION_STORAGE_PREFIX) || event.key === SELECTED_USER_STORAGE_KEY) {
        syncNotifications();
      }
    };

    const onNotificationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId?: string }>;
      if (!customEvent.detail || !customEvent.detail.userId) {
        syncNotifications();
        return;
      }

      if (customEvent.detail.userId === selectedUserId || customEvent.detail.userId !== selectedUserId) {
        syncNotifications();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('udhaar:notification-update', onNotificationUpdate);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('udhaar:notification-update', onNotificationUpdate);
    };
  }, [selectedUserId]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleCustomers = useMemo(() => paginateItems(filtered, currentPage, pageSize), [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const existingNames = useMemo(() => customers.map((c) => c.name), [customers]);
  const dueTodayCount = useMemo(() => customers.filter((c) => isDueToday(c)).length, [customers]);

  const markNotificationRead = (notificationId: string) => {
    const next = notifications.map((item) =>
      item.id === notificationId ? { ...item, read: true } : item
    );
    saveNotifications(selectedUserId, next);
    setNotifications(next);
  };

  const markAllNotificationsRead = () => {
    const next = notifications.map((item) => ({ ...item, read: true }));
    saveNotifications(selectedUserId, next);
    setNotifications(next);
  };

  const notifyUsersAboutCredit = (customerName: string, customerId: string, amount: number) => {
    const notification = buildNotification({
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      customerId,
      customerName,
      amount,
    });

    USERS.forEach((user) => {
      if (user.id === currentUser.id) return;
      const existing = loadNotifications(user.id);
      const next = [notification, ...existing].slice(0, 100);
      saveNotifications(user.id, next);
    });
  };

  const notifyUsersAboutPayment = (customerName: string, customerId: string, amount: number) => {
    const notification = buildNotification({
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      customerId,
      customerName,
      amount,
    });

    USERS.forEach((user) => {
      if (user.id === currentUser.id) return;
      const existing = loadNotifications(user.id);
      const next = [notification, ...existing].slice(0, 100);
      saveNotifications(user.id, next);
    });
  };

  const handleAdd = (name: string, phone: string, amount: number, date?: string, currency?: Customer['currency']) => {
    const createdCustomerId = addOrUpdateCustomer(name, phone, amount, date, currency || 'THB');
    const customerKey = `${name.trim()}-${Date.now()}`;
    notifyUsersAboutCredit(name.trim(), createdCustomerId ? customerKey : customerKey, amount);
    setSheet({ type: 'none' });
  };

  const handlePay = (amount: number, note?: string, paymentMethod?: 'cash' | 'account') => {
    if (sheet.type === 'pay') {
      recordPayment(sheet.customer.id, amount, note, paymentMethod);
      notifyUsersAboutPayment(sheet.customer.name, sheet.customer.id, amount);
    }
  };

  const handleWhatsApp = (customer: Customer) => {
    if (!customer.phone) {
      throw new Error('Phone number is missing or invalid. Add a valid customer phone number first.');
    }

    const givenDate = customer.transactions.find((txn) => txn.type === 'credit')?.date ?? customer.createdAt;
    const link = buildWhatsAppLink(
      customer.phone,
      customer.name,
      customer.balance,
      givenDate,
      customer.currency || 'THB'
    );

    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handlePaymentWhatsApp = (
    customer: Customer,
    paymentDetails: { amountPaid: number; paymentDate: string; remainingBalance: number }
  ) => {
    if (!customer.phone || !/\d/.test(customer.phone)) {
      throw new Error('Phone number is missing or invalid. Add a valid customer phone number first.');
    }

    const link = buildWhatsAppLink(
      customer.phone,
      customer.name,
      customer.balance,
      customer.createdAt,
      customer.currency || 'THB',
      {
        amountPaid: paymentDetails.amountPaid,
        paymentDate: paymentDetails.paymentDate,
        remainingBalance: paymentDetails.remainingBalance,
      }
    );

    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#071521] text-slate-100">
      <div className="relative mx-auto max-w-6xl pb-10">
        <Header
          totalBalance={totalBalance}
          customerCount={customers.length}
          currentUser={currentUser}
          users={USERS}
          unreadCount={unreadCount}
          onAddClick={() => setSheet({ type: 'add' })}
          onToggleNotifications={() => {
            setNotificationsOpen((value) => !value);
            if (!notificationsOpen) markAllNotificationsRead();
          }}
          onUserChange={(userId) => setSelectedUserId(userId)}
        />

        {notificationsOpen && (
          <div className="absolute right-4 top-20 z-40 w-[min(92vw,23rem)] rounded-[28px] border border-[#d4af37]/20 bg-[#0e233b] p-3 shadow-[0_30px_80px_rgba(2,6,23,0.45)] sm:right-6 lg:right-8">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#f5d78a]" />
                <h3 className="text-sm font-bold text-white">Notifications</h3>
              </div>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-[11px] font-semibold text-[#f5d78a]"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="rounded-2xl bg-[#0a1c2f] px-3 py-4 text-sm text-slate-300">
                No notifications yet.
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => markNotificationRead(item.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      item.read
                        ? 'border-slate-700 bg-[#0b1d31] text-slate-300'
                        : 'border-[#d4af37]/30 bg-[#f5d78a]/8 text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
                          {item.actorName} made a payment entry
                        </p>
                        <p className="mt-1 text-sm font-bold text-white">{item.customerName}</p>
                        <p className="mt-1 text-sm text-[#f5d78a]">
                          ฿{new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(item.amount)}
                        </p>
                      </div>
                      {!item.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#d4af37]" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-4 sm:px-6 lg:px-8">
          {whatsAppError && (
            <div className="-mt-4 mb-4 rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
              {whatsAppError}
            </div>
          )}

          <div className="relative -mt-5 mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-[#d4af37]/20 bg-[#0d1d33] p-4 shadow-[0_16px_32px_rgba(2,6,23,0.2)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Outstanding</p>
              <p className="mt-2 text-xl font-bold text-white">฿{new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(totalBalance)}</p>
            </div>
            <div className="rounded-[24px] border border-[#d4af37]/20 bg-[#0d1d33] p-4 shadow-[0_16px_32px_rgba(2,6,23,0.2)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Customers</p>
              <p className="mt-2 text-xl font-bold text-white">{customers.length}</p>
            </div>
            <div className="rounded-[24px] border border-[#d4af37]/20 bg-[#0d1d33] p-4 shadow-[0_16px_32px_rgba(2,6,23,0.2)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Due Today</p>
              <p className="mt-2 text-xl font-bold text-[#f5d78a]">{dueTodayCount}</p>
            </div>
          </div>

          <SearchBar value={search} onChange={setSearch} />

          <main className="flex-1 pb-28">
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0d1d33] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-[#d4af37]/20">
                  <BookOpen size={36} className="text-[#f5d78a]" />
                </div>
                <h3 className="mb-1 text-lg font-bold text-white">No customers yet</h3>
                <p className="max-w-xs text-sm text-slate-300">
                  Tap the + button above to add your first customer and start tracking their udhaar.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0d1d33] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-[#d4af37]/20">
                  <Users size={36} className="text-[#f5d78a]" />
                </div>
                <h3 className="mb-1 text-lg font-bold text-white">No matches found</h3>
                <p className="text-sm text-slate-300">
                  No customer named "{search}". Try a different search.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3 rounded-[22px] border border-[#d4af37]/15 bg-[#0d1d33] px-4 py-3 text-sm text-slate-300">
                  <span>
                    Showing {visibleCustomers.length} of {filtered.length} customers
                  </span>
                  <span className="rounded-full border border-[#d4af37]/20 bg-[#f5d78a]/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f5d78a]">
                    Page {currentPage} / {totalPages}
                  </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {visibleCustomers.map((customer) => (
                    <CustomerCard
                      key={customer.id}
                      customer={customer}
                      onWhatsApp={() => {
                        try {
                          handleWhatsApp(customer);
                          setWhatsAppError('');
                        } catch (error) {
                          setWhatsAppError(
                            error instanceof Error ? error.message : 'Phone number is missing or invalid.'
                          );
                        }
                      }}
                      onPay={() => setSheet({ type: 'pay', customer })}
                      onDetails={() => setSheet({ type: 'history', customer })}
                      onDelete={() => setConfirmDelete(customer)}
                      onAddCredit={(amount) => {
                        addOrUpdateCustomer(customer.name, customer.phone, amount, new Date().toISOString(), customer.currency || 'THB');
                      }}
                      onDeleteTransaction={(transactionId) => deleteTransaction(customer.id, transactionId)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="rounded-2xl border border-[#d4af37]/20 bg-[#0d1d33] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#d4af37]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <div className="rounded-full border border-[#d4af37]/20 bg-[#0d1d33] px-3 py-2 text-sm font-medium text-[#f5d78a]">
                      {currentPage}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-2xl border border-[#d4af37]/20 bg-[#0d1d33] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#d4af37]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {customers.length > 0 && (
        <button
          onClick={() => setSheet({ type: 'add' })}
          className="fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#f5d78a] via-[#d4af37] to-[#b98c1e] text-[#071521] shadow-[0_20px_40px_rgba(212,175,55,0.35)] transition hover:scale-[1.02] active:scale-90 safe-bottom sm:right-1/2 sm:translate-x-[194px]"
          aria-label="Add customer"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      <BottomSheet
        open={sheet.type === 'add'}
        onClose={() => setSheet({ type: 'none' })}
        title="Add Customer"
      >
        <AddCustomerForm onSubmit={handleAdd} existingNames={existingNames} />
      </BottomSheet>

      <BottomSheet
        open={sheet.type === 'pay'}
        onClose={() => setSheet({ type: 'none' })}
        title="Record Payment"
      >
        {sheet.type === 'pay' && (
          <PaymentForm
            customer={sheet.customer}
            onSubmit={handlePay}
            onWhatsApp={(paymentDetails) => {
              try {
                handlePaymentWhatsApp(sheet.customer, paymentDetails);
                setWhatsAppError('');
              } catch (error) {
                setWhatsAppError(
                  error instanceof Error ? error.message : 'Phone number is missing or invalid.'
                );
              }
            }}
          />
        )}
      </BottomSheet>

      <BottomSheet
        open={sheet.type === 'history'}
        onClose={() => setSheet({ type: 'none' })}
        title="Transaction History"
      >
        {sheet.type === 'history' && <HistoryView customer={sheet.customer} />}
      </BottomSheet>

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
