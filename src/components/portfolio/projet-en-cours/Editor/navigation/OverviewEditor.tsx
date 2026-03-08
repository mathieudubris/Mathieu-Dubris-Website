"use client";

import React, { useEffect, useState } from 'react';
import { Info, Link, Tag, Target, Users2, Activity, Calendar, Eye } from 'lucide-react';
import { generateSlug } from '@/utils/projet-api';
import { Timestamp } from 'firebase/firestore';
import styles from './OverviewEditor.module.css';

const PROJECT_TYPES = [
  'Jeu vidéo',
  'Site web',
  'Application mobile',
  'Application desktop',
  'Outil / utilitaire',
  'API / Backend',
  'Design / UI',
  'Autre',
];

const STATUS_OPTIONS = [
  { value: 'planning',    label: 'En planification' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'paused',      label: 'En pause' },
  { value: 'completed',   label: 'Terminé' },
  { value: 'archived',    label: 'Archivé' },
];

interface OverviewEditorProps {
  title: string;
  slug: string;
  description: string;
  projectType?: string;
  objective?: string;
  targetAudience?: string;
  status?: string;
  views?: number;
  onViewsChange?: (value: number) => void;
  createdAt?: any;
  updatedAt?: any;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onProjectTypeChange: (value: string) => void;
  onObjectiveChange: (value: string) => void;
  onTargetAudienceChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCreatedAtChange: (value: any) => void;
  onUpdatedAtChange: (value: any) => void;
  isNewProject: boolean;
}

/** Convert a Firestore Timestamp or Date to yyyy-MM-dd for <input type="date"> */
function toDateInputValue(date: any): string {
  if (!date) return '';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/** Convert yyyy-MM-dd string to Firestore Timestamp */
function fromDateInputValue(value: string): any {
  if (!value) return null;
  return Timestamp.fromDate(new Date(value));
}

const OverviewEditor: React.FC<OverviewEditorProps> = ({
  title,
  slug,
  description,
  projectType = '',
  objective = '',
  targetAudience = '',
  status = 'in_progress',
  views = 0,
  onViewsChange,
  createdAt,
  updatedAt,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  onProjectTypeChange,
  onObjectiveChange,
  onTargetAudienceChange,
  onStatusChange,
  onCreatedAtChange,
  onUpdatedAtChange,
  isNewProject,
}) => {
  const [localSlug, setLocalSlug] = useState(slug);
  const [isEditingSlug, setIsEditingSlug] = useState(false);

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
    <div className={styles.overviewEditor}>

      {/* ── Titre ── */}
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
        <p className={styles.fieldHint}>Le titre doit être clair et descriptif</p>
      </div>

      {/* ── Slug/URL ── */}
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
        <p className={styles.fieldHint}>L'URL est générée automatiquement à partir du titre</p>
      </div>

      {/* ── Type de projet ── */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <Tag size={16} />
          <span>Type de projet</span>
        </label>
        <select
          value={projectType}
          onChange={(e) => onProjectTypeChange(e.target.value)}
          className={styles.selectInput}
        >
          <option value="">— Sélectionner un type —</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* ── Statut ── */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <Activity size={16} />
          <span>Statut du projet</span>
        </label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className={styles.selectInput}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Objectif ── */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <Target size={16} />
          <span>Objectif du projet</span>
        </label>
        <input
          type="text"
          value={objective}
          onChange={(e) => onObjectiveChange(e.target.value)}
          placeholder="Ex: Créer un jeu de plateforme 2D multijoueur"
          className={styles.titleInput}
        />
      </div>

      {/* ── Public cible ── */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <Users2 size={16} />
          <span>Public cible</span>
        </label>
        <input
          type="text"
          value={targetAudience}
          onChange={(e) => onTargetAudienceChange(e.target.value)}
          placeholder="Ex: Gamers 15–30 ans, développeurs indépendants…"
          className={styles.titleInput}
        />
      </div>

      {/* ── Description ── */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <Info size={16} />
          <span>Description courte</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Décrivez votre projet en détail..."
          className={styles.descriptionInput}
          required
          rows={6}
        />
        <p className={styles.fieldHint}>
          {description.length} caractères — Si quelqu'un ne lit qu'une seule partie, c'est celle-ci.
        </p>
      </div>

      {/* ── Vues ── */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <Eye size={16} />
          <span>Nombre de vues</span>
        </label>
        <div className={styles.viewsRow}>
          <input
            type="number"
            min={0}
            value={views}
            onChange={(e) => onViewsChange?.(Math.max(0, parseInt(e.target.value) || 0))}
            className={styles.viewsInput}
          />
          <p className={styles.fieldHint} style={{ margin: 0 }}>
            Modifie le compteur affiché publiquement
          </p>
        </div>
      </div>

      {/* ── Dates ── */}
      <div className={styles.datesRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <Calendar size={16} />
            <span>Date de création</span>
          </label>
          <input
            type="date"
            value={toDateInputValue(createdAt)}
            onChange={(e) => onCreatedAtChange(fromDateInputValue(e.target.value))}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <Calendar size={16} />
            <span>Dernière mise à jour</span>
          </label>
          <input
            type="date"
            value={toDateInputValue(updatedAt)}
            onChange={(e) => onUpdatedAtChange(fromDateInputValue(e.target.value))}
            className={styles.dateInput}
          />
        </div>
      </div>

    </div>
  );
};

export default OverviewEditor;