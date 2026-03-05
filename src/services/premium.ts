// Premium service to manage subscriptions
import { UserPremiumStatus, PREMIUM_PLANS } from '@/types/premium';

const STORAGE_KEY = 'premium_user_status';
const SPTC_EARNING_KEY = 'sptc_transactions';

export const premiumService = {
  // Get current premium status
  getPremiumStatus(): UserPremiumStatus {
    if (typeof window === 'undefined') {
      return {
        isActive: false,
        plan: null,
        activatedAt: null,
        sptcBalance: 0,
        totalEarned: 0,
        referrals: 0,
      };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      isActive: false,
      plan: null,
      activatedAt: null,
      sptcBalance: 0,
      totalEarned: 0,
      referrals: 0,
    };
  },

  // Activate premium plan
  activatePremium(
    plan: 'pro' | 'premium' | 'vip',
    paymentMethod: 'free' | 'sptc' | 'card'
  ): UserPremiumStatus {
    const planConfig = PREMIUM_PLANS[plan];
    const status: UserPremiumStatus = {
      isActive: true,
      plan,
      activatedAt: new Date().toISOString(),
      sptcBalance:
        paymentMethod === 'free'
          ? 0
          : premiumService.getPremiumStatus().sptcBalance - planConfig.sptc,
      totalEarned: premiumService.getPremiumStatus().totalEarned,
      referrals: premiumService.getPremiumStatus().referrals,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
      localStorage.setItem(
        'premiumActivatedAt',
        new Date().toISOString()
      );
    }

    return status;
  },

  // Upgrade to a higher plan
  upgradePlan(newPlan: 'pro' | 'premium' | 'vip'): UserPremiumStatus {
    const currentStatus = premiumService.getPremiumStatus();
    if (!currentStatus.isActive) {
      throw new Error('User does not have active premium');
    }

    const status: UserPremiumStatus = {
      ...currentStatus,
      plan: newPlan,
      activatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
    }

    return status;
  },

  // Deactivate premium
  deactivatePremium(): UserPremiumStatus {
    const status: UserPremiumStatus = {
      isActive: false,
      plan: null,
      activatedAt: null,
      sptcBalance: premiumService.getPremiumStatus().sptcBalance,
      totalEarned: premiumService.getPremiumStatus().totalEarned,
      referrals: premiumService.getPremiumStatus().referrals,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
      localStorage.removeItem('premiumActivatedAt');
    }

    return status;
  },

  // Add SPTC tokens (from surveys, referrals, etc)
  addSPTC(amount: number, source: string): number {
    const currentStatus = premiumService.getPremiumStatus();
    const newBalance = currentStatus.sptcBalance + amount;
    const newTotal = currentStatus.totalEarned + amount;

    const status: UserPremiumStatus = {
      ...currentStatus,
      sptcBalance: newBalance,
      totalEarned: newTotal,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));

      // Track transaction
      const transactions = JSON.parse(
        localStorage.getItem(SPTC_EARNING_KEY) || '[]'
      );
      transactions.push({
        date: new Date().toISOString(),
        amount,
        source,
        type: 'earned',
      });
      localStorage.setItem(SPTC_EARNING_KEY, JSON.stringify(transactions));
    }

    return newBalance;
  },

  // Spend SPTC tokens
  spendSPTC(amount: number, destination: string): number {
    const currentStatus = premiumService.getPremiumStatus();
    if (currentStatus.sptcBalance < amount) {
      throw new Error('Insufficient SPTC balance');
    }

    const newBalance = currentStatus.sptcBalance - amount;

    const status: UserPremiumStatus = {
      ...currentStatus,
      sptcBalance: newBalance,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));

      // Track transaction
      const transactions = JSON.parse(
        localStorage.getItem(SPTC_EARNING_KEY) || '[]'
      );
      transactions.push({
        date: new Date().toISOString(),
        amount,
        destination,
        type: 'spent',
      });
      localStorage.setItem(SPTC_EARNING_KEY, JSON.stringify(transactions));
    }

    return newBalance;
  },

  // Add referral
  addReferral(): number {
    const currentStatus = premiumService.getPremiumStatus();
    const newCount = currentStatus.referrals + 1;

    const status: UserPremiumStatus = {
      ...currentStatus,
      referrals: newCount,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
    }

    return newCount;
  },

  // Get SPTC transactions history
  getTransactions() {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(SPTC_EARNING_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Check if feature is available for current plan
  hasFeature(featureId: string): boolean {
    const status = premiumService.getPremiumStatus();
    if (!status.isActive || !status.plan) return false;

    // Check if feature is available in current plan
    const { PREMIUM_FEATURES } = require('@/types/premium');
    const feature = PREMIUM_FEATURES.find(
      (f: any) => f.id === featureId
    );
    return feature ? feature.availableIn.includes(status.plan) : false;
  },

  // Reset (for testing only)
  reset(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SPTC_EARNING_KEY);
      localStorage.removeItem('premiumActivatedAt');
    }
  },
};
