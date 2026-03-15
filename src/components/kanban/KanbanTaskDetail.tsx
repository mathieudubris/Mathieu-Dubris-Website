"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Flag, Calendar, MessageCircle, Link2, Edit2, Trash2, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { deleteCard } from "@/utils/kanban-projet-api";
import type { KanbanCard } from "@/utils/kanban-projet-api";
import type { TeamMemberForKanban } from "@/components/kanban/KanbanTaskEditor";
import styles from "./KanbanTaskDetail.module.css";

const PRIORITIES: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Basse",    color: "var(--green)",  bg: "color-mix(in srgb, var(--green) 12%, transparent)"  },
  medium:   { label: "Moyenne",  color: "var(--blue)",   bg: "color-mix(in srgb, var(--blue) 12%, transparent)"   },
  high:     { label: "Haute",    color: "var(--orange)", bg: "color-mix(in srgb, var(--orange) 12%, transparent)" },
  critical: { label: "Critique", color: "var(--red)",    bg: "color-mix(in srgb, var(--red) 12%, transparent)"    },
};

const COL_STYLES: Record<string, { label: string; color: string }> = {
  todo:       { label: "À faire",     color: "var(--gray)"    },
  inprogress: { label: "En cours",    color: "var(--primary)" },
  review:     { label: "En révision", color: "var(--orange)"  },
  blocked:    { label: "Blocage",     color: "var(--red)"     },
  done:       { label: "Terminé",     color: "var(--green)"   },
};

const IMAGE_EXTS = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i;
const isImage = (url: string) => IMAGE_EXTS.test(url.split("?")[0]);

// ─────────────────────────────────────────────────────────────────
// Lightbox component — zoom + pan, stays on-site
// ─────────────────────────────────────────────────────────────────

interface LightboxImage {
  url: string;
  name: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = images[index];

  // Reset zoom/pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex(i => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft")  setIndex(i => Math.max(i - 1, 0));
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.25, 5));
      if (e.key === "-") setZoom(z => Math.max(z - 0.25, 0.25));
      if (e.key === "0") { setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom(z => Math.min(Math.max(z + delta, 0.25), 5));
  }, []);

  // Mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.65rem 1.2rem",
        background: "#0a0a0a",
        borderBottom: "1px solid #1a1a1a",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: "0.78rem", color: "#aaa", fontWeight: 600, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current.name}
          {images.length > 1 && (
            <span style={{ color: "#555", marginLeft: "0.5rem" }}>{index + 1} / {images.length}</span>
          )}
        </span>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} title="Zoom -" style={lbBtnStyle}>
            <ZoomOut size={15} />
          </button>
          <span style={{ fontSize: "0.7rem", color: "#888", minWidth: "36px", textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(z + 0.25, 5))} title="Zoom +" style={lbBtnStyle}>
            <ZoomIn size={15} />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Réinitialiser" style={lbBtnStyle}>
            <RotateCcw size={14} />
          </button>
          <button onClick={onClose} title="Fermer (Échap)" style={{ ...lbBtnStyle, marginLeft: "0.4rem" }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
          userSelect: "none",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={current.url}
          alt={current.name}
          draggable={false}
          style={{
            maxWidth: "90vw",
            maxHeight: "80vh",
            objectFit: "contain",
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 0.12s ease",
            borderRadius: "4px",
            boxShadow: "0 8px 48px rgba(0,0,0,0.8)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIndex(i => Math.max(i - 1, 0)); }}
            disabled={index === 0}
            style={{ ...lbNavStyle, left: "1rem" }}
          >
            ‹
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIndex(i => Math.min(i + 1, images.length - 1)); }}
            disabled={index === images.length - 1}
            style={{ ...lbNavStyle, right: "1rem" }}
          >
            ›
          </button>
        </>
      )}

      {/* Thumbnail strip (if multiple) */}
      {images.length > 1 && (
        <div style={{
          display: "flex",
          gap: "0.4rem",
          padding: "0.6rem 1.2rem",
          background: "#0a0a0a",
          borderTop: "1px solid #1a1a1a",
          overflowX: "auto",
          flexShrink: 0,
          justifyContent: "center",
        }}>
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 52,
                height: 38,
                borderRadius: 4,
                overflow: "hidden",
                border: i === index ? "2px solid var(--primary)" : "2px solid #222",
                cursor: "pointer",
                flexShrink: 0,
                opacity: i === index ? 1 : 0.55,
                transition: "opacity 0.12s, border-color 0.12s",
              }}
            >
              <img src={img.url} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}

      {/* Keyboard hint */}
      <div style={{
        position: "absolute",
        bottom: images.length > 1 ? "4.5rem" : "0.75rem",
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: "0.58rem",
        color: "#333",
        whiteSpace: "nowrap",
      }}>
        Molette pour zoomer · Clic-glisser pour déplacer · Échap pour fermer
      </div>
    </div>
  );
}

const lbBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  background: "#161616",
  border: "1px solid #2a2a2a",
  borderRadius: 6,
  color: "#aaa",
  cursor: "pointer",
  transition: "background 0.12s",
};

const lbNavStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.55)",
  border: "1px solid #333",
  borderRadius: 6,
  color: "#fff",
  fontSize: "1.8rem",
  lineHeight: 1,
  width: 40,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 10,
};

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

interface KanbanTaskDetailProps {
  card: KanbanCard;
  currentUser: any;
  onClose: () => void;
  onEdit: () => void;
  onToast: (msg: string) => void;
  columnActions?: { id: string; label: string }[];
  onMoveCard?: (cardId: string, targetColumnId: string) => void;
  readOnly?: boolean;
  projectId: string;
  boardId: string;
  teamMembers?: TeamMemberForKanban[];
}

export default function KanbanTaskDetail({
  card, currentUser, onClose, onEdit, onToast,
  columnActions = [], onMoveCard, readOnly = false, projectId, boardId, teamMembers = [],
}: KanbanTaskDetailProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const getMember = (uid: string) => {
    const m = teamMembers.find(t => t.userId === uid);
    return {
      name:   m
        ? (m.firstName && m.lastName ? `${m.firstName} ${m.lastName[0]}.` : m.displayName || "Membre")
        : uid.slice(0, 6),
      avatar: m ? (m.image || m.photoURL || "") : "",
      init:   m ? (m.firstName || m.displayName || "?")[0].toUpperCase() : uid[0]?.toUpperCase() || "?",
    };
  };

  const handleDelete = async () => {
    if (readOnly) return;
    if (confirm("Supprimer cette tâche ?")) {
      await deleteCard(projectId, boardId, card.id!);
      onToast("Tâche supprimée");
      onClose();
    }
  };

  const handleMove = async (targetId: string) => {
    if (readOnly || !onMoveCard) return;
    await onMoveCard(card.id!, targetId);
    onToast(`Déplacé vers ${columnActions.find(c => c.id === targetId)?.label}`);
    onClose();
  };

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  const colStyle      = COL_STYLES[card.columnId] || { label: card.columnId, color: "var(--line)" };
  const priorityStyle = PRIORITIES[card.priority]  || { label: card.priority,  color: "var(--line)", bg: "#1a1a1a" };
  const attachments   = card.attachments || [];
  const imageLinks    = attachments.filter(a => isImage(a.url));
  const otherLinks    = attachments.filter(a => !isImage(a.url));
  const startDate     = formatDate((card as any).startDate);
  const dueDate       = formatDate(card.dueDate);

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal}>

          {/* Cover strip */}
          {card.coverColor && (
            <div className={styles.coverStrip} style={{ background: card.coverColor }} />
          )}

          {/* Header — full width */}
          <div className={styles.headerOuter}>
            <div className={styles.header}>
              <div className={styles.titleBlock}>
                <h2 className={styles.title}>{card.title}</h2>
                <div className={styles.metaRow}>
                  <span
                    className={styles.badgePriority}
                    style={{ color: priorityStyle.color, background: priorityStyle.bg, borderColor: priorityStyle.color + "33" }}
                  >
                    {priorityStyle.label}
                  </span>
                  <span className={styles.badgeCol} style={{ color: colStyle.color }}>
                    {columnActions.find(c => c.id === card.columnId)?.label || colStyle.label}
                  </span>
                </div>
              </div>
              <div className={styles.headerActions}>
                {!readOnly && (
                  <>
                    <button className={styles.iconBtn} onClick={onEdit} title="Modifier"><Edit2 size={15} /></button>
                    <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={handleDelete} title="Supprimer"><Trash2 size={15} /></button>
                  </>
                )}
                <button className={styles.iconBtn} onClick={onClose} title="Fermer"><X size={16} /></button>
              </div>
            </div>
          </div>

          {/* Move bar — full width */}
          {!readOnly && columnActions.length > 0 && (
            <div className={styles.moveBarOuter}>
              <div className={styles.moveBar}>
                <span className={styles.moveLabel}>Déplacer :</span>
                <div className={styles.moveBtns}>
                  {columnActions.map(col => (
                    <button
                      key={col.id}
                      className={`${styles.moveBtn} ${col.id === card.columnId ? styles.moveBtnActive : ""}`}
                      onClick={() => handleMove(col.id)}
                      disabled={col.id === card.columnId}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Body — two columns */}
          <div className={styles.body}>

            {/* LEFT: main content */}
            <div className={styles.bodyMain}>

              {/* Description */}
              {card.description && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Description</h3>
                  <p className={styles.desc}>{card.description}</p>
                </div>
              )}

              {/* Images — click opens lightbox */}
              {imageLinks.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}><ImageIcon size={10} /> Images</h3>
                  <div className={styles.imagesGrid}>
                    {imageLinks.map((img, i) => (
                      <div
                        key={img.id}
                        className={styles.imageThumbLink}
                        title={`${img.name} — cliquer pour agrandir`}
                        onClick={() => setLightboxIndex(i)}
                        style={{ cursor: "zoom-in" }}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className={styles.imageThumb}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <span className={styles.imageThumbName}>{img.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {card.comments && card.comments.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}><MessageCircle size={10} /> Commentaires ({card.comments.length})</h3>
                  {card.comments.map(c => (
                    <div key={c.id} className={styles.comment}>
                      <div className={styles.commentAvatar}>
                        {c.authorPhoto ? <img src={c.authorPhoto} alt={c.authorName} /> : c.authorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={styles.commentBody}>
                        <div className={styles.commentAuthor}>{c.authorName}</div>
                        <div className={styles.commentText}>{c.text}</div>
                        <div className={styles.commentTime}>{formatDate(c.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* RIGHT: sidebar metadata */}
            <div className={styles.bodySidebar}>

              {/* Assignees */}
              {card.assignees && card.assignees.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Assignés</h3>
                  <div className={styles.assigneeRow}>
                    {card.assignees.map(uid => {
                      const { name, avatar, init } = getMember(uid);
                      return (
                        <div key={uid} className={styles.assigneeChip}>
                          <div className={styles.assigneeAvatar}>
                            {avatar
                              ? <img src={avatar} alt={name} className={styles.assigneeImg} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              : <span className={styles.assigneeInit}>{init}</span>
                            }
                          </div>
                          {name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={styles.sidebarDivider} />

              {/* Dates */}
              {startDate && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}><Calendar size={10} /> Début</h3>
                  <div className={styles.dateValue}>{startDate}</div>
                </div>
              )}
              {dueDate && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}><Calendar size={10} /> Échéance</h3>
                  <div className={styles.dateValue}>{dueDate}</div>
                </div>
              )}

              {(startDate || dueDate) && <div className={styles.sidebarDivider} />}

              {/* Labels */}
              {card.labels && card.labels.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}><Flag size={10} /> Labels</h3>
                  <div className={styles.labelsWrap}>
                    {card.labels.map(l => (
                      <span key={l.id} className={styles.labelChip} style={{ background: l.color + "22", color: l.color }}>
                        {l.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {card.labels && card.labels.length > 0 && <div className={styles.sidebarDivider} />}

              {/* Links */}
              {otherLinks.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}><Link2 size={10} /> Liens</h3>
                  <div className={styles.linksList}>
                    {otherLinks.map(l => (
                      <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        <Link2 size={10} style={{ flexShrink: 0 }} />{l.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {otherLinks.length > 0 && <div className={styles.sidebarDivider} />}

              {/* Metadata footer */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Créée le</h3>
                <span style={{ fontSize: "0.76rem", color: "var(--line)" }}>{formatDate(card.createdAt)}</span>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Lightbox — rendered outside the main modal via portal-like placement */}
      {lightboxIndex !== null && (
        <Lightbox
          images={imageLinks.map(img => ({ url: img.url, name: img.name }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}