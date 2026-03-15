"use client";

import React from "react";
import { Search, X, Edit2, Check, ArrowLeft, User } from "lucide-react";
import styles from "./HeaderKanbanDetail.module.css";

const PRIORITIES = [
  { value: "low",      label: "Basse",    color: "var(--green)"  },
  { value: "medium",   label: "Moyenne",  color: "var(--blue)"   },
  { value: "high",     label: "Haute",    color: "var(--orange)" },
  { value: "critical", label: "Critique", color: "var(--red)"    },
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
  readOnly?: boolean;
  filterMyTasks?: boolean;
  onFilterMyTasksChange?: (v: boolean) => void;
  currentUser?: any;
}

export default function HeaderKanbanDetail({
  boardTitle, editingTitle, boardTitleValue, onTitleChange,
  onTitleEdit, onTitleSave, onTitleCancel,
  search, onSearchChange, filterPriority, onFilterChange,
  onBack, readOnly = false,
  filterMyTasks = false, onFilterMyTasksChange, currentUser,
}: HeaderKanbanDetailProps) {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.btnIcon} onClick={onBack} title="Retour">
            <ArrowLeft size={17} />
          </button>

          {editingTitle && !readOnly ? (
            <div className={styles.titleEditor}>
              <input
                className={styles.titleInput}
                value={boardTitleValue}
                onChange={e => onTitleChange(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === "Enter" && onTitleSave()}
              />
              <button className={styles.btnIcon} onClick={onTitleSave}><Check size={15} /></button>
              <button className={styles.btnIcon} onClick={onTitleCancel}><X size={15} /></button>
            </div>
          ) : (
            <div className={styles.titleWrapper}>
              <span className={styles.boardTitle}>{boardTitle}</span>
              {!readOnly && (
                <button className={styles.btnIcon} onClick={onTitleEdit} title="Renommer">
                  <Edit2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* "Mes tâches" button — visible whenever onFilterMyTasksChange is provided */}
        {onFilterMyTasksChange && (
          <button
            className={`${styles.myTasksBtn} ${filterMyTasks ? styles.myTasksBtnActive : ""}`}
            onClick={() => onFilterMyTasksChange(!filterMyTasks)}
            title={filterMyTasks ? "Voir toutes les tâches" : "Voir mes tâches"}
          >
            <User size={12} />
            <span>Mes tâches</span>
          </button>
        )}
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Rechercher..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => onSearchChange("")}>
              <X size={13} />
            </button>
          )}
        </div>

        <button
          className={filterPriority === "all" ? styles.filterChipActive : styles.filterChip}
          onClick={() => onFilterChange("all")}
        >
          Tous
        </button>

        {PRIORITIES.map(p => (
          <button
            key={p.value}
            className={filterPriority === p.value ? styles.filterChipActive : styles.filterChip}
            onClick={() => onFilterChange(filterPriority === p.value ? "all" : p.value)}
            style={filterPriority === p.value ? { borderColor: p.color, color: p.color, background: "#141a00" } : {}}
          >
            {p.label}
          </button>
        ))}
      </div>
    </>
  );
}
