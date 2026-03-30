'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertCircle, CheckCircle, Loader, User, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { sendInternalTransfer, verifyRecipient, estimateTransferFee, type VerifyRecipientResult } from '@/lib/internalTransfer';
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
  const [recipientInfo, setRecipientInfo] = useState<VerifyRecipientResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const validateTimer = useRef<NodeJS.Timeout | null>(null);

  // Estimate fee when amount changes
  useEffect(() => {
    if (formData.amount) {
      const amount = parseFloat(formData.amount);
      if (amount > 0) {
        estimateTransferFee(amount).then(setEstimatedFee).catch(() => {});
      }
    } else {
      setEstimatedFee(null);
    }
  }, [formData.amount]);

  // Validate recipient with debounce when input changes
  useEffect(() => {
    if (validateTimer.current) clearTimeout(validateTimer.current);
    setRecipientInfo(null);

    const value = formData.recipient.trim();
    if (value.length < 2) return;

    validateTimer.current = setTimeout(async () => {
      setIsValidating(true);
      setError(null);
      const result = await verifyRecipient(value, authToken);
      setRecipientInfo(result);
      if (!result.exists && result.error) {
        setError(result.error);
      }
      setIsValidating(false);
    }, 600);

    return () => {
      if (validateTimer.current) clearTimeout(validateTimer.current);
    };
  }, [formData.recipient, authToken]);

  const validateForm = (): boolean => {
    setError(null);

    if (!formData.recipient.trim()) {
      setError("Nom d'utilisateur ou email requis");
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Le montant doit être supérieur à 0');
      return false;
    }

    if (!recipientInfo?.exists) {
      setError('Destinataire introuvable');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmTransfer = async () => {
    setShowConfirmation(false);
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!authToken) throw new Error('Authentification requise');

      const response = await sendInternalTransfer(
        {
          recipientUsername: formData.recipient,
          amount: parseFloat(formData.amount),
          description: '',
        },
        authToken
      );

      setSuccess(
        `Transfert envoyé à ${recipientInfo?.displayName || formData.recipient} ! ID: ${response.transactionId.slice(0, 10)}...`
      );

      setFormData({ recipient: '', amount: '' });
      setRecipientInfo(null);
      setEstimatedFee(null);
      onSuccess?.(response.transactionId);

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      const errorMessage = err.message || 'Échec du transfert';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount =
    estimatedFee && formData.amount
      ? (parseFloat(formData.amount) + estimatedFee).toFixed(4)
      : formData.amount;

  const isFormDisabled = !authToken;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
    >
      <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-6">
        Transfert Interne
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Destinataire
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) =>
                setFormData({ ...formData, recipient: e.target.value })
              }
              placeholder="Nom d'utilisateur ou email"
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition disabled:opacity-50"
            />
            {isValidating && (
              <Loader className="absolute right-3 top-3 w-5 h-5 text-brand-500 animate-spin" />
            )}
            {!isValidating && recipientInfo?.exists && (
              <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-green-500" />
            )}
          </div>

          {/* Recipient matched info */}
          <AnimatePresence>
            {recipientInfo?.exists && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2"
              >
                {recipientInfo.matchedBy === 'email' ? (
                  <Mail className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                )}
                <div className="text-sm">
                  <span className="font-medium text-green-800 dark:text-green-300">
                    {recipientInfo.displayName}
                  </span>
                  {recipientInfo.username && (
                    <span className="text-green-600 dark:text-green-400 ml-1">
                      @{recipientInfo.username}
                    </span>
                  )}
                  {recipientInfo.matchedBy === 'email' && recipientInfo.maskedEmail && (
                    <span className="text-green-600 dark:text-green-400 ml-1">
                      ({recipientInfo.maskedEmail})
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <span>Montant</span>
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

        {/* Fee Info */}
        {estimatedFee !== null && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Montant:</span>
              <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                {formData.amount} <SDALogo size="sm" />
              </span>
            </div>
            {estimatedFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Frais:</span>
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
                {totalAmount} <SDALogo size="sm" />
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
          disabled={isLoading || isFormDisabled || isValidating || !recipientInfo?.exists}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Envoyer le transfert
            </>
          )}
        </Button>
      </form>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-full">
                  <ShieldCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Confirmer le transfert
                </h4>
              </div>

              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Destinataire:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {recipientInfo?.displayName}
                    {recipientInfo?.username && (
                      <span className="text-gray-500 ml-1">@{recipientInfo.username}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Montant:</span>
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    {formData.amount} <SDALogo size="sm" />
                  </span>
                </div>
                {estimatedFee !== null && estimatedFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frais:</span>
                    <span className="text-gray-900 dark:text-white flex items-center gap-1">
                      {estimatedFee.toFixed(4)} <SDALogo size="sm" />
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Cette action est irréversible. Vérifiez les informations avant de confirmer.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowConfirmation(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirmTransfer}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Confirmer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
