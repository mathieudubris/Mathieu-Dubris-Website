"use client";

import React, { useState, useRef, type DragEvent } from "react";
import { Plus } from "lucide-react";
import {
  moveCard
} from "@/utils/kanban-projet-api";
import type { KanbanColumn, KanbanCard } from "@/utils/kanban-projet-api";
import KanbanTask from "@/components/kanban/KanbanTask";
import KanbanTaskEditor from "@/components/kanban/KanbanTaskEditor";
import type { TeamMemberForKanban } from "@/components/kanban/KanbanTaskEditor";
import KanbanTaskDetail from "@/components/kanban/KanbanTaskDetail";
import {
  getTaskNotificationStats,
  editDiscordNotification,
} from "@/utils/discord-notify-api";
import styles from "./SectionKanbanDetail.module.css";

const DEFAULT_COLUMNS = [
  { id: "todo",       title: "À faire",      color: "#a3a3a3" },
  { id: "inprogress", title: "En cours",      color: "#3b82f6" },
  { id: "review",     title: "En révision",   color: "#8b5cf6" },
  { id: "blocked",    title: "Blocage",       color: "#ef4444" },
  { id: "done",       title: "Terminé",       color: "#22c55e" },
];

interface SectionKanbanDetailProps {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  currentUser: any;
  projectId: string;
  boardId: string;
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

  const getColumnCards = (columnId: string) =>
    cards.filter((c) => c.columnId === columnId).sort((a, b) => a.position - b.position);

  const handleAddCard = (columnId: string) => {
    if (readOnly) return;
    setAddingCardColumn(columnId);
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

  // Sync Discord after a column move
  const syncDiscordAfterMove = async (card: KanbanCard, targetColumnId: string, columnActions: { id: string; label: string }[]) => {
    try {
      const stats = await getTaskNotificationStats(projectId, boardId, card.id!);
      if (!stats?.discordMessageId || !stats?.webhookUrl) return;

      const discordIds = teamMembers
        .filter(tm => card.assignees?.includes(tm.userId) && tm.discordId)
        .map(tm => tm.discordId!);

      const fmtTs = (ts: any) => {
        if (!ts) return undefined;
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
      };

      const columnTitle = columnActions.find(c => c.id === targetColumnId)?.label || targetColumnId;

      await editDiscordNotification(
        stats.webhookUrl,
        stats.discordMessageId,
        card.title,
        card.description || "",
        discordIds,
        targetColumnId,
        fmtTs((card as any).startDate),
        fmtTs(card.dueDate),
        `${window.location.origin}/portfolio/projet-en-cours?project=${projectId}`,
        columnTitle,
      );
    } catch (e) {
      console.warn("Discord drag-drop sync error (non-blocking):", e);
    }
  };

  const handleDrop = async (e: DragEvent, targetColumnId: string) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(null);
    const cardId = dragCardId.current;
    if (!cardId) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.columnId === targetColumnId) return;

    const columnActions = columnsToDisplay.map(col => ({ id: col.id!, label: col.title }));

    try {
      const colCards = cards.filter((c) => c.columnId === targetColumnId);
      await moveCard(projectId, boardId, cardId, targetColumnId, colCards.length);
      // Auto-update Discord message
      await syncDiscordAfterMove(card, targetColumnId, columnActions);
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

    const columnActions = columnsToDisplay.map(col => ({ id: col.id!, label: col.title }));

    try {
      const colCards = cards.filter((c) => c.columnId === targetColumnId);
      await moveCard(projectId, boardId, cardId, targetColumnId, colCards.length);
      // Auto-update Discord message
      await syncDiscordAfterMove(card, targetColumnId, columnActions);
      onToast("Tâche déplacée");
    } catch {
      onToast("Erreur lors du déplacement");
    }
  };

  const columnsToDisplay = dbColumns.length > 0 ? dbColumns : DEFAULT_COLUMNS;

  const columnActions = columnsToDisplay.map(col => ({ id: col.id!, label: col.title }));

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
          onSave={() => setAddingCardColumn(null)}
          onToast={onToast}
          projectId={projectId}
          boardId={boardId}
          teamMembers={teamMembers}
          columnActions={columnActions}
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
