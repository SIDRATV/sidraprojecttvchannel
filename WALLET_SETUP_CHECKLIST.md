# Wallet System Setup Checklist

Complete this checklist to deploy the wallet backend system in production.

## 1. Environment Variables - Local Development

All variables have been added to `.env.local`. Please update **placeholder values** with real keys:

### RPC Endpoints
```env
RPC_URL_SIDRA=https://node.sidrachain.com          # Already set - verify it's correct
RPC_URL_BSK=https://bsc-dataseed.binance.org       # Already set - or use custom BSC RPC
```

### Hot Wallet Private Keys (CRITICAL - Keep Secure!)
```env
# Sidra Chain hot wallet - used for all on-chain withdrawals + sweeps
HOT_WALLET_PRIVATE_KEY_SIDRA=your_sidra_hot_wallet_private_key_here
  # Format: 0x followed by 64 hex characters (256-bit key)
  # NEVER commit real keys to git
  # Consider using encrypted env vars in Vercel/production

# BSC hot wallet - for BSC withdrawal & sweep operations  
HOT_WALLET_PRIVATE_KEY_BSK=your_bsc_hot_wallet_private_key_here
  # Format: 0x followed by 64 hex characters (256-bit key)
```

**To generate new hot wallet keys:**
```bash
npx ethers-cli account new
# This will output: Address and Private Key
# Save the address separately - you need to fund these wallets with gas tokens
```

### Deposit Address Generation Mnemonic (CRITICAL)
```env
WALLET_DEPOSIT_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
  # 12 or 24 BIP39 words
  # Used to HD-derive unique deposit addresses for each user
  # NEVER reuse in production - generate fresh
```

**To generate a new secure mnemonic:**
```bash
npx ethers-cli account new-mnemonic
# Keep this mnemonic secure - do NOT share
# This wallet will NOT hold funds (they get swept to hot wallet after deposit)
```

### Encryption Key (CRITICAL)
```env
ENCRYPTION_KEY=your_encryption_key_min_32_chars_highly_random_string_here_replace
  # At least 32 random characters
  # Used for AES-256 encryption of sensitive data (addresses, keys) at rest
  # Generate secure random: openssl rand -hex 32
```

**Generate a secure encryption key:**
```bash
# On Linux/Mac:
openssl rand -hex 32

# On Windows PowerShell:
[System.Convert]::ToBase64String([System.Random]::new().NextBytes(32))
```

---

## 2. Database Setup - Supabase Console

### Run SQL Migration
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create a new query
3. Paste contents from: `prisma/sql.wallet_system_exchange.sql`
4. Click "Run"
5. Verify: Check **Database → Tables** - confirm these tables exist:
   - `wallet_accounts`
   - `wallet_balances`
   - `wallet_transactions`
   - `wallet_deposits`
   - `wallet_withdrawals`
   - `wallet_logs`

**Important Notes:**
- If tables already exist from earlier versions, the SQL adds missing `network` columns automatically
- RLS (Row Level Security) policies are created for user data isolation
- Service role policies allow backend operations

### Verify RLS Policies
1. Go to **Authentication → Policies**
2. Confirm policies exist for each wallet table:
   - ✅ Users can read own data
   - ✅ Service role (backend) can manage all

---

## 3. Vercel Deployment - Production Environment Variables

### Dashboard Steps
1. Go to **Project Settings → Environment Variables**
2. Add all variables from `.env.local` EXCEPT placeholders:
   - ✅ `RPC_URL_SIDRA` (real value)
   - ✅ `RPC_URL_BSK` (real value)
   - ✅ `HOT_WALLET_PRIVATE_KEY_SIDRA` (real private key)
   - ✅ `HOT_WALLET_PRIVATE_KEY_BSK` (real private key)
   - ✅ `WALLET_DEPOSIT_MNEMONIC` (real 12/24 words)
   - ✅ `ENCRYPTION_KEY` (random 32+ chars)
   - ✅ All other `WALLET_*` configuration variables

3. **Redeploy** after adding:
   - Go to **Deployments → Trigger deploy** or push to `master` branch

### Security Best Practices for Vercel
- Mark sensitive variables (private keys, mnemonic, encryption key) as **encrypted**
- Do NOT use preview deployments with real production keys
- Rotate keys regularly in production
- Consider using separate hot wallet keys per environment (dev/staging/prod)

---

## 4. Hot Wallet Funding

### What to do:
1. Deploy the code
2. Generate hot wallet addresses locally:
   ```bash
   node -e "
   const ethers = require('ethers');
   const sidraKey = process.env.HOT_WALLET_PRIVATE_KEY_SIDRA;
   const bskKey = process.env.HOT_WALLET_PRIVATE_KEY_BSK;
   
   const sidraWallet = new ethers.Wallet(sidraKey);
   const bskWallet = new ethers.Wallet(bskKey);
   
   console.log('Sidra Hot Wallet:', sidraWallet.address);
   console.log('BSC Hot Wallet:', bskWallet.address);
   "
   ```

3. **Fund each hot wallet with gas tokens:**
   - Send SIDRA to Sidra Chain hot wallet address
   - Send BNB to BSC hot wallet address
   - Recommended: 0.5 - 2.0 of each token (for gas fees)

4. **Test a withdrawal:**
   - User requests withdrawal
   - Backend sends from hot wallet
   - Verify transaction succeeds

---

## 5. Wallet APIs - Test Endpoints

### After deployment, test these routes:

#### 1. Generate User Wallet Address (at signup)
```bash
POST /api/wallet/address/generate
Authorization: Bearer {user_jwt_token}
```
Response:
```json
{
  "success": true,
  "userId": "uuid",
  "address": "0x...",
  "network": "sidra",
  "createdAt": "2026-03-22T..."
}
```

#### 2. Get Deposit Address
```bash
GET /api/wallet/deposit-address
Authorization: Bearer {user_jwt_token}
```

#### 3. Request Withdrawal
```bash
POST /api/wallet/withdraw
Authorization: Bearer {user_jwt_token}
Content-Type: application/json

{
  "toAddress": "0x...",
  "amount": 100,
  "network": "sidra"
}
```

#### 4. Sync Deposits (Admin)
```bash
POST /api/wallet/deposits/sync
x-admin-api-key: {WALLET_ADMIN_API_KEY}

{
  "network": "sidra",
  "maxBlocks": 250
}
```

---

## 6. Configuration Summary

### Key Values Already Set
```env
WALLET_CURRENCY=SIDRA                              # ✅ Set
WALLET_CHAIN_NAME=sidra                            # ✅ Set
WALLET_INTERNAL_TRANSFER_FEE_BPS=100               # ✅ 1% fee
WALLET_WITHDRAWAL_MIN=0.01                         # ✅ Minimum 0.01 SIDRA
WALLET_WITHDRAWAL_SINGLE_LIMIT=500                # ✅ Max 500 per withdrawal
WALLET_WITHDRAWAL_DAILY_LIMIT=1000                # ✅ Max 1000 per day
WALLET_MIN_CONFIRMATIONS=3                        # ✅ 3 block confirmations
WALLET_DEPOSIT_SYNC_BLOCKS=250                    # ✅ Scan 250 blocks per sync
```

### Features Enabled
- ✅ Unique deposit address per user (HD-derived from mnemonic)
- ✅ Automatic on-chain deposit detection + sweep to hot wallet
- ✅ Internal transfers (off-chain, instant, between users)
- ✅ External withdrawals (on-chain, with limit enforcement)
- ✅ Multi-network support (Sidra + BSC)
- ✅ Encryption for addresses at rest
- ✅ Audit logging of all wallet operations
- ✅ Retry logic for failed withdrawals

---

## 7. Monitoring & Maintenance

### After launch, check:

1. **Deposit Sync**
   - Run `/api/wallet/deposits/sync` every 1-5 minutes (via Vercel cron or external job)
   - Monitor: `wallet_deposits.sweep_status` for failed sweeps

2. **Withdrawal Processing**
   - Run `/api/wallet/retry-failed` every 10-30 minutes
   - Check `wallet_withdrawals.status` for stuck transactions

3. **Logs**
   - Query `wallet_logs` table for errors
   - Search for `action` like `wallet.deposit.sweep_failed` to catch issues

4. **Heartbeat**
   - Query `wallet_accounts` count - should grow with new users
   - Query `wallet_balances` totals - sanity check platform reserves

---

## 8. Troubleshooting

### "Failed to get deposit address" (400 error)
- ❌ `WALLET_DEPOSIT_MNEMONIC` not set in Vercel
- ❌ Supabase `wallet_deposit_addresses` table missing
- ✅ Solution: Run SQL migration + set env vars + redeploy

### "Hot wallet private key not configured" (withdrawal fails)
- ❌ `HOT_WALLET_PRIVATE_KEY_SIDRA` or `HOT_WALLET_PRIVATE_KEY_BSK` missing
- ❌ Hot wallet address underfunded (insufficient gas)
- ✅ Solution: Add env vars + fund wallet with gas tokens

### Deposit detected but not credited
- ❌ Not enough confirmations (default: 3)
- ❌ Sweep failed (check `wallet_logs` for errors)
- ✅ Solution: Query `wallet_deposits` status, retry sync manually

### User can't withdraw / "limit exceeded"
- Read error message for which limit (daily/single)
- Check user's `wallet_limits` row in DB
- Limits can be updated per-user if needed

---

## 9. Going Live Checklist

- [ ] RPC URLs configured for both networks
- [ ] Hot wallet private keys set in Vercel
- [ ] Deposit mnemonic set in Vercel
- [ ] Encryption key generated and set
- [ ] SQL migration run in Supabase
- [ ] Hot wallets funded with gas tokens
- [ ] Test deposit flow works (detect → credit → sweep)
- [ ] Test withdrawal works (validate → execute → confirm)
- [ ] Admin cron jobs scheduled (sync deposits + process withdrawals)
- [ ] Monitoring alerts configured
- [ ] Documentation shared with ops team
- [ ] Backup of mnemonic + hot wallet keys (secure storage)

---

## Support

For issues or questions about the wallet system:
1. Check `wallet_logs` table for detailed error messages
2. Review this checklist for missing configuration
3. Verify RPC endpoints are reachable: `curl {RPC_URL}`
4. Check Vercel deployment logs for startup errors
