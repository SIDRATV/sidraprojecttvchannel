'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  PremiumFAQ,
} from '@/components/premium';

import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';

export default function PremiumPage() {
  const router = useRouter();
  const { session, user } = useAuth();
  const { status } = usePremium();
  const isPremiumUser = status.isActive || !!(user?.premium_plan &&
    (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date()));

  // Redirect premium users to their dashboard
  useEffect(() => {
    if (isPremiumUser) {
      router.replace('/premium-dashboard');
    }
  }, [isPremiumUser, router]);

  // Fetch real plan prices from backend
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/premium/subscribe', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.plans) setDbPlans(d.plans); })
      .catch(() => {});
  }, [session?.access_token]);

  const premiumFeatures = [
    {
      icon: Film,
      title: 'Documentaires Exclusifs',
      description: 'Accédez à des documentaires primés non disponibles pour les utilisateurs gratuits.',
    },
    {
      icon: Users,
      title: 'Interviews de Fondateurs',
      description: 'Conversations approfondies avec des leaders du secteur et des fondateurs à succès.',
    },
    {
      icon: Lightbulb,
      title: 'Accès Anticipé',
      description: 'Accédez à tous les nouveaux contenus 48h avant leur sortie officielle.',
    },
    {
      icon: Award,
      title: "Masterclasses d'Innovation",
      description: "Apprenez des experts en IA, blockchain et technologies émergentes.",
    },
    {
      icon: Zap,
      title: 'Événements Live',
      description: 'Sessions live exclusives, Q&A et opportunités de networking.',
    },
    {
      icon: TrendingUp,
      title: 'Analyses Investisseurs',
      description: "Accédez à nos analyses détaillées de startups et opportunités d'investissement.",
    },
    {
      icon: Vote,
      title: 'Vote Communautaire',
      description: 'Votez pour les futurs contenus et influencez le développement de la plateforme.',
    },
    {
      icon: BarChart3,
      title: 'Analytique Avancée',
      description: 'Suivez votre progression et vos habitudes de consommation de contenu.',
    },
  ];

  const tokenUtilities = [
    {
      icon: DollarSign,
      title: 'Abonnement Premium',
      description: 'Payez votre abonnement premium directement avec vos tokens SPTC.',
    },
    {
      icon: Film,
      title: 'Contenu Exclusif',
      description: 'Débloquez les documentaires et masterclasses réservés aux abonnés.',
    },
    {
      icon: Vote,
      title: 'Vote Communautaire',
      description: "Utilisez vos SPTC pour voter sur les fonctionnalités et l'orientation des contenus.",
    },
    {
      icon: BarChart3,
      title: 'Analyses Investisseurs',
      description: "Accédez à des analyses détaillées de startups et opportunités d'investissement.",
    },
    {
      icon: Zap,
      title: 'Support Prioritaire',
      description: 'Les détenteurs de tokens premium bénéficient du support client prioritaire.',
    },
    {
      icon: TrendingUp,
      title: "Récompenses de l'Écosystème",
      description: 'Gagnez des tokens supplémentaires en interagissant avec les contenus de la plateforme.',
    },
  ];

  const premiumContent = [
    {
      id: '1',
      title: "Le Futur de l'IA : Comment les Startups Changent le Monde",
      image: 'https://images.unsplash.com/photo-1618761490192-04901461159e?w=500&h=300&fit=crop',
      category: 'Documentaire',
    },
    {
      id: '2',
      title: "Histoires de Fondateurs : De l'Idée à 1 Milliard de Valorisation",
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
      category: 'Interview',
    },
    {
      id: '3',
      title: 'Révolution Blockchain : Construire des Applications Web3',
      image: 'https://images.unsplash.com/photo-1533879413603-d7886542fea0?w=500&h=300&fit=crop',
      category: 'Masterclasse',
    },
    {
      id: '4',
      title: "Dans les Coulisses d'OpenAI : Les Secrets des Produits Révolutionnaires",
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=300&fit=crop',
      category: 'Documentaire',
    },
    {
      id: '5',
      title: 'Capital Risque : Comment Lever Votre Premier Million',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop',
      category: 'Masterclasse',
    },
  ];

  const pricingPlans = dbPlans.length > 0
    ? dbPlans.map(p => ({
        name: p.name,
        price: Number(p.price_monthly),
        currency: p.currency || 'SIDRA',
        billingPeriod: 'month',
        description: p.id === 'pro' ? 'Idéal pour commencer' : p.id === 'premium' ? 'Le plus populaire' : 'Expérience ultime',
        features: (p.features || []).slice(0, 7),
        buttonText: `Choisir ${p.name}`,
        isPopular: p.id === 'premium',
        onSelect: () => router.push('/subscribe'),
      }))
    : [
    {
      name: 'Pro',
      price: 9.99,
      currency: 'SIDRA',
      billingPeriod: 'month',
      description: 'Idéal pour commencer',
      features: ['Streaming jusqu\'à 1080p', 'Télécharger 5 vidéos', 'Accès anticipé (24h)', '100 SPTC / mois'],
      buttonText: 'Choisir Pro',
      isPopular: false,
      onSelect: () => router.push('/subscribe'),
    },
    {
      name: 'Premium',
      price: 19.99,
      currency: 'SIDRA',
      billingPeriod: 'month',
      description: 'Le plus populaire',
      features: [
        'Streaming 4K Ultra HD',
        'Téléchargements illimités',
        'Accès anticipé (48h)',
        '200 SPTC / mois',
        'Sans publicité',
        'Accès Créateurs VIP',
      ],
      buttonText: 'Choisir Premium',
      isPopular: true,
      onSelect: () => router.push('/subscribe'),
    },
    {
      name: 'VIP',
      price: 29.99,
      currency: 'SIDRA',
      billingPeriod: 'month',
      description: 'Expérience ultime',
      features: [
        'Toutes les fonctionnalités Premium',
        '4K + Audio sans perte',
        'Événements VIP',
        '300 SPTC / mois',
        'Sessions privées avec les créateurs',
        'Tableau de bord analyses investisseurs',
        'Support premium 24h/7j',
      ],
      buttonText: 'Choisir VIP',
      isPopular: false,
      onSelect: () => router.push('/subscribe'),
    },
  ];

  const faqs = [
    {
      question: 'Qu\'est-ce que Sidra Premium ?',
      answer:
        'Sidra Premium est notre abonnement exclusif qui vous donne accès à du contenu de haute qualité : documentaires, interviews de fondateurs et masterclasses. Vous payez avec votre solde wallet SIDRA.',
    },
    {
      question: 'Comment payer mon abonnement ?',
      answer:
        'Vous payez directement avec le solde SIDRA de votre wallet intégré. Bientôt, le paiement avec les tokens SPTC et les cartes Visa sera aussi disponible.',
    },
    {
      question: 'Que se passe-t-il quand mon abonnement expire ?',
      answer:
        'Quand votre abonnement arrive à échéance, votre compte revient au niveau gratuit mais vous conservez vos favoris et historique. Vous pouvez renouveler à tout moment.',
    },
    {
      question: 'Puis-je annuler à tout moment ?',
      answer:
        'Votre abonnement reste actif jusqu\'à la fin de la période payée. Pas de frais cachés ni de contrat long terme.',
    },
    {
      question: 'Comment utiliser un code de réduction ?',
      answer:
        'Lors du processus d\'abonnement, entrez votre code promo dans le champ dédié. La réduction sera appliquée automatiquement au prix affiché.',
    },
    {
      question: 'Y a-t-il des remboursements ?',
      answer:
        'Contactez notre support pour toute demande de remboursement dans les 7 jours suivant votre abonnement.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Hero Section */}
      <PremiumHero
        onUnlockClick={() => router.push('/subscribe')}
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
              <span className="bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">
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
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-brand-800/10 to-transparent">
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
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-brand-800/10 to-transparent">
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
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-brand-800/20 via-brand-800/10 to-brand-800/20 border-t border-brand-500/20">
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
              <span className="bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">
                Innovation Community
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Rejoignez la communauté Premium et accédez à tout le contenu exclusif.
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/subscribe')}
            className="px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
          >
            🚀 S'abonner maintenant
          </motion.button>
        </div>
      </section>
    </div>
  );
}
