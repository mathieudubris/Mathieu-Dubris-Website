"use client";

import React, { useEffect, useState } from 'react';
import { FileText, Repeat, Kanban, Link, Book, Code, ArrowUpRight, FileX, Loader2 } from 'lucide-react';
import type { ProjectDocLink } from '@/utils/projet-api';
import { getDocLinks } from '@/utils/documentation-api';
import styles from './Documentation.module.css';

// ─────────────────────────────────────────────
// Types & constantes
// ─────────────────────────────────────────────

const ICON_MAP: Record<ProjectDocLink['icon'], React.FC<any>> = {
  'file-text': FileText,
  'repeat':    Repeat,
  'kanban':    Kanban,
  'link':      Link,
  'book':      Book,
  'code':      Code,
};

interface DocumentationProps {
  docLinks?: ProjectDocLink[];
  projectId?: string;
}

// ─────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────

const Documentation: React.FC<DocumentationProps> = ({ docLinks: initialLinks, projectId }) => {
  const [links,   setLinks]   = useState<ProjectDocLink[]>(initialLinks ?? []);
  const [loading, setLoading] = useState(!initialLinks && !!projectId);

  useEffect(() => {
    if (initialLinks) { setLinks(initialLinks); return; }
    if (!projectId) return;

    let cancelled = false;
    setLoading(true);
    getDocLinks(projectId)
      .then((l) => { if (!cancelled) setLinks(l); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId, initialLinks]);

  const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  // ── Loading ──
  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingState}>
          <Loader2 size={18} className={styles.spinner} />
          <span>Chargement…</span>
        </div>
      </div>
    );
  }

  // ── Empty ──
  if (!links || links.length === 0) {
    return (
      <div className={styles.empty}>
        <FileX size={40} className={styles.emptyIcon} />
        <p>Aucune ressource de documentation pour ce projet.</p>
      </div>
    );
  }

  // ── Grid ──
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Ressources</span>
        <span className={styles.headerBadge}>{links.length}</span>
      </div>

      <div className={styles.grid}>
        {links.map(({ id, label, fullLabel, url, icon, stat }) => {
          const Icon = ICON_MAP[icon] || FileText;
          return (
            <button
              key={id}
              className={styles.card}
              onClick={() => open(url)}
              title={url} /* ✅ L'URL s'affiche au survol via le tooltip natif */
            >
              <div className={styles.cardTop}>
                <div className={styles.iconWrap}>
                  <Icon size={15} />
                </div>
                <ArrowUpRight size={13} className={styles.arrow} />
              </div>

              <div className={styles.cardLabel}>{label}</div>

              {fullLabel && fullLabel !== label && (
                <div className={styles.cardFullLabel}>{fullLabel}</div>
              )}

              {stat && <div className={styles.cardStat}>{stat}</div>}

              {/* ✅ URL supprimée — elle débordait et n'apporte rien visuellement */}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Documentation;