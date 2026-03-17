'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { SIDRA_CHAIN_CONFIG } from '@/lib/web3-provider';

interface NetworkStatusProps {
  isConnected: boolean;
  isCorrectChain: boolean;
  chainId?: number;
}

export function NetworkStatus({ isConnected, isCorrectChain, chainId }: NetworkStatusProps) {
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);

  useEffect(() => {
    const checkLatency = async () => {
      const start = Date.now();
      try {
        const response = await fetch(SIDRA_CHAIN_CONFIG.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'net_version',
            params: [],
            id: 1,
          }),
        });
        if (response.ok) {
          setNetworkLatency(Date.now() - start);
        }
      } catch (error) {
        console.error('Failed to check network latency:', error);
      }
    };

    const interval = setInterval(checkLatency, 5000);
    checkLatency();
    return () => clearInterval(interval);
  }, []);

  const pulseVariants = {
    initial: { scale: 0.8, opacity: 1 },
    animate: {
      scale: [0.8, 1.2, 0.8],
      opacity: [1, 0.5, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (!isConnected) {
    return null;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-8 p-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/30 rounded-2xl shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Network Status Indicator */}
          <div className="relative">
            <motion.div
              variants={pulseVariants}
              initial="initial"
              animate="animate"
              className="absolute inset-0 rounded-full bg-emerald-500/50"
            />
            <div
              className={`relative flex items-center justify-center w-4 h-4 rounded-full ${
                isCorrectChain
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                  : 'bg-orange-500 shadow-lg shadow-orange-500/50'
              }`}
            />
          </div>

          {/* Status Text */}
          <div className="flex items-center gap-3">
            {isCorrectChain ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {SIDRA_CHAIN_CONFIG.chainName} Connected
                  </p>
                  <p className="text-xs text-slate-400 ml-6">Chain ID: {SIDRA_CHAIN_CONFIG.chainId}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Wrong Network</p>
                  <p className="text-xs text-slate-400">
                    Connected to Chain ID: {chainId}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Network Latency */}
        {networkLatency !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/30"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium text-slate-300">
              {networkLatency}ms
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
