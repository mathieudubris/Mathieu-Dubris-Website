"use client";

import React, { useState, useEffect } from "react";
import { subscribeToProjectKanban } from "@/utils/kanban-projet-api";
import type { KanbanColumn, KanbanCard } from "@/utils/kanban-projet-api";
import HeaderKanbanDetail from "@/components/kanban/HeaderKanbanDetail";
import SectionKanbanDetail from "@/components/kanban/SectionKanbanDetail";
import styles from "./KanbanViewer.module.css";

interface KanbanViewerProps {
  projectId: string;
  currentUser?: any;
  readOnly?: boolean;
  onBack?: () => void;
  onBoardUpdated?: () => void;
  onToast?: (msg: string) => void;
  boardTitle?: string; // Optionnel, pour personnaliser le titre
}

export default function KanbanViewer({ 
  projectId,
  currentUser,
  readOnly = false,
  onBack,
  onBoardUpdated,
  onToast,
  boardTitle = "Tableau Kanban"
}: KanbanViewerProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(boardTitle);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      setError("ID de projet manquant");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const unsub = subscribeToProjectKanban(
      projectId, 
      (cols) => {
        setColumns(cols);
        setIsLoading(false);
      },
      (newCards) => {
        setCards(newCards);
        setIsLoading(false);
      },
      (error) => {
        console.error("Subscription error:", error);
        setError("Erreur de chargement du tableau");
        setIsLoading(false);
      }
    );
    
    return () => {
      if (unsub) unsub();
    };
  }, [projectId]);

  // Mettre à jour le titre éditable quand boardTitle change
  useEffect(() => {
    setEditableTitle(boardTitle);
  }, [boardTitle]);

  const showToast = (msg: string) => {
    if (onToast) {
      onToast(msg);
    } else {
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 2500);
    }
  };

  // Filtrer les cartes
  const filteredCards = cards.filter((card) => {
    const matchSearch = !search ||
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchPriority = filterPriority === "all" || card.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const handleTitleSave = async () => {
    // Ici vous pourriez sauvegarder le titre du tableau si nécessaire
    setEditingTitle(false);
    showToast("Titre mis à jour");
  };

  const handleTitleCancel = () => {
    setEditableTitle(boardTitle);
    setEditingTitle(false);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Chargement du tableau...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        {onBack && (
          <button onClick={onBack} className={styles.backButton}>
            Retour
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <HeaderKanbanDetail
        boardTitle={boardTitle}
        editingTitle={editingTitle && !readOnly}
        boardTitleValue={editableTitle}
        onTitleChange={setEditableTitle}
        onTitleEdit={() => setEditingTitle(true)}
        onTitleSave={handleTitleSave}
        onTitleCancel={handleTitleCancel}
        search={search}
        onSearchChange={setSearch}
        filterPriority={filterPriority}
        onFilterChange={setFilterPriority}
        onBack={onBack || (() => {})}
        readOnly={readOnly}
      />

      <SectionKanbanDetail
        columns={columns}
        cards={filteredCards}
        currentUser={currentUser}
        projectId={projectId}
        onToast={showToast}
        readOnly={readOnly}
      />

      {localToast && (
        <div className={styles.toast}>
          {localToast}
        </div>
      )}
    </div>
  );
}