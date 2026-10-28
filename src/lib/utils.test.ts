import { describe, expect, it } from 'vitest';
import { buildTransactionShareLink, buildWhatsAppLink, normalizePhoneForWhatsApp, paginateItems } from './utils';
import type { Transaction } from '@/types';

describe('normalizePhoneForWhatsApp', () => {
  it('adds +92 for local Pakistani numbers without country code', () => {
    expect(normalizePhoneForWhatsApp('03001234567')).toBe('923001234567');
  });

  it('keeps an existing international code', () => {
    expect(normalizePhoneForWhatsApp('+923001234567')).toBe('923001234567');
  });

  it('strips non-digit characters', () => {
    expect(normalizePhoneForWhatsApp('+92 (300) 123-4567')).toBe('923001234567');
  });

  it('trusts an explicit non-Pakistani country code instead of guessing +92', () => {
    expect(normalizePhoneForWhatsApp('+7 707 123 4567')).toBe('77071234567');
  });
});

describe('buildWhatsAppLink', () => {
  it('creates a valid wa.me link with a prefilled payment message', () => {
    const link = buildWhatsAppLink('03001234567', 'Ali', 2500, '2026-09-21', 'KZT', {
      amountPaid: 1200,
      paymentDate: '2026-09-21',
      remainingBalance: 1300,
    });

    expect(link).toContain('https://wa.me/923001234567');
    expect(link).toContain(encodeURIComponent('Hi Ali'));
    expect(link).toContain(encodeURIComponent('Amount received: ₸1,200'));
    expect(link).toContain(encodeURIComponent('Remaining balance: ₸1,300'));
  });

  it('throws a clear error when the phone is invalid', () => {
    expect(() => buildWhatsAppLink('', 'Ali', 2500)).toThrow('Phone number is missing or invalid');
  });
});

describe('buildTransactionShareLink', () => {
  it('includes the receipt URL in the shared message when present', () => {
    const txn: Transaction = {
      id: 'txn-1',
      type: 'debit',
      amount: 5000,
      date: '2026-10-28T10:00:00.000Z',
      receiptUrl: 'https://example.supabase.co/storage/v1/object/public/receipts/c1/r1.jpg',
    };

    const link = buildTransactionShareLink('+7 707 123 4567', 'Ahmed', txn, 'KZT');

    expect(link).toContain('https://wa.me/77071234567');
    expect(link).toContain(encodeURIComponent('Payment received: ₸5,000'));
    expect(link).toContain(encodeURIComponent('Receipt: https://example.supabase.co/storage/v1/object/public/receipts/c1/r1.jpg'));
  });

  it('omits the receipt line when there is no receipt', () => {
    const txn: Transaction = {
      id: 'txn-2',
      type: 'credit',
      amount: 1000,
      date: '2026-10-28T10:00:00.000Z',
    };

    const link = buildTransactionShareLink('+7 707 123 4567', 'Ahmed', txn, 'KZT');

    expect(link).not.toContain(encodeURIComponent('Receipt:'));
  });
});

describe('paginateItems', () => {
  it('splits a large list into pages while keeping order', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    expect(paginateItems(items, 1, 3)).toEqual([1, 2, 3]);
    expect(paginateItems(items, 2, 3)).toEqual([4, 5, 6]);
    expect(paginateItems(items, 3, 3)).toEqual([7, 8, 9]);
  });
});
