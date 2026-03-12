"use client";

import React, { useState, useEffect } from "react";
import KanbanViewer from "@/components/kanban/KanbanViewer";
import { initializeProjectKanban, projectHasKanban } from "@/utils/kanban-projet-api";
import styles from "./ProgressionEditor.module.css";

interface ProgressionEditorProps {
  projectId: string;
  currentUser: any;
  progress: number;
  onProgressChange: (progress: number) => void;
}

export default function ProgressionEditor({
  projectId,
  currentUser,
  progress,
  onProgressChange,
}: ProgressionEditorProps) {
  const [hasKanban, setHasKanban] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      checkKanban();
    }
  }, [projectId]);

  const checkKanban = async () => {
    try {
      setIsLoading(true);
      const exists = await projectHasKanban(projectId);
      setHasKanban(exists);
    } catch (error) {
      console.error("Error checking kanban:", error);
      setHasKanban(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKanban = async () => {
    try {
      setIsLoading(true);
      await initializeProjectKanban(projectId);
      setHasKanban(true);
    } catch (error) {
      console.error("Error creating kanban:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className={styles.emptyState}>
        <p>Identifiant de projet manquant.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (hasKanban === false) {
    return (
      <div className={styles.emptyState}>
        <p>Aucun tableau Kanban associé à ce projet.</p>
        <button
          className={styles.createBtn}
          onClick={handleCreateKanban}
          disabled={isLoading}
        >
          Créer un tableau Kanban
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <KanbanViewer
        projectId={projectId}
        currentUser={currentUser}
        readOnly={false}
        onBoardUpdated={() => {}}
        onToast={(msg) => console.log(msg)}
      />
    </div>
  );
}