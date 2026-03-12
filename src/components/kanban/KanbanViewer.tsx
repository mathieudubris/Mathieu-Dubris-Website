"use client";

import React, { useState, useEffect } from "react";
import { Layout, Plus, X, AlertCircle, Edit2, Trash2 } from "lucide-react";
import {
  subscribeToProjectKanban,
  initializeProjectKanban,
  projectHasKanban,
} from "@/utils/kanban-projet-api";
import type { KanbanColumn, KanbanCard } from "@/utils/kanban-projet-api";
import HeaderKanbanDetail from "@/components/kanban/HeaderKanbanDetail";
import SectionKanbanDetail from "@/components/kanban/SectionKanbanDetail";
import styles from "./KanbanViewer.module.css";

interface BoardEntry {
  id: string;       // on réutilise projectId comme boardId unique
  title: string;
}

interface KanbanViewerProps {
  projectId: string;
  currentUser?: any;
  readOnly?: boolean;
  onBack?: () => void;
  onBoardUpdated?: () => void;
  onToast?: (msg: string) => void;
  boardTitle?: string;
}

export default function KanbanViewer({
  projectId,
  currentUser,
  readOnly = false,
  onBack,
  onBoardUpdated,
  onToast,
  boardTitle = "Tableau Kanban",
}: KanbanViewerProps) {
  // ── Multi-board state ──────────────────────────────────────────
  const [boards, setBoards] = useState<BoardEntry[]>([]);
  const [activeBoard, setActiveBoard] = useState<BoardEntry | null>(null);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");

  // ── Board detail state ─────────────────────────────────────────
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Init : on charge les boards sauvegardés en localStorage ────
  // (stockage léger côté client ; peut être remplacé par Firestore)
  useEffect(() => {
    if (!projectId) return;
    const key = `kanban_boards_${projectId}`;
    const saved = localStorage.getItem(key);
    const parsed: BoardEntry[] = saved ? JSON.parse(saved) : [];

    // Toujours s'assurer qu'il y a au moins un board par défaut
    if (parsed.length === 0) {
      const defaultBoard: BoardEntry = { id: `${projectId}_default`, title: boardTitle };
      const initial = [defaultBoard];
      localStorage.setItem(key, JSON.stringify(initial));
      setBoards(initial);
    } else {
      setBoards(parsed);
    }
  }, [projectId]);

  // ── Persistance boards ─────────────────────────────────────────
  const saveBoards = (updated: BoardEntry[]) => {
    const key = `kanban_boards_${projectId}`;
    localStorage.setItem(key, JSON.stringify(updated));
    setBoards(updated);
  };

  // ── Subscribe to active board ──────────────────────────────────
  useEffect(() => {
    if (!activeBoard) return;

    setIsLoading(true);
    setError(null);
    setSearch("");
    setFilterPriority("all");
    setEditableTitle(activeBoard.title);

    const unsub = subscribeToProjectKanban(
      activeBoard.id,
      (cols) => { setColumns(cols); setIsLoading(false); },
      (newCards) => { setCards(newCards); setIsLoading(false); },
      (err) => {
        console.error("Subscription error:", err);
        setError("Erreur de chargement du tableau");
        setIsLoading(false);
      }
    );

    return () => { if (unsub) unsub(); };
  }, [activeBoard]);

  const showToast = (msg: string) => {
    if (onToast) {
      onToast(msg);
    } else {
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 2500);
    }
  };

  const filteredCards = cards.filter((card) => {
    const matchSearch =
      !search ||
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(search.toLowerCase()));
    const matchPriority = filterPriority === "all" || card.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  // ── Board management ───────────────────────────────────────────
  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    const newBoard: BoardEntry = {
      id: `${projectId}_${Date.now()}`,
      title: newBoardTitle.trim(),
    };
    // Initialise les colonnes Firestore pour ce sous-board
    await initializeProjectKanban(newBoard.id);
    const updated = [...boards, newBoard];
    saveBoards(updated);
    setNewBoardTitle("");
    setCreatingBoard(false);
    showToast("Tableau créé !");
  };

  const handleDeleteBoard = (boardId: string) => {
    if (!confirm("Supprimer ce tableau ?")) return;
    const updated = boards.filter((b) => b.id !== boardId);
    saveBoards(updated);
    if (activeBoard?.id === boardId) setActiveBoard(null);
    showToast("Tableau supprimé");
  };

  const handleTitleSave = () => {
    if (!activeBoard || !editableTitle.trim()) return;
    const updated = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, title: editableTitle.trim() } : b
    );
    saveBoards(updated);
    setActiveBoard({ ...activeBoard, title: editableTitle.trim() });
    setEditingTitle(false);
    showToast("Titre mis à jour");
  };

  const handleTitleCancel = () => {
    setEditableTitle(activeBoard?.title || "");
    setEditingTitle(false);
  };

  // ── Vue liste des boards ───────────────────────────────────────
  if (!activeBoard) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.boardListHeader}>
          <div className={styles.boardListHeaderLeft}>
            <Layout size={18} color="var(--primary)" />
            <span className={styles.boardListTitle}>Tableaux Kanban</span>
          </div>
          {!readOnly && (
            <button
              className={styles.btnPrimary}
              onClick={() => setCreatingBoard(true)}
            >
              <Plus size={14} /> Nouveau tableau
            </button>
          )}
        </div>

        <div className={styles.boardListBody}>
          {!readOnly && creatingBoard && (
            <div className={styles.createForm}>
              <input
                className={styles.createInput}
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Nom du tableau..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
              />
              <div className={styles.createActions}>
                <button className={styles.btnPrimary} onClick={handleCreateBoard}>
                  Créer
                </button>
                <button
                  className={styles.btnGhost}
                  onClick={() => { setCreatingBoard(false); setNewBoardTitle(""); }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {boards.length === 0 ? (
            <div className={styles.emptyState}>
              <AlertCircle size={32} />
              <p>Aucun tableau. {!readOnly && "Créez-en un pour commencer."}</p>
            </div>
          ) : (
            <div className={styles.boardGrid}>
              {boards.map((board) => (
                <div key={board.id} className={styles.boardCard}>
                  <div
                    className={styles.boardCardContent}
                    onClick={() => setActiveBoard(board)}
                  >
                    <Layout size={16} color="var(--primary)" />
                    <span className={styles.boardCardTitle}>{board.title}</span>
                  </div>
                  {!readOnly && (
                    <button
                      className={styles.boardDeleteBtn}
                      onClick={() => handleDeleteBoard(board.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {localToast && <div className={styles.toast}>{localToast}</div>}
      </div>
    );
  }

  // ── Vue détail d'un board ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          Chargement du tableau...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.error}>
          <p>{error}</p>
          <button className={styles.backButton} onClick={() => setActiveBoard(null)}>
            Retour aux tableaux
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <HeaderKanbanDetail
        boardTitle={editableTitle}
        editingTitle={editingTitle && !readOnly}
        boardTitleValue={editableTitle}
        onTitleChange={setEditableTitle}
        onTitleEdit={() => !readOnly && setEditingTitle(true)}
        onTitleSave={handleTitleSave}
        onTitleCancel={handleTitleCancel}
        search={search}
        onSearchChange={setSearch}
        filterPriority={filterPriority}
        onFilterChange={setFilterPriority}
        onBack={() => setActiveBoard(null)}
        readOnly={readOnly}
      />

      <SectionKanbanDetail
        columns={columns}
        cards={filteredCards}
        currentUser={currentUser}
        projectId={activeBoard.id}
        onToast={showToast}
        readOnly={readOnly}
      />

      {localToast && <div className={styles.toast}>{localToast}</div>}
    </div>
  );
}