import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HistoryView } from './HistoryView';

describe('HistoryView', () => {
  it('shows who recorded a payment entry', () => {
    const customer = {
      id: 'customer-1',
      name: 'Russian',
      phone: '03454718520',
      currency: 'THB',
      balance: 500,
      transactions: [
        {
          id: 'txn-1',
          type: 'debit',
          amount: 200,
          note: 'UPI transfer',
          paymentMethod: 'cash',
          date: '2026-09-22T10:00:00.000Z',
          recordedBy: 'Nadia',
        },
      ],
      createdAt: '2026-09-22T09:00:00.000Z',
      updatedAt: '2026-09-22T10:00:00.000Z',
    };

    const html = renderToStaticMarkup(<HistoryView customer={customer as any} />);

    expect(html).toContain('Recorded by');
    expect(html).toContain('Nadia');
  });
});
