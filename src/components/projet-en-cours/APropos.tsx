"use client";

import React from 'react';
import { Calendar, Eye, Users } from 'lucide-react';
import { Project as FirebaseProject } from '@/utils/firebase-api';
import styles from './APropos.module.css';

interface AProposProps {
  project: FirebaseProject;
  views: number;
  formatDate: (date: any) => string;
}

const APropos: React.FC<AProposProps> = ({ project, views, formatDate }) => {
  return (
    <div className={styles.aPropos}>
      {/* Métadonnées du projet */}
      <div className={styles.projectMeta}>
        <div className={styles.metaItem}>
          <Calendar size={16} />
          <span>{formatDate(project.createdAt)}</span>
        </div>
        <div className={styles.metaItem}>
          <Eye size={16} />
          <span>{views} vues</span>
        </div>
        <div className={styles.metaItem}>
          <Users size={16} />
          <span>{(project.teamMembers || []).length} membre(s)</span>
        </div>
      </div>

      {/* Description */}
      <div className={styles.descriptionSection}>
        <h2 className={styles.sectionTitle}>Description du projet</h2>
        <p className={styles.projectDescription}>{project.description}</p>
      </div>

      {/* NOTE: La section technologies a été supprimée car elle n'existe pas dans l'interface Project */}
      {/* Si vous avez besoin d'afficher des technologies, utilisez project.software ou project.categories */}
    </div>
  );
};

export default APropos;