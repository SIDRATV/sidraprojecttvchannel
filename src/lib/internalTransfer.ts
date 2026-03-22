// Internal Transfer API

export interface InternalTransferRequest {
  recipientUsername: string;
  amount: number;
  description?: string;
}

export interface InternalTransferResponse {
  success: boolean;
  transactionId: string;
  message: string;
  timestamp: string;
}

export interface InternalTransaction {
  id: string;
  type: 'internal_transfer' | 'withdrawal' | 'deposit' | 'fee' | 'adjustment';
  direction: 'credit' | 'debit';
  counterparty_user_id?: string | null;
  amount: number;
  fee?: number;
  status: 'pending' | 'success' | 'failed';
  tx_hash?: string | null;
  to_address?: string | null;
  from_address?: string | null;
  created_at: string;
  description?: string;
  reference_id?: string | null;
  retry_count?: number;
  error_message?: string | null;
}

export interface InternalBalance {
  balance: number;
  lockedBalance: number;
  currency: string;
  lastUpdated: string;
}

export interface WithdrawalRequest {
  toAddress: string;
  amount: number;
  description?: string;
}

export interface WithdrawalResponse {
  success: boolean;
  withdrawalId: string;
  transactionId: string;
  amount: number;
  fee: number;
  status: 'pending' | 'success' | 'failed';
  referenceId: string;
  createdAt: string;
  message: string;
}

export interface DepositAddressResponse {
  success: boolean;
  address: string;
  network: string;
  createdAt: string;
}

/**
 * Send Internal Transfer (Off-Chain)
 */
export const sendInternalTransfer = async (
  request: InternalTransferRequest,
  authToken: string
): Promise<InternalTransferResponse> => {
  try {
    const response = await fetch('/api/wallet/internal-transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send internal transfer');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending internal transfer:', error);
    throw error;
  }
};

/**
 * Get Internal Balance
 */
export const getInternalBalance = async (authToken: string): Promise<InternalBalance> => {
  try {
    const response = await fetch('/api/wallet/internal-balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch internal balance');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching internal balance:', error);
    throw error;
  }
};

/**
 * Get Internal Transaction History
 */
export const getInternalTransactionHistory = async (
  authToken: string,
  limit: number = 20,
  offset: number = 0
): Promise<InternalTransaction[]> => {
  try {
    const response = await fetch(
      `/api/wallet/internal-transactions?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch transaction history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};

/**
 * Get Internal Transaction Details
 */
export const getInternalTransactionDetails = async (
  transactionId: string,
  authToken: string
): Promise<InternalTransaction> => {
  try {
    const response = await fetch(
      `/api/wallet/internal-transactions/${transactionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Transaction not found');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw error;
  }
};

/**
 * Verify Username Exists
 */
export const verifyUsername = async (username: string, authToken?: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/wallet/verify-username/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error('Error verifying username:', error);
    return false;
  }
};

/**
 * Estimate Internal Transfer Fee
 */
export const estimateTransferFee = async (amount: number): Promise<number> => {
  try {
    const response = await fetch('/api/wallet/estimate-fee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      return 0; // No fee
    }

    const data = await response.json();
    return data.fee || 0;
  } catch (error) {
    console.error('Error estimating fee:', error);
    return 0;
  }
};

/**
 * Request External Withdrawal
 */
export const requestWithdrawal = async (
  request: WithdrawalRequest,
  authToken: string,
  twoFactorCode?: string
): Promise<WithdrawalResponse> => {
  try {
    const response = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        ...(twoFactorCode ? { 'x-wallet-2fa': twoFactorCode } : {}),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to request withdrawal');
    }

    return await response.json();
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    throw error;
  }
};

/**
 * Get User Deposit Address
 */
export const getDepositAddress = async (authToken: string): Promise<DepositAddressResponse> => {
  try {
    const response = await fetch('/api/wallet/deposit-address', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to get deposit address');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting deposit address:', error);
    throw error;
  }
};
