import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';
import type { AuthContextValue } from '@/providers/AuthProvider';

/**
 * Thin context consumer — all auth logic lives in AuthProvider.
 * Safe to call from any component wrapped by AuthProvider.
 */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
};


