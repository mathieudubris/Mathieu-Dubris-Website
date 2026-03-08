"use client";

import React, { useState } from 'react';
import { FileText, Repeat, Kanban, Link, Book, Code, Plus, X, Edit2, Check, ExternalLink } from 'lucide-react';
import type { ProjectDocLink } from '@/utils/projet-api';
import styles from './DocumentationEditor.module.css';

interface DocumentationEditorProps {
  docLinks: ProjectDocLink[];
  onDocLinksChange: (links: ProjectDocLink[]) => void;
}

const ICON_OPTIONS: { value: ProjectDocLink['icon']; label: string; icon: React.FC<any> }[] = [
  { value: 'file-text', label: 'Document', icon: FileText },
  { value: 'book', label: 'Guide', icon: Book },
  { value: 'code', label: 'Code', icon: Code },
  { value: 'repeat', label: 'Sprint', icon: Repeat },
  { value: 'kanban', label: 'Kanban', icon: Kanban },
  { value: 'link', label: 'Lien', icon: Link },
];

const EMPTY_FORM = (): Partial<ProjectDocLink> => ({
  label: '',
  fullLabel: '',
  url: '',
  icon: 'file-text',
  stat: '',
});

const DocumentationEditor: React.FC<DocumentationEditorProps> = ({ docLinks, onDocLinksChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProjectDocLink>>(EMPTY_FORM());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Partial<ProjectDocLink>>(EMPTY_FORM());

  const handleEditLink = (link: ProjectDocLink) => {
    setEditingId(link.id);
    setEditForm({ ...link });
    setShowAddForm(false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editForm.label?.trim() || !editForm.url?.trim()) return;
    onDocLinksChange(
      docLinks.map((l) => (l.id === editingId ? ({ ...l, ...editForm } as ProjectDocLink) : l))
    );
    setEditingId(null);
    setEditForm(EMPTY_FORM());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM());
  };

  const handleDeleteLink = (id: string) => {
    onDocLinksChange(docLinks.filter((l) => l.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditForm(EMPTY_FORM());
    }
  };

  const handleAddLink = () => {
    if (!addForm.label?.trim() || !addForm.url?.trim()) return;
    const newLink: ProjectDocLink = {
      id: `doc_${Date.now()}`,
      label: addForm.label.trim(),
      fullLabel: addForm.fullLabel?.trim() || addForm.label.trim(),
      url: addForm.url.trim(),
      icon: addForm.icon || 'file-text',
      stat: addForm.stat?.trim() || undefined,
    };
    onDocLinksChange([...docLinks, newLink]);
    setAddForm(EMPTY_FORM());
    setShowAddForm(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <FileText size={16} />
          Documentation ({docLinks.length} ressources)
        </h3>
        <button
          type="button"
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
          className={styles.addBtn}
        >
          <Plus size={14} />
          Ajouter un lien
        </button>
      </div>

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
            placeholder="URL (https://...)"
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
            <button type="button" onClick={handleAddLink} className={styles.saveBtn}>
              <Check size={13} /> Ajouter
            </button>
            <button type="button" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM()); }} className={styles.cancelBtn}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {docLinks.length === 0 && !showAddForm ? (
        <div className={styles.empty}>
          <FileText size={36} />
          <p>Aucune ressource documentaire</p>
          <span>Ajoutez des liens vers vos GDD, sprints, wikis...</span>
        </div>
      ) : (
        <div className={styles.linksList}>
          {docLinks.map((link) => {
            const IconComp = ICON_OPTIONS.find((i) => i.value === link.icon)?.icon || FileText;

            return (
              <div key={link.id} className={`${styles.linkItem} ${editingId === link.id ? styles.editing : ''}`}>
                {editingId === link.id ? (
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
                      <button type="button" onClick={handleSaveEdit} className={styles.saveBtn}>
                        <Check size={13} /> Enregistrer
                      </button>
                      <button type="button" onClick={handleCancelEdit} className={styles.cancelBtn}>
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
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
                        {link.url.length > 40 ? link.url.slice(0, 40) + '…' : link.url}
                      </a>
                    </div>
                    <div className={styles.linkActions}>
                      <button
                        type="button"
                        onClick={() => handleEditLink(link)}
                        className={styles.editBtn}
                        title="Modifier"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(link.id)}
                        className={styles.deleteBtn}
                        title="Supprimer"
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
        Centralisez tous vos liens de documentation : GDD, wiki, sprints, boards externes...
      </p>
    </div>
  );
};

export default DocumentationEditor;