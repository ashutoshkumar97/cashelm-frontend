export interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    balance: number;
    remark: string;
}