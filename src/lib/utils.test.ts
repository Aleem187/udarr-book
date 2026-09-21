import { describe, expect, it } from 'vitest';
import { buildWhatsAppLink, normalizePhoneForWhatsApp, paginateItems } from './utils';

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
});

describe('buildWhatsAppLink', () => {
  it('creates a valid wa.me link with a prefilled payment message', () => {
    const link = buildWhatsAppLink('03001234567', 'Ali', 2500, '2026-09-21', 'THB', {
      amountPaid: 1200,
      paymentDate: '2026-09-21',
      remainingBalance: 1300,
    });

    expect(link).toContain('https://wa.me/923001234567');
    expect(link).toContain(encodeURIComponent('Hi Ali'));
    expect(link).toContain(encodeURIComponent('Amount received: ฿1,200'));
    expect(link).toContain(encodeURIComponent('Remaining balance: ฿1,300'));
  });

  it('throws a clear error when the phone is invalid', () => {
    expect(() => buildWhatsAppLink('', 'Ali', 2500)).toThrow('Phone number is missing or invalid');
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
