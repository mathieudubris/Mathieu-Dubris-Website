"use client";

import React, { useState, type DragEvent } from "react";
import { CheckSquare, MessageCircle, Clock, Edit2, Trash2 } from "lucide-react";
import { deleteCard } from "@/utils/kanban-api";
import type { KanbanCard, KanbanMember } from "@/utils/kanban-api";
import styles from "./KanbanTask.module.css";

const PRIORITIES = {
  low: { color: "var(--green)", label: "Basse" },
  medium: { color: "var(--blue)", label: "Moyenne" },
  high: { color: "var(--orange)", label: "Haute" },
  critical: { color: "var(--red)", label: "Critique" },
};

interface KanbanTaskProps {
  card: KanbanCard;
  onClick: () => void;
  onEdit: () => void;
  onDragStart: (e: DragEvent, cardId: string) => void;
  boardMembers?: KanbanMember[];
}

export default function KanbanTask({
  card,
  onClick,
  onEdit,
  onDragStart,
  boardMembers = [],
}: KanbanTaskProps) {
  const [dragging, setDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const doneCount = card.checklist.filter((c) => c.done).length;
  const totalCount = card.checklist.length;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Supprimer cette tâche ?")) {
      await deleteCard(card.id!);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const getMemberDisplay = (uid: string) => {
    const member = boardMembers.find((m) => m.uid === uid);
    if (!member)
      return { initials: uid.slice(0, 2).toUpperCase(), name: uid, photoURL: undefined };
    const initials =
      member.firstName && member.lastName
        ? (member.firstName[0] + member.lastName[0]).toUpperCase()
        : (member.displayName || uid).slice(0, 2).toUpperCase();
    return {
      initials,
      name: member.displayName || `${member.firstName} ${member.lastName}`,
      photoURL: member.photoURL,
    };
  };

  return (
    <div
      className={`${styles.card} ${dragging ? styles.dragging : ""}`}
      draggable
      onDragStart={(e) => {
        setDragging(true);
        onDragStart(e, card.id!);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
          {showActions && (
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
              {card.assignees.slice(0, 3).map((uid) => {
                const display = getMemberDisplay(uid);
                return (
                  <div key={uid} className={styles.avatar} title={display.name}>
                    {display.photoURL ? (
                      <img
                        src={display.photoURL}
                        alt={display.name}
                      />
                    ) : (
                      <span>{display.initials}</span>
                    )}
                  </div>
                );
              })}
              {card.assignees.length > 3 && (
                <div className={styles.avatar} title={`+${card.assignees.length - 3} autres`}>
                  <span>+{card.assignees.length - 3}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.checklistBar}>
          <div
            className={styles.checklistBarFill}
            style={{
              width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
}