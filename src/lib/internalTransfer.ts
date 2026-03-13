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
  sender: string;
  recipient: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  description?: string;
}

export interface InternalBalance {
  balance: number;
  currency: string;
  lastUpdated: string;
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
export const verifyUsername = async (username: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/wallet/verify-username/${username}`, {
      method: 'GET',
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
