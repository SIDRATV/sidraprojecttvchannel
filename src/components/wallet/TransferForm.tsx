'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { sendInternalTransfer, verifyUsername, estimateTransferFee } from '@/lib/internalTransfer';
import { SDALogo } from './SDALogo';
interface TransferFormProps {
  walletAddress: string | null;
  transferType: 'internal';
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
  authToken?: string;
}

// Helper to check if component should render
function shouldRender(transferType: 'onchain' | 'internal', walletAddress: string | null, authToken?: string) {
  if (transferType === 'onchain') {
    return !!walletAddress; // Needs wallet connection
  }
  return !!authToken; // Only needs auth token
}

export function TransferForm({
  walletAddress,
  transferType,
  onSuccess,
  onError,
  authToken,
}: TransferFormProps) {

  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Estimate fee when amount changes
  useEffect(() => {
    if (formData.amount) {
      estimateFeeDebounced();
    }
  }, [formData.amount]);

  const estimateFeeDebounced = async () => {
    try {
      const amount = parseFloat(formData.amount);
      if (amount > 0) {
        const fee = await estimateTransferFee(amount);
        setEstimatedFee(fee);
      }
    } catch (err) {
      console.error('Error estimating fee:', err);
    }
  };

  const validateRecipient = async () => {
    setIsValidating(true);
    try {
      const exists = await verifyUsername(formData.recipient);
      if (!exists) {
        setError('Username not found');
        setIsValidating(false);
        return false;
      }
    } catch (err) {
      setError('Error validating username');
      setIsValidating(false);
      return false;
    }
    setIsValidating(false);
    return true;
  };

  const validateForm = async (): Promise<boolean> => {
    setError(null);

    // Check recipient
    if (!formData.recipient.trim()) {
      setError('Username is required');
      return false;
    }

    // Check amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    // Validate recipient format
    return await validateRecipient();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let txHash: string;

      // Internal transfer
      if (!authToken) {
        throw new Error('Authentication required');
      }
      const response = await sendInternalTransfer(
        {
          recipientUsername: formData.recipient,
          amount: parseFloat(formData.amount),
          description: '',
        },
        authToken
      );
      txHash = response.transactionId;
      setSuccess(
        `Transfer sent! Transaction ID: ${txHash.slice(0, 10)}...`
      );

      // Reset form
      setFormData({ recipient: '', amount: '' });
      onSuccess?.(txHash);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      const errorMessage = err.message || 'Transfer failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const placeholderText = 'username';

  const totalAmount =
    estimatedFee && formData.amount
      ? (parseFloat(formData.amount) + estimatedFee).toFixed(4)
      : formData.amount;

  // Check if form should be disabled
  const isFormDisabled = !authToken;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
    >
      <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-6">
        Internal Transfer
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipient Username
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) =>
                setFormData({ ...formData, recipient: e.target.value })
              }
              placeholder={placeholderText}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition disabled:opacity-50"
            />
            {isValidating && (
              <Loader className="absolute right-3 top-3 w-5 h-5 text-brand-500 animate-spin" />
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <span>Amount</span>
            <SDALogo size="sm" />
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="0.0"
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition disabled:opacity-50"
          />
        </div>

        {/* Fee Info (Internal Transfer) */}
        {estimatedFee !== null && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                {formData.amount} <SDALogo size="sm" />
              </span>
            </div>
            {estimatedFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Fee:</span>
                <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  {estimatedFee.toFixed(4)} <SDALogo size="sm" />
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-gray-300 dark:border-gray-700 pt-1 mt-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Total:
              </span>
              <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                {totalAmount} 
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2 items-start"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-2 items-start"
          >
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </motion.div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || isFormDisabled || isValidating}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Transfer
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
