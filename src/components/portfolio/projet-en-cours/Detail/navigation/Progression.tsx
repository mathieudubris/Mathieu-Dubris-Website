"use client";

import React, { useState, useEffect } from "react";
import { subscribeToBoards } from "@/utils/kanban-projet-api";
import type { KanbanBoard } from "@/utils/kanban-projet-api";
import ProgressionBoardList from "@/components/kanban/ProgressionBoardList";
import KanbanViewer from "@/components/kanban/KanbanViewer";
import styles from "./Progression.module.css";

interface ProgressionProps {
  projectId: string;
  projectTitle: string;
  currentUser?: any;
}

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