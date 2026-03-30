'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Loader2, MessageSquare, Eye, EyeOff,
  X, ChevronDown, ChevronUp, BarChart3, Clock, Coins,
} from 'lucide-react';

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
  max_responses: number | null;
  expires_at: string | null;
  is_active: boolean;
  response_count: number;
  created_at: string;
}

interface Props {
  token: string;
}

export function AdminSurveyManager({ token }: Props) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [minPlan, setMinPlan] = useState('pro');
  const [maxResponses, setMaxResponses] = useState('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/surveys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSurveys(d.surveys || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRewardAmount(0);
    setDurationMinutes(5);
    setMinPlan('pro');
    setMaxResponses('');
    setQuestions([]);
    setShowCreate(false);
  };

  const addQuestion = (type: 'choice' | 'text' | 'rating') => {
    setQuestions((prev) => [
      ...prev,
      { id: `q${Date.now()}`, text: '', type, options: type === 'choice' ? [''] : undefined },
    ]);
  };

  const updateQuestion = (idx: number, updates: Partial<SurveyQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, options: [...(q.options || []), ''] } : q))
    );
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: (q.options || []).map((o, j) => (j === oIdx ? value : o)) } : q
      )
    );
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: (q.options || []).filter((_, j) => j !== oIdx) } : q
      )
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) { setMsg({ type: 'err', text: 'Le titre est requis' }); return; }
    if (questions.length === 0) { setMsg({ type: 'err', text: 'Ajoutez au moins une question' }); return; }
    const invalid = questions.find((q) => !q.text.trim() || (q.type === 'choice' && (!q.options || q.options.filter((o) => o.trim()).length < 2)));
    if (invalid) { setMsg({ type: 'err', text: 'Toutes les questions doivent avoir un texte et les choix multiples au moins 2 options' }); return; }

    setSaving(true);
    setMsg(null);
    try {
      const cleanQuestions = questions.map((q) => ({
        ...q,
        options: q.type === 'choice' ? (q.options || []).filter((o) => o.trim()) : undefined,
      }));

      const res = await fetch('/api/admin/surveys', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions: cleanQuestions,
          reward_amount: rewardAmount,
          duration_minutes: durationMinutes,
          min_plan: minPlan,
          max_responses: maxResponses ? parseInt(maxResponses) : null,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setMsg({ type: 'ok', text: 'Sondage créé avec succès ! Notification envoyée.' });
        resetForm();
        await load();
      } else {
        setMsg({ type: 'err', text: d.error || 'Erreur lors de la création' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' });
    }
    setSaving(false);
  };

  const toggleSurvey = async (surveyId: string, current: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/surveys', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId, is_active: !current }),
      });
      if (res.ok) {
        setMsg({ type: 'ok', text: current ? 'Sondage désactivé' : 'Sondage activé' });
        await load();
      } else {
        setMsg({ type: 'err', text: 'Erreur' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' });
    }
    setSaving(false);
  };

  const deleteSurvey = async (surveyId: string) => {
    if (!confirm('Supprimer définitivement ce sondage et toutes ses réponses ?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/surveys?id=${surveyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMsg({ type: 'ok', text: 'Sondage supprimé' });
        await load();
      } else {
        setMsg({ type: 'err', text: 'Erreur lors de la suppression' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Sondages</h2>
          <p className="text-slate-400 text-sm mt-1">{surveys.length} sondage{surveys.length !== 1 ? 's' : ''} au total</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl text-sm"
        >
          {showCreate ? <X size={16} /> : <Plus size={16} />}
          {showCreate ? 'Annuler' : 'Nouveau sondage'}
        </motion.button>
      </div>

      {/* Message */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl text-sm font-medium ${
              msg.type === 'ok'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-5">
              <h3 className="text-lg font-bold text-white">Créer un sondage</h3>

              {/* Title & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Titre *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-brand-500 outline-none"
                    placeholder="Ex: Satisfaction du service"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Description</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-brand-500 outline-none"
                    placeholder="Décrivez le sondage..."
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Récompense (SPTC)</label>
                  <input
                    type="number"
                    min={0}
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Durée (min)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Plan minimum</label>
                  <select
                    value={minPlan}
                    onChange={(e) => setMinPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-brand-500 outline-none"
                  >
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Max réponses</label>
                  <input
                    type="number"
                    min={0}
                    value={maxResponses}
                    onChange={(e) => setMaxResponses(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-brand-500 outline-none"
                    placeholder="Illimité"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Questions ({questions.length})</h4>
                  <div className="flex gap-2">
                    <button onClick={() => addQuestion('choice')} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium hover:bg-blue-500/30">
                      + Choix multiple
                    </button>
                    <button onClick={() => addQuestion('text')} className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500/30">
                      + Texte libre
                    </button>
                    <button onClick={() => addQuestion('rating')} className="px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-medium hover:bg-orange-500/30">
                      + Note (1-5)
                    </button>
                  </div>
                </div>

                {questions.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">Aucune question. Ajoutez-en avec les boutons ci-dessus.</p>
                )}

                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-brand-400 font-bold text-sm mt-2">{idx + 1}.</span>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={q.text}
                            onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                            className="flex-1 px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded-lg text-white text-sm focus:border-brand-500 outline-none"
                            placeholder="Texte de la question..."
                          />
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            q.type === 'choice' ? 'bg-blue-500/20 text-blue-400' :
                            q.type === 'text' ? 'bg-green-500/20 text-green-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>{q.type === 'choice' ? 'Choix' : q.type === 'text' ? 'Texte' : 'Note'}</span>
                          <button onClick={() => removeQuestion(idx)} className="p-1.5 hover:bg-red-500/10 rounded-lg">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>

                        {q.type === 'choice' && (
                          <div className="space-y-2 ml-2">
                            {(q.options || []).map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs w-4">{String.fromCharCode(65 + oIdx)}.</span>
                                <input
                                  value={opt}
                                  onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-slate-600/30 border border-slate-500/30 rounded text-white text-xs focus:border-brand-500 outline-none"
                                  placeholder={`Option ${oIdx + 1}`}
                                />
                                {(q.options || []).length > 2 && (
                                  <button onClick={() => removeOption(idx, oIdx)} className="p-1 hover:bg-red-500/10 rounded">
                                    <X size={12} className="text-red-400" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button onClick={() => addOption(idx)} className="text-xs text-brand-400 hover:text-brand-300 ml-6">
                              + Ajouter une option
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create Button */}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Création...' : 'Créer le sondage'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surveys List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-400" size={32} />
        </div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">Aucun sondage créé</p>
          <p className="text-slate-500 text-sm mt-1">Cliquez sur &quot;Nouveau sondage&quot; pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((survey) => (
            <div key={survey.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
              {/* Survey Row */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${survey.is_active ? 'bg-green-400' : 'bg-slate-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm truncate">{survey.title}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                        survey.min_plan === 'vip' ? 'bg-amber-500/20 text-amber-400' :
                        survey.min_plan === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-brand-500/20 text-brand-400'
                      }`}>{survey.min_plan}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><BarChart3 size={12} /> {survey.response_count} réponses</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {survey.questions.length} questions</span>
                      <span className="flex items-center gap-1"><Coins size={12} /> {survey.reward_amount} SPTC</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> ~{survey.duration_minutes} min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === survey.id ? null : survey.id)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-all"
                    title="Détails"
                  >
                    {expandedId === survey.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>
                  <button
                    onClick={() => toggleSurvey(survey.id, survey.is_active)}
                    disabled={saving}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-all"
                    title={survey.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {survey.is_active ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-slate-500" />}
                  </button>
                  <button
                    onClick={() => deleteSurvey(survey.id)}
                    disabled={saving}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedId === survey.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 space-y-3">
                      {survey.description && (
                        <p className="text-sm text-slate-400">{survey.description}</p>
                      )}
                      <div className="space-y-2">
                        {survey.questions.map((q, idx) => (
                          <div key={q.id} className="flex items-start gap-2 text-sm">
                            <span className="text-brand-400 font-bold">{idx + 1}.</span>
                            <div>
                              <p className="text-slate-300">{q.text}</p>
                              <span className={`text-[10px] font-bold uppercase ${
                                q.type === 'choice' ? 'text-blue-400' : q.type === 'text' ? 'text-green-400' : 'text-orange-400'
                              }`}>{q.type === 'choice' ? 'Choix multiple' : q.type === 'text' ? 'Texte libre' : 'Note 1-5'}</span>
                              {q.type === 'choice' && q.options && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {q.options.map((o, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">{o}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                        Créé le {new Date(survey.created_at).toLocaleDateString('fr-FR')}
                        {survey.max_responses && ` · Max ${survey.max_responses} réponses`}
                        {survey.expires_at && ` · Expire le ${new Date(survey.expires_at).toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
