"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { subscribeToBoards } from "@/utils/kanban-projet-api";
import type { KanbanBoard } from "@/utils/kanban-projet-api";
import ProgressionBoardList from "@/components/kanban/ProgressionBoardList";
import styles from "./ProgressionEditor.module.css";

// Import dynamique pour éviter les erreurs SSR
const KanbanViewer = dynamic(
  () => import('@/components/kanban/KanbanViewer'),
  { ssr: false }
);

interface ProgressionEditorProps {
  projectId: string;
  currentUser: any;
  // progress et onProgressChange retirés — non nécessaires
}

export default function ProgressionEditor({
  projectId,
  currentUser,
}: ProgressionEditorProps) {
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

  // Quand les boards changent (ex: rename), mettre à jour selectedBoard
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
        <p>Identifiant de projet manquant.</p>
      </div>
    );
  }

  // Vue Kanban d'un board
  if (selectedBoard) {
    return (
      <div className={styles.wrapper}>
        <KanbanViewer
          projectId={projectId}
          board={selectedBoard}
          currentUser={currentUser}
          readOnly={false}
          onBack={() => setSelectedBoard(null)}
          onToast={showToast}
        />
        {toast && <div className={styles.toast}>{toast}</div>}
      </div>
    );
  }

  // Vue liste des boards
  return (
    <div className={styles.wrapper}>
      <ProgressionBoardList
        projectId={projectId}
        boards={boards}
        readOnly={false}
        onSelectBoard={setSelectedBoard}
        onToast={showToast}
      />
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}