// Types for premium system
export interface PremiumPlan {
  id: 'pro' | 'premium' | 'vip';
  name: string;
  price: number;
  sptc: number;
  features: string[];
  icon: string;
  color: string;
}

export interface UserPremiumStatus {
  isActive: boolean;
  plan: 'pro' | 'premium' | 'vip' | null;
  activatedAt: string | null;
  sptcBalance: number;
  totalEarned: number;
  referrals: number;
}

export interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  availableIn: ('pro' | 'premium' | 'vip')[];
}

export const PREMIUM_PLANS: Record<'pro' | 'premium' | 'vip', PremiumPlan> = {
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    sptc: 100,
    icon: 'Zap',
    color: 'from-blue-600 to-blue-500',
    features: [
      'Up to 1080p streaming',
      'Download 5 videos per month',
      'Early access (24h)',
      '100 SPTC per month',
      'Ad-supported experience',
      'Basic analytics',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    sptc: 200,
    icon: 'Crown',
    color: 'from-yellow-600 to-orange-600',
    features: [
      '4K Ultra HD streaming',
      'Download unlimited videos',
      'Early access (48h)',
      '200 SPTC per month',
      'Ad-free experience',
      'VIP Creator access',
      'Advanced analytics',
      'Paid surveys access',
      'Basic referral program',
    ],
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    price: 29.99,
    sptc: 300,
    icon: 'Star',
    color: 'from-purple-600 to-pink-600',
    features: [
      'All Premium features',
      '4K + Lossless audio',
      'VIP events access',
      '300 SPTC per month',
      'Private creator sessions',
      'Investor insights dashboard',
      'Premium support 24/7',
      'Advanced paid surveys',
      'Premium referral program (+50% bonus)',
      'Exclusive content access',
    ],
  },
};

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'ultra-hd',
    title: '4K Ultra HD Streaming',
    description: 'Watch content in stunning 4K resolution',
    icon: 'Monitor',
    availableIn: ['premium', 'vip'],
  },
  {
    id: 'offline-download',
    title: 'Download & Watch Offline',
    description: 'Download videos to watch anywhere, anytime',
    icon: 'Download',
    availableIn: ['pro', 'premium', 'vip'],
  },
  {
    id: 'early-access',
    title: 'Early Access Content',
    description: 'Access new content before others',
    icon: 'Zap',
    availableIn: ['pro', 'premium', 'vip'],
  },
  {
    id: 'no-ads',
    title: 'Ad-Free Experience',
    description: 'Enjoy uninterrupted content streaming',
    icon: 'Slash',
    availableIn: ['premium', 'vip'],
  },
  {
    id: 'surveys',
    title: 'Paid Surveys',
    description: 'Earn SPTC by participating in surveys',
    icon: 'ClipboardCheck',
    availableIn: ['premium', 'vip'],
  },
  {
    id: 'referral',
    title: 'Referral Program',
    description: 'Earn SPTC by referring friends',
    icon: 'Share2',
    availableIn: ['premium', 'vip'],
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Track your viewing habits and insights',
    icon: 'BarChart3',
    availableIn: ['pro', 'premium', 'vip'],
  },
  {
    id: 'vip-content',
    title: 'Exclusive VIP Content',
    description: 'Access exclusive creator sessions and masterclasses',
    icon: 'Crown',
    availableIn: ['vip'],
  },
];
