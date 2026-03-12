"use client";

import React, { useState, useRef, type DragEvent } from "react";
import { Plus } from "lucide-react";
import { createCard, updateCard } from "@/utils/kanban-api";
import type { KanbanColumn, KanbanCard } from "@/utils/kanban-api";
// ⚠️ Composants locaux (dossier navigation/) — PAS ceux de src/components/kanban/
import KanbanTask from "./KanbanTask";
import KanbanTaskEditor from "./KanbanTaskEditor";
import KanbanTaskDetail from "./KanbanTaskDetail";
import styles from "./SectionKanbanDetail.module.css";

const DEFAULT_COLUMNS = [
  { id: "todo", title: "À faire", color: "#a3a3a3" },
  { id: "inprogress", title: "En cours", color: "#c7ff44" },
  { id: "review", title: "En révision", color: "#f59e0b" },
  { id: "blocked", title: "Blocage", color: "#ef4444" },
  { id: "done", title: "Terminé", color: "#22c55e" },
];

const COLUMN_ACTIONS = [
  { id: "todo", label: "À faire" },
  { id: "inprogress", label: "En cours" },
  { id: "review", label: "En révision" },
  { id: "blocked", label: "Blocage" },
  { id: "done", label: "Terminé" },
];

interface SectionKanbanDetailProps {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  currentUser: any;
  boardId: string;
  onToast: (msg: string) => void;
}

export default function SectionKanbanDetail({
  columns: dbColumns,
  cards,
  currentUser,
  boardId,
  onToast,
}: SectionKanbanDetailProps) {
  const [addingCardColumn, setAddingCardColumn] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [detailCard, setDetailCard] = useState<KanbanCard | null>(null);
  const [isDragOver, setIsDragOver] = useState<string | null>(null);
  const dragCardId = useRef<string | null>(null);

  const mergedColumns = DEFAULT_COLUMNS.map((defaultCol, index) => {
    const dbCol = dbColumns.find((c) => c.title === defaultCol.title) || {
      id: `temp-${defaultCol.id}`,
      title: defaultCol.title,
      boardId,
      position: index,
      color: defaultCol.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return dbCol;
  }).sort((a, b) => a.position - b.position);

  const getColumnCards = (columnId: string) =>
    cards.filter((c) => c.columnId === columnId).sort((a, b) => a.position - b.position);

  const handleCreateCard = async (columnId: string, title: string) => {
    if (!title.trim() || !currentUser) return;

    const colCards = cards.filter((c) => c.columnId === columnId);
    const newCardId = await createCard(
      boardId,
      columnId,
      title.trim(),
      currentUser.uid,
      colCards.length
    );

    const newCard: KanbanCard = {
      id: newCardId,
      title: title.trim(),
      description: "",
      columnId,
      boardId,
      position: colCards.length,
      priority: "medium",
      labels: [],
      assignees: [],
      checklist: [],
      comments: [],
      attachments: [],
      archived: false,
      createdBy: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAddingCardColumn(null);
    setEditingCard(newCard);
    onToast("Tâche créée");
  };

  const handleDragStart = (e: DragEvent, cardId: string) => {
    dragCardId.current = cardId;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(columnId);
  };

  const handleDragLeave = () => setIsDragOver(null);

  const handleDrop = async (e: DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setIsDragOver(null);
    const cardId = dragCardId.current;
    if (!cardId) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.columnId === targetColumnId) return;
    const colCards = cards.filter((c) => c.columnId === targetColumnId);
    await updateCard(cardId, { columnId: targetColumnId, position: colCards.length });
    dragCardId.current = null;
    onToast("Tâche déplacée");
  };

  const handleMoveCard = async (cardId: string, targetColumnId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.columnId === targetColumnId) return;
    const colCards = cards.filter((c) => c.columnId === targetColumnId);
    await updateCard(cardId, { columnId: targetColumnId, position: colCards.length });
    onToast("Tâche déplacée");
  };

  return (
    <div className={styles.boardScroll}>
      {mergedColumns.map((col) => (
        <div
          key={col.id}
          className={`${styles.column} ${isDragOver === col.id ? styles.dragOver : ""}`}
          onDragOver={(e) => handleDragOver(e, col.id!)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, col.id!)}
        >
          <div className={styles.columnHeader}>
            {col.color && (
              <div
                className={styles.columnHeaderAccent}
                style={{ background: col.color }}
              />
            )}
            <div className={styles.columnTitleGroup}>
              <span className={styles.columnTitle}>{col.title}</span>
              <span className={styles.columnCount}>{getColumnCards(col.id!).length}</span>
            </div>
            <button
              className={styles.addColumnBtn}
              onClick={() => setAddingCardColumn(col.id!)}
              title="Ajouter une tâche"
            >
              <Plus size={16} />
            </button>
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
                  onClick={() => setDetailCard(card)}
                  onEdit={() => setEditingCard(card)}
                  onDragStart={handleDragStart}
                />
              ))
            )}
          </div>
        </div>
      ))}

      {addingCardColumn && (
        <KanbanTaskEditor
          isNew
          columnId={addingCardColumn}
          currentUser={currentUser}
          onClose={() => setAddingCardColumn(null)}
          onSave={(title) => handleCreateCard(addingCardColumn, title)}
          onToast={onToast}
        />
      )}

      {editingCard && !addingCardColumn && (
        <KanbanTaskEditor
          card={editingCard}
          currentUser={currentUser}
          onClose={() => setEditingCard(null)}
          onToast={onToast}
          columnActions={COLUMN_ACTIONS}
          onMoveCard={handleMoveCard}
        />
      )}

      {detailCard && !editingCard && (
        <KanbanTaskDetail
          card={detailCard}
          currentUser={currentUser}
          onClose={() => setDetailCard(null)}
          onEdit={() => {
            setDetailCard(null);
            setEditingCard(detailCard);
          }}
          onToast={onToast}
          columnActions={COLUMN_ACTIONS}
          onMoveCard={handleMoveCard}
        />
      )}
    </div>
  );
}