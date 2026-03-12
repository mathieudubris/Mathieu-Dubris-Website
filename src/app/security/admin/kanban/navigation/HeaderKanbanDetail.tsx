"use client";

import React from "react";
import { Layout, Search, X, Edit2, Check } from "lucide-react";
import styles from "./HeaderKanbanDetail.module.css";

const PRIORITIES = [
  { value: "low", label: "Basse", color: "#22c55e" },
  { value: "medium", label: "Moyenne", color: "#3b82f6" },
  { value: "high", label: "Haute", color: "#f59e0b" },
  { value: "critical", label: "Critique", color: "#ef4444" },
];

interface HeaderKanbanDetailProps {
  boardTitle: string;
  editingTitle: boolean;
  boardTitleValue: string;
  onTitleChange: (value: string) => void;
  onTitleEdit: () => void;
  onTitleSave: () => void;
  onTitleCancel: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filterPriority: string;
  onFilterChange: (value: string) => void;
  onBack: () => void;
}

export default function HeaderKanbanDetail({
  boardTitle,
  editingTitle,
  boardTitleValue,
  onTitleChange,
  onTitleEdit,
  onTitleSave,
  onTitleCancel,
  search,
  onSearchChange,
  filterPriority,
  onFilterChange,
  onBack,
}: HeaderKanbanDetailProps) {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.btnIcon} onClick={onBack} title="Retour aux tableaux">
            <Layout size={18} />
          </button>

          {editingTitle ? (
            <div className={styles.titleEditor}>
              <input
                className={styles.titleInput}
                value={boardTitleValue}
                onChange={(e) => onTitleChange(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && onTitleSave()}
              />
              <button className={styles.btnIcon} onClick={onTitleSave}>
                <Check size={16} />
              </button>
              <button className={styles.btnIcon} onClick={onTitleCancel}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className={styles.titleWrapper}>
              <span className={styles.boardTitle}>{boardTitle}</span>
              <button className={styles.btnIcon} onClick={onTitleEdit} title="Renommer">
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => onSearchChange("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <button
          className={filterPriority === "all" ? styles.filterChipActive : styles.filterChip}
          onClick={() => onFilterChange("all")}
        >
          Tous
        </button>

        {PRIORITIES.map((p) => (
          <button
            key={p.value}
            className={
              filterPriority === p.value ? styles.filterChipActive : styles.filterChip
            }
            onClick={() =>
              onFilterChange(filterPriority === p.value ? "all" : p.value)
            }
            style={
              filterPriority === p.value ? { borderColor: p.color, color: p.color } : {}
            }
          >
            {p.label}
          </button>
        ))}
      </div>
    </>
  );
}