"use client";

import React, { useEffect, useState } from 'react';
import { Clock, Link2, Unlink, Layout, Check, ExternalLink } from 'lucide-react';
import { getBoards } from '@/utils/kanban-api';
import type { KanbanBoard } from '@/utils/kanban-api';
import styles from './ProgressionEditor.module.css';

interface ProgressionEditorProps {
  kanbanBoardId?: string | null;
  onKanbanBoardChange: (boardId: string | null) => void;
  currentUser: any;
  progress: number;
  onProgressChange: (progress: number) => void;
}

const ProgressionEditor: React.FC<ProgressionEditorProps> = ({
  kanbanBoardId,
  onKanbanBoardChange,
  currentUser,
  progress,
  onProgressChange,
}) => {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(kanbanBoardId || '');

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    getBoards(currentUser.uid)
      .then(setBoards)
      .finally(() => setLoading(false));
  }, [currentUser]);

  useEffect(() => {
    setSelectedId(kanbanBoardId || '');
  }, [kanbanBoardId]);

  const handleLink = () => {
    if (!selectedId) return;
    onKanbanBoardChange(selectedId);
  };

  const handleUnlink = () => {
    setSelectedId('');
    onKanbanBoardChange(null);
  };

  const linkedBoard = boards.find((b) => b.id === kanbanBoardId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Clock size={16} />
          Progression
        </h3>
      </div>

      {/* Progression manuelle */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Progression globale du projet</label>
        <div className={styles.progressRow}>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => onProgressChange(parseInt(e.target.value))}
            className={styles.progressSlider}
          />
          <span className={styles.progressValue}>{progress}%</span>
        </div>
        <div className={styles.progressBarPreview}>
          <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.divider} />

      {/* Lien Kanban */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          <Layout size={14} />
          Tableau Kanban associé
        </label>
        <p className={styles.sectionHint}>
          Liez un tableau Kanban pour afficher automatiquement la progression des tâches dans l'onglet Progression.
        </p>

        {kanbanBoardId && linkedBoard ? (
          <div className={styles.linkedBoard}>
            <div className={styles.linkedBoardInfo}>
              <Layout size={14} />
              <div>
                <span className={styles.linkedBoardTitle}>{linkedBoard.title}</span>
                {linkedBoard.description && (
                  <span className={styles.linkedBoardDesc}>{linkedBoard.description}</span>
                )}
              </div>
              <Check size={14} className={styles.linkedCheck} />
            </div>
            <button type="button" onClick={handleUnlink} className={styles.unlinkBtn}>
              <Unlink size={13} />
              Délier
            </button>
          </div>
        ) : (
          <div className={styles.linkSection}>
            {loading ? (
              <span className={styles.loadingText}>Chargement des tableaux...</span>
            ) : boards.length === 0 ? (
              <div className={styles.noBoards}>
                <Layout size={20} />
                <span>Aucun tableau Kanban créé pour l'instant.</span>
              </div>
            ) : (
              <>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={styles.boardSelect}
                >
                  <option value="">— Choisir un tableau —</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleLink}
                  disabled={!selectedId}
                  className={styles.linkBtn}
                >
                  <Link2 size={13} />
                  Lier ce tableau
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className={styles.hint}>
        La progression via Kanban est calculée automatiquement à partir des tâches terminées. La barre manuelle est utilisée comme indicateur général.
      </p>
    </div>
  );
};

export default ProgressionEditor;
