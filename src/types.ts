export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  note?: string;
  date: string;
}

export type CurrencyCode = 'INR' | 'RUB';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  currency?: CurrencyCode;
  balance: number;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}
