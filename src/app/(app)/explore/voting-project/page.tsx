'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Users, Clock, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VotingProject {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  daysLeft: number;
  fundingGoal: number;
  fundingCurrent: number;
  status: 'active' | 'upcoming' | 'completed';
  participants: number;
}

const mockProjects: VotingProject[] = [
  {
    id: '1',
    title: 'AI-Powered Islamic Education Platform',
    description: 'Revolutionary platform using AI to teach Islamic principles interactively',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    upvotes: 2450,
    downvotes: 125,
    totalVotes: 2575,
    daysLeft: 15,
    fundingGoal: 50000,
    fundingCurrent: 38750,
    status: 'active',
    participants: 380,
  },
  {
    id: '2',
    title: 'Sustainable Technology Initiative',
    description: 'Green tech solutions for developing communities',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&h=400&fit=crop',
    upvotes: 1890,
    downvotes: 210,
    totalVotes: 2100,
    daysLeft: 8,
    fundingGoal: 75000,
    fundingCurrent: 52500,
    status: 'active',
    participants: 290,
  },
  {
    id: '3',
    title: 'Youth Empowerment Program',
    description: 'Support for youth entrepreneurship and skill development',
    category: 'Social',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    upvotes: 3120,
    downvotes: 85,
    totalVotes: 3205,
    daysLeft: 25,
    fundingGoal: 100000,
    fundingCurrent: 45000,
    status: 'active',
    participants: 520,
  },
  {
    id: '4',
    title: 'Healthcare Innovation Lab',
    description: 'Next-generation medical research and development',
    category: 'Healthcare',
    image: 'https://images.unsplash.com/photo-1576091160550-112173cba4b7?w=600&h=400&fit=crop',
    upvotes: 1245,
    downvotes: 95,
    totalVotes: 1340,
    daysLeft: 0,
    fundingGoal: 120000,
    fundingCurrent: 125000,
    status: 'completed',
    participants: 210,
  },
];

export default function VotingProjectPage() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  const filteredProjects = mockProjects.filter((p) => 
    filterStatus === 'all' ? true : p.status === filterStatus
  );

  const handleVote = (projectId: string, voteType: 'up' | 'down') => {
    setUserVotes((prev) => ({
      ...prev,
      [projectId]: prev[projectId] === voteType ? null : voteType,
    }));
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
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-gray-950 dark:text-white">Community Voting Projects</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Vote on projects that matter to the community</p>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        variants={itemVariants}
        className="flex gap-3 mb-8 flex-wrap"
      >
        {(['all', 'active', 'upcoming', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Stats Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'Total Projects', value: mockProjects.length, icon: Award },
          { label: 'Active Votes', value: mockProjects.reduce((sum, p) => sum + p.totalVotes, 0), icon: ThumbsUp },
          { label: 'Total Participants', value: mockProjects.reduce((sum, p) => sum + p.participants, 0), icon: Users },
          { label: 'Completed', value: mockProjects.filter(p => p.status === 'completed').length, icon: TrendingUp },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <Icon className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-950 dark:text-white">{stat.value}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {filteredProjects.map((project, idx) => {
          const votePercentage = (project.upvotes / project.totalVotes) * 100;
          const fundingPercentage = (project.fundingCurrent / project.fundingGoal) * 100;
          const userVote = userVotes[project.id];

          return (
            <motion.div
              key={project.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
              className={`bg-gradient-to-br rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all cursor-pointer ${
                selectedProject === project.id
                  ? 'ring-2 ring-blue-500'
                  : ''
              } ${
                project.status === 'completed'
                  ? 'from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'
                  : 'from-white dark:from-gray-900 to-gray-50 dark:to-gray-950'
              }`}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${project.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    project.status === 'active' ? 'bg-green-500 text-white' :
                    project.status === 'upcoming' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {project.status.toUpperCase()}
                  </span>
                </div>

                {/* Category */}
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    {project.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Voting Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white">
                      Voting: {votePercentage.toFixed(1)}% Upvotes
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {project.totalVotes.toLocaleString()} votes
                    </p>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      layoutId={`voting-bar-${project.id}`}
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${votePercentage}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                    />
                  </div>
                </div>

                {/* Funding Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white">
                      Funding: ${project.fundingCurrent.toLocaleString()}/${project.fundingGoal.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {fundingPercentage.toFixed(0)}%
                    </p>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                    />
                  </div>
                </div>

                {/* Time and Participants */}
                <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-gray-200 dark:border-gray-800">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={14} />
                      Days Left
                    </p>
                    <p className="text-lg font-bold text-gray-950 dark:text-white">
                      {project.daysLeft > 0 ? project.daysLeft : 'Ended'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Users size={14} />
                      Participants
                    </p>
                    <p className="text-lg font-bold text-gray-950 dark:text-white">
                      {project.participants.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Vote Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(project.id, 'up');
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                      userVote === 'up'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                    }`}
                  >
                    <ThumbsUp size={18} />
                    {project.upvotes.toLocaleString()}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(project.id, 'down');
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                      userVote === 'down'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                    }`}
                  >
                    <ThumbsDown size={18} />
                    {project.downvotes.toLocaleString()}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Award size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No projects in this category yet.</p>
        </motion.div>
      )}
    </div>
  );
}
