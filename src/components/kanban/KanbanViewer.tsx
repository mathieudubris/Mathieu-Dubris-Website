"use client";

import React, { useState, useEffect } from "react";
import {
  subscribeToProjectKanban,
  updateBoard,
} from "@/utils/kanban-projet-api";
import type { KanbanColumn, KanbanCard, KanbanBoard } from "@/utils/kanban-projet-api";
import { getProjectTeamMembers } from "@/utils/projet-api";
import type { ProjectTeamMember } from "@/utils/projet-api";
import { getAllUsers } from "@/utils/firebase-api";
import type { TeamMemberForKanban } from "@/components/kanban/KanbanTaskEditor";
import HeaderKanbanDetail from "@/components/kanban/HeaderKanbanDetail";
import SectionKanbanDetail from "@/components/kanban/SectionKanbanDetail";
import styles from "./KanbanViewer.module.css";

interface KanbanViewerProps {
  projectId: string;
  board: KanbanBoard;           // le board sélectionné
  currentUser?: any;
  readOnly?: boolean;
  onBack: () => void;           // retour vers la liste des tableaux
  onToast?: (msg: string) => void;
}

export default function KanbanViewer({
  projectId,
  board,
  currentUser,
  readOnly = false,
  onBack,
  onToast,
}: KanbanViewerProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterMyTasks, setFilterMyTasks] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(board.title);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberForKanban[]>([]);

  // Sync title when board changes
  useEffect(() => {
    setEditableTitle(board.title);
  }, [board.title]);

  // Load team members
  useEffect(() => {
    if (!projectId) return;
    const loadTeam = async () => {
      try {
        const teamProfiles: ProjectTeamMember[] = await getProjectTeamMembers(projectId);
        const allUsers = await getAllUsers();
        const merged: TeamMemberForKanban[] = teamProfiles.map(tp => {
          const googleUser = allUsers.find(u => u.uid === tp.userId);
          return {
            userId: tp.userId,
            firstName: tp.firstName,
            lastName: tp.lastName,
            image: tp.image || "",
            displayName: googleUser?.displayName || "",
            photoURL: googleUser?.photoURL || "",
          };
        });
        setTeamMembers(merged);
      } catch (err) {
        console.error("Erreur chargement membres:", err);
      }
    };
    loadTeam();
  }, [projectId]);

  // Subscribe to kanban data
  useEffect(() => {
    if (!projectId || !board.id) return;
    setIsLoading(true);
    setError(null);

    const unsub = subscribeToProjectKanban(
      projectId,
      board.id,
      (cols) => { setColumns(cols); setIsLoading(false); },
      (newCards) => { setCards(newCards); setIsLoading(false); },
      (err) => {
        console.error("Subscription error:", err);
        setError("Erreur de chargement du tableau");
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, [projectId, board.id]);

  const showToast = (msg: string) => {
    if (onToast) onToast(msg);
    else {
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 2500);
    }
  };

  const handleTitleSave = async () => {
    if (!editableTitle.trim()) return;
    try {
      await updateBoard(projectId, board.id!, { title: editableTitle.trim() });
      setEditingTitle(false);
      showToast("Titre mis à jour");
    } catch {
      showToast("Erreur lors de la mise à jour");
    }
  };

  const handleTitleCancel = () => {
    setEditableTitle(board.title);
    setEditingTitle(false);
  };

  const filteredCards = cards.filter((card) => {
    const matchSearch =
      !search ||
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(search.toLowerCase()));
    const matchPriority = filterPriority === "all" || card.priority === filterPriority;
    const matchMyTasks = !filterMyTasks || !currentUser || (card.assignees ?? []).includes(currentUser.uid);
    return matchSearch && matchPriority && matchMyTasks;
  });

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          Chargement du tableau...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.error}>
          <p>{error}</p>
          <button className={styles.backButton} onClick={onBack}>Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} style={{ overflow: "hidden" }}>
      <HeaderKanbanDetail
        boardTitle={editableTitle}
        editingTitle={editingTitle && !readOnly}
        boardTitleValue={editableTitle}
        onTitleChange={setEditableTitle}
        onTitleEdit={() => !readOnly && setEditingTitle(true)}
        onTitleSave={handleTitleSave}
        onTitleCancel={handleTitleCancel}
        search={search}
        onSearchChange={setSearch}
        filterPriority={filterPriority}
        onFilterChange={setFilterPriority}
        onBack={onBack}
        readOnly={readOnly}
        filterMyTasks={filterMyTasks}
        onFilterMyTasksChange={setFilterMyTasks}
        currentUser={currentUser}
      />

      <div className={styles.detailWrapper} style={{ flex: 1, minHeight: 0 }}>
        <SectionKanbanDetail
          columns={columns}
          cards={filteredCards}
          currentUser={currentUser}
          projectId={projectId}
          boardId={board.id!}
          onToast={showToast}
          readOnly={readOnly}
          teamMembers={teamMembers}
          filterMyTasks={filterMyTasks}
        />
      </div>

      {localToast && <div className={styles.toast}>{localToast}</div>}
    </div>
  );
}