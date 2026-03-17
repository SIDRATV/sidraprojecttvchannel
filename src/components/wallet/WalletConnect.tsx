'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

interface WalletConnectProps {
  onAccountChange?: (account: string | null) => void;
  onChainChange?: (chainId: number | null) => void;
}

export function WalletConnect({ onAccountChange, onChainChange }: WalletConnectProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 rounded-xl p-6 md:p-8"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-900/30 rounded-xl mb-3">
            <Wallet className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-950 dark:text-white">
            External Wallets Disabled
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Only internal wallet transfers are supported
          </p>
        </div>
      </div>
    </motion.div>
  );
}
