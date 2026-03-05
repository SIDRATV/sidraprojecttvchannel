'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Users,
  Lightbulb,
  Award,
  Zap,
  TrendingUp,
  DollarSign,
  Vote,
  Lock,
  Download,
  BarChart3,
} from 'lucide-react';
import {
  PremiumHero,
  PremiumFeatureCard,
  PremiumContentPreview,
  TokenUtilityCard,
  PricingCard,
  PremiumModal,
  PremiumFAQ,
} from '@/components/premium';

export default function PremiumPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPremiumUser] = useState(false); // Change to true to test premium state

  const premiumFeatures = [
    {
      icon: Film,
      title: 'Exclusive Documentaries',
      description: 'Access award-winning documentaries not available to free users.',
    },
    {
      icon: Users,
      title: 'Founder Interviews',
      description: 'Deep conversations with industry leaders and successful founders.',
    },
    {
      icon: Lightbulb,
      title: 'Early Access',
      description: 'Get 48 hours early access to all new content before release.',
    },
    {
      icon: Award,
      title: 'Innovation Masterclasses',
      description: 'Learn from experts in AI, blockchain, and emerging technologies.',
    },
    {
      icon: Zap,
      title: 'Live Events',
      description: 'Exclusive live sessions, Q&A, and networking opportunities.',
    },
    {
      icon: TrendingUp,
      title: 'Investor Insights',
      description: 'Access our detailed startup analysis and investment opportunities.',
    },
    {
      icon: Vote,
      title: 'Community Voting',
      description: 'Vote on future content and influence platform development.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track your learning progress and content consumption patterns.',
    },
  ];

  const tokenUtilities = [
    {
      icon: DollarSign,
      title: 'Premium Membership',
      description: 'Pay for your premium subscription directly with SPTC tokens.',
    },
    {
      icon: Film,
      title: 'Exclusive Content',
      description: 'Unlock premium-only documentaries and masterclasses.',
    },
    {
      icon: Vote,
      title: 'Community Voting',
      description: 'Use SPTC to vote on platform features and content direction.',
    },
    {
      icon: BarChart3,
      title: 'Investor Insights',
      description: 'Access detailed startup analysis and investment opportunities.',
    },
    {
      icon: Zap,
      title: 'Priority Support',
      description: 'Premium token holders get priority customer support.',
    },
    {
      icon: TrendingUp,
      title: 'Ecosystem Rewards',
      description: 'Earn additional tokens by engaging with platform content.',
    },
  ];

  const premiumContent = [
    {
      id: '1',
      title: 'The Future of AI: How Startups are Changing the World',
      image: 'https://images.unsplash.com/photo-1677442d019cecf8181d02c91c5c90e1a9f1eb0e?w=500&h=300&fit=crop',
      category: 'Documentary',
    },
    {
      id: '2',
      title: 'Founder Stories: From Idea to $1B Valuation',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
      category: 'Interview',
    },
    {
      id: '3',
      title: 'Blockchain Revolution: Building Web3 Applications',
      image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd8f2c91?w=500&h=300&fit=crop',
      category: 'Masterclass',
    },
    {
      id: '4',
      title: 'Inside OpenAI: Secrets to Building Revolutionary Products',
      image: 'https://images.unsplash.com/photo-1620712014215-c8ee9ae4aaae?w=500&h=300&fit=crop',
      category: 'Documentary',
    },
    {
      id: '5',
      title: 'VC Insights: How to Raise Your First Million',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&h=300&fit=crop',
      category: 'Masterclass',
    },
  ];

  const pricingPlans = [
    {
      name: 'Pro',
      price: 9.99,
      currency: '$',
      billingPeriod: 'month',
      description: 'Great for getting started',
      features: ['Up to 1080p streaming', 'Download 5 videos', 'Early access (24h)', '100 SPTC / month'],
      buttonText: 'Choose Pro',
      isPopular: false,
      onSelect: () => setIsModalOpen(true),
    },
    {
      name: 'Premium',
      price: 19.99,
      currency: '$',
      billingPeriod: 'month',
      description: 'Most popular choice',
      features: [
        '4K Ultra HD streaming',
        'Download unlimited videos',
        'Early access (48h)',
        '200 SPTC / month',
        'Ad-free experience',
        'VIP Creator access',
      ],
      buttonText: 'Choose Premium',
      isPopular: true,
      onSelect: () => setIsModalOpen(true),
    },
    {
      name: 'VIP',
      price: 29.99,
      currency: '$',
      billingPeriod: 'month',
      description: 'Ultimate experience',
      features: [
        'All Premium features',
        '4K + Lossless audio',
        'VIP events access',
        '300 SPTC / month',
        'Private creator sessions',
        'Investor insights dashboard',
        'Premium support 24/7',
      ],
      buttonText: 'Choose VIP',
      isPopular: false,
      onSelect: () => setIsModalOpen(true),
    },
  ];

  const faqs = [
    {
      question: 'What is SPTC Premium?',
      answer:
        'SPTC Premium is our exclusive membership that gives you access to high-quality, exclusive content including documentaries, founder interviews, and masterclasses. You can pay for your subscription using SPTC tokens or traditional payment methods.',
    },
    {
      question: 'How do I pay with SPTC tokens?',
      answer:
        'When you select your premium plan, you can choose to pay with SPTC tokens instead of fiat currency. Your wallet will be connected securely, and the transaction will be processed instantly on the blockchain.',
    },
    {
      question: 'What happens if my subscription expires?',
      answer:
        'When your subscription is about to expire, we will send you a notification. You can easily renew your subscription with one click. If it expires, your account reverts to free tier but you keep all your favorites and watch history.',
    },
    {
      question: 'Can I cancel anytime?',
      answer:
        'Yes! You can cancel your subscription anytime from your account settings. Your access continues until the end of your billing period. No hidden fees or long-term contracts.',
    },
    {
      question: 'What is the 7-day free trial?',
      answer:
        'New users get a 7-day free trial of any premium plan. You can try all premium features without any payment. You will be reminded before the trial ends so you can cancel if you want.',
    },
    {
      question: 'Are there refunds?',
      answer:
        'We offer a 30-day money-back guarantee if you are not satisfied with your premium membership. Contact our support team for hassle-free refunds.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Hero Section */}
      <PremiumHero
        onUnlockClick={() => setIsModalOpen(true)}
        onLearnMore={() => {
          document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Benefits Section */}
      <section id="benefits" className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold">
              Premium Benefits
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                You Deserve
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Unlock exclusive content and features designed for serious innovators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {premiumFeatures.map((feature, idx) => (
              <PremiumFeatureCard
                key={idx}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={idx * 0.1}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Premium Content Preview */}
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold">Exclusive Content</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Scroll to discover premium documentaries and masterclasses
              </p>
            </div>

            <PremiumContentPreview content={premiumContent} />
          </motion.div>
        </div>
      </section>

      {/* Token Utility Section */}
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold">
              SPTC Token
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-yellow-600 bg-clip-text text-transparent">
                Utility
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Discover multiple ways to use your SPTC tokens on the platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokenUtilities.map((utility, idx) => (
              <TokenUtilityCard
                key={idx}
                icon={utility.icon}
                title={utility.title}
                description={utility.description}
                delay={idx * 0.1}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold">Simple, Transparent Pricing</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Choose the plan that fits your needs. 7-day free trial included.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, idx) => (
                <PricingCard
                  key={idx}
                  {...plan}
                  delay={idx * 0.1}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about premium membership
            </p>
          </div>

          <PremiumFAQ faqs={faqs} />
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/20 via-blue-900/10 to-blue-900/20 border-t border-blue-500/20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-5xl md:text-6xl font-bold">
              Join the Sidra
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Innovation Community
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start your 7-day free trial today. No credit card required.
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
          >
            🚀 Activate Premium
          </motion.button>
        </div>
      </section>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPaymentMethod={(method) => {
          console.log('Payment method selected:', method);
          // TODO: Implement payment processing
          alert(`Payment with ${method === 'sptc' ? 'SPTC' : 'Card'} coming soon!`);
          setIsModalOpen(false);
        }}
        isPremiumUser={isPremiumUser}
      />
    </div>
  );
}
