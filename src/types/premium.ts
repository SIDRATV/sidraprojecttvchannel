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
    color: 'from-brand-500 to-brand-400',
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
    color: 'from-gold-500 to-gold-400',
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

// Premium Video types (R2-stored content)
export interface PremiumVideo {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  thumbnail_key: string | null;
  thumbnail_url?: string | null;
  video_key_480p: string | null;
  video_key_720p: string | null;
  video_key_1080p: string | null;
  quality_options: string[];
  duration: number | null;
  file_size: number | null;
  is_premium: boolean;
  min_plan: 'pro' | 'premium' | 'vip';
  views: number;
  likes: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PremiumVideoWithRelations extends PremiumVideo {
  categories?: {
    name: string;
    icon: string;
    color: string;
  } | null;
}
