"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/firebase-api";
import { getBoards, type KanbanBoard } from "@/utils/kanban-api";
// ⚠️ Composants locaux (dossier navigation/) — PAS ceux de src/components/kanban/
import KanbanEditor from "./navigation/KanbanEditor";
import KanbanDetail from "./navigation/KanbanDetail";
import styles from "./kanban.module.css";

export default function KanbanPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoard, setActiveBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    getBoards(currentUser.uid).then(setBoards);
  }, [currentUser]);

  const handleBoardCreated = (board: KanbanBoard) => {
    setActiveBoard(board);
  };

  const handleBoardUpdated = async () => {
    if (!currentUser) return;
    const updatedBoards = await getBoards(currentUser.uid);
    setBoards(updatedBoards);
  };

  if (loading) {
    return (
      <div className={styles.kanbanWrapper}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          Chargement...
        </div>
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <KanbanEditor
        boards={boards}
        currentUser={currentUser}
        onBoardSelect={setActiveBoard}
        onBoardCreated={handleBoardCreated}
        onBoardUpdated={handleBoardUpdated}
        onClose={() => setActiveBoard(null)}
      />
    );
  }

  return (
    <KanbanDetail
      board={activeBoard}
      currentUser={currentUser}
      onBack={() => setActiveBoard(null)}
      onBoardUpdated={handleBoardUpdated}
    />
  );
}