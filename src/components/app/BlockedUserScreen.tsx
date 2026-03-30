'use client';

import { motion } from 'framer-motion';
import { ShieldX, Mail } from 'lucide-react';

interface BlockedUserScreenProps {
  reason?: string | null;
}

export function BlockedUserScreen({ reason }: BlockedUserScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center"
        >
          <ShieldX size={48} className="text-red-500" />
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">Compte Bloqué</h1>
          <p className="text-gray-400 text-lg">
            Votre compte a été bloqué par un administrateur.
          </p>
          {reason && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-300">
                <span className="font-semibold">Raison :</span> {reason}
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 space-y-3">
          <p className="text-gray-500 text-sm">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
          </p>
          <a
            href="mailto:support@sidratv.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold transition-colors"
          >
            <Mail size={18} />
            Contacter le support
          </a>
        </div>
      </motion.div>
    </div>
  );
}
