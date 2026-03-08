"use client";

import React from "react";
import { X, Flag, Calendar, CheckSquare, MessageCircle, Link2, Edit2, Trash2 } from "lucide-react";
import { deleteCard } from "@/utils/kanban-api";
import type { KanbanCard, KanbanMember } from "@/utils/kanban-api";
import styles from "./KanbanTaskDetail.module.css";

const PRIORITIES = {
  low: { label: "Basse", color: "#22c55e" },
  medium: { label: "Moyenne", color: "#3b82f6" },
  high: { label: "Haute", color: "#f59e0b" },
  critical: { label: "Critique", color: "#ef4444" },
};

const COLUMN_STYLES: Record<string, { label: string; color: string }> = {
  todo: { label: "À faire", color: "#a3a3a3" },
  inprogress: { label: "En cours", color: "#c7ff44" },
  review: { label: "En révision", color: "#f59e0b" },
  blocked: { label: "Blocage", color: "#ef4444" },
  done: { label: "Terminé", color: "#22c55e" },
};

interface KanbanTaskDetailProps {
  card: KanbanCard;
  currentUser: any;
  onClose: () => void;
  onEdit: () => void;
  onToast: (msg: string) => void;
  columnActions?: { id: string; label: string }[];
  onMoveCard?: (cardId: string, targetColumnId: string) => void;
  boardMembers?: KanbanMember[];
}

export default function KanbanTaskDetail({
  card,
  currentUser,
  onClose,
  onEdit,
  onToast,
  columnActions = [],
  onMoveCard,
  boardMembers = [],
}: KanbanTaskDetailProps) {
  const doneCount = card.checklist.filter((c) => c.done).length;
  const totalCount = card.checklist.length;

  const handleDelete = async () => {
    if (confirm("Supprimer cette tâche ?")) {
      await deleteCard(card.id!);
      onToast("Tâche supprimée");
      onClose();
    }
  };

  const handleMove = async (targetColumnId: string) => {
    if (onMoveCard) {
      await onMoveCard(card.id!, targetColumnId);
      onToast(`Tâche déplacée vers ${columnActions.find(c => c.id === targetColumnId)?.label}`);
      onClose();
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const getMemberDisplay = (uid: string) => {
    const member = boardMembers.find((m) => m.uid === uid);
    if (!member) return { initials: uid.slice(0, 2).toUpperCase(), name: uid, photoURL: undefined };
    const initials = member.firstName && member.lastName
      ? (member.firstName[0] + member.lastName[0]).toUpperCase()
      : (member.displayName || uid).slice(0, 2).toUpperCase();
    return { initials, name: member.displayName || `${member.firstName} ${member.lastName}`, photoURL: member.photoURL };
  };

  const currentColumn = columnActions.find(c => c.id === card.columnId);

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{card.title}</h2>
          <div className={styles.headerActions}>
            <button className={styles.btnIcon} onClick={onEdit} title="Modifier">
              <Edit2 size={16} />
            </button>
            <button className={styles.btnIcon} onClick={handleDelete} title="Supprimer">
              <Trash2 size={16} />
            </button>
            <button className={styles.btnIcon} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Déplacement rapide */}
        {columnActions.length > 0 && (
          <div className={styles.moveBar}>
            <span className={styles.moveLabel}>Déplacer vers :</span>
            <div className={styles.moveButtons}>
              {columnActions.map((col) => (
                <button
                  key={col.id}
                  className={`${styles.moveBtn} ${col.id === card.columnId ? styles.active : ""}`}
                  onClick={() => handleMove(col.id)}
                  disabled={col.id === card.columnId}
                  style={{ borderColor: COLUMN_STYLES[col.id]?.color }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.modalBody}>
          <div className={styles.modalMain}>
            {card.description && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Description</h3>
                <p className={styles.description}>{card.description}</p>
              </div>
            )}

            {card.labels.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Flag size={14} /> Labels
                </h3>
                <div className={styles.labelsContainer}>
                  {card.labels.map((label) => (
                    <div
                      key={label.id}
                      className={styles.labelChip}
                      style={{ background: label.color + "20", color: label.color }}
                    >
                      {label.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {card.checklist.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <CheckSquare size={14} /> Checklist ({doneCount}/{totalCount})
                </h3>
                <div className={styles.checklistProgress}>
                  <div className={styles.checklistBar}>
                    <div
                      className={styles.checklistBarFill}
                      style={{ width: `${(doneCount / totalCount) * 100}%` }}
                    />
                  </div>
                </div>
                {card.checklist.map((item) => (
                  <div key={item.id} className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      className={styles.checklistCheckbox}
                      checked={item.done}
                      readOnly
                    />
                    <span className={`${styles.checklistItemText} ${item.done ? styles.done : ""}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {card.comments.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <MessageCircle size={14} /> Commentaires ({card.comments.length})
                </h3>
                {card.comments.map((comment) => (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentAvatar}>
                      {comment.authorPhoto ? (
                        <img src={comment.authorPhoto} alt={comment.authorName} />
                      ) : (
                        comment.authorName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className={styles.commentContent}>
                      <div className={styles.commentAuthor}>{comment.authorName}</div>
                      <div className={styles.commentText}>{comment.text}</div>
                      <div className={styles.commentTime}>{formatDate(comment.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {card.attachments && card.attachments.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Link2 size={14} /> Liens
                </h3>
                {card.attachments.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                    {link.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className={styles.modalSidebar}>
            <div className={styles.sidebarItem}>
              <span className={styles.sidebarLabel}>Colonne</span>
              <div className={styles.columnBadge} style={{ color: COLUMN_STYLES[card.columnId]?.color }}>
                {currentColumn?.label || card.columnId}
              </div>
            </div>

            <div className={styles.sidebarItem}>
              <span className={styles.sidebarLabel}>Priorité</span>
              <div className={styles.priorityBadge} style={{ color: PRIORITIES[card.priority].color }}>
                {PRIORITIES[card.priority].label}
              </div>
            </div>

            {card.dueDate && (
              <div className={styles.sidebarItem}>
                <span className={styles.sidebarLabel}>
                  <Calendar size={12} /> Échéance
                </span>
                <span className={styles.sidebarValue}>{formatDate(card.dueDate)}</span>
              </div>
            )}

            {/* Assignés avec vrais profils */}
            {card.assignees.length > 0 && (
              <div className={styles.sidebarItem}>
                <span className={styles.sidebarLabel}>Membres ({card.assignees.length})</span>
                <div className={styles.assigneesList}>
                  {card.assignees.map((uid) => {
                    const display = getMemberDisplay(uid);
                    return (
                      <div key={uid} className={styles.assignee} title={display.name}>
                        {display.photoURL ? (
                          <img src={display.photoURL} alt={display.name} className={styles.assigneeImg} />
                        ) : (
                          <span>{display.initials}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className={styles.assigneeNames}>
                  {card.assignees.map((uid) => {
                    const { name } = getMemberDisplay(uid);
                    return <div key={uid} className={styles.assigneeName}>{name}</div>;
                  })}
                </div>
              </div>
            )}

            <div className={styles.sidebarItem}>
              <span className={styles.sidebarLabel}>Créée le</span>
              <span className={styles.sidebarValue}>{formatDate(card.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
