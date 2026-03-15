"use client";

import React from 'react';
import { Calendar, Eye, Tag, Target, Users2, Activity, AlignLeft, Info } from 'lucide-react';
import { FullProject } from '@/utils/projet-api';
import styles from './Overview.module.css';

interface OverviewProps {
  // BUG FIX: était FirebaseProject & { projectType?; objective?; targetAudience?; status? }
  // — intersection manuelle qui ne couvrait pas description (ligne 104 rouge).
  // FullProject étend déjà Project avec tous ces champs + description.
  project: FullProject;
  views: number;
  formatDate: (date: any) => string;
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  completed: 'Terminé',
  paused: 'En pause',
  planning: 'En planification',
  archived: 'Archivé',
};

const Overview: React.FC<OverviewProps> = ({ project, views, formatDate }) => {
  return (
    <div className={styles.overview}>
      {/* Métadonnées rapides */}
      <div className={styles.projectMeta}>
        <div className={styles.metaItem}>
          <Calendar size={16} />
          <span>Créé le {formatDate(project.createdAt)}</span>
        </div>
        {project.updatedAt && (
          <div className={styles.metaItem}>
            <Calendar size={16} />
            <span>Mis à jour le {formatDate(project.updatedAt)}</span>
          </div>
        )}
        <div className={styles.metaItem}>
          <Eye size={16} />
          <span>{views} vues</span>
        </div>
      </div>

      {/* Résumé rapide */}
      <div className={styles.summaryGrid}>
        {/* Nom du projet */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <Info size={15} />
            <span>Nom du projet</span>
          </div>
          <p className={styles.summaryCardValue}>{project.title || '—'}</p>
        </div>

        {/* Type de projet */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <Tag size={15} />
            <span>Type de projet</span>
          </div>
          <p className={styles.summaryCardValue}>{project.projectType || '—'}</p>
        </div>

        {/* Statut */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <Activity size={15} />
            <span>Statut</span>
          </div>
          <p className={styles.summaryCardValue}>
            {project.status ? (STATUS_LABELS[project.status] || project.status) : '—'}
          </p>
        </div>

        {/* Public cible */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <Users2 size={15} />
            <span>Public cible</span>
          </div>
          <p className={styles.summaryCardValue}>{project.targetAudience || '—'}</p>
        </div>

        {/* Objectif */}
        <div className={`${styles.summaryCard} ${styles.summaryCardWide}`}>
          <div className={styles.summaryCardHeader}>
            <Target size={15} />
            <span>Objectif</span>
          </div>
          <p className={styles.summaryCardValue}>{project.objective || '—'}</p>
        </div>
      </div>

      {/* Description courte */}
      <div className={styles.descriptionSection}>
        <div className={styles.sectionTitleRow}>
          <AlignLeft size={16} />
          <h2 className={styles.sectionTitle}>Description</h2>
        </div>
        <p className={styles.projectDescription}>{project.description || '—'}</p>
      </div>
    </div>
  );
};

export default Overview;