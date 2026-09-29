import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Customer, CurrencyCode, Transaction } from '@/types';

interface TransactionRow {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  note: string | null;
  payment_method: 'cash' | 'account' | 'card' | null;
  recorded_by: string | null;
  date: string;
}

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  currency: CurrencyCode;
  balance: number;
  created_at: string;
  updated_at: string;
  transactions: TransactionRow[] | null;
}

const SELECT_QUERY = '*, transactions(id, type, amount, note, payment_method, recorded_by, date)';

function mapRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    currency: row.currency,
    balance: Number(row.balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    transactions: (row.transactions ?? []).map(
      (t): Transaction => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        note: t.note ?? undefined,
        paymentMethod: t.payment_method ?? undefined,
        recordedBy: t.recorded_by ?? undefined,
        date: t.date,
      })
    ),
  };
}

export function useCustomers(enabled: boolean) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('customers')
      .select(SELECT_QUERY)
      .order('created_at', { ascending: false })
      .order('date', { foreignTable: 'transactions', ascending: false });

    if (error) {
      console.error('useCustomers: failed to load customers', error);
      return;
    }

    setCustomers(((data as unknown as CustomerRow[]) ?? []).map(mapRow));
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCustomers([]);
      setLoading(true);
      return;
    }

    setLoading(true);
    refetch().finally(() => setLoading(false));

    const channel = supabase
      .channel('customers-and-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => refetch())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, refetch]);

  const addOrUpdateCustomer = useCallback(
    async (name: string, phone: string, amount: number, date?: string, currency: CurrencyCode = 'KZT') => {
      const selectedDate = date ? new Date(date).toISOString() : new Date().toISOString();

      const { data: existing, error: findError } = await supabase
        .from('customers')
        .select('id, phone, currency')
        .ilike('name', name.trim())
        .maybeSingle();

      if (findError) {
        console.error('useCustomers: failed to look up customer by name', findError);
        throw findError;
      }

      let addedNew = false;
      let customerId: string;

      if (existing) {
        customerId = existing.id;
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            phone: phone || existing.phone,
            currency: currency || existing.currency || 'KZT',
          })
          .eq('id', customerId);

        if (updateError) {
          console.error('useCustomers: failed to update customer', updateError);
          throw updateError;
        }

        const { error: rpcError } = await supabase.rpc('record_transaction', {
          p_customer_id: customerId,
          p_type: 'credit',
          p_amount: amount,
          p_date: selectedDate,
        });

        if (rpcError) {
          console.error('useCustomers: failed to record credit transaction', rpcError);
          throw rpcError;
        }
      } else {
        addedNew = true;
        const { data: created, error: insertError } = await supabase
          .from('customers')
          .insert({
            name: name.trim(),
            phone: phone.trim(),
            currency,
            balance: 0,
            created_at: selectedDate,
            updated_at: selectedDate,
          })
          .select('id')
          .single();

        if (insertError || !created) {
          console.error('useCustomers: failed to create customer', insertError);
          throw insertError;
        }
        customerId = created.id;

        const { error: rpcError } = await supabase.rpc('record_transaction', {
          p_customer_id: customerId,
          p_type: 'credit',
          p_amount: amount,
          p_date: selectedDate,
        });

        if (rpcError) {
          console.error('useCustomers: failed to record initial credit transaction', rpcError);
          throw rpcError;
        }
      }

      await refetch();
      return addedNew;
    },
    [refetch]
  );

  const recordPayment = useCallback(
    async (
      customerId: string,
      amount: number,
      note?: string,
      paymentMethod?: 'cash' | 'account' | 'card',
      recordedBy?: string
    ) => {
      const { error } = await supabase.rpc('record_transaction', {
        p_customer_id: customerId,
        p_type: 'debit',
        p_amount: amount,
        p_note: note || null,
        p_payment_method: paymentMethod || null,
        p_recorded_by: recordedBy?.trim() || null,
      });

      if (error) {
        console.error('useCustomers: failed to record payment', error);
        throw error;
      }

      await refetch();
    },
    [refetch]
  );

  const deleteCustomer = useCallback(
    async (customerId: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', customerId);
      if (error) {
        console.error('useCustomers: failed to delete customer', error);
        throw error;
      }
      await refetch();
    },
    [refetch]
  );

  const deleteTransaction = useCallback(
    async (_customerId: string, transactionId: string) => {
      const { error } = await supabase.rpc('delete_transaction', { p_transaction_id: transactionId });
      if (error) {
        console.error('useCustomers: failed to delete transaction', error);
        throw error;
      }
      await refetch();
    },
    [refetch]
  );

  return {
    customers,
    loading,
    addOrUpdateCustomer,
    recordPayment,
    deleteCustomer,
    deleteTransaction,
  };
}
