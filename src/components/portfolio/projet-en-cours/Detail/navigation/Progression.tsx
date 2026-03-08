"use client";

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, Circle, AlertCircle, Link2, BarChart3, Lock } from 'lucide-react';
import { subscribeToBoard } from '@/utils/kanban-api';
import type { KanbanCard, KanbanColumn } from '@/utils/kanban-api';
import styles from './Progression.module.css';

interface ProgressionProps {
  kanbanBoardId?: string | null;
  projectTitle?: string;
}

const COLUMN_ORDER = ['todo', 'inprogress', 'review', 'blocked', 'done'];

const COLUMN_META: Record<string, { label: string; color: string }> = {
  todo: { label: 'À faire', color: 'var(--line)' },
  inprogress: { label: 'En cours', color: 'var(--primary)' },
  review: { label: 'En révision', color: 'var(--line)' },
  blocked: { label: 'Blocage', color: 'var(--dark-red)' },
  done: { label: 'Terminé', color: 'var(--primary)' },
};

const Progression: React.FC<ProgressionProps> = ({ kanbanBoardId, projectTitle }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!kanbanBoardId) return;

    setLoading(true);
    setPermissionDenied(false);

    // subscribeToBoard utilise onSnapshot — on doit intercepter les erreurs
    // de permission pour éviter que Firebase les logue en console
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToBoard(
        kanbanBoardId,
        (cols) => {
          setColumns(cols);
          setLoading(false);
        },
        (cds) => {
          setCards(cds);
        },
        // Callback d'erreur optionnel — voir kanban-api.ts
        (error: Error) => {
          setLoading(false);
          if (
            error.message?.includes('permission-denied') ||
            error.message?.includes('Missing or insufficient permissions')
          ) {
            setPermissionDenied(true);
          }
        }
      );
    } catch (err) {
      setLoading(false);
      setPermissionDenied(true);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [kanbanBoardId]);

  if (!kanbanBoardId) {
    return (
      <div className={styles.empty}>
        <Link2 size={40} className={styles.emptyIcon} />
        <p>Aucun tableau Kanban lié à ce projet.</p>
        <span>Associez un Kanban dans l'éditeur pour suivre la progression.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Chargement de la progression...</span>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className={styles.empty}>
        <Lock size={40} className={styles.emptyIcon} />
        <p>Accès restreint</p>
        <span>Vous devez être membre du tableau pour voir la progression.</span>
      </div>
    );
  }

  const total = cards.length;
  const done = cards.filter((c) => {
    const col = columns.find((col) => col.id === c.columnId);
    return col?.title === 'Terminé';
  }).length;
  const globalPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  const getColCards = (colId: string) =>
    cards.filter((c) => c.columnId === colId).sort((a, b) => a.position - b.position);

  const sortedColumns = [...columns].sort((a, b) => {
    const ai = COLUMN_ORDER.indexOf(Object.keys(COLUMN_META).find(k => COLUMN_META[k].label === a.title) || '');
    const bi = COLUMN_ORDER.indexOf(Object.keys(COLUMN_META).find(k => COLUMN_META[k].label === b.title) || '');
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className={styles.container}>
      <div className={styles.globalProgress}>
        <div className={styles.globalHeader}>
          <BarChart3 size={16} className={styles.globalIcon} />
          <span className={styles.globalLabel}>Progression globale</span>
          <span className={styles.globalPercent}>{globalPercent}%</span>
        </div>
        <div className={styles.globalBar}>
          <div className={styles.globalBarFill} style={{ width: `${globalPercent}%` }} />
        </div>
        <div className={styles.globalStats}>
          <span>{done} terminée{done > 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{total - done} restante{total - done > 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{total} tâche{total > 1 ? 's' : ''} au total</span>
        </div>
      </div>

      <div className={styles.columnsGrid}>
        {sortedColumns.map((col) => {
          const colCards = getColCards(col.id!);
          const meta = Object.values(COLUMN_META).find(m => m.label === col.title) || { label: col.title, color: 'var(--line)' };

          return (
            <div key={col.id} className={styles.columnBlock}>
              <div className={styles.columnHeader}>
                <div className={styles.columnDot} style={{ backgroundColor: meta.color }} />
                <span className={styles.columnTitle}>{col.title}</span>
                <span className={styles.columnCount}>{colCards.length}</span>
              </div>

              {colCards.length === 0 ? (
                <div className={styles.emptyColumn}>Aucune tâche</div>
              ) : (
                <ul className={styles.cardList}>
                  {colCards.map((card) => {
                    const isDone = col.title === 'Terminé';
                    const isBlocked = col.title === 'Blocage';
                    return (
                      <li key={card.id} className={`${styles.cardItem} ${isDone ? styles.cardDone : ''} ${isBlocked ? styles.cardBlocked : ''}`}>
                        {isDone ? (
                          <CheckCircle2 size={12} className={styles.cardIcon} style={{ color: 'var(--primary)' }} />
                        ) : isBlocked ? (
                          <AlertCircle size={12} className={styles.cardIcon} style={{ color: 'var(--dark-red)' }} />
                        ) : (
                          <Circle size={12} className={styles.cardIcon} />
                        )}
                        <span>{card.title}</span>
                        {card.checklist.length > 0 && (
                          <span className={styles.checkBadge}>
                            {card.checklist.filter(c => c.done).length}/{card.checklist.length}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Progression;