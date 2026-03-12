"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Flag,
  Calendar,
  CheckSquare,
  Link2,
  Users,
  UserCheck,
} from "lucide-react";
import {
  updateCard,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  getBoardMemberProfiles,
} from "@/utils/kanban-api";
import type { KanbanCard, KanbanPriority, KanbanMember } from "@/utils/kanban-api";
import styles from "./KanbanTaskEditor.module.css";

const PRIORITIES = [
  { value: "low", label: "Basse", color: "#22c55e" },
  { value: "medium", label: "Moyenne", color: "#3b82f6" },
  { value: "high", label: "Haute", color: "#f59e0b" },
  { value: "critical", label: "Critique", color: "#ef4444" },
];

const COLOR_PALETTE = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
  "#14b8a6", "#f97316", "#06b6d4", "#84cc16", "#a855f7", "#d946ef",
  "#64748b", "#6b7280", "#78716c", "#71717a", "#737373", "#525252",
  "#ef4444cc", "#f59e0bcc", "#22c55ecc", "#3b82f6cc", "#8b5cf6cc", "#ec4899cc",
];

interface KanbanTaskEditorProps {
  card?: KanbanCard;
  isNew?: boolean;
  columnId?: string;
  currentUser: any;
  onClose: () => void;
  onSave?: (title: string) => void;
  onToast: (msg: string) => void;
  columnActions?: { id: string; label: string }[];
  onMoveCard?: (cardId: string, targetColumnId: string) => void;
}

export default function KanbanTaskEditor({
  card,
  isNew,
  columnId,
  currentUser,
  onClose,
  onSave,
  onToast,
  columnActions = [],
  onMoveCard,
}: KanbanTaskEditorProps) {
  const [title, setTitle] = useState(card?.title || "");
  const [description, setDescription] = useState(card?.description || "");
  const [priority, setPriority] = useState<KanbanPriority>(card?.priority || "medium");
  const [dueDate, setDueDate] = useState(
    card?.dueDate
      ? (card.dueDate.toDate ? card.dueDate.toDate() : new Date(card.dueDate))
          .toISOString()
          .split("T")[0]
      : ""
  );
  const [labels, setLabels] = useState(card?.labels || []);
  const [assignees, setAssignees] = useState<string[]>(card?.assignees || []);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLabelCreator, setShowLabelCreator] = useState(false);
  const [targetColumn, setTargetColumn] = useState(card?.columnId || columnId || "");
  const [boardMembers, setBoardMembers] = useState<KanbanMember[]>([]);

  useEffect(() => {
    if (!card?.boardId) return;
    getBoardMemberProfiles(card.boardId)
      .then(setBoardMembers)
      .catch(() => {});
  }, [card?.boardId]);

  const handleSave = async () => {
    if (isNew && onSave) {
      if (!title.trim()) return;
      onSave(title.trim());
      onClose();
      return;
    }
    if (!card) return;

    setSaving(true);
    await updateCard(card.id!, {
      title,
      description,
      priority,
      labels,
      assignees,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    if (onMoveCard && targetColumn !== card.columnId) {
      await onMoveCard(card.id!, targetColumn);
    }

    setSaving(false);
    onToast("Tâche mise à jour");
    onClose();
  };

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    setLabels([
      ...labels,
      { id: `label-${Date.now()}`, name: newLabelName.trim(), color: selectedColor },
    ]);
    setNewLabelName("");
    setShowLabelCreator(false);
  };

  const handleRemoveLabel = (labelId: string) =>
    setLabels(labels.filter((l) => l.id !== labelId));

  const handleToggleAssignee = (uid: string) =>
    setAssignees((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    );

  const handleAddCheckItem = async () => {
    if (!newCheckItem.trim() || !card) return;
    await addChecklistItem(card.id!, card.checklist, newCheckItem.trim());
    setNewCheckItem("");
  };

  const handleToggleCheck = (itemId: string) => {
    if (!card) return;
    toggleChecklistItem(card.id!, card.checklist, itemId);
  };

  const handleDeleteCheck = (itemId: string) => {
    if (!card) return;
    deleteChecklistItem(card.id!, card.checklist, itemId);
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

  const doneCount = card?.checklist.filter((c) => c.done).length || 0;
  const totalCount = card?.checklist.length || 0;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <input
            id="task-title-input"
            className={styles.modalTitleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la tâche"
            autoFocus={!isNew}
          />
          <button className={styles.btnIcon} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalMain}>
            {/* Description */}
            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>Description</span>
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
              <div className={styles.labelsContainer}>
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className={styles.labelChip}
                    style={{ background: label.color + "20", color: label.color }}
                  >
                    {label.name}
                    <button
                      className={styles.removeLabel}
                      onClick={() => handleRemoveLabel(label.id)}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <button
                  className={styles.addLabelBtn}
                  onClick={() => setShowLabelCreator(!showLabelCreator)}
                >
                  <Plus size={12} /> Ajouter
                </button>
              </div>

              {showLabelCreator && (
                <div className={styles.labelCreator}>
                  <input
                    className={styles.labelInput}
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Nom du label"
                    autoFocus
                  />
                  <div className={styles.colorPalette}>
                    {COLOR_PALETTE.slice(0, 12).map((color) => (
                      <div
                        key={color}
                        className={`${styles.colorOption} ${selectedColor === color ? styles.selected : ""}`}
                        style={{ background: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                  <div className={styles.labelActions}>
                    <button className={styles.btnPrimary} onClick={handleAddLabel}>
                      Ajouter
                    </button>
                    <button
                      className={styles.btnGhost}
                      onClick={() => setShowLabelCreator(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Membres assignés */}
            {!isNew && boardMembers.length > 0 && (
              <div className={styles.modalSection}>
                <span className={styles.modalSectionTitle}>
                  <Users size={12} /> Membres assignés
                </span>
                <div className={styles.membersGrid}>
                  {boardMembers.map((member) => {
                    const isAssigned = assignees.includes(member.uid);
                    const display = getMemberDisplay(member.uid);
                    return (
                      <button
                        key={member.uid}
                        type="button"
                        className={`${styles.memberChip} ${isAssigned ? styles.memberAssigned : ""}`}
                        onClick={() => handleToggleAssignee(member.uid)}
                        title={display.name}
                      >
                        {display.photoURL ? (
                          <img
                            src={display.photoURL}
                            alt={display.name}
                            className={styles.memberAvatar}
                          />
                        ) : (
                          <div className={styles.memberInitials}>{display.initials}</div>
                        )}
                        <span className={styles.memberName}>{display.name}</span>
                        {isAssigned && <UserCheck size={11} className={styles.memberCheck} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checklist */}
            {card && (
              <div className={styles.modalSection}>
                <span className={styles.modalSectionTitle}>
                  <CheckSquare size={12} /> Checklist
                  {totalCount > 0 && ` (${doneCount}/${totalCount})`}
                </span>

                {card.checklist.map((item) => (
                  <div key={item.id} className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      className={styles.checklistCheckbox}
                      checked={item.done}
                      onChange={() => handleToggleCheck(item.id)}
                    />
                    <span
                      className={`${styles.checklistItemText} ${item.done ? styles.done : ""}`}
                    >
                      {item.text}
                    </span>
                    <button
                      className={styles.btnIcon}
                      onClick={() => handleDeleteCheck(item.id)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <div className={styles.addItemRow}>
                  <input
                    className={styles.addItemInput}
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    placeholder="Nouvel élément..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddCheckItem()}
                  />
                  <button className={styles.btnPrimary} onClick={handleAddCheckItem}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Liens */}
            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>
                <Link2 size={12} /> Liens
              </span>
              <div className={styles.addItemRow}>
                <input className={styles.addItemInput} placeholder="Ajouter un lien..." />
                <button className={styles.btnPrimary}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.modalSidebar}>
            {columnActions.length > 0 && card && (
              <div className={styles.modalSection}>
                <span className={styles.modalSectionTitle}>Déplacer vers</span>
                <select
                  className={styles.sidebarSelect}
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                >
                  {columnActions.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>Priorité</span>
              <select
                className={styles.sidebarSelect}
                value={priority}
                onChange={(e) => setPriority(e.target.value as KanbanPriority)}
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

            {assignees.length > 0 && (
              <div className={styles.modalSection}>
                <span className={styles.modalSectionTitle}>
                  Assignés ({assignees.length})
                </span>
                <div className={styles.assigneePreview}>
                  {assignees.map((uid) => {
                    const display = getMemberDisplay(uid);
                    return (
                      <div key={uid} className={styles.assigneeAvatar} title={display.name}>
                        {display.photoURL ? (
                          <img src={display.photoURL} alt={display.name} />
                        ) : (
                          <span>{display.initials}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.divider} />

            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? "Sauvegarde..." : isNew ? "Créer" : "Sauvegarder"}
            </button>
            <button className={styles.btnGhost} onClick={onClose}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}