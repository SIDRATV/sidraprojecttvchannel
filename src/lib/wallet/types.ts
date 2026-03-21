export type WalletTransactionStatus = 'pending' | 'success' | 'failed';
export type WalletNetwork = 'sidra' | 'bsc';

export interface AuthenticatedWalletUser {
  id: string;
  email?: string;
  username?: string | null;
  fullName?: string | null;
  isAdmin?: boolean;
}

export interface InternalTransferInput {
  senderUserId: string;
  recipientUsername: string;
  amount: number;
  description?: string;
}

export interface WithdrawalInput {
  userId: string;
  toAddress: string;
  amount: number;
  network?: WalletNetwork;
  description?: string;
}

export interface WalletBalanceResult {
  balance: number;
  currency: string;
  lockedBalance: number;
  lastUpdated: string;
}
