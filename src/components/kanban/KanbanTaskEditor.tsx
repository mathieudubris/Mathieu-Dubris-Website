"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Flag, Calendar, CheckSquare, Link2 } from "lucide-react";
import { 
  updateCard, 
  addChecklistItem, 
  toggleChecklistItem, 
  deleteChecklistItem 
} from "@/utils/kanban-projet-api";
import type { KanbanCard, KanbanPriority } from "@/utils/kanban-projet-api";
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
  "#ef4444cc", "#f59e0bcc", "#22c55ecc", "#3b82f6cc", "#8b5cf6cc", "#ec4899cc"
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
  projectId: string;
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
  projectId,
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
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newLink, setNewLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLabelCreator, setShowLabelCreator] = useState(false);
  const [targetColumn, setTargetColumn] = useState(card?.columnId || columnId || "");

  useEffect(() => {
    if (isNew && title.trim()) {
      const timer = setTimeout(() => {
        document.getElementById("task-title-input")?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const handleSave = async () => {
    if (isNew && onSave) {
      if (!title.trim()) return;
      onSave(title.trim());
      onClose();
      return;
    }

    if (!card) return;
    
    setSaving(true);
    try {
      await updateCard(projectId, card.id!, {
        title,
        description,
        priority,
        labels,
        dueDate: dueDate ? new Date(dueDate) : null,
      });
      
      if (onMoveCard && targetColumn !== card.columnId) {
        await onMoveCard(card.id!, targetColumn);
      }
      
      onToast("Tâche mise à jour");
      onClose();
    } catch (error) {
      console.error("Error saving card:", error);
      onToast("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    const newLabel = {
      id: `label-${Date.now()}`,
      name: newLabelName.trim(),
      color: selectedColor,
    };
    setLabels([...labels, newLabel]);
    setNewLabelName("");
    setShowLabelCreator(false);
  };

  const handleRemoveLabel = (labelId: string) => {
    setLabels(labels.filter((l) => l.id !== labelId));
  };

  const handleAddCheckItem = async () => {
    if (!newCheckItem.trim() || !card) return;
    await addChecklistItem(projectId, card.id!, card.checklist, newCheckItem.trim());
    setNewCheckItem("");
  };

  const handleToggleCheck = (itemId: string) => {
    if (!card) return;
    toggleChecklistItem(projectId, card.id!, card.checklist, itemId);
  };

  const handleDeleteCheck = (itemId: string) => {
    if (!card) return;
    deleteChecklistItem(projectId, card.id!, card.checklist, itemId);
  };

  const doneCount = card?.checklist.filter((c) => c.done).length || 0;
  const totalCount = card?.checklist.length || 0;

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
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

            {/* Checklist - seulement si carte existe */}
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
                    <span className={`${styles.checklistItemText} ${item.done ? styles.done : ""}`}>
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

            {/* Links - placeholder */}
            <div className={styles.modalSection}>
              <span className={styles.modalSectionTitle}>
                <Link2 size={12} /> Liens
              </span>
              <div className={styles.addItemRow}>
                <input
                  className={styles.addItemInput}
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Ajouter un lien..."
                />
                <button className={styles.btnPrimary}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.modalSidebar}>
            {/* Colonne de destination (pour les cartes existantes) */}
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