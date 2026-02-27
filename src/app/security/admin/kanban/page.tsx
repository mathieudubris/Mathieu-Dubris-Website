"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type DragEvent,
} from "react";
import {
  Plus,
  Search,
  X,
  MoreHorizontal,
  CheckSquare,
  MessageCircle,
  Calendar,
  Paperclip,
  Users,
  ChevronDown,
  Trash2,
  Edit3,
  Archive,
  Loader2,
  Layout,
  AlertCircle,
  Clock,
  Flag,
} from "lucide-react";
import { auth } from "@/utils/firebase-api";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createBoard,
  createCard,
  createColumn,
  updateCard,
  updateColumn,
  deleteCard,
  deleteColumn,
  archiveCard,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  addComment,
  seedDefaultColumns,
  subscribeToBoard,
  getBoards,
  type KanbanBoard,
  type KanbanColumn,
  type KanbanCard,
  type KanbanPriority,
  type KanbanChecklist,
  type KanbanComment,
} from "@/utils/kanban-api";
import styles from "./kanban.module.css";

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITIES: { value: KanbanPriority; label: string; color: string }[] = [
  { value: "low", label: "Basse", color: "#22c55e" },
  { value: "medium", label: "Moyenne", color: "#3b82f6" },
  { value: "high", label: "Haute", color: "#f59e0b" },
  { value: "critical", label: "Critique", color: "#ef4444" },
];

const DEFAULT_LABELS = [
  { id: "l1", name: "Bug", color: "#ef4444" },
  { id: "l2", name: "Feature", color: "#3b82f6" },
  { id: "l3", name: "Design", color: "#8b5cf6" },
  { id: "l4", name: "Urgent", color: "#f59e0b" },
  { id: "l5", name: "Documentation", color: "#22c55e" },
  { id: "l6", name: "Refactor", color: "#ec4899" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function priorityClass(p: KanbanPriority) {
  const map: Record<KanbanPriority, string> = {
    low: styles.priorityLow,
    medium: styles.priorityMedium,
    high: styles.priorityHigh,
    critical: styles.priorityCritical,
  };
  return map[p];
}

function dueDateStatus(ts: any): "overdue" | "dueSoon" | "ok" | null {
  if (!ts) return null;
  const due = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "overdue";
  if (diff < 2) return "dueSoon";
  return "ok";
}

function formatDate(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Card Detail Modal ────────────────────────────────────────────────────────

interface CardModalProps {
  card: KanbanCard;
  columns: KanbanColumn[];
  currentUser: User | null;
  onClose: () => void;
  onUpdate: (cardId: string, data: Partial<KanbanCard>) => void;
  onDelete: (cardId: string) => void;
  onArchive: (cardId: string) => void;
}

function CardModal({
  card,
  columns,
  currentUser,
  onClose,
  onUpdate,
  onDelete,
  onArchive,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [priority, setPriority] = useState<KanbanPriority>(card.priority);
  const [columnId, setColumnId] = useState(card.columnId);
  const [dueDate, setDueDate] = useState(
    card.dueDate
      ? (card.dueDate.toDate
          ? card.dueDate.toDate()
          : new Date(card.dueDate)
        )
          .toISOString()
          .split("T")[0]
      : ""
  );
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    card.labels.map((l) => l.id)
  );
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const labels = DEFAULT_LABELS.filter((l) => selectedLabels.includes(l.id));
    await onUpdate(card.id!, {
      title,
      description,
      priority,
      columnId,
      labels,
      dueDate: dueDate ? new Date(dueDate) : null,
    });
    setSaving(false);
  };

  const handleAddCheckItem = async () => {
    if (!newCheckItem.trim()) return;
    await addChecklistItem(card.id!, card.checklist, newCheckItem.trim());
    setNewCheckItem("");
  };

  const handleToggle = (itemId: string) =>
    toggleChecklistItem(card.id!, card.checklist, itemId);

  const handleDeleteCheck = (itemId: string) =>
    deleteChecklistItem(card.id!, card.checklist, itemId);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    await addComment(card.id!, card.comments, {
      authorId: currentUser.uid,
      authorName: currentUser.displayName || "Moi",
      authorPhoto: currentUser.photoURL || undefined,
      text: newComment.trim(),
    });
    setNewComment("");
  };

  const doneCount = card.checklist.filter((c) => c.done).length;
  const totalCount = card.checklist.length;

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <textarea
            className={styles.modalTitleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
          />
          <button className={styles.btnIcon} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Main */}
          <div className={styles.modalMain}>
            {/* Description */}
            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>
                <Edit3 size={12} /> Description
              </span>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajouter une description..."
                rows={3}
              />
            </div>

            {/* Labels */}
            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>
                <Flag size={12} /> Labels
              </span>
              <div className={styles.labelsGrid}>
                {DEFAULT_LABELS.map((label) => (
                  <div
                    key={label.id}
                    className={`${styles.labelChip} ${
                      selectedLabels.includes(label.id) ? styles.selected : ""
                    }`}
                    style={{ background: label.color + "30", color: label.color }}
                    onClick={() =>
                      setSelectedLabels((prev) =>
                        prev.includes(label.id)
                          ? prev.filter((id) => id !== label.id)
                          : [...prev, label.id]
                      )
                    }
                  >
                    {label.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>
                <CheckSquare size={12} /> Checklist{" "}
                {totalCount > 0 && `(${doneCount}/${totalCount})`}
              </span>
              {totalCount > 0 && (
                <div className={styles.checklistProgress}>
                  <span className={styles.checklistText}>
                    {Math.round((doneCount / totalCount) * 100)}%
                  </span>
                  <div className={styles.checklistBar}>
                    <div
                      className={styles.checklistBarFill}
                      style={{ width: `${(doneCount / totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {card.checklist.map((item) => (
                <div key={item.id} className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    className={styles.checklistCheckbox}
                    checked={item.done}
                    onChange={() => handleToggle(item.id)}
                  />
                  <span
                    className={`${styles.checklistItemText} ${
                      item.done ? styles.done : ""
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    className={styles.btnIcon}
                    onClick={() => handleDeleteCheck(item.id)}
                    style={{ padding: "0.2rem" }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  className={styles.addItemInput}
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Ajouter un élément..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddCheckItem()}
                />
                <button className={styles.btnPrimary} onClick={handleAddCheckItem}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Comments */}
            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>
                <MessageCircle size={12} /> Commentaires
              </span>
              {card.comments.map((c) => (
                <div key={c.id} className={styles.commentItem}>
                  <div
                    className={styles.avatar}
                    style={{ width: 28, height: 28 }}
                  >
                    {c.authorPhoto ? (
                      <img src={c.authorPhoto} alt={c.authorName} />
                    ) : (
                      initials(c.authorName)
                    )}
                  </div>
                  <div className={styles.commentContent}>
                    <div className={styles.commentAuthor}>{c.authorName}</div>
                    <div className={styles.commentText}>{c.text}</div>
                    <div className={styles.commentTime}>
                      {formatDate(c.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  className={styles.addItemInput}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <button className={styles.btnPrimary} onClick={handleAddComment}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.modalSidebar}>
            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>Colonne</span>
              <select
                className={styles.sidebarSelect}
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>Priorité</span>
              <select
                className={styles.prioritySelect}
                value={priority}
                onChange={(e) => setPriority(e.target.value as KanbanPriority)}
                style={{
                  borderColor:
                    PRIORITIES.find((p) => p.value === priority)?.color + "80",
                }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>
                <Calendar size={11} /> Échéance
              </span>
              <input
                type="date"
                className={styles.dateInput}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className={styles.divider} />

            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : "Sauvegarder"}
            </button>
            <button
              className={styles.btnGhost}
              onClick={() => onArchive(card.id!)}
            >
              <Archive size={14} /> Archiver
            </button>
            <button
              className={styles.btnDanger}
              onClick={() => {
                onDelete(card.id!);
                onClose();
              }}
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Column Component ─────────────────────────────────────────────────────────

interface ColumnProps {
  column: KanbanColumn;
  cards: KanbanCard[];
  onAddCard: (columnId: string, title: string) => void;
  onCardClick: (card: KanbanCard) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDragStart: (e: DragEvent, cardId: string) => void;
  onDrop: (e: DragEvent, columnId: string) => void;
  onDragOver: (e: DragEvent) => void;
}

function ColumnComp({
  column,
  cards,
  onAddCard,
  onCardClick,
  onDeleteColumn,
  onRenameColumn,
  onDragStart,
  onDrop,
  onDragOver,
}: ColumnProps) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (addingCard) inputRef.current?.focus();
  }, [addingCard]);

  const handleAdd = () => {
    if (!newCardTitle.trim()) {
      setAddingCard(false);
      return;
    }
    onAddCard(column.id!, newCardTitle.trim());
    setNewCardTitle("");
    setAddingCard(false);
  };

  const atLimit =
    column.cardLimit != null && cards.length >= column.cardLimit;

  return (
    <div
      className={`${styles.column} ${isDragOver ? styles.dragOver : ""}`}
      onDragOver={(e) => {
        onDragOver(e);
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, column.id!);
      }}
    >
      {/* Column header */}
      <div className={styles.columnHeader}>
        {column.color && (
          <div
            className={styles.columnHeaderAccent}
            style={{ background: column.color }}
          />
        )}
        <div className={styles.columnTitleGroup}>
          <input
            className={styles.columnTitleInput}
            value={colTitle}
            onChange={(e) => setColTitle(e.target.value)}
            onBlur={() =>
              colTitle !== column.title &&
              onRenameColumn(column.id!, colTitle)
            }
          />
          <span className={`${styles.columnCount} ${atLimit ? styles.atLimit : ""}`}>
            {cards.length}
            {column.cardLimit != null ? `/${column.cardLimit}` : ""}
          </span>
        </div>
        <div className={styles.columnActions}>
          <button
            className={styles.btnIcon}
            onClick={() => setAddingCard(true)}
            title="Ajouter une carte"
          >
            <Plus size={15} />
          </button>
          <button
            className={styles.btnIcon}
            onClick={() => onDeleteColumn(column.id!)}
            title="Supprimer la colonne"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className={styles.cardsList}>
        {cards.length === 0 && !addingCard && (
          <div className={styles.emptyColumn}>
            <Layout size={22} />
            <span>Aucune tâche</span>
          </div>
        )}
        {cards.map((card) => (
          <KanbanCardComp
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
            onDragStart={onDragStart}
          />
        ))}

        {/* Inline add form */}
        {addingCard && (
          <div className={styles.addCardForm}>
            <textarea
              ref={inputRef}
              className={styles.addCardInput}
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Titre de la tâche..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
                if (e.key === "Escape") setAddingCard(false);
              }}
            />
            <div className={styles.addCardActions}>
              <button className={styles.btnPrimary} onClick={handleAdd}>
                Ajouter
              </button>
              <button
                className={styles.btnIcon}
                onClick={() => setAddingCard(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add card button */}
      {!addingCard && (
        <button
          className={styles.addCardBtn}
          onClick={() => setAddingCard(true)}
          disabled={atLimit}
          title={atLimit ? `Limite WIP atteinte (${column.cardLimit})` : ""}
        >
          <Plus size={15} />
          {atLimit ? `Limite atteinte (${column.cardLimit})` : "Ajouter une tâche"}
        </button>
      )}
    </div>
  );
}

// ─── Card Component ───────────────────────────────────────────────────────────

interface KanbanCardCompProps {
  card: KanbanCard;
  onClick: () => void;
  onDragStart: (e: DragEvent, cardId: string) => void;
}

function KanbanCardComp({ card, onClick, onDragStart }: KanbanCardCompProps) {
  const [dragging, setDragging] = useState(false);
  const doneCount = card.checklist.filter((c) => c.done).length;
  const totalCount = card.checklist.length;
  const dueSt = dueDateStatus(card.dueDate);
  const pColor = PRIORITIES.find((p) => p.value === card.priority)?.color || "";

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
    >
      {/* Cover */}
      {card.coverColor && (
        <div
          className={styles.cardCover}
          style={{ background: card.coverColor }}
        />
      )}

      <div className={styles.cardBody}>
        {/* Labels */}
        {card.labels.length > 0 && (
          <div className={styles.cardLabels}>
            {card.labels.map((label) => (
              <div
                key={label.id}
                className={styles.cardLabel}
                style={{ background: label.color, minWidth: 36 }}
                title={label.name}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <div className={styles.cardTitle}>{card.title}</div>

        {/* Description preview */}
        {card.description && (
          <div className={styles.cardDesc}>{card.description}</div>
        )}

        {/* Meta */}
        <div className={styles.cardMeta}>
          <div className={styles.cardMetaLeft}>
            {/* Priority dot */}
            <div
              className={`${styles.priorityDot} ${priorityClass(card.priority)}`}
              title={PRIORITIES.find((p) => p.value === card.priority)?.label}
            />

            {/* Due date */}
            {dueSt && (
              <span
                className={`${styles.cardBadge} ${
                  dueSt === "overdue"
                    ? styles.overdue
                    : dueSt === "dueSoon"
                    ? styles.dueSoon
                    : ""
                }`}
              >
                <Clock size={10} />
                {formatDate(card.dueDate)}
              </span>
            )}

            {/* Checklist */}
            {totalCount > 0 && (
              <span className={styles.cardBadge}>
                <CheckSquare size={10} />
                {doneCount}/{totalCount}
              </span>
            )}

            {/* Comments */}
            {card.comments.length > 0 && (
              <span className={styles.cardBadge}>
                <MessageCircle size={10} />
                {card.comments.length}
              </span>
            )}
          </div>

          {/* Avatars */}
          {card.assignees.length > 0 && (
            <div className={styles.avatarStack}>
              {card.assignees.slice(0, 3).map((uid, i) => (
                <div key={uid} className={styles.avatar}>
                  {uid.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist progress bar */}
        {totalCount > 0 && (
          <div className={styles.checklistBar} style={{ marginTop: "0.5rem" }}>
            <div
              className={styles.checklistBarFill}
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Kanban Page ─────────────────────────────────────────────────────────

export default function KanbanPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoard, setActiveBoard] = useState<KanbanBoard | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<KanbanPriority | "all">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const dragCardId = useRef<string | null>(null);

  // Auth
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  // Load boards
  useEffect(() => {
    if (!currentUser) return;
    getBoards(currentUser.uid).then(setBoards);
  }, [currentUser]);

  // Subscribe to active board
  useEffect(() => {
    if (!activeBoard?.id) return;
    const unsub = subscribeToBoard(
      activeBoard.id,
      setColumns,
      setCards
    );
    return unsub;
  }, [activeBoard?.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Sync selected card from live cards
  useEffect(() => {
    if (!selectedCard) return;
    const updated = cards.find((c) => c.id === selectedCard.id);
    if (updated) setSelectedCard(updated);
  }, [cards]);

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim() || !currentUser) return;
    const boardId = await createBoard(newBoardTitle.trim(), "", currentUser.uid);
    await seedDefaultColumns(boardId);
    const updatedBoards = await getBoards(currentUser.uid);
    setBoards(updatedBoards);
    const board = updatedBoards.find((b) => b.id === boardId);
    if (board) setActiveBoard(board);
    setNewBoardTitle("");
    setCreatingBoard(false);
    showToast("Tableau créé !");
  };

  const handleAddCard = async (columnId: string, title: string) => {
    if (!activeBoard?.id || !currentUser) return;
    const colCards = cards.filter((c) => c.columnId === columnId);
    await createCard(
      activeBoard.id,
      columnId,
      title,
      currentUser.uid,
      colCards.length
    );
    showToast("Tâche ajoutée");
  };

  const handleAddColumn = async () => {
    if (!activeBoard?.id) return;
    const title = `Colonne ${columns.length + 1}`;
    await createColumn(activeBoard.id, title, columns.length);
    showToast("Colonne ajoutée");
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Supprimer cette colonne et toutes ses cartes ?")) return;
    await deleteColumn(columnId);
    showToast("Colonne supprimée");
  };

  const handleRenameColumn = async (columnId: string, title: string) => {
    await updateColumn(columnId, { title });
  };

  const handleUpdateCard = async (cardId: string, data: Partial<KanbanCard>) => {
    await updateCard(cardId, data);
    showToast("Carte mise à jour");
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    await deleteCard(cardId);
    setSelectedCard(null);
    showToast("Tâche supprimée");
  };

  const handleArchiveCard = async (cardId: string) => {
    await archiveCard(cardId);
    setSelectedCard(null);
    showToast("Tâche archivée");
  };

  // Drag & Drop
  const handleDragStart = (e: DragEvent, cardId: string) => {
    dragCardId.current = cardId;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const cardId = dragCardId.current;
    if (!cardId) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.columnId === targetColumnId) return;
    const colCards = cards.filter((c) => c.columnId === targetColumnId);
    await updateCard(cardId, {
      columnId: targetColumnId,
      position: colCards.length,
    });
    dragCardId.current = null;
    showToast("Tâche déplacée");
  };

  // Filter cards
  const filteredCards = cards.filter((card) => {
    const matchSearch =
      !search ||
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      card.description?.toLowerCase().includes(search.toLowerCase());
    const matchPriority =
      filterPriority === "all" || card.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const getColumnCards = (columnId: string) =>
    filteredCards
      .filter((c) => c.columnId === columnId)
      .sort((a, b) => a.position - b.position);

  // ── Render: loading ──
  if (loading) {
    return (
      <div className={styles.kanbanWrapper}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          Chargement...
        </div>
      </div>
    );
  }

  // ── Render: board selection ──
  if (!activeBoard) {
    return (
      <div className={styles.kanbanWrapper}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <Layout size={20} color="var(--primary)" />
            <span className={styles.boardTitle}>Kanban</span>
          </div>
          <div className={styles.topbarRight}>
            <button
              className={styles.btnPrimary}
              onClick={() => setCreatingBoard(true)}
            >
              <Plus size={15} /> Nouveau tableau
            </button>
          </div>
        </div>

        <div className={styles.boardSelector}>
          <h2 style={{ color: "var(--light)", fontWeight: 700, fontSize: "1.4rem" }}>
            Mes tableaux
          </h2>

          {/* Create board inline */}
          {creatingBoard && (
            <div style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: 500 }}>
              <input
                className={styles.searchInput}
                style={{ flex: 1, maxWidth: "unset" }}
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Nom du tableau..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
              />
              <button className={styles.btnPrimary} onClick={handleCreateBoard}>
                Créer
              </button>
              <button
                className={styles.btnGhost}
                onClick={() => setCreatingBoard(false)}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {boards.length === 0 ? (
            <div style={{ color: "var(--line)", textAlign: "center" }}>
              <AlertCircle size={36} style={{ margin: "0 auto 1rem" }} />
              <p>Aucun tableau. Créez-en un pour commencer.</p>
            </div>
          ) : (
            <div className={styles.boardGrid}>
              {boards.map((board) => (
                <div
                  key={board.id}
                  className={styles.boardCard}
                  onClick={() => setActiveBoard(board)}
                >
                  <div className={styles.boardCardTitle}>{board.title}</div>
                  {board.description && (
                    <div className={styles.boardCardDesc}>
                      {board.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: active board ──
  return (
    <div className={styles.kanbanWrapper}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            className={styles.btnIcon}
            onClick={() => setActiveBoard(null)}
            title="Retour aux tableaux"
          >
            <Layout size={18} />
          </button>
          <span
            className={styles.boardTitle}
            title="Cliquer pour renommer"
          >
            {activeBoard.title}
          </span>
        </div>
        <div className={styles.topbarRight}>
          <button className={styles.btnPrimary} onClick={handleAddColumn}>
            <Plus size={15} /> Colonne
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className={filterPriority === "all" ? styles.filterChipActive : styles.filterChip}
          onClick={() => setFilterPriority("all")}
        >
          Tous
        </button>
        {PRIORITIES.map((p) => (
          <button
            key={p.value}
            className={
              filterPriority === p.value
                ? styles.filterChipActive
                : styles.filterChip
            }
            onClick={() =>
              setFilterPriority(
                filterPriority === p.value ? "all" : p.value
              )
            }
            style={
              filterPriority === p.value
                ? { borderColor: p.color, color: p.color }
                : {}
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Board */}
      <div className={styles.boardScroll}>
        {columns.map((col) => (
          <ColumnComp
            key={col.id}
            column={col}
            cards={getColumnCards(col.id!)}
            onAddCard={handleAddCard}
            onCardClick={setSelectedCard}
            onDeleteColumn={handleDeleteColumn}
            onRenameColumn={handleRenameColumn}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        ))}
      </div>

      {/* Card modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          columns={columns}
          currentUser={currentUser}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
          onArchive={handleArchiveCard}
        />
      )}

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}