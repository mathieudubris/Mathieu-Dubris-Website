"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Map, Link, GripVertical } from 'lucide-react';
import styles from './RoadmapEditor.module.css';

export interface RoadmapLink {
  id: string;
  label: string;
  url: string;
}

interface RoadmapEditorProps {
  links: RoadmapLink[];
  onLinksChange: (links: RoadmapLink[]) => void;
}

const RoadmapEditor: React.FC<RoadmapEditorProps> = ({ links, onLinksChange }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  const generateId = () => `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAdd = () => {
    setError('');

    if (!newLabel.trim()) {
      setError('Veuillez entrer un nom pour ce lien.');
      return;
    }
    if (!newUrl.trim()) {
      setError('Veuillez coller un lien.');
      return;
    }
    if (!isValidUrl(newUrl.trim())) {
      setError('Le lien ne semble pas valide. Assurez-vous qu\'il commence par https://');
      return;
    }

    const newLink: RoadmapLink = {
      id: generateId(),
      label: newLabel.trim(),
      url: newUrl.trim(),
    };

    onLinksChange([...links, newLink]);
    setNewLabel('');
    setNewUrl('');
  };

  const handleRemove = (id: string) => {
    onLinksChange(links.filter(link => link.id !== id));
  };

  const handleLabelChange = (id: string, value: string) => {
    onLinksChange(links.map(link => link.id === id ? { ...link, label: value } : link));
  };

  const handleUrlChange = (id: string, value: string) => {
    onLinksChange(links.map(link => link.id === id ? { ...link, url: value } : link));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={styles.roadmapEditor}>
      {/* En-tête explicatif */}
      <div className={styles.infoBox}>
        <Map size={16} />
        <div>
          <strong>Liens Roadmap</strong>
          <p>
            Collez des liens Notion (ou tout autre lien) pour afficher votre roadmap.
            Pour partager une page Notion : ouvrez la page → <em>Share</em> → activez <em>Share to web</em> → copiez le lien.
          </p>
        </div>
      </div>

      {/* Liste des liens existants */}
      {links.length > 0 && (
        <div className={styles.linksList}>
          {links.map((link, index) => (
            <div key={link.id} className={styles.linkItem}>
              <div className={styles.linkIndex}>
                <GripVertical size={14} />
                <span>{index + 1}</span>
              </div>
              <div className={styles.linkFields}>
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleLabelChange(link.id, e.target.value)}
                  placeholder="Nom du lien"
                  className={styles.linkLabelInput}
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleUrlChange(link.id, e.target.value)}
                  placeholder="https://notion.so/..."
                  className={styles.linkUrlInput}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(link.id)}
                className={styles.removeBtn}
                title="Supprimer ce lien"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className={styles.addSection}>
        <div className={styles.addFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Nom du lien</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Roadmap Q1 2025"
              className={styles.addInput}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <Link size={14} />
              URL (Notion ou autre)
            </label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://notion.so/..."
              className={styles.addInput}
            />
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          className={styles.addBtn}
        >
          <Plus size={16} />
          Ajouter ce lien
        </button>
      </div>

      {links.length === 0 && (
        <div className={styles.emptyState}>
          <Map size={32} />
          <p>Aucun lien roadmap pour l'instant.<br />Ajoutez votre premier lien ci-dessus.</p>
        </div>
      )}
    </div>
  );
};

export default RoadmapEditor;
