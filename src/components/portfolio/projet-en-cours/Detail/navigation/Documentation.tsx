"use client";

import React from 'react';
import { FileText, Repeat, Kanban, Link, Book, Code, ArrowUpRight, FileX } from 'lucide-react';
import type { ProjectDocLink } from '@/utils/projet-api';
import styles from './Documentation.module.css';

interface DocumentationProps {
  docLinks: ProjectDocLink[];
}

const ICON_MAP: Record<ProjectDocLink['icon'], React.FC<any>> = {
  'file-text': FileText,
  'repeat': Repeat,
  'kanban': Kanban,
  'link': Link,
  'book': Book,
  'code': Code,
};

const Documentation: React.FC<DocumentationProps> = ({ docLinks }) => {
  const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  if (!docLinks || docLinks.length === 0) {
    return (
      <div className={styles.empty}>
        <FileX size={40} className={styles.emptyIcon} />
        <p>Aucune ressource de documentation pour ce projet.</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Ressources</span>
        <span className={styles.headerBadge}>Projet</span>
      </div>

      <div className={styles.grid}>
        {docLinks.map(({ id, label, fullLabel, url, icon, stat }) => {
          const Icon = ICON_MAP[icon] || FileText;
          return (
            <button
              key={id}
              className={styles.card}
              onClick={() => open(url)}
              title={fullLabel || label}
            >
              <div className={styles.cardTop}>
                <div className={styles.iconWrap}>
                  <Icon size={16} />
                </div>
                <ArrowUpRight size={14} className={styles.arrow} />
              </div>
              <div className={styles.cardLabel}>{label}</div>
              {stat && <div className={styles.cardStat}>{stat}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Documentation;