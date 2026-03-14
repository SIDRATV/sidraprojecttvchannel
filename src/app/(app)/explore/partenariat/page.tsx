'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Users, Star, TrendingUp, ArrowRight, Award, Check, AlertCircle, Clock, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Partner {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  rating: number;
  reviews: number;
  followers: number;
  status: 'active' | 'pending' | 'featured';
  joinDate: string;
  benefits: string[];
}

interface ApplicationRequest {
  id: string;
  projectName: string;
  ownerName: string;
  partnershipType: 'advertising' | 'project';
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  message?: string;
}

const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'TechHub Innovation',
    description: 'Leading technology development agency focusing on AI and blockchain solutions',
    category: 'Technology',
    logo: '🚀',
    rating: 4.8,
    reviews: 342,
    followers: 15200,
    status: 'featured',
    joinDate: 'Jan 2024',
    benefits: ['Revenue Sharing', 'Co-marketing', 'Technical Support'],
  },
  {
    id: '2',
    name: 'Islamic Learning Academy',
    description: 'Premium Islamic education platform with certified instructors',
    category: 'Education',
    logo: '📚',
    rating: 4.9,
    reviews: 521,
    followers: 28500,
    status: 'featured',
    joinDate: 'Dec 2023',
    benefits: ['Credential Recognition', 'Student Access', 'API Integration'],
  },
  {
    id: '3',
    name: 'Green Energy Solutions',
    description: 'Sustainable technology and renewable energy implementation',
    category: 'Sustainability',
    logo: '💚',
    rating: 4.6,
    reviews: 218,
    followers: 9800,
    status: 'active',
    joinDate: 'Mar 2024',
    benefits: ['Eco-Certification', 'Grant Access', 'Network Expansion'],
  },
  {
    id: '4',
    name: 'Global Healthcare Network',
    description: 'International medical services and health information platform',
    category: 'Healthcare',
    logo: '⚕️',
    rating: 4.7,
    reviews: 456,
    followers: 32100,
    status: 'featured',
    joinDate: 'Feb 2024',
    benefits: ['Health Insurance', 'Research Data', 'Expert Network'],
  },
  {
    id: '5',
    name: 'Creative Studios Collective',
    description: 'Network of content creators and digital artists',
    category: 'Arts & Media',
    logo: '🎨',
    rating: 4.4,
    reviews: 287,
    followers: 11400,
    status: 'active',
    joinDate: 'Apr 2024',
    benefits: ['Portfolio Showcase', 'Collaboration Tools', 'Revenue Streams'],
  },
  {
    id: '6',
    name: 'Financial Innovation Labs',
    description: 'Fintech solutions for Islamic banking and finance',
    category: 'Finance',
    logo: '💰',
    rating: 4.9,
    reviews: 678,
    followers: 45300,
    status: 'featured',
    joinDate: 'Jan 2024',
    benefits: ['Payment Integration', 'Compliance Support', 'Business Tools'],
  },
];

export default function PartenariatPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'explore' | 'applications'>('explore');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [partnershipType, setPartnershipType] = useState<'advertising' | 'project' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    ownerName: '',
    ownerEmail: '',
    domain: '',
    redirectLink: '',
    benefits: ['', '', '', '', ''],
    countries: [] as string[],
    sdaAmount: '',
    policyAgreed: false,
    hasTeamIn5Countries: false,
    hasSDA2000Plus: false,
  });

  // Mock applications
  const [applications] = useState<ApplicationRequest[]>([
    {
      id: '1',
      projectName: 'AI Learning Hub',
      ownerName: 'Ahmed Hassan',
      partnershipType: 'project',
      status: 'approved',
      submittedDate: '2024-02-15',
    },
    {
      id: '2',
      projectName: 'Islamic Finance App',
      ownerName: 'Fatima Al-Mansouri',
      partnershipType: 'advertising',
      status: 'pending',
      submittedDate: '2024-03-10',
    },
  ]);

  const categories = Array.from(new Set(mockPartners.map((p) => p.category)));
  const filteredPartners = selectedCategory
    ? mockPartners.filter((p) => p.category === selectedCategory)
    : mockPartners;

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  const addBenefit = () => {
    setFormData({ ...formData, benefits: [...formData.benefits, ''] });
  };

  const handleCountryToggle = (country: string) => {
    setFormData(prev => ({
      ...prev,
      countries: prev.countries.includes(country)
        ? prev.countries.filter(c => c !== country)
        : [...prev.countries, country]
    }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      return (
        partnershipType &&
        formData.projectName.trim() !== '' &&
        formData.ownerName.trim() !== '' &&
        formData.ownerEmail.includes('@')
      );
    } else if (currentStep === 2) {
      return (
        formData.domain.trim() !== '' &&
        formData.redirectLink.trim() !== '' &&
        formData.benefits.filter(b => b.trim()).length >= 5
      );
    } else if (currentStep === 3) {
      // Advertising: Only needs agreement
      if (partnershipType === 'advertising') {
        return formData.policyAgreed;
      }
      // Project: Needs 5 countries confirmation + 2000+ SDA + agreement
      return (
        formData.hasTeamIn5Countries &&
        formData.hasSDA2000Plus &&
        formData.policyAgreed
      );
    }
    return false;
  };

  const handleSubmit = () => {
    if (validateStep()) {
      // Show submission modal
      setShowSubmissionModal(true);
      // Simulated delay before clearing form
      setTimeout(() => {
        setShowApplicationForm(false);
        setCurrentStep(1);
        setPartnershipType(null);
        setFormData({
          projectName: '',
          ownerName: '',
          ownerEmail: '',
          domain: '',
          redirectLink: '',
          benefits: ['', '', '', '', ''],
          countries: [],
          sdaAmount: '',
          policyAgreed: false,
          hasTeamIn5Countries: false,
          hasSDA2000Plus: false,
        });
      }, 2000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-8 transition-colors">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
            <Award className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-gray-950 dark:text-white">Partners</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Join our network of innovative organizations</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={itemVariants}
        className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800"
      >
        <button
          onClick={() => setCurrentTab('explore')}
          className={`pb-4 px-4 font-semibold transition-all ${
            currentTab === 'explore'
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Explore Partners
        </button>
        <button
          onClick={() => setCurrentTab('applications')}
          className={`pb-4 px-4 font-semibold transition-all ${
            currentTab === 'applications'
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          My Applications
        </button>
      </motion.div>

      {/* CTA Section - Only on explore tab */}
      {currentTab === 'explore' && (
        <motion.div
          variants={itemVariants}
          className="mb-8 bg-gradient-to-r from-pink-500 via-pink-600 to-rose-600 rounded-xl p-8 text-white shadow-lg shadow-pink-500/20"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Become a Partner</h2>
              <p className="text-pink-100">Collaborate with us to create meaningful impact and grow together</p>
            </div>
            <Button 
              size="lg" 
              variant="primary"
              onClick={() => setShowApplicationForm(true)}
              className="bg-pink-600 dark:bg-white text-white dark:text-pink-600 hover:bg-pink-700 dark:hover:bg-gray-100 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Apply Now
              <ArrowRight size={20} />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Explore Tab Content */}
      {currentTab === 'explore' && !showApplicationForm && (
        <>
          {/* Category Filter */}
          <motion.div
            variants={itemVariants}
            className="flex gap-2 mb-8 overflow-x-auto pb-2"
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              All Partners
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Active Partners', value: mockPartners.filter(p => p.status === 'active' || p.status === 'featured').length },
              { label: 'Total Contributors', value: mockPartners.reduce((sum, p) => sum + p.followers, 0).toLocaleString() },
              { label: 'Success Rate', value: '98%' },
              { label: 'Countries', value: '45+' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-950 dark:text-white">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Partners Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPartners.map((partner) => (
              <motion.div
                key={partner.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedPartner(selectedPartner === partner.id ? null : partner.id)}
                className={`rounded-xl overflow-hidden border transition-all cursor-pointer backdrop-blur-sm ${
                  selectedPartner === partner.id
                    ? 'ring-2 ring-pink-500 bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-500/10 dark:to-rose-500/10 border-pink-300 dark:border-pink-700'
                    : partner.status === 'featured'
                    ? 'bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-500/5 dark:to-orange-500/5 border-yellow-200 dark:border-yellow-700'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-pink-300 dark:hover:border-pink-700'
                }`}
              >
                {/* Featured Badge */}
                {partner.status === 'featured' && (
                  <div className="relative h-1 bg-gradient-to-r from-yellow-400 to-orange-400" />
                )}

                <div className="p-6">
                  {/* Logo and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl flex items-center justify-center text-4xl">
                      {partner.logo}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      partner.status === 'featured' ? 'bg-yellow-500 text-white' :
                      partner.status === 'active' ? 'bg-green-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {partner.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Name and Category */}
                  <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-2">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold mb-3">
                    {partner.category}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {partner.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.floor(partner.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-950 dark:text-white">
                      {partner.rating}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      ({partner.reviews} reviews)
                    </span>
                  </div>

                  {/* Benefits */}
                  {selectedPartner === partner.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 mb-4 py-4 border-y border-gray-200 dark:border-gray-800"
                    >
                      <p className="text-sm font-semibold text-gray-950 dark:text-white">Project Advantages:</p>
                      {partner.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 rounded-full bg-pink-600" />
                          {benefit}
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Action Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4"
                  >
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Join Now
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {filteredPartners.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="text-center py-12"
            >
              <Award size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No partners in this category.</p>
            </motion.div>
          )}
        </>
      )}

      {/* Applications Tab Content */}
      {currentTab === 'applications' && !showApplicationForm && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {applications.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl"
            >
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No applications yet</p>
              <Button onClick={() => setShowApplicationForm(true)}>
                Submit Application
              </Button>
            </motion.div>
          ) : (
            applications.map((app) => (
              <motion.div
                key={app.id}
                variants={itemVariants}
                className={`rounded-xl p-6 border transition-all ${
                  app.status === 'approved'
                    ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-700'
                    : app.status === 'pending'
                    ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-700'
                    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                        {app.projectName}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'approved'
                          ? 'bg-green-500 text-white'
                          : app.status === 'pending'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {app.status === 'approved' && <Check size={14} />}
                        {app.status === 'pending' && <Clock size={14} />}
                        {app.status === 'rejected' && <X size={14} />}
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Owner: <span className="font-semibold">{app.ownerName}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Type: <span className="font-semibold capitalize">{app.partnershipType}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Submitted: {new Date(app.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                  {app.message && (
                    <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" size={24} />
                  )}
                </div>
              </motion.div>
            ))
          )}

          <Button 
            onClick={() => setShowApplicationForm(true)}
            className="w-full mt-6"
            variant="primary"
          >
            New Application
          </Button>
        </motion.div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowApplicationForm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Form Header */}
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Partnership Application</h3>
                <p className="text-pink-100">Step {currentStep} of 3</p>
              </div>
              <button
                onClick={() => {
                  setShowApplicationForm(false);
                  setCurrentStep(1);
                  setPartnershipType(null);
                }}
                className="p-2 hover:bg-pink-600 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-6">
              <div className="flex gap-2 mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex-1">
                    <div className={`h-2 rounded-full transition-all ${
                      step <= currentStep
                        ? 'bg-pink-600'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                      Step {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Step 1: Partnership Type & Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h4 className="text-lg font-bold text-gray-950 dark:text-white mb-4">
                      Select Partnership Type
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['advertising', 'project'].map((type) => (
                        <motion.button
                          key={type}
                          onClick={() => setPartnershipType(type as 'advertising' | 'project')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-6 rounded-xl border-2 transition-all relative overflow-hidden ${
                            partnershipType === type
                              ? 'border-pink-600 bg-pink-600 dark:bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                              : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-400 dark:hover:border-pink-600'
                          }`}
                        >
                          {partnershipType === type && (
                            <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 rounded-full p-1">
                              <Check size={18} className="text-pink-600" />
                            </div>
                          )}
                          <div className={`font-bold capitalize mb-2 ${
                            partnershipType === type
                              ? 'text-white'
                              : 'text-gray-950 dark:text-white'
                          }`}>
                            Partnership for {type === 'advertising' ? 'Advertising' : 'Project'}
                          </div>
                          <p className={`text-xs ${
                            partnershipType === type
                              ? 'text-pink-100'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {type === 'advertising'
                              ? 'Promote your brand through our platform'
                              : 'Showcase your project to our community'}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-950 dark:text-white mb-4">
                      Project & Owner Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                          Project Name *
                        </label>
                        <input
                          type="text"
                          value={formData.projectName}
                          onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-pink-600 outline-none"
                          placeholder="Enter project name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                          Owner Name *
                        </label>
                        <input
                          type="text"
                          value={formData.ownerName}
                          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-pink-600 outline-none"
                          placeholder="Enter owner name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.ownerEmail}
                          onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-pink-600 outline-none"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Domain & Benefits */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                      Project Domain *
                    </label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-pink-600 outline-none"
                      placeholder="example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                      Redirect Link *
                    </label>
                    <input
                      type="url"
                      value={formData.redirectLink}
                      onChange={(e) => setFormData({ ...formData, redirectLink: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-pink-600 outline-none"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-gray-950 dark:text-white">
                        Project Advantages (Minimum 5) *
                      </label>
                      <button
                        onClick={addBenefit}
                        className="flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.benefits.map((benefit, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={benefit}
                          onChange={(e) => handleBenefitChange(idx, e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-pink-600 outline-none"
                          placeholder={`Advantage ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {formData.benefits.filter(b => b.trim()).length}/5 advantages entered
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Verification */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Advertising Partnership - Simple Verification */}
                  {partnershipType === 'advertising' && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
                          📢 Advertising Partnership Agreement
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                          By submitting this application, you confirm your commitment to promoting your brand on our platform following our guidelines and terms of service.
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.policyAgreed}
                              onChange={(e) => setFormData({ ...formData, policyAgreed: e.target.checked })}
                              className="w-4 h-4 rounded accent-blue-600"
                            />
                            <label className="text-sm text-blue-800 dark:text-blue-200">
                              I have read and agree to the advertising guidelines and partnership terms *
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Project Partnership - Detailed Verification */}
                  {partnershipType === 'project' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-bold text-gray-950 dark:text-white mb-4">
                          Project Verification Checklist
                        </h4>
                        
                        {/* Requirement 1: Team Members in 5 Countries */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-200 dark:border-purple-700 rounded-xl p-6 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="pt-1">
                              <Check className="text-purple-600 dark:text-purple-400" size={20} />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-950 dark:text-white mb-2">
                                Has your project team members in at least 5 different countries?
                              </h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                Your team should have representatives dispersed across multiple geographical regions
                              </p>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.hasTeamIn5Countries}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      hasTeamIn5Countries: e.target.checked
                                    }));
                                  }}
                                  className="w-5 h-5 rounded accent-purple-600"
                                />
                                <span className="text-sm font-semibold text-gray-950 dark:text-white">
                                  I confirm my team operates in 5+ countries
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Requirement 2: SDA Balance */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200 dark:border-green-700 rounded-xl p-6 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="pt-1">
                              <Check className="text-green-600 dark:text-green-400" size={20} />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-950 dark:text-white mb-2">
                                Does your project have accumulated at least 2000 SDA?
                              </h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                Minimum Sidra token balance required to ensure project stability
                              </p>
                              <label className="flex items-center gap-3 cursor-pointer mb-3">
                                <input
                                  type="checkbox"
                                  checked={formData.hasSDA2000Plus}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      hasSDA2000Plus: e.target.checked
                                    }));
                                  }}
                                  className="w-5 h-5 rounded accent-green-600"
                                />
                                <span className="text-sm font-semibold text-gray-950 dark:text-white">
                                  Confirmed - Project has 2000+ SDA
                                </span>
                              </label>
                              <div>
                                <label className="block text-xs font-semibold text-gray-950 dark:text-white mb-2">
                                  Actual SDA Balance (for reference)
                                </label>
                                <input
                                  type="number"
                                  value={formData.sdaAmount}
                                  onChange={(e) => setFormData({ ...formData, sdaAmount: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-green-600 outline-none"
                                  placeholder="Enter SDA amount"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Agreement */}
                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 border border-pink-200 dark:border-pink-700 rounded-xl p-6">
                          <h5 className="font-semibold text-gray-950 dark:text-white mb-4">
                            Final Confirmation
                          </h5>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={formData.policyAgreed}
                                onChange={(e) => setFormData({ ...formData, policyAgreed: e.target.checked })}
                                className="w-4 h-4 rounded accent-pink-600"
                              />
                              <label className="text-sm text-gray-700 dark:text-gray-400">
                                I confirm all information is accurate and agree to partnership terms *
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Form Footer */}
            <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-800 px-6 py-4 flex gap-3 justify-between border-t border-gray-200 dark:border-gray-700">
              {currentStep > 1 && (
                <Button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  variant="secondary"
                >
                  Back
                </Button>
              )}
              <div className="flex-1" />
              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  variant="primary"
                  disabled={!validateStep()}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight size={18} />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  disabled={!validateStep()}
                  className="disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
                >
                  <Check size={18} />
                  Submit Application
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Submission Success Modal */}
      {showSubmissionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
          >
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4"
              >
                <Check className="text-green-600" size={32} />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Application Submitted!</h3>
              <p className="text-green-100">Your partnership request has been received</p>
            </div>

            {/* Message Content */}
            <div className="p-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center space-y-3"
              >
                <p className="text-gray-950 dark:text-white font-semibold text-lg">
                  Votre demande est soumise pour révision
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Merci de patienter. Nous vous répondrons bientôt avec des détails sur votre demande de partenariat.
                </p>
              </motion.div>

              {/* Loading Animation */}
              <motion.div
                className="flex justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </motion.div>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-700 rounded-xl p-4"
              >
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">💡 Conseil:</span> Vous pouvez consulter le statut de votre demande dans l'onglet "My Applications"
                </p>
              </motion.div>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setCurrentTab('applications');
                  }}
                  variant="primary"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  View My Applications
                  <ArrowRight size={18} />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
