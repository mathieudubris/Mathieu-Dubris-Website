"use client";

import React from "react";
import KanbanViewer from "@/components/kanban/KanbanViewer";
import styles from "./Progression.module.css";

interface ProgressionProps {
  projectId: string;
  projectTitle: string;
}

export default function Progression({ projectId, projectTitle }: ProgressionProps) {
  if (!projectId) {
    return (
      <div className={styles.emptyState}>
        <p>Aucun projet associé.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <KanbanViewer
        projectId={projectId}
        currentUser={null} // ← Ajoutez cette ligne
        readOnly={true}
        onBack={() => {}}
      />
    </div>
  );
}