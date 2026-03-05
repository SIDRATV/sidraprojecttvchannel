'use client';

import { useState, useEffect } from 'react';
import { UserPremiumStatus } from '@/types/premium';
import { premiumService } from '@/services/premium';

export function usePremium() {
  const [status, setStatus] = useState<UserPremiumStatus>({
    isActive: false,
    plan: null,
    activatedAt: null,
    sptcBalance: 0,
    totalEarned: 0,
    referrals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setStatus(premiumService.getPremiumStatus());
    setIsLoading(false);
  }, []);

  const activatePremium = (
    plan: 'pro' | 'premium' | 'vip',
    paymentMethod: 'free' | 'sptc' | 'card'
  ) => {
    const newStatus = premiumService.activatePremium(plan, paymentMethod);
    setStatus(newStatus);
    return newStatus;
  };

  const upgradePlan = (newPlan: 'pro' | 'premium' | 'vip') => {
    const newStatus = premiumService.upgradePlan(newPlan);
    setStatus(newStatus);
    return newStatus;
  };

  const deactivatePremium = () => {
    const newStatus = premiumService.deactivatePremium();
    setStatus(newStatus);
    return newStatus;
  };

  const addSPTC = (amount: number, source: string) => {
    premiumService.addSPTC(amount, source);
    setStatus(premiumService.getPremiumStatus());
  };

  const spendSPTC = (amount: number, destination: string) => {
    premiumService.spendSPTC(amount, destination);
    setStatus(premiumService.getPremiumStatus());
  };

  const hasFeature = (featureId: string) => {
    return premiumService.hasFeature(featureId);
  };

  return {
    status,
    isLoading,
    activatePremium,
    upgradePlan,
    deactivatePremium,
    addSPTC,
    spendSPTC,
    hasFeature,
  };
}
