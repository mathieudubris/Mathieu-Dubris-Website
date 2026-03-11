"use client";

import React, { useState } from "react";
import { Layout, Plus, X, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { createBoard, seedDefaultColumns, updateBoard, deleteBoard, getBoards } from "@/utils/kanban-api";
import type { KanbanBoard } from "@/utils/kanban-api";
import styles from "./KanbanEditor.module.css";

interface KanbanEditorProps {
  boards: KanbanBoard[];
  currentUser: any;
  onBoardSelect: (board: KanbanBoard) => void;
  onBoardCreated: (board: KanbanBoard) => void;
  onBoardUpdated: () => void;
  onClose: () => void;
}

export default function KanbanEditor({
  boards,
  currentUser,
  onBoardSelect,
  onBoardCreated,
  onBoardUpdated,
  onClose,
}: KanbanEditorProps) {
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim() || !currentUser) return;
    
    const boardId = await createBoard(newBoardTitle.trim(), newBoardDescription.trim(), currentUser.uid);
    await seedDefaultColumns(boardId);
    
    const updatedBoards = await getBoards(currentUser.uid);
    const board = updatedBoards.find((b: KanbanBoard) => b.id === boardId);
    
    if (board) {
      onBoardCreated(board);
      showToast("Tableau créé !");
    }
    
    setNewBoardTitle("");
    setNewBoardDescription("");
    setCreatingBoard(false);
  };

  const handleUpdateBoard = async () => {
    if (!editingBoard || !newBoardTitle.trim()) return;
    
    await updateBoard(editingBoard.id!, {
      title: newBoardTitle.trim(),
      description: newBoardDescription.trim(),
    });
    
    onBoardUpdated();
    setEditingBoard(null);
    setNewBoardTitle("");
    setNewBoardDescription("");
    showToast("Tableau mis à jour");
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm("Supprimer ce tableau et toutes ses données ?")) return;
    await deleteBoard(boardId);
    onBoardUpdated();
    showToast("Tableau supprimé");
  };

  const startEdit = (board: KanbanBoard) => {
    setEditingBoard(board);
    setNewBoardTitle(board.title);
    setNewBoardDescription(board.description || "");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Layout size={20} color="var(--primary)" />
          <span className={styles.title}>Kanban</span>
        </div>
        <div className={styles.topbarRight}>
          <button
            className={styles.btnPrimary}
            onClick={() => setCreatingBoard(true)}
          >
            <Plus size={15} /> Nouveau tableau
          </button>
        </div>
      </div>

      <div className={styles.boardSelector}>
        <h2 className={styles.heading}>Mes tableaux</h2>

        {(creatingBoard || editingBoard) && (
          <div className={styles.createForm}>
            <input
              className={styles.input}
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Nom du tableau..."
              autoFocus
            />
            <input
              className={styles.input}
              value={newBoardDescription}
              onChange={(e) => setNewBoardDescription(e.target.value)}
              placeholder="Description (optionnel)"
            />
            <div className={styles.formActions}>
              <button 
                className={styles.btnPrimary} 
                onClick={editingBoard ? handleUpdateBoard : handleCreateBoard}
              >
                {editingBoard ? "Mettre à jour" : "Créer"}
              </button>
              <button
                className={styles.btnGhost}
                onClick={() => {
                  setCreatingBoard(false);
                  setEditingBoard(null);
                  setNewBoardTitle("");
                  setNewBoardDescription("");
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {boards.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={36} />
            <p>Aucun tableau. Créez-en un pour commencer.</p>
          </div>
        ) : (
          <div className={styles.boardGrid}>
            {boards.map((board) => (
              <div key={board.id} className={styles.boardCard}>
                <div className={styles.boardCardContent} onClick={() => onBoardSelect(board)}>
                  <div className={styles.boardCardTitle}>{board.title}</div>
                  {board.description && (
                    <div className={styles.boardCardDesc}>{board.description}</div>
                  )}
                </div>
                <div className={styles.boardCardActions}>
                  <button 
                    className={styles.boardActionBtn}
                    onClick={() => startEdit(board)}
                    title="Modifier"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className={styles.boardActionBtn}
                    onClick={() => handleDeleteBoard(board.id!)}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}