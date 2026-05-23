export interface Transaction {
  id?: number;
  transactionDate: string;
  description: string;
  amount: number;
  type: string;
  balance: number;
  category?: string;
}
