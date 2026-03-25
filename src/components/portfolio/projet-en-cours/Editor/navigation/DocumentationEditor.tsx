"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText, Repeat, Kanban, Link, Book, Code,
  Plus, X, Edit2, Check, ExternalLink, Loader2, AlertCircle,
} from 'lucide-react';
import type { ProjectDocLink } from '@/utils/projet-api';
import { getDocLinks, saveDocLinks } from '@/utils/documentation-api';
import styles from './DocumentationEditor.module.css';

// ─────────────────────────────────────────────
// Types & constantes
// ─────────────────────────────────────────────

interface DocumentationEditorProps {
  /** ID du projet (slug ou uid Firestore). Requis pour la sauvegarde. */
  projectId: string;
  /**
   * Liste initiale de liens. Si fournie, elle est utilisée comme valeur
   * de départ sans déclencher un fetch Firestore supplémentaire.
   * Sinon le composant charge lui-même via getDocLinks().
   */
  initialDocLinks?: ProjectDocLink[];
  /** Callback appelé après chaque sauvegarde réussie pour synchroniser le parent. */
  onDocLinksChange?: (links: ProjectDocLink[]) => void;
}

export const ICON_OPTIONS: { value: ProjectDocLink['icon']; label: string; icon: React.FC<any> }[] = [
  { value: 'file-text', label: 'Document',  icon: FileText },
  { value: 'book',      label: 'Guide',     icon: Book     },
  { value: 'code',      label: 'Code',      icon: Code     },
  { value: 'repeat',    label: 'Sprint',    icon: Repeat   },
  { value: 'kanban',    label: 'Kanban',    icon: Kanban   },
  { value: 'link',      label: 'Lien',      icon: Link     },
];

const EMPTY_FORM = (): Partial<ProjectDocLink> => ({
  label: '', fullLabel: '', url: '', icon: 'file-text', stat: '',
});

// ─────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────

const DocumentationEditor: React.FC<DocumentationEditorProps> = ({
  projectId,
  initialDocLinks,
  onDocLinksChange,
}) => {
  // ── State ──────────────────────────────────
  const [docLinks,    setDocLinks]    = useState<ProjectDocLink[]>(initialDocLinks ?? []);
  const [loading,     setLoading]     = useState(!initialDocLinks);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null);

  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState<Partial<ProjectDocLink>>(EMPTY_FORM());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm,     setAddForm]     = useState<Partial<ProjectDocLink>>(EMPTY_FORM());

  // ── Chargement initial ─────────────────────
  useEffect(() => {
    if (initialDocLinks) return; // déjà fourni via props
    if (!projectId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getDocLinks(projectId)
      .then((links) => { if (!cancelled) setDocLinks(links); })
      .catch(() => { if (!cancelled) setError('Impossible de charger la documentation.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId, initialDocLinks]);

  // ── Sauvegarde Firestore ───────────────────
  const persist = async (links: ProjectDocLink[]) => {
    if (!projectId) {
      setError('projectId manquant — impossible de sauvegarder.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveDocLinks(projectId, links);
      setDocLinks(links);
      onDocLinksChange?.(links); // ✅ synchronise le parent (ProjetEditor)
      flashSuccess('Sauvegardé !');
    } catch {
      setError('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // ── Handlers CRUD ──────────────────────────
  const handleEditLink = (link: ProjectDocLink) => {
    setEditingId(link.id);
    setEditForm({ ...link });
    setShowAddForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.label?.trim() || !editForm.url?.trim()) return;
    const updated = docLinks.map((l) =>
      l.id === editingId ? ({ ...l, ...editForm } as ProjectDocLink) : l
    );
    setEditingId(null);
    setEditForm(EMPTY_FORM());
    await persist(updated);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM());
  };

  const handleDeleteLink = async (id: string) => {
    const updated = docLinks.filter((l) => l.id !== id);
    if (editingId === id) { setEditingId(null); setEditForm(EMPTY_FORM()); }
    await persist(updated);
  };

  const handleAddLink = async () => {
    if (!addForm.label?.trim() || !addForm.url?.trim()) return;
    const newLink: ProjectDocLink = {
      id:        `doc_${Date.now()}`,
      label:     addForm.label.trim(),
      fullLabel: addForm.fullLabel?.trim() || addForm.label.trim(),
      url:       addForm.url.trim(),
      icon:      addForm.icon || 'file-text',
      stat:      addForm.stat?.trim() || undefined,
    };
    setAddForm(EMPTY_FORM());
    setShowAddForm(false);
    await persist([...docLinks, newLink]);
  };

  // ── Rendu ──────────────────────────────────
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Loader2 size={20} className={styles.spinner} />
          <span>Chargement de la documentation…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* ── En-tête ── */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          <FileText size={16} />
          Documentation
          <span className={styles.badge}>{docLinks.length}</span>
        </h3>
        <div className={styles.headerRight}>
          {saving && <Loader2 size={14} className={styles.spinner} />}
          {successMsg && <span className={styles.successMsg}>{successMsg}</span>}
          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className={styles.addBtn}
            disabled={saving}
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* ── Erreur globale ── */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={14} /> {error}
          <button type="button" onClick={() => setError(null)} className={styles.errorClose}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Formulaire d'ajout ── */}
      {showAddForm && (
        <div className={styles.addForm}>
          <div className={styles.formRow}>
            <input
              type="text"
              value={addForm.label || ''}
              onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
              className={styles.input}
              placeholder="Nom court (ex: GDD)"
              autoFocus
            />
            <input
              type="text"
              value={addForm.fullLabel || ''}
              onChange={(e) => setAddForm({ ...addForm, fullLabel: e.target.value })}
              className={styles.input}
              placeholder="Nom complet (ex: Game Design Document)"
            />
          </div>
          <input
            type="url"
            value={addForm.url || ''}
            onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
            className={styles.input}
            placeholder="URL (https://…)"
          />
          <div className={styles.formRow}>
            <div className={styles.iconSelector}>
              {ICON_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.iconOption} ${addForm.icon === value ? styles.iconOptionActive : ''}`}
                  onClick={() => setAddForm({ ...addForm, icon: value })}
                  title={label}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <input
              type="text"
              value={addForm.stat || ''}
              onChange={(e) => setAddForm({ ...addForm, stat: e.target.value })}
              className={styles.input}
              placeholder="Stat (ex: 12 pages)"
            />
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleAddLink}
              className={styles.saveBtn}
              disabled={saving || !addForm.label?.trim() || !addForm.url?.trim()}
            >
              {saving ? <Loader2 size={13} className={styles.spinner} /> : <Check size={13} />}
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM()); }}
              className={styles.cancelBtn}
              disabled={saving}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Liste vide ── */}
      {docLinks.length === 0 && !showAddForm ? (
        <div className={styles.empty}>
          <FileText size={36} />
          <p>Aucune ressource documentaire</p>
          <span>Ajoutez des liens vers vos GDD, sprints, wikis…</span>
        </div>
      ) : (
        <div className={styles.linksList}>
          {docLinks.map((link) => {
            const IconComp = ICON_OPTIONS.find((i) => i.value === link.icon)?.icon || FileText;

            return (
              <div
                key={link.id}
                className={`${styles.linkItem} ${editingId === link.id ? styles.editing : ''}`}
              >
                {editingId === link.id ? (
                  // ── Édition inline ──
                  <div className={styles.editInline}>
                    <div className={styles.formRow}>
                      <input
                        type="text"
                        value={editForm.label || ''}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        className={styles.input}
                        placeholder="Nom court"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editForm.fullLabel || ''}
                        onChange={(e) => setEditForm({ ...editForm, fullLabel: e.target.value })}
                        className={styles.input}
                        placeholder="Nom complet"
                      />
                    </div>
                    <input
                      type="url"
                      value={editForm.url || ''}
                      onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      className={styles.input}
                      placeholder="URL"
                    />
                    <div className={styles.formRow}>
                      <div className={styles.iconSelector}>
                        {ICON_OPTIONS.map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            className={`${styles.iconOption} ${editForm.icon === value ? styles.iconOptionActive : ''}`}
                            onClick={() => setEditForm({ ...editForm, icon: value })}
                            title={label}
                          >
                            <Icon size={14} />
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={editForm.stat || ''}
                        onChange={(e) => setEditForm({ ...editForm, stat: e.target.value })}
                        className={styles.input}
                        placeholder="Stat (ex: 12 pages)"
                      />
                    </div>
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className={styles.saveBtn}
                        disabled={saving || !editForm.label?.trim() || !editForm.url?.trim()}
                      >
                        {saving
                          ? <Loader2 size={13} className={styles.spinner} />
                          : <Check size={13} />}
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className={styles.cancelBtn}
                        disabled={saving}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── Affichage ──
                  <>
                    <div className={styles.linkIcon}>
                      <IconComp size={15} />
                    </div>
                    <div className={styles.linkInfo}>
                      <span className={styles.linkLabel}>{link.label}</span>
                      {link.fullLabel && link.fullLabel !== link.label && (
                        <span className={styles.linkFullLabel}>{link.fullLabel}</span>
                      )}
                      {link.stat && <span className={styles.linkStat}>{link.stat}</span>}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkUrl}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={10} />
                        {link.url.length > 45 ? link.url.slice(0, 45) + '…' : link.url}
                      </a>
                    </div>
                    <div className={styles.linkActions}>
                      <button
                        type="button"
                        onClick={() => handleEditLink(link)}
                        className={styles.editBtn}
                        title="Modifier"
                        disabled={saving}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(link.id)}
                        className={styles.deleteBtn}
                        title="Supprimer"
                        disabled={saving}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className={styles.hint}>
        Centralisez tous vos liens : GDD, wiki, sprints, boards externes…
      </p>
    </div>
  );
};

export default DocumentationEditor;