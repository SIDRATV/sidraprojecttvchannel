'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Settings, FileText, Send, BarChart3, Loader2, AlertCircle,
  CheckCircle, Save, Plus, Trash2, Eye, Edit3, RefreshCw, Users,
  Search, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Code,
} from 'lucide-react';

interface AdminEmailManagerProps {
  token: string;
}

type SubTab = 'settings' | 'templates' | 'send' | 'logs';

interface EmailSettings {
  id: string;
  sender_name: string;
  sender_email: string;
  reply_to_email: string | null;
  event_password_reset: boolean;
  event_password_changed: boolean;
  event_email_changed: boolean;
  event_signup_welcome: boolean;
  event_login_alert: boolean;
  event_mfa_enabled: boolean;
  event_mfa_disabled: boolean;
  max_bulk_emails_per_hour: number;
  max_single_emails_per_minute: number;
}

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  html_body: string;
  description: string | null;
  variables: string[];
  is_system: boolean;
  is_active: boolean;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  today: number;
}

interface EmailLogEntry {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  template_slug: string | null;
  resend_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

// ─── Helper ──────────────────────────────────────────────
async function apiFetch<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ─── Main Component ──────────────────────────────────────
export default function AdminEmailManager({ token }: AdminEmailManagerProps) {
  const [subTab, setSubTab] = useState<SubTab>('settings');

  const subTabs = [
    { id: 'settings' as const, label: 'Paramètres', icon: Settings },
    { id: 'templates' as const, label: 'Templates', icon: FileText },
    { id: 'send' as const, label: 'Envoyer', icon: Send },
    { id: 'logs' as const, label: 'Historique', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              subTab === id
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {subTab === 'settings' && <SettingsPanel token={token} />}
          {subTab === 'templates' && <TemplatesPanel token={token} />}
          {subTab === 'send' && <SendPanel token={token} />}
          {subTab === 'logs' && <LogsPanel token={token} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SETTINGS PANEL
// ════════════════════════════════════════════════════════
function SettingsPanel({ token }: { token: string }) {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch<EmailSettings>('/api/admin/email/settings', token)
      .then(setSettings)
      .catch(() => setMessage('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await apiFetch<EmailSettings>('/api/admin/email/settings', token, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      setMessage('Paramètres sauvegardés !');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!settings) return <ErrorBox message="Impossible de charger les paramètres" />;

  const toggles: { key: keyof EmailSettings; label: string; desc: string }[] = [
    { key: 'event_password_reset', label: 'Réinitialisation mot de passe', desc: 'Email envoyé quand un utilisateur demande un reset' },
    { key: 'event_password_changed', label: 'Mot de passe modifié', desc: 'Notification après changement de mot de passe' },
    { key: 'event_email_changed', label: 'Email modifié', desc: 'Notification après changement d\'email' },
    { key: 'event_signup_welcome', label: 'Email de bienvenue', desc: 'Email envoyé à l\'inscription' },
    { key: 'event_login_alert', label: 'Alerte de connexion', desc: 'Notification à chaque connexion (avancé)' },
    { key: 'event_mfa_enabled', label: 'MFA activé', desc: 'Notification quand le 2FA est activé' },
    { key: 'event_mfa_disabled', label: 'MFA désactivé', desc: 'Notification quand le 2FA est désactivé' },
  ];

  return (
    <div className="space-y-6">
      {/* Sender Config */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Mail size={20} className="text-brand-400" /> Configuration expéditeur
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nom expéditeur</label>
            <input
              type="text"
              value={settings.sender_name}
              onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email expéditeur</label>
            <input
              type="email"
              value={settings.sender_email}
              onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email réponse (optionnel)</label>
            <input
              type="email"
              value={settings.reply_to_email || ''}
              onChange={(e) => setSettings({ ...settings, reply_to_email: e.target.value || null })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
              placeholder="reply@sidratv.com"
            />
          </div>
        </div>
      </div>

      {/* Event Toggles */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ToggleRight size={20} className="text-brand-400" /> Notifications par email
        </h3>
        <div className="space-y-3">
          {toggles.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/30"
            >
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings[key] ? 'bg-brand-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings[key] ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limits */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Limites d&apos;envoi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Max emails en masse / heure</label>
            <input
              type="number"
              value={settings.max_bulk_emails_per_hour}
              onChange={(e) => setSettings({ ...settings, max_bulk_emails_per_hour: parseInt(e.target.value) || 200 })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Max emails individuels / minute</label>
            <input
              type="number"
              value={settings.max_single_emails_per_minute}
              onChange={(e) => setSettings({ ...settings, max_single_emails_per_minute: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
              min={1}
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Sauvegarder
        </button>
        {message && (
          <span className={`text-sm ${message.includes('Erreur') ? 'text-red-400' : 'text-emerald-400'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TEMPLATES PANEL
// ════════════════════════════════════════════════════════
function TemplatesPanel({ token }: { token: string }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await apiFetch<EmailTemplate[]>('/api/admin/email/templates', token);
      setTemplates(data);
    } catch {
      setMessage('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = async (template: Partial<EmailTemplate>) => {
    setSaving(true);
    setMessage('');
    try {
      if (creating) {
        await apiFetch('/api/admin/email/templates', token, {
          method: 'POST',
          body: JSON.stringify(template),
        });
        setCreating(false);
      } else {
        await apiFetch('/api/admin/email/templates', token, {
          method: 'PUT',
          body: JSON.stringify(template),
        });
      }
      setEditing(null);
      fetchTemplates();
      setMessage('Template sauvegardé !');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    try {
      await apiFetch(`/api/admin/email/templates?id=${id}`, token, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
    }
  };

  if (loading) return <LoadingSpinner />;

  // Template Editor
  if (editing || creating) {
    const tpl = editing || { slug: '', name: '', subject: '', html_body: '', description: '', variables: [], is_system: false, is_active: true };
    return (
      <TemplateEditor
        template={tpl as EmailTemplate}
        isNew={creating}
        saving={saving}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setCreating(false); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Templates d&apos;email</h3>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus size={16} /> Nouveau template
        </button>
      </div>

      {message && <p className="text-sm text-emerald-400">{message}</p>}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Aperçu du template</h4>
              <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-gray-900">✕</button>
            </div>
            <div className="p-4" dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white">{tpl.name}</h4>
                {tpl.is_system && (
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">Système</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${tpl.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {tpl.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{tpl.description || tpl.slug}</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{tpl.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreview(tpl.html_body)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Aperçu"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => setEditing(tpl)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Modifier"
              >
                <Edit3 size={16} />
              </button>
              {!tpl.is_system && (
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Template Editor Sub-component ───────────────────────
function TemplateEditor({
  template,
  isNew,
  saving,
  onSave,
  onCancel,
}: {
  template: EmailTemplate;
  isNew: boolean;
  saving: boolean;
  onSave: (t: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    id: template.id,
    slug: template.slug,
    name: template.name,
    subject: template.subject,
    html_body: template.html_body,
    description: template.description || '',
    variables: template.variables.join(', '),
    is_active: template.is_active,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {isNew ? 'Nouveau template' : `Modifier : ${template.name}`}
        </h3>
        <button onClick={onCancel} className="text-sm text-slate-400 hover:text-white">Annuler</button>
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-4">
        {isNew && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">Slug (identifiant unique)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none font-mono"
              placeholder="mon_template"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Sujet</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Variables (séparées par virgules)</label>
          <input
            type="text"
            value={form.variables}
            onChange={(e) => setForm({ ...form, variables: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none font-mono"
            placeholder="user.name, user.email, app.name"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-slate-400 flex items-center gap-1">
              <Code size={14} /> Corps HTML
            </label>
          </div>
          <textarea
            value={form.html_body}
            onChange={(e) => setForm({ ...form, html_body: e.target.value })}
            rows={16}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none font-mono leading-relaxed resize-y"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 accent-brand-500 rounded"
            />
            Template actif
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const vars = form.variables.split(',').map((v) => v.trim()).filter(Boolean);
            onSave({
              ...(!isNew ? { id: form.id } : {}),
              slug: form.slug,
              name: form.name,
              subject: form.subject,
              html_body: form.html_body,
              description: form.description || null,
              variables: vars,
              is_active: form.is_active,
            });
          }}
          disabled={saving || !form.name || !form.subject || !form.html_body}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isNew ? 'Créer' : 'Sauvegarder'}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold text-sm transition-all"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SEND PANEL
// ════════════════════════════════════════════════════════
function SendPanel({ token }: { token: string }) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [filter, setFilter] = useState('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSend = async () => {
    if (!subject || !html) return;
    if (mode === 'single' && !to) return;

    if (mode === 'bulk' && !confirm(`Envoyer cet email à ${filter === 'admins' ? 'tous les admins' : 'TOUS les utilisateurs'} ?`)) return;

    setSending(true);
    setResult(null);

    try {
      const body = mode === 'single'
        ? { mode: 'single', to, subject, html }
        : { mode: 'bulk', subject, html, filter: filter === 'all' ? undefined : filter };

      const data = await apiFetch<any>('/api/admin/email/send', token, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const text = mode === 'single'
        ? 'Email envoyé avec succès !'
        : `Envoyé: ${data.sent}, Échoué: ${data.failed}, Ignoré: ${data.skipped || 0}`;

      setResult({ type: 'success', text });
    } catch (err) {
      setResult({ type: 'error', text: err instanceof Error ? err.message : 'Erreur d\'envoi' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setMode('single')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'single' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
          }`}
        >
          <Send size={16} /> Email individuel
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'bulk' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
          }`}
        >
          <Users size={16} /> Email en masse
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-4">
        {mode === 'single' ? (
          <div>
            <label className="block text-sm text-slate-400 mb-1">Destinataire</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm text-slate-400 mb-1">Destinataires</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="admins">Admins uniquement</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-400 mb-1">Sujet</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Sujet de l'email..."
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-slate-400">Corps HTML</label>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <Eye size={12} /> {showPreview ? 'Éditeur' : 'Aperçu'}
            </button>
          </div>
          {showPreview ? (
            <div className="w-full min-h-[200px] p-4 bg-white rounded-xl text-sm" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={10}
              placeholder="<h1>Mon email</h1><p>Contenu...</p>"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-400 focus:outline-none font-mono leading-relaxed resize-y"
            />
          )}
        </div>

        <p className="text-xs text-slate-500">
          Variables disponibles : {'{{user.name}}'}, {'{{user.email}}'}, {'{{app.name}}'}
        </p>
      </div>

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${
          result.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
        }`}>
          {result.type === 'success' ? <CheckCircle size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-red-400" />}
          <span className={`text-sm ${result.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>{result.text}</span>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sending || !subject || !html || (mode === 'single' && !to)}
        className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {mode === 'single' ? 'Envoyer' : 'Envoyer à tous'}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// LOGS PANEL
// ════════════════════════════════════════════════════════
function LogsPanel({ token }: { token: string }) {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        apiFetch<EmailStats>('/api/admin/email/logs?stats=true', token),
        apiFetch<{ logs: EmailLogEntry[]; pages: number }>(`/api/admin/email/logs?page=${page}&limit=20`, token),
      ]);
      setStats(statsData);
      setLogs(logsData.logs);
      setTotalPages(logsData.pages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total envoyés', value: stats.total, color: 'text-white' },
            { label: 'Réussis', value: stats.sent, color: 'text-emerald-400' },
            { label: 'Échoués', value: stats.failed, color: 'text-red-400' },
            { label: "Aujourd'hui", value: stats.today, color: 'text-brand-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Historique d&apos;envoi</h3>
        <button
          onClick={fetchData}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-3 text-slate-400 font-medium">Date</th>
                <th className="text-left p-3 text-slate-400 font-medium">Destinataire</th>
                <th className="text-left p-3 text-slate-400 font-medium">Sujet</th>
                <th className="text-left p-3 text-slate-400 font-medium">Template</th>
                <th className="text-left p-3 text-slate-400 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                  <td className="p-3 text-slate-300 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 text-white font-mono text-xs">{log.to_email}</td>
                  <td className="p-3 text-slate-300 max-w-[200px] truncate">{log.subject}</td>
                  <td className="p-3 text-slate-500 font-mono text-xs">{log.template_slug || '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      log.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.status === 'delivered' ? 'bg-blue-500/20 text-blue-400' :
                      log.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {log.status}
                    </span>
                    {log.error_message && (
                      <p className="text-xs text-red-400/70 mt-1 max-w-[200px] truncate">{log.error_message}</p>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Aucun email envoyé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-slate-400">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Shared UI ───────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={28} className="animate-spin text-brand-400" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
      <AlertCircle size={18} className="text-red-400" />
      <span className="text-sm text-red-300">{message}</span>
    </div>
  );
}
