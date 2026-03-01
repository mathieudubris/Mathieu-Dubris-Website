// Roadmap.tsx - Version avec boutons GDD, SPRINT, KANBAN et Next.js
"use client";

import React from 'react';
import { FileText, Repeat, Kanban, ExternalLink } from 'lucide-react';
import styles from './Roadmap.module.css';

interface RoadmapProps {
  // On garde la prop pour compatibilité, mais on ne l'utilise plus
  roadmapLinks?: any[];
}

const Roadmap: React.FC<RoadmapProps> = () => {
  // Liens fixes pour les différents boutons
  const buttons = [
    {
      id: 'gdd',
      label: 'GDD',
      fullLabel: 'Game Design Document',
      url: 'https://docs.google.com/document/d/1exemple_gdd', // À remplacer par le vrai lien
      icon: FileText,
      color: '#10b981' // Vert
    },
    {
      id: 'sprint',
      label: 'SPRINT',
      fullLabel: 'Sprint Planning',
      url: 'https://docs.google.com/document/d/1exemple_sprint', // À remplacer par le vrai lien
      icon: Repeat,
      color: '#f59e0b' // Orange
    },
    {
      id: 'kanban',
      label: 'KANBAN',
      fullLabel: 'Tableau Kanban',
      url: 'https://docs.google.com/document/d/1exemple_kanban', // À remplacer par le vrai lien
      icon: Kanban,
      color: '#6366f1' // Indigo
    },
    {
      id: 'nextjs',
      label: 'NEXT JS',
      fullLabel: 'Documentation Next.js',
      url: 'https://nextjs.org/docs', // Lien Next.js
      icon: ExternalLink,
      color: '#ffffff' // Blanc
    }
  ];

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.roadmap}>
      {/* Header avec le titre */}
      <div className={styles.iframeHeader}>
        <div className={styles.iframeTitle}>
          <FileText size={15} />
          <span>Ressources du projet</span>
        </div>
      </div>

      {/* Boutons de navigation */}
      <div className={styles.buttonsContainer}>
        {buttons.map((button) => {
          const Icon = button.icon;
          return (
            <button
              key={button.id}
              className={styles.navButton}
              onClick={() => openInNewTab(button.url)}
              style={{ '--button-color': button.color } as React.CSSProperties}
              title={button.fullLabel}
            >
              <Icon size={18} />
              <span>{button.label}</span>
            </button>
          );
        })}
      </div>

      {/* Description des ressources */}
      <div className={styles.descriptionContainer}>
        <p className={styles.description}>
          Accédez rapidement aux ressources essentielles du projet :
        </p>
        <ul className={styles.resourcesList}>
          <li>
            <strong>GDD</strong> : Document de conception du jeu
          </li>
          <li>
            <strong>SPRINT</strong> : Planning et objectifs du sprint
          </li>
          <li>
            <strong>KANBAN</strong> : Suivi des tâches et progression
          </li>
          <li>
            <strong>NEXT JS</strong> : Documentation officielle
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Roadmap;