"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Layout, X, Check, ArrowRight } from "lucide-react";
import { createBoard, updateBoard, deleteBoard } from "@/utils/kanban-projet-api";
import type { KanbanBoard } from "@/utils/kanban-projet-api";
import styles from "./ProgressionBoardList.module.css";

interface ProgressionBoardListProps {
  projectId: string;
  boards: KanbanBoard[];
  readOnly?: boolean;
  onSelectBoard: (board: KanbanBoard) => void;
  onToast: (msg: string) => void;
}

export default function ProgressionBoardList({
  projectId,
  boards,
  readOnly = false,
  onSelectBoard,
  onToast,
}: ProgressionBoardListProps) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await createBoard(projectId, newTitle.trim(), newDesc.trim());
      onToast("Tableau créé !");
      setCreating(false);
      setNewTitle("");
      setNewDesc("");
    } catch {
      onToast("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (boardId: string) => {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await updateBoard(projectId, boardId, { title: newTitle.trim(), description: newDesc.trim() });
      onToast("Tableau mis à jour");
      setEditingId(null);
      setNewTitle("");
      setNewDesc("");
    } catch {
      onToast("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (boardId: string, title: string) => {
    if (!confirm(`Supprimer le tableau "${title}" et toutes ses tâches ?`)) return;
    setLoading(true);
    try {
      await deleteBoard(projectId, boardId);
      onToast("Tableau supprimé");
    } catch {
      onToast("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (board: KanbanBoard) => {
    setEditingId(board.id!);
    setNewTitle(board.title);
    setNewDesc(board.description || "");
  };

  const cancelForm = () => {
    setCreating(false);
    setEditingId(null);
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Layout size={18} color="var(--primary)" />
          <span className={styles.title}>Tableaux Kanban</span>
        </div>
        {!readOnly && (
          <button
            className={styles.btnPrimary}
            onClick={() => { setCreating(true); setEditingId(null); setNewTitle(""); setNewDesc(""); }}
            disabled={loading}
          >
            <Plus size={14} /> Nouveau tableau
          </button>
        )}
      </div>

      {/* Formulaire création */}
      {!readOnly && creating && (
        <div className={styles.form}>
          <input
            className={styles.input}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Nom du tableau..."
            autoFocus
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
          <input
            className={styles.input}
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optionnel)"
          />
          <div className={styles.formActions}>
            <button className={styles.btnPrimary} onClick={handleCreate} disabled={loading || !newTitle.trim()}>
              {loading ? "Création..." : "Créer"}
            </button>
            <button className={styles.btnGhost} onClick={cancelForm}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Liste des boards */}
      {boards.length === 0 && !creating ? (
        <div className={styles.empty}>
          <Layout size={32} style={{ opacity: 0.3 }} />
          <p>Aucun tableau. {!readOnly && "Créez-en un pour commencer."}</p>
        </div>
      ) : (
        <div className={styles.boardList}>
          {boards.map(board => (
            <div key={board.id} className={styles.boardCard}>
              {/* Formulaire d'édition inline */}
              {!readOnly && editingId === board.id ? (
                <div className={styles.form} style={{ padding: 0, background: "none", border: "none" }}>
                  <input
                    className={styles.input}
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleUpdate(board.id!)}
                  />
                  <input
                    className={styles.input}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Description (optionnel)"
                  />
                  <div className={styles.formActions}>
                    <button className={styles.btnPrimary} onClick={() => handleUpdate(board.id!)} disabled={loading || !newTitle.trim()}>
                      <Check size={13} /> {loading ? "..." : "Enregistrer"}
                    </button>
                    <button className={styles.btnGhost} onClick={cancelForm}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.boardInfo} onClick={() => onSelectBoard(board)}>
                    <div className={styles.boardAccent} />
                    <div className={styles.boardText}>
                      <span className={styles.boardTitle}>{board.title}</span>
                      {board.description && (
                        <span className={styles.boardDesc}>{board.description}</span>
                      )}
                    </div>
                    <ArrowRight size={16} className={styles.arrowIcon} />
                  </div>
                  {!readOnly && (
                    <div className={styles.boardActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={e => { e.stopPropagation(); startEdit(board); }}
                        title="Renommer"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={e => { e.stopPropagation(); handleDelete(board.id!, board.title); }}
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}