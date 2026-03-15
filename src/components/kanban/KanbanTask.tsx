"use client";

import React, { useState, useEffect, useRef, type DragEvent } from "react";
import { Clock, Edit2, Trash2 } from "lucide-react";
import { deleteCard } from "@/utils/kanban-projet-api";
import type { KanbanCard } from "@/utils/kanban-projet-api";
import type { TeamMemberForKanban } from "@/components/kanban/KanbanTaskEditor";
import styles from "./KanbanTask.module.css";

interface KanbanTaskProps {
  card: KanbanCard;
  boardId: string;
  onClick: () => void;
  onEdit: () => void;
  onDragStart: (e: DragEvent, cardId: string) => void;
  readOnly?: boolean;
  teamMembers?: TeamMemberForKanban[];
}

// ── Avatar carrousel (carré arrondi, sans nom) ───────────────────
const AvatarCarousel: React.FC<{ uids: string[]; teamMembers: TeamMemberForKanban[] }> = ({ uids, teamMembers }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (uids.length <= 1) return;
    timerRef.current = setInterval(() => setCurrent(p => (p + 1) % uids.length), 2000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [uids.length]);

  if (uids.length === 0) return <div className={styles.avatarEmpty} />;

  const getInfo = (uid: string) => {
    const m = teamMembers.find(t => t.userId === uid);
    const name = m ? (m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.displayName || "?") : "?";
    const src  = m ? (m.image || m.photoURL || "") : "";
    const init = m ? (m.firstName || m.displayName || "?")[0].toUpperCase() : uid[0]?.toUpperCase() || "?";
    return { name, src, init };
  };

  const { name, src, init } = getInfo(uids[current]);

  return (
    <div
      className={styles.avatarWrap}
      title={`${name}${uids.length > 1 ? ` +${uids.length - 1} autre${uids.length > 2 ? "s" : ""}` : ""}`}
      onClick={e => { e.stopPropagation(); if (uids.length > 1) setCurrent(p => (p + 1) % uids.length); }}
      key={current}
    >
      {src
        ? <img src={src} alt={name} className={styles.avatarImg} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        : <span className={styles.avatarInit}>{init}</span>
      }
    </div>
  );
};

// ── Labels carrousel ─────────────────────────────────────────────
const LABELS_PER_SLIDE = 2;
const LabelsCarousel: React.FC<{ labels: KanbanCard["labels"] }> = ({ labels }) => {
  const [page, setPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pages = Math.ceil(labels.length / LABELS_PER_SLIDE);

  useEffect(() => {
    if (pages <= 1) return;
    timerRef.current = setInterval(() => setPage(p => (p + 1) % pages), 2500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pages]);

  if (labels.length === 0) return null;

  const slice = labels.slice(page * LABELS_PER_SLIDE, page * LABELS_PER_SLIDE + LABELS_PER_SLIDE);
  const remaining = labels.length - (page * LABELS_PER_SLIDE + slice.length);

  return (
    <div className={styles.labelsRow}>
      <div className={styles.labelsSlide} key={page}>
        {slice.map(l => (
          <span
            key={l.id}
            className={styles.labelChip}
            style={{ background: l.color + "28", color: l.color }}
          >
            {l.name}
          </span>
        ))}
        {remaining > 0 && <span className={styles.labelMore}>+{remaining}</span>}
      </div>
    </div>
  );
};

// ── Date formatter avec année ────────────────────────────────────
const formatDate = (ts: any) => {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

// ─────────────────────────────────────────────────────────────────

export default function KanbanTask({
  card, boardId, onClick, onEdit, onDragStart, readOnly = false, teamMembers = []
}: KanbanTaskProps) {
  const [dragging, setDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const startDate = formatDate((card as any).startDate);
  const dueDate   = formatDate(card.dueDate);

  return (
    <div
      className={`${styles.card} ${dragging ? styles.dragging : ""}`}
      draggable={!readOnly}
      onDragStart={e => {
        if (readOnly) { e.preventDefault(); return; }
        setDragging(true);
        onDragStart(e, card.id!);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={onClick}
      onMouseEnter={() => !readOnly && setShowActions(true)}
      onMouseLeave={() => !readOnly && setShowActions(false)}
    >
      {/* Cover color */}
      {card.coverColor && (
        <div className={styles.cardCover} style={{ background: card.coverColor }} />
      )}

      {/* Actions hover */}
      {!readOnly && showActions && (
        <div className={styles.cardActions}>
          <button
            className={styles.actionBtn}
            onClick={e => { e.stopPropagation(); onEdit(); }}
            title="Modifier"
          >
            <Edit2 size={11} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={async e => {
              e.stopPropagation();
              if (confirm("Supprimer cette tâche ?")) await deleteCard(card.projectId, boardId, card.id!);
            }}
            title="Supprimer"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {/* Ligne 1 : Avatar + Titre + Description */}
      <div className={styles.cardTop}>
        <AvatarCarousel uids={card.assignees || []} teamMembers={teamMembers} />
        <div className={styles.cardTitleBlock}>
          <div className={styles.cardTitle}>{card.title}</div>
          {card.description && (
            <div className={styles.cardDesc}>{card.description}</div>
          )}
        </div>
      </div>

      {/* Ligne 2 : Labels carrousel */}
      <LabelsCarousel labels={card.labels || []} />

      {/* Ligne 3 : Dates — sans priorityDot */}
      <div className={styles.datesRow}>
        {startDate ? (
          <span className={styles.dateBadge}>
            <Clock size={9} />
            {startDate}
          </span>
        ) : <span className={styles.dateNone} />}

        {dueDate ? (
          <span className={styles.dateBadge}>
            <Clock size={9} />
            {dueDate}
          </span>
        ) : <span className={styles.dateNone} />}
      </div>
    </div>
  );
}