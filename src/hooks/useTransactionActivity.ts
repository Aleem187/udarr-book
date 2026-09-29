import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppUser, Customer, CurrencyCode } from '@/types';

export interface TransactionActivity {
  id: string;
  customerName: string;
  performedByName: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: CurrencyCode;
  paymentMethod: 'cash' | 'account' | 'card' | null;
}

interface RawTransactionRow {
  id: string;
  customer_id: string;
  performed_by: string | null;
  recorded_by: string | null;
  type: 'credit' | 'debit';
  amount: number;
  payment_method: 'cash' | 'account' | 'card' | null;
}

// Subscribes once and stays subscribed — customers/roster/onActivity are read
// through refs so a resubscribe (which could miss events mid-swap) never
// happens just because the customer list refetched.
export function useTransactionActivity(
  customers: Customer[],
  roster: AppUser[],
  currentUserId: string,
  onActivity: (activity: TransactionActivity) => void
) {
  const customersRef = useRef(customers);
  const rosterRef = useRef(roster);
  const onActivityRef = useRef(onActivity);

  useEffect(() => {
    customersRef.current = customers;
    rosterRef.current = roster;
    onActivityRef.current = onActivity;
  });

  useEffect(() => {
    const channel = supabase
      .channel('transactions-activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const row = payload.new as RawTransactionRow;

          // Don't toast your own action back at yourself.
          if (row.performed_by && row.performed_by === currentUserId) return;

          const customer = customersRef.current.find((c) => c.id === row.customer_id);
          const performer = rosterRef.current.find((u) => u.id === row.performed_by);

          onActivityRef.current({
            id: row.id,
            customerName: customer?.name ?? 'a customer',
            performedByName: performer?.name ?? row.recorded_by ?? 'A staff member',
            type: row.type,
            amount: Number(row.amount),
            currency: customer?.currency ?? 'KZT',
            paymentMethod: row.payment_method,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);
}
