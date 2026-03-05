'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Coins, Clock } from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  description: string;
  reward: number;
  duration: string;
  questions: number;
  completed: boolean;
}

export function PaidSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([
    {
      id: 's1',
      title: 'Streaming Preferences Survey',
      description: 'Tell us what content you prefer to watch',
      reward: 50,
      duration: '5-7 mins',
      questions: 12,
      completed: false,
    },
    {
      id: 's2',
      title: 'Platform Experience Feedback',
      description: 'Help us improve the Sidra experience',
      reward: 75,
      duration: '8-10 mins',
      questions: 18,
      completed: false,
    },
    {
      id: 's3',
      title: 'Content Creator Insights',
      description: 'Your thoughts on creator partnerships',
      reward: 60,
      duration: '6-8 mins',
      questions: 15,
      completed: false,
    },
    {
      id: 's4',
      title: 'Technology Adopter Survey',
      description: 'Share your tech adoption habits',
      reward: 40,
      duration: '4-5 mins',
      questions: 10,
      completed: true,
    },
  ]);

  const handleCompleteSurvey = (id: string) => {
    setSurveys(
      surveys.map((s) =>
        s.id === id ? { ...s, completed: true } : s
      )
    );
    // In real app, would call: usePremium().addSPTC(survey.reward, 'survey')
  };

  const completedSurveys = surveys.filter((s) => s.completed).length;
  const totalRewards = surveys.reduce((acc, s) => acc + (s.completed ? s.reward : 0), 0);
  const availableRewards = surveys.reduce((acc, s) => acc + (!s.completed ? s.reward : 0), 0);

  return (
    <section className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-green-600/20 to-green-500/10 border border-green-500/30 rounded-xl p-6"
        >
          <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium mb-2">Completed Surveys</h3>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{completedSurveys}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">out of {surveys.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-xl p-6"
        >
          <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium mb-2">Rewards Earned</h3>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{totalRewards}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">SPTC</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 border border-orange-500/30 rounded-xl p-6"
        >
          <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium mb-2">Available Rewards</h3>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{availableRewards}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">SPTC</p>
        </motion.div>
      </div>

      {/* Surveys List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-950 dark:text-white">Available Surveys</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {surveys.map((survey, idx) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`border rounded-lg p-6 space-y-4 transition-all ${
                survey.completed
                  ? 'bg-gray-700/30 border-gray-600/30'
                  : 'bg-gray-800/40 border-gray-700/50 hover:border-blue-500/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <h4 className="text-lg font-bold text-white">{survey.title}</h4>
                  <p className="text-sm text-gray-400">{survey.description}</p>
                </div>
                {survey.completed && (
                  <CheckCircle className="text-green-400" size={24} />
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-700/50">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Duration</p>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Clock size={16} />
                    {survey.duration}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Questions</p>
                  <p className="text-sm text-white">{survey.questions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Reward</p>
                  <div className="flex items-center gap-2 text-sm text-orange-400 font-semibold">
                    <Coins size={16} />
                    {survey.reward}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCompleteSurvey(survey.id)}
                disabled={survey.completed}
                className={`w-full py-2 rounded-lg font-semibold transition-all ${
                  survey.completed
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg'
                }`}
              >
                {survey.completed ? 'Completed ✓' : 'Start Survey'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
