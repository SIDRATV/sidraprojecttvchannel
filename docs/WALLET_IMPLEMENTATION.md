# Wallet Implementation Guide

## Overview
This is a complete professional wallet implementation for SidraChain (EVM-compatible chain). It supports both on-chain and internal (off-chain) transfers.

## Features

### ✅ Implemented
- **MetaMask Connection**: Connect/disconnect wallet with one click
- **SidraChain Integration**: Automatic chain detection and switching
- **Balance Display**: Real-time on-chain balance fetching
- **On-Chain Transfers**: Send SIDRA tokens directly via blockchain
- **Internal Transfers**: Send tokens between platform users
- **Fee Estimation**: Calculate internal transfer fees
- **Transaction History**: View transaction details with status tracking
- **Responsive UI**: Mobile-first design with Tailwind CSS
- **Error Handling**: Comprehensive error messages and validation
- **Loading States**: Visual feedback during transactions

## File Structure

```
src/
├── lib/
│   ├── web3-provider.ts          # Ethers.js configuration & blockchain functions
│   └── internalTransfer.ts       # Internal transfer API client
├── components/wallet/
│   ├── WalletConnect.tsx         # MetaMask connection component
│   ├── TransferForm.tsx          # Transfer form for both types
│   ├── TransactionHistory.tsx    # Transaction list display
│   └── index.ts                  # Component exports
├── app/
│   ├── (app)/wallet/
│   │   └── page.tsx              # Main wallet page
│   └── api/wallet/
│       ├── internal-transfer.ts  # Internal transfer API endpoint
│       ├── internal-balance.ts   # Get user balance endpoint
│       ├── internal-transactions.ts # Transaction history endpoint
│       ├── verify-username.ts    # Username verification endpoint
│       └── estimate-fee.ts       # Fee estimation endpoint
```

## Configuration

### SidraChain Details
```typescript
const SIDRA_CHAIN_CONFIG = {
  chainId: 97453,
  chainName: 'SidraChain',
  rpcUrl: 'https://node.sidrachain.com',
  symbol: 'SIDRA',
  decimals: 18,
  blockExplorerUrl: 'https://explorer.sidrachain.com',
};
```

## Usage

### 1. Wallet Connection
```typescript
import { connectMetaMask, getCurrentAccount } from '@/lib/web3-provider';

// Connect wallet
const account = await connectMetaMask();

// Get current account
const currentAccount = await getCurrentAccount();
```

### 2. Get Balance
```typescript
import { getBalance } from '@/lib/web3-provider';

const balance = await getBalance('0x742d35Cc6634C0532925a3b844Bc868e4D64e6Ef');
console.log(balance); // Returns balance in SIDRA (not Wei)
```

### 3. Send On-Chain Transaction
```typescript
import { sendTransaction } from '@/lib/web3-provider';

const txHash = await sendTransaction('0x...', '10'); // Send 10 SIDRA
```

### 4. Send Internal Transfer
```typescript
import { sendInternalTransfer } from '@/lib/internalTransfer';

await sendInternalTransfer(
  {
    recipientUsername: 'john_doe',
    amount: 10,
    description: 'Payment for services',
  },
  authToken
);
```

### 5. Get Transaction Details
```typescript
import { getTransaction } from '@/lib/web3-provider';

const tx = await getTransaction('0x...'); // Returns tx details with status
```

## API Endpoints

### Internal Transfers

#### POST /api/wallet/internal-transfer
Send tokens to another platform user.

**Request:**
```json
{
  "recipientUsername": "john_doe",
  "amount": 10,
  "description": "Payment"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "TXN_123456",
  "message": "Transfer sent successfully",
  "timestamp": "2024-03-12T10:30:00Z"
}
```

#### GET /api/wallet/internal-balance
Get user's internal (platform) balance.

**Response:**
```json
{
  "balance": 1000.5,
  "currency": "SIDRA",
  "lastUpdated": "2024-03-12T10:30:00Z"
}
```

#### GET /api/wallet/internal-transactions?limit=20&offset=0
Get user's transaction history.

**Response:**
```json
[
  {
    "id": "TXN_001",
    "sender": "user_123",
    "recipient": "user_456",
    "amount": 10.5,
    "status": "completed",
    "timestamp": "2024-03-12T09:30:00Z",
    "description": "Payment"
  }
]
```

#### GET /api/wallet/verify-username/{username}
Check if a username exists on the platform.

**Response:**
```json
{
  "exists": true,
  "username": "john_doe"
}
```

#### POST /api/wallet/estimate-fee
Estimate transfer fee for a given amount.

**Request:**
```json
{
  "amount": 100
}
```

**Response:**
```json
{
  "amount": 100,
  "fee": 1,
  "total": 101,
  "feePercentage": 1
}
```

## Backend Implementation TODO

The following needs to be implemented in your backend:

### 1. Authentication
- [ ] Verify JWT tokens from authorization header
- [ ] Validate token expiry

### 2. User Management
- [ ] Check if username exists (verify-username endpoint)
- [ ] Prevent self-transfers
- [ ] Track user balances in database

### 3. Internal Transfers
- [ ] Validate sender has sufficient balance
- [ ] Calculate transfer fees
- [ ] Execute atomic transaction (debit sender, credit recipient)
- [ ] Store transaction record
- [ ] Handle transaction failures/rollbacks

### 4. Database Schema
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(255),
  internal_balance DECIMAL(18, 6) DEFAULT 0,
  created_at TIMESTAMP
);

-- Internal Transactions
CREATE TABLE internal_transactions (
  id UUID PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  amount DECIMAL(18, 6) NOT NULL,
  fee DECIMAL(18, 6) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);
```

### 5. Security Considerations
- [ ] Validate all inputs server-side
- [ ] Implement rate limiting on transfer endpoints
- [ ] Use database transactions for atomic operations
- [ ] Audit log all transfers
- [ ] Monitor for fraud patterns
- [ ] Implement 2FA for large transfers

## Production Environment Variables

Set these on your server (never expose private keys to the client):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Wallet chain + signer
WALLET_RPC_URL=
WALLET_CHAIN_NAME=sidra
WALLET_CURRENCY=SIDRA
WALLET_SIGNER_PRIVATE_KEY=

# Deposit address derivation (unique per user)
WALLET_DEPOSIT_MNEMONIC=
WALLET_DEPOSIT_DERIVATION_PREFIX=m/44'/60'/0'/0/

# Security + encryption
WALLET_ENCRYPTION_KEY=
WALLET_REQUIRE_2FA=false
WALLET_2FA_MASTER_CODE=

# Limits + fee + retries
WALLET_INTERNAL_TRANSFER_FEE_BPS=100
WALLET_WITHDRAWAL_MIN=0.01
WALLET_WITHDRAWAL_SINGLE_LIMIT=500
WALLET_WITHDRAWAL_DAILY_LIMIT=1000
WALLET_WITHDRAWAL_MAX_RETRIES=3
WALLET_WITHDRAWAL_RETRY_DELAY_MINUTES=10
WALLET_MIN_CONFIRMATIONS=3
WALLET_DEPOSIT_SYNC_BLOCKS=250

# Admin/ops endpoints (sync + retry + monitoring)
WALLET_ADMIN_API_KEY=
```

## Operational Endpoints

- `POST /api/wallet/internal-transfer` (off-chain internal transfers)
- `GET /api/wallet/internal-balance` (internal balance)
- `GET /api/wallet/internal-transactions` (history + status)
- `POST /api/wallet/withdraw` (queue on-chain withdrawal)
- `GET /api/wallet/deposit-address` (unique deposit address per user)
- `POST /api/wallet/deposits/sync` (detect and credit deposits; admin)
- `POST /api/wallet/retry-failed` (retry failed/pending withdrawals; admin)
- `GET /api/wallet/admin/monitoring` (admin monitoring)

## Gas Fees (On-Chain Transfers)

On-chain transfers require gas fees. Users should be aware that:
1. Gas fees vary based on network congestion
2. Fees are paid in SIDRA
3. Minimum balance check includes gas estimation

To estimate gas costs, use ethers.js:
```typescript
const gasEstimate = await signer.estimateGas({
  to: recipientAddress,
  value: ethers.parseEther('1'),
});
const gasCost = gasEstimate * gasPrice;
```

## Testing

### Local Testing
1. Install MetaMask extension
2. Add SidraChain network to MetaMask:
   - RPC URL: https://node.sidrachain.com
   - Chain ID: 97453
   - Symbol: SIDRA

### Test Transfers
1. Connect wallet
2. Fill in recipient address (test wallet)
3. Enter amount
4. Confirm transaction in MetaMask
5. Wait for blockchain confirmation

## Troubleshooting

### "MetaMask is not installed"
- Install MetaMask extension from Chrome Web Store

### "Wrong Network"
- Click the network selector in wallet UI to switch to SidraChain
- Or manually add SidraChain to MetaMask

### "Insufficient Balance"
- Make sure you have enough SIDRA tokens
- Check on-chain balance and gas costs

### "Invalid Recipient Address"
- For on-chain: Use valid Ethereum address (0x...)
- For internal: Use exact username from platform

## Performance Optimization

- Balance is cached and refreshed every 5 minutes
- Transaction history pagination (max 100 items per request)
- Optimistic UI updates for better UX
- Debounced username verification (500ms)

## Security

- No private keys are stored
- All blockchain interactions via MetaMask
- Internal transfers authenticated via JWT
- Rate limiting on API endpoints (implement server-side)

## Future Enhancements

- [ ] Multi-wallet support (Ledger, Trezor, etc.)
- [ ] Transaction receipts/confirmation status
- [ ] QR code for receiving addresses
- [ ] Recurring transfers
- [ ] Transfer templates
- [ ] Advanced analytics
- [ ] Mobile app support

## Support

For issues or questions:
1. Check the error message and troubleshooting section
2. Review the API documentation
3. Check blockchain explorer: https://explorer.sidrachain.com
