'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Coins, Clock, ChevronRight, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'choice' | 'text' | 'rating';
  options?: string[];
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  reward_amount: number;
  reward_currency: string;
  duration_minutes: number;
  min_plan: string;
  question_count: number;
  already_responded: boolean;
  total_responses: number;
  created_at: string;
}

export function PaidSurveys() {
  const { session } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchSurveys = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/surveys', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSurveys(data.surveys || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  const handleSubmit = async () => {
    if (!activeSurvey || !session?.access_token) return;
    const unanswered = activeSurvey.questions.filter((q) => !answers[q.id] && answers[q.id] !== 0);
    if (unanswered.length > 0) {
      setSubmitResult({ success: false, message: `Veuillez répondre à toutes les questions (${unanswered.length} restante${unanswered.length > 1 ? 's' : ''})` });
      return;
    }
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: activeSurvey.id, answers }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitResult({ success: true, message: 'Merci ! Votre réponse a été enregistrée.' });
        setSurveys((prev) => prev.map((s) => s.id === activeSurvey.id ? { ...s, already_responded: true } : s));
        setTimeout(() => { setActiveSurvey(null); setAnswers({}); setSubmitResult(null); }, 2000);
      } else {
        setSubmitResult({ success: false, message: data.error || 'Erreur' });
      }
    } catch { setSubmitResult({ success: false, message: 'Erreur réseau' }); }
    setSubmitting(false);
  };

  const completedSurveys = surveys.filter((s) => s.already_responded).length;
  const availableSurveys = surveys.filter((s) => !s.already_responded).length;
  const totalRewards = surveys.filter((s) => s.already_responded).reduce((acc, s) => acc + Number(s.reward_amount), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>;
  }

  return (
    <section className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-green-600/20 to-green-500/10 border border-green-500/30 rounded-xl p-6">
          <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium mb-2">Sondages complétés</h3>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{completedSurveys}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">sur {surveys.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-brand-500/20 to-brand-500/10 border border-brand-500/30 rounded-xl p-6">
          <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium mb-2">Récompenses gagnées</h3>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{totalRewards}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">SPTC</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 border border-orange-500/30 rounded-xl p-6">
          <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium mb-2">Sondages disponibles</h3>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{availableSurveys}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">à compléter</p>
        </motion.div>
      </div>

      {/* Surveys List */}
      {surveys.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Aucun sondage disponible pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-950 dark:text-white">Sondages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {surveys.map((survey, idx) => (
              <motion.div key={survey.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`border rounded-xl p-6 space-y-4 transition-all ${
                  survey.already_responded
                    ? 'bg-gray-100/50 dark:bg-gray-700/30 border-gray-300 dark:border-gray-600/30'
                    : 'bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/50 hover:border-brand-500/30'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-gray-950 dark:text-white">{survey.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-500/10 text-brand-500">{survey.min_plan}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{survey.description}</p>
                  </div>
                  {survey.already_responded && <CheckCircle className="text-green-400 flex-shrink-0" size={24} />}
                </div>
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200 dark:border-gray-700/50">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Durée</p>
                    <div className="flex items-center gap-1.5 text-sm text-gray-950 dark:text-white"><Clock size={14} /> ~{survey.duration_minutes} min</div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
                    <p className="text-sm text-gray-950 dark:text-white">{survey.question_count}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Récompense</p>
                    <div className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold"><Coins size={14} /> {survey.reward_amount}</div>
                  </div>
                </div>
                <motion.button whileHover={{ scale: survey.already_responded ? 1 : 1.02 }} whileTap={{ scale: survey.already_responded ? 1 : 0.98 }}
                  onClick={() => { if (!survey.already_responded) { setActiveSurvey(survey); setAnswers({}); setSubmitResult(null); } }}
                  disabled={survey.already_responded}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    survey.already_responded
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:shadow-lg'
                  }`}>
                  {survey.already_responded ? 'Complété ✓' : <>Commencer <ChevronRight size={16} /></>}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Survey Modal */}
      <AnimatePresence>
        {activeSurvey && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setActiveSurvey(null); setAnswers({}); }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-bold text-gray-950 dark:text-white">{activeSurvey.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{activeSurvey.question_count} questions · ~{activeSurvey.duration_minutes} min</p>
                </div>
                <button onClick={() => { setActiveSurvey(null); setAnswers({}); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              {/* Questions */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeSurvey.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-3">
                    <p className="font-medium text-gray-950 dark:text-white"><span className="text-brand-500 mr-2">{idx + 1}.</span>{q.text}</p>
                    {q.type === 'choice' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt) => (
                          <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            answers[q.id] === opt ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}>
                            <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))} className="w-4 h-4 text-brand-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'text' && (
                      <textarea value={(answers[q.id] as string) || ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:border-brand-500 outline-none" rows={3} placeholder="Votre réponse..." />
                    )}
                    {q.type === 'rating' && (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: n }))}
                            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                              answers[q.id] === n ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}>{n}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {submitResult && <p className={`text-sm ${submitResult.success ? 'text-green-600' : 'text-red-500'}`}>{submitResult.message}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-orange-500 font-semibold"><Coins size={16} /> Récompense: {activeSurvey.reward_amount} {activeSurvey.reward_currency}</div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {submitting ? 'Envoi...' : 'Soumettre'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
