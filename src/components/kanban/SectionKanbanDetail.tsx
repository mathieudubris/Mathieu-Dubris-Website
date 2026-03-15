"use client";

import React, { useState, useRef, type DragEvent } from "react";
import { Plus } from "lucide-react";
import {
  createCard,
  moveCard
} from "@/utils/kanban-projet-api";
import type { KanbanColumn, KanbanCard } from "@/utils/kanban-projet-api";
import KanbanTask from "@/components/kanban/KanbanTask";
import KanbanTaskEditor from "@/components/kanban/KanbanTaskEditor";
import type { TeamMemberForKanban } from "@/components/kanban/KanbanTaskEditor";
import KanbanTaskDetail from "@/components/kanban/KanbanTaskDetail";
import styles from "./SectionKanbanDetail.module.css";

const DEFAULT_COLUMNS = [
  { id: "todo",       title: "À faire",      color: "#a3a3a3" },
  { id: "inprogress", title: "En cours",      color: "#c7ff44" },
  { id: "review",     title: "En révision",   color: "#f59e0b" },
  { id: "blocked",    title: "Blocage",       color: "#ef4444" },
  { id: "done",       title: "Terminé",       color: "#22c55e" },
];

const COLUMN_ACTIONS = [
  { id: "todo",       label: "À faire"      },
  { id: "inprogress", label: "En cours"     },
  { id: "review",     label: "En révision"  },
  { id: "blocked",    label: "Blocage"      },
  { id: "done",       label: "Terminé"      },
];

interface SectionKanbanDetailProps {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  currentUser: any;
  projectId: string;
  boardId: string;           // ← NOUVEAU : requis pour la nouvelle structure
  onToast: (msg: string) => void;
  readOnly?: boolean;
  teamMembers?: TeamMemberForKanban[];
  filterMyTasks?: boolean;
}

export default function SectionKanbanDetail({
  columns: dbColumns,
  cards,
  currentUser,
  projectId,
  boardId,
  onToast,
  readOnly = false,
  teamMembers = [],
  filterMyTasks = false,
}: SectionKanbanDetailProps) {
  const [addingCardColumn, setAddingCardColumn] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [detailCard, setDetailCard] = useState<KanbanCard | null>(null);
  const [isDragOver, setIsDragOver] = useState<string | null>(null);
  const dragCardId = useRef<string | null>(null);

  // Les cartes arrivent déjà filtrées depuis KanbanViewer (search + priority + myTasks)
  const getColumnCards = (columnId: string) =>
    cards.filter((c) => c.columnId === columnId).sort((a, b) => a.position - b.position);

  const handleAddCard = (columnId: string) => {
    if (readOnly) return;
    setAddingCardColumn(columnId);
  };

  const handleCreateCard = async (columnId: string, title: string, assignees: string[]) => {
    if (readOnly || !title.trim() || !currentUser) return;
    try {
      const colCards = cards.filter((c) => c.columnId === columnId);
      await createCard(
        projectId,
        boardId,
        columnId,
        title.trim(),
        currentUser.uid,
        colCards.length,
        assignees,
      );
      setAddingCardColumn(null);
      onToast("Tâche créée");
    } catch (error) {
      console.error("Error creating card:", error);
      onToast("Erreur lors de la création");
    }
  };

  const handleDragStart = (e: DragEvent, cardId: string) => {
    if (readOnly) { e.preventDefault(); return; }
    dragCardId.current = cardId;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent, columnId: string) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(columnId);
  };

  const handleDragLeave = () => setIsDragOver(null);

  const handleDrop = async (e: DragEvent, targetColumnId: string) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(null);
    const cardId = dragCardId.current;
    if (!cardId) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.columnId === targetColumnId) return;
    try {
      const colCards = cards.filter((c) => c.columnId === targetColumnId);
      await moveCard(projectId, boardId, cardId, targetColumnId, colCards.length);
      onToast("Tâche déplacée");
    } catch {
      onToast("Erreur lors du déplacement");
    } finally {
      dragCardId.current = null;
    }
  };

  const handleMoveCard = async (cardId: string, targetColumnId: string) => {
    if (readOnly) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.columnId === targetColumnId) return;
    try {
      const colCards = cards.filter((c) => c.columnId === targetColumnId);
      await moveCard(projectId, boardId, cardId, targetColumnId, colCards.length);
      onToast("Tâche déplacée");
    } catch {
      onToast("Erreur lors du déplacement");
    }
  };

  // Pour le détail/editeur des cartes, on doit passer boardId
  const columnsToDisplay = dbColumns.length > 0 ? dbColumns : DEFAULT_COLUMNS;

  // Compute COLUMN_ACTIONS from actual columns
  const columnActions = dbColumns.length > 0
    ? dbColumns.map(col => ({ id: col.id!, label: col.title }))
    : COLUMN_ACTIONS;

  return (
    <div className={styles.boardScroll}>
      {columnsToDisplay.map((col) => (
        <div
          key={col.id}
          className={`${styles.column} ${isDragOver === col.id ? styles.dragOver : ""}`}
          onDragOver={(e) => handleDragOver(e, col.id!)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, col.id!)}
        >
          <div className={styles.columnHeader}>
            {col.color && (
              <div className={styles.columnHeaderAccent} style={{ background: col.color }} />
            )}
            <div className={styles.columnTitleGroup}>
              <span className={styles.columnTitle}>{col.title}</span>
              <span className={styles.columnCount}>{getColumnCards(col.id!).length}</span>
            </div>
            {!readOnly && (
              <button
                className={styles.addColumnBtn}
                onClick={() => handleAddCard(col.id!)}
                title="Ajouter une tâche"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className={styles.cardsList}>
            {getColumnCards(col.id!).length === 0 ? (
              <div className={styles.emptyColumn}>
                <span>Aucune tâche</span>
              </div>
            ) : (
              getColumnCards(col.id!).map((card) => (
                <KanbanTask
                  key={card.id}
                  card={card}
                  boardId={boardId}
                  teamMembers={teamMembers}
                  onClick={() => setDetailCard(card)}
                  onEdit={() => !readOnly && setEditingCard(card)}
                  onDragStart={handleDragStart}
                  readOnly={readOnly}
                />
              ))
            )}
          </div>
        </div>
      ))}

      {/* Éditeur création */}
      {!readOnly && addingCardColumn && (
        <KanbanTaskEditor
          isNew
          columnId={addingCardColumn}
          currentUser={currentUser}
          onClose={() => setAddingCardColumn(null)}
          onSave={(title, assignees) => handleCreateCard(addingCardColumn, title, assignees)}
          onToast={onToast}
          projectId={projectId}
          boardId={boardId}
          teamMembers={teamMembers}
        />
      )}

      {/* Éditeur modification */}
      {!readOnly && editingCard && !addingCardColumn && (
        <KanbanTaskEditor
          card={editingCard}
          currentUser={currentUser}
          onClose={() => setEditingCard(null)}
          onToast={onToast}
          columnActions={columnActions}
          onMoveCard={handleMoveCard}
          projectId={projectId}
          boardId={boardId}
          teamMembers={teamMembers}
        />
      )}

      {/* Détail */}
      {detailCard && (
        <KanbanTaskDetail
          card={detailCard}
          currentUser={currentUser}
          onClose={() => setDetailCard(null)}
          onEdit={() => {
            if (!readOnly) {
              setDetailCard(null);
              setEditingCard(detailCard);
            }
          }}
          onToast={onToast}
          columnActions={readOnly ? [] : columnActions}
          onMoveCard={readOnly ? undefined : handleMoveCard}
          readOnly={readOnly}
          projectId={projectId}
          boardId={boardId}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}