"use client";

import React, { useState, type DragEvent } from "react";
import { CheckSquare, MessageCircle, Clock, Edit2, Trash2 } from "lucide-react";
import { deleteCard } from "@/utils/kanban-projet-api";
import type { KanbanCard } from "@/utils/kanban-projet-api";
import styles from "./KanbanTask.module.css";

const PRIORITIES = {
  low: { color: "#22c55e", label: "Basse" },
  medium: { color: "#3b82f6", label: "Moyenne" },
  high: { color: "#f59e0b", label: "Haute" },
  critical: { color: "#ef4444", label: "Critique" },
};

interface KanbanTaskProps {
  card: KanbanCard;
  onClick: () => void;
  onEdit: () => void;
  onDragStart: (e: DragEvent, cardId: string) => void;
  readOnly?: boolean;
}

export default function KanbanTask({ card, onClick, onEdit, onDragStart, readOnly = false }: KanbanTaskProps) {
  const [dragging, setDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const doneCount = card.checklist.filter((c) => c.done).length;
  const totalCount = card.checklist.length;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    if (confirm("Supprimer cette tâche ?")) {
      await deleteCard(card.projectId, card.id!);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    onEdit();
  };

  return (
    <div
      className={`${styles.card} ${dragging ? styles.dragging : ""}`}
      draggable={!readOnly}
      onDragStart={(e) => {
        if (readOnly) {
          e.preventDefault();
          return;
        }
        setDragging(true);
        onDragStart(e, card.id!);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={onClick}
      onMouseEnter={() => !readOnly && setShowActions(true)}
      onMouseLeave={() => !readOnly && setShowActions(false)}
    >
      {card.coverColor && (
        <div className={styles.cardCover} style={{ background: card.coverColor }} />
      )}

      <div className={styles.cardBody}>
        {card.labels.length > 0 && (
          <div className={styles.cardLabels}>
            {card.labels.map((label) => (
              <div
                key={label.id}
                className={styles.cardLabel}
                style={{ background: label.color }}
                title={label.name}
              />
            ))}
          </div>
        )}

        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>{card.title}</div>
          {!readOnly && showActions && (
            <div className={styles.cardActions}>
              <button className={styles.actionBtn} onClick={handleEdit} title="Modifier">
                <Edit2 size={12} />
              </button>
              <button className={styles.actionBtn} onClick={handleDelete} title="Supprimer">
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {card.description && (
          <div className={styles.cardDesc}>{card.description}</div>
        )}

        <div className={styles.cardMeta}>
          <div className={styles.cardMetaLeft}>
            <div
              className={styles.priorityDot}
              style={{ background: PRIORITIES[card.priority].color }}
              title={PRIORITIES[card.priority].label}
            />

            {card.dueDate && (
              <span className={styles.cardBadge}>
                <Clock size={10} />
                {new Date(card.dueDate.toDate()).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}

            {totalCount > 0 && (
              <span className={styles.cardBadge}>
                <CheckSquare size={10} />
                {doneCount}/{totalCount}
              </span>
            )}

            {card.comments.length > 0 && (
              <span className={styles.cardBadge}>
                <MessageCircle size={10} />
                {card.comments.length}
              </span>
            )}
          </div>

          {card.assignees.length > 0 && (
            <div className={styles.avatarStack}>
              {card.assignees.slice(0, 2).map((uid) => (
                <div key={uid} className={styles.avatar}>
                  {uid.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.checklistBar}>
          <div
            className={styles.checklistBarFill}
            style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%" }}
          />
        </div>
      </div>
    </div>
  );
}