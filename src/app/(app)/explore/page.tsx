'use client';

import Link from 'next/link';

export default function ExplorePage() {
  const sections = [
    {
      href: '/explore/wallet',
      title: 'My Wallet',
      description: 'Manage your funds, view transactions, and control your digital wallet',
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      href: '/explore/voting-project',
      title: 'Voting Projects',
      description: 'Vote on community projects and help shape the future of our platform',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      href: '/explore/partenariat',
      title: 'Partners',
      description: 'Discover and connect with innovative partners in our ecosystem',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      href: '/explore/actualiter',
      title: 'Actualités',
      description: 'Stay updated with the latest news and announcements from our community',
      gradient: 'from-orange-500 to-red-500'
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold text-gray-950 dark:text-white mb-4">
            Explore Sidra
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Discover our comprehensive platform features and services
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <div className={`h-80 bg-gradient-to-br ${section.gradient} rounded-2xl p-8 text-white cursor-pointer hover:shadow-2xl transition-all hover:scale-105`}>
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-3">
                      {section.title}
                    </h2>
                    <p className="text-lg opacity-90">
                      {section.description}
                    </p>
                  </div>
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors">
                    Explore →
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-12 mb-16">
          <h3 className="text-3xl font-bold text-gray-950 dark:text-white mb-8">
            Platform Highlights
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Users', value: '50K+' },
              { label: 'Transactions', value: '$2.5M+' },
              { label: 'Projects', value: '145' },
              { label: 'Articles', value: '500+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl font-bold text-gray-950 dark:text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
