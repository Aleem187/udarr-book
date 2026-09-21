export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  note?: string;
  paymentMethod?: 'cash' | 'account';
  date: string;
}

export type CurrencyCode = 'RUB' | 'THB';

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

export interface NotificationItem {
  id: string;
  actorUserId: string;
  actorName: string;
  customerId: string;
  customerName: string;
  amount: number;
  createdAt: string;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
}
