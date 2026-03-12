"use client";

import React, { useState, useEffect } from "react";
import { subscribeToBoard, updateBoard } from "@/utils/kanban-api";
import type { KanbanBoard, KanbanColumn, KanbanCard } from "@/utils/kanban-api";
// ⚠️ Composants locaux (dossier navigation/) — PAS ceux de src/components/kanban/
import HeaderKanbanDetail from "./HeaderKanbanDetail";
import SectionKanbanDetail from "./SectionKanbanDetail";
import styles from "./KanbanDetail.module.css";

interface KanbanDetailProps {
  board: KanbanBoard;
  currentUser: any;
  onBack: () => void;
  onBoardUpdated: () => void;
}

export default function KanbanDetail({
  board,
  currentUser,
  onBack,
  onBoardUpdated,
}: KanbanDetailProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [editingTitle, setEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!board.id) return;
    const unsub = subscribeToBoard(board.id, setColumns, setCards);
    return unsub;
  }, [board.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleUpdateTitle = async () => {
    if (!boardTitle.trim() || boardTitle === board.title) {
      setBoardTitle(board.title);
      setEditingTitle(false);
      return;
    }
    await updateBoard(board.id!, { title: boardTitle.trim() });
    onBoardUpdated();
    setEditingTitle(false);
    showToast("Titre mis à jour");
  };

  const filteredCards = cards.filter((card) => {
    const matchSearch =
      !search ||
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      card.description?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === "all" || card.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  return (
    <div className={styles.wrapper}>
      <HeaderKanbanDetail
        boardTitle={board.title}
        editingTitle={editingTitle}
        boardTitleValue={boardTitle}
        onTitleChange={setBoardTitle}
        onTitleEdit={() => setEditingTitle(true)}
        onTitleSave={handleUpdateTitle}
        onTitleCancel={() => {
          setBoardTitle(board.title);
          setEditingTitle(false);
        }}
        search={search}
        onSearchChange={setSearch}
        filterPriority={filterPriority}
        onFilterChange={setFilterPriority}
        onBack={onBack}
      />

      <SectionKanbanDetail
        columns={columns}
        cards={filteredCards}
        currentUser={currentUser}
        boardId={board.id!}
        onToast={showToast}
      />

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}