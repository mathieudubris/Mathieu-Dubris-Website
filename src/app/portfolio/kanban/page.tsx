"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/firebase-api";
import { getBoards, type KanbanBoard } from "@/utils/kanban-api";
import KanbanEditor from "@/components/kanban/KanbanEditor";
import KanbanDetail from "@/components/kanban/KanbanDetail";
import styles from "./kanban.module.css";

export default function KanbanPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoard, setActiveBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

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
    setShowEditor(false);
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

  if (!activeBoard || showEditor) {
    return (
      <KanbanEditor
        boards={boards}
        currentUser={currentUser}
        onBoardSelect={setActiveBoard}
        onBoardCreated={handleBoardCreated}
        onBoardUpdated={handleBoardUpdated}
        onClose={() => setShowEditor(false)}
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