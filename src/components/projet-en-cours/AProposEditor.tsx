"use client";

import React, { useEffect, useState } from 'react';
import { Info, Link } from 'lucide-react';
import { generateSlug } from '@/utils/firebase-api';
import styles from './AProposEditor.module.css';

interface AProposEditorProps {
  title: string;
  slug: string;
  description: string;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  isNewProject: boolean;
}

const AProposEditor: React.FC<AProposEditorProps> = ({
  title,
  slug,
  description,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  isNewProject
}) => {
  const [localSlug, setLocalSlug] = useState(slug);
  const [isEditingSlug, setIsEditingSlug] = useState(false);

  // Générer automatiquement le slug quand le titre change (uniquement pour les nouveaux projets)
  useEffect(() => {
    if (isNewProject && title && !isEditingSlug) {
      const generatedSlug = generateSlug(title);
      setLocalSlug(generatedSlug);
      onSlugChange(generatedSlug);
    }
  }, [title, isNewProject, isEditingSlug, onSlugChange]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setLocalSlug(value);
    onSlugChange(value);
  };

  const handleSlugBlur = () => {
    setIsEditingSlug(false);
    if (!localSlug.trim() && title) {
      const generatedSlug = generateSlug(title);
      setLocalSlug(generatedSlug);
      onSlugChange(generatedSlug);
    }
  };

  return (
    <div className={styles.aProposEditor}>
      {/* Titre */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <Info size={16} />
          <span>Titre du projet</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ex: Mon Projet de Jeu"
          className={styles.titleInput}
          required
        />
        <p className={styles.fieldHint}>
          Le titre doit être clair et descriptif
        </p>
      </div>

      {/* Slug/URL */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <Link size={16} />
          <span>URL du projet</span>
        </label>
        <div className={styles.slugContainer}>
          <span className={styles.slugPrefix}>/portfolio/projet-en-cours?project=</span>
          <input
            type="text"
            value={localSlug}
            onChange={handleSlugChange}
            onFocus={() => setIsEditingSlug(true)}
            onBlur={handleSlugBlur}
            placeholder="mon-projet"
            className={styles.slugInput}
          />
        </div>
        <p className={styles.fieldHint}>
          L'URL est générée automatiquement à partir du titre
        </p>
      </div>

      {/* Description */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          Description du projet
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Décrivez votre projet en détail..."
          className={styles.descriptionInput}
          required
          rows={8}
        />
        <p className={styles.fieldHint}>
          {description.length} caractères - Une description détaillée aide à présenter votre projet
        </p>
      </div>
    </div>
  );
};

export default AProposEditor;