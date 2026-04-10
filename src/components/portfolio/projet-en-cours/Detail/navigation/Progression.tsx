"use client";

import React, { useState, useEffect } from "react";
import { subscribeToBoards } from "@/utils/kanban-projet-api";
import type { KanbanBoard } from "@/utils/kanban-projet-api";
import { useProjectProgress } from "@/utils/useProjectProgress";
import ProgressionBoardList from "@/components/kanban/ProgressionBoardList";
import KanbanViewer from "@/components/kanban/KanbanViewer";
import styles from "./Progression.module.css";

interface ProgressionProps {
  projectId: string;
  projectTitle: string;
  currentUser?: any;
}

// ── Bandeau résumé ────────────────────────────────────────────────────────────

const ProgressSummary: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { total, done, percent } = useProjectProgress(projectId);

  if (total === 0) return null;

  return (
    <div className={styles.summary}>
      <div className={styles.summaryTop}>
        <span className={styles.summaryLabel}>Progression globale</span>
        <span className={styles.summaryStats}>{done}/{total} tâches terminées</span>
      </div>
      <div className={styles.summaryBarTrack}>
        <div
          className={styles.summaryBarFill}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={styles.summaryPercent}>{percent}%</span>
    </div>
  );
};

// ── Progression ───────────────────────────────────────────────────────────────

export default function Progression({ projectId, projectTitle, currentUser }: ProgressionProps) {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribeToBoards(projectId, setBoards);
    return () => unsub();
  }, [projectId]);

  // Sync titre si boards changent
  useEffect(() => {
    if (selectedBoard && boards.length > 0) {
      const updated = boards.find(b => b.id === selectedBoard.id);
      if (updated && updated.title !== selectedBoard.title) {
        setSelectedBoard(updated);
      }
    }
  }, [boards]);

  if (!projectId) {
    return (
      <div className={styles.emptyState}>
        <p>Aucun projet associé.</p>
      </div>
    );
  }

  if (selectedBoard) {
    return (
      <div className={styles.wrapper}>
        <KanbanViewer
          projectId={projectId}
          board={selectedBoard}
          currentUser={currentUser ?? null}
          readOnly={true}
          onBack={() => setSelectedBoard(null)}
          onToast={showToast}
        />
        {toast && <div className={styles.toast}>{toast}</div>}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Bandeau de progression globale */}
      <ProgressSummary projectId={projectId} />

      <ProgressionBoardList
        projectId={projectId}
        boards={boards}
        readOnly={true}
        onSelectBoard={setSelectedBoard}
        onToast={showToast}
      />
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}