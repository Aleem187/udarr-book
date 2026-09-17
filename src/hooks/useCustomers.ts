import { useCallback, useEffect, useState } from 'react';
import type { Customer, CurrencyCode, Transaction } from '@/types';

const STORAGE_KEY = 'udhaar-khata-book-v1';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function load(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function save(customers: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(() => load());

  useEffect(() => {
    save(customers);
  }, [customers]);

  const addOrUpdateCustomer = useCallback(
    (name: string, phone: string, amount: number, date?: string, currency: CurrencyCode = 'INR') => {
      const selectedDate = date ? new Date(date).toISOString() : new Date().toISOString();
      let addedNew = false;

      setCustomers((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()
        );

        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          const updated: Customer = {
            ...existing,
            phone: phone || existing.phone,
            currency: currency || existing.currency || 'INR',
            balance: existing.balance + amount,
            transactions: [
              {
                id: uid(),
                type: 'credit',
                amount,
                date: selectedDate,
              },
              ...existing.transactions,
            ],
            updatedAt: selectedDate,
          };
          const next = [...prev];
          next[existingIndex] = updated;
          return next;
        }

        addedNew = true;
        const newCustomer: Customer = {
          id: uid(),
          name: name.trim(),
          phone: phone.trim(),
          currency,
          balance: amount,
          transactions: [
            {
              id: uid(),
              type: 'credit',
              amount,
              date: selectedDate,
            },
          ],
          createdAt: selectedDate,
          updatedAt: selectedDate,
        };
        return [newCustomer, ...prev];
      });

      return addedNew;
    },
    []
  );

  const recordPayment = useCallback((customerId: string, amount: number, note?: string) => {
    const now = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const txn: Transaction = {
          id: uid(),
          type: 'debit',
          amount,
          note,
          date: now,
        };
        return {
          ...c,
          balance: c.balance - amount,
          transactions: [txn, ...c.transactions],
          updatedAt: now,
        };
      })
    );
  }, []);

  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  }, []);

  return {
    customers,
    addOrUpdateCustomer,
    recordPayment,
    deleteCustomer,
  };
}
