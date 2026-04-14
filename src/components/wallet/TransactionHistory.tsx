'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, ExternalLink, Loader, Crown } from 'lucide-react';
import { getTransaction } from '@/lib/web3-provider';
import { getInternalTransactionHistory, InternalTransaction } from '@/lib/internalTransfer';
import { Button } from '@/components/ui/Button';
import { SDALogo } from './SDALogo';

interface BlockchainTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  status: 'success' | 'failed' | 'pending';
  timestamp?: number | null;
  blockNumber?: number | null;
}

interface TransactionHistoryProps {
  walletAddress: string | null;
  transactionType: 'onchain' | 'internal' | 'all';
  authToken?: string;
  limit?: number;
}

export function TransactionHistory({
  walletAddress,
  transactionType,
  authToken,
  limit = 10,
}: TransactionHistoryProps) {
  const [blockchainTxs, setBlockchainTxs] = useState<BlockchainTx[]>([]);
  const [internalTxs, setInternalTxs] = useState<InternalTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'onchain' | 'internal'>(
    transactionType === 'onchain' ? 'onchain' : 'internal'
  );

  useEffect(() => {
    if (transactionType === 'all' || transactionType === 'onchain') {
      // Note: In a real app, you would fetch on-chain transaction history
      // from an indexer like Etherscan or The Graph
      console.log('Fetching blockchain transactions for:', walletAddress);
    }

    if ((transactionType === 'all' || transactionType === 'internal') && authToken) {
      fetchInternalTransactions();
    }
  }, [walletAddress, authToken, transactionType]);

  const fetchInternalTransactions = async () => {
    if (!authToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const txs = await getInternalTransactionHistory(authToken, limit, 0);
      setInternalTxs(
        txs.map((tx) => ({
          ...tx,
          amount: Number.isFinite(Number(tx.amount)) ? Number(tx.amount) : 0,
          fee: Number.isFinite(Number(tx.fee ?? 0)) ? Number(tx.fee ?? 0) : 0,
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transaction history');
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const shortenHash = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-8)}`;

  const formatDate = (timestamp: string | number | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const showNoData = 
    (activeTab === 'onchain' && blockchainTxs.length === 0) ||
    (activeTab === 'internal' && internalTxs.length === 0);

  const tabs = [];
  if (transactionType === 'all' || transactionType === 'onchain') {
    tabs.push({ id: 'onchain' as const, label: 'On-Chain' });
  }
  if (transactionType === 'all' || transactionType === 'internal') {
    tabs.push({ id: 'internal' as const, label: 'Internal' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-950 dark:text-white">
          Transaction History
        </h3>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && showNoData && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 opacity-50 mb-4" />
            <p className="text-center">
              No{' '}
              {activeTab === 'onchain' ? 'on-chain' : 'internal'} transactions yet
            </p>
          </div>
        )}

        {!isLoading && !error && activeTab === 'onchain' && (
          <div className="space-y-3">
            {blockchainTxs.slice(0, limit).map((tx) => (
              <TransactionRow key={tx.hash} tx={tx} type="onchain" />
            ))}
          </div>
        )}

        {!isLoading && !error && activeTab === 'internal' && (
          <div className="space-y-3">
            {internalTxs.slice(0, limit).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} type="internal" />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {(blockchainTxs.length > 0 || internalTxs.length > 0) && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (activeTab === 'internal') {
                fetchInternalTransactions();
              } else {
                // Refresh blockchain transactions
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

interface TransactionRowProps {
  tx: BlockchainTx | InternalTransaction;
  type: 'onchain' | 'internal';
}

function TransactionRow({ tx, type }: TransactionRowProps) {
  const isBlockchain = type === 'onchain';
  const isSent = isBlockchain ? true : ((tx as InternalTransaction).direction === 'debit' || (tx as InternalTransaction).direction === 'out');

  const getStatusIcon = () => {
    if (isBlockchain) {
      const bcTx = tx as BlockchainTx;
      if (bcTx.status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
      if (bcTx.status === 'failed') return <XCircle className="w-5 h-5 text-red-500" />;
      return <Clock className="w-5 h-5 text-yellow-500" />;
    } else {
      const iTx = tx as InternalTransaction;
      if (iTx.status === 'success' || iTx.status === 'completed') return <CheckCircle className="w-5 h-5 text-green-500" />;
      if (iTx.status === 'failed') return <XCircle className="w-5 h-5 text-red-500" />;
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getAmount = () => {
    if (isBlockchain) {
      const bcTx = tx as BlockchainTx;
      return (
        <span className="flex items-center gap-1">
            {(Number.isFinite(Number(bcTx.value)) ? Number(bcTx.value) : 0).toFixed(4)} <SDALogo size="sm" />
        </span>
      );
    } else {
      const iTx = tx as InternalTransaction;
      return (
        <span className="flex items-center gap-1">
            {(Number.isFinite(Number(iTx.amount)) ? Number(iTx.amount) : 0).toFixed(4)} <SDALogo size="sm" />
        </span>
      );
    }
  };

  const getRecipient = () => {
    if (isBlockchain) {
      const bcTx = tx as BlockchainTx;
      return shortenAddress(bcTx.to);
    } else {
      const iTx = tx as InternalTransaction;

      // Subscription transactions — show description
      if (iTx.type === 'subscription' && iTx.description) {
        return iTx.description;
      }

      if (iTx.to_address) {
        return shortenAddress(iTx.to_address);
      }

      if (iTx.counterparty_user_id) {
          return `User ${String(iTx.counterparty_user_id).slice(0, 8)}`;
      }

      // Fallback to description if available
      if (iTx.description) {
        return iTx.description;
      }

      return 'Internal wallet';
    }

    function shortenAddress(addr: string) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
  };

  const getHash = () => {
    if (isBlockchain) {
      return (tx as BlockchainTx).hash;
    } else {
      return (tx as InternalTransaction).id;
    }
  };

  const getTimestamp = () => {
    if (isBlockchain) {
      const timestamp = Number((tx as any)?.timestamp ?? 0);
      if (!timestamp) return 'Pending';
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } else {
      const iTx = tx as InternalTransaction;
      return formatDate(iTx.created_at);
    }

    function formatDate(timestamp: string) {
      const date = new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Direction Icon */}
        <div className={`p-2 rounded-full ${
          !isBlockchain && (tx as InternalTransaction).type === 'subscription'
            ? 'bg-gold-100 dark:bg-gold-900/20'
            : 'bg-brand-100 dark:bg-brand-900/20'
        }`}>
          {!isBlockchain && (tx as InternalTransaction).type === 'subscription' ? (
            <Crown className="w-5 h-5 text-gold-600 dark:text-gold-400" />
          ) : isSent ? (
            <ArrowUpRight className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          ) : (
            <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
        </div>

        {/* Transaction Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-gray-950 dark:text-white">
              {!isBlockchain && (tx as InternalTransaction).type === 'subscription'
                ? getRecipient()
                : isSent ? `Sent to ${getRecipient()}` : `Received from ${getRecipient()}`}
            </p>
            {getStatusIcon()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getTimestamp()}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className="font-bold text-gray-950 dark:text-white">
            {isSent ? '-' : '+'}
            {getAmount()}
          </p>
          <a
            href={`${type === 'onchain' ? 'https://explorer.sidrachain.com/tx/' : '#'
              }${getHash()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center justify-end gap-1"
          >
            {type === 'onchain' && <ExternalLink className="w-3 h-3" />}
            {shortenHash(getHash())}
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function shortenHash(hash: string): string {
  const value = String(hash || '');
  if (!value) return 'N/A';
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function shortenAddress(addr: string): string {
  const value = String(addr || '');
  if (!value) return 'N/A';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatDate(timestamp: string | number): string {
  const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
