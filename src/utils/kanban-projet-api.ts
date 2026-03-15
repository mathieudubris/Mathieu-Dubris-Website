// utils/kanban-projet-api.ts
// API Firestore pour les Kanban liés aux projets
// Structure : portfolio/projet-en-cours/projects/{projectId}/progression/{boardId}/kanban_columns|kanban_cards

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase-api";

// ─── INTERFACES ─────────────────────────────────────────────────────────────

export type KanbanPriority = "low" | "medium" | "high" | "critical";
export type KanbanLabel = { id: string; name: string; color: string };

export interface KanbanChecklist {
  id: string;
  text: string;
  done: boolean;
}

export interface KanbanComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: any;
}

export interface KanbanAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: any;
}

export interface KanbanBoard {
  id?: string;
  title: string;
  projectId: string;
  description?: string;
  createdAt: any;
  updatedAt: any;
}

export interface KanbanCard {
  id?: string;
  title: string;
  description?: string;
  columnId: string;
  projectId: string;
  boardId: string;
  position: number;
  priority: KanbanPriority;
  labels: KanbanLabel[];
  assignees: string[];
  checklist: KanbanChecklist[];
  comments: KanbanComment[];
  attachments: KanbanAttachment[];
  coverColor?: string;
  dueDate?: any;
  startDate?: any;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  archived: boolean;
}

export interface KanbanColumn {
  id?: string;
  title: string;
  projectId: string;
  boardId: string;
  position: number;
  color?: string;
  cardLimit?: number | null;
  createdAt: any;
  updatedAt: any;
}

// ─── CHEMINS FIRESTORE ─────────────────────────────────────────────────────

/** Référence vers la collection progression d'un projet */
const getProgressionCol = (projectId: string) =>
  collection(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'progression');

/** Référence vers un document board */
const getBoardDoc = (projectId: string, boardId: string) =>
  doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'progression', boardId);

/** Référence vers la sous-collection des colonnes d'un board */
const getKanbanColumnsCol = (projectId: string, boardId: string) =>
  collection(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'progression', boardId, 'kanban_columns');

/** Référence vers un document colonne */
const getKanbanColumnDoc = (projectId: string, boardId: string, columnId: string) =>
  doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'progression', boardId, 'kanban_columns', columnId);

/** Référence vers la sous-collection des cartes d'un board */
const getKanbanCardsCol = (projectId: string, boardId: string) =>
  collection(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'progression', boardId, 'kanban_cards');

/** Référence vers un document carte */
const getKanbanCardDoc = (projectId: string, boardId: string, cardId: string) =>
  doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'progression', boardId, 'kanban_cards', cardId);

// ─── BOARDS (tableaux) ───────────────────────────────────────────────────────

export const getProjectBoards = async (projectId: string): Promise<KanbanBoard[]> => {
  if (!projectId) return [];
  const snap = await getDocs(query(getProgressionCol(projectId), orderBy("createdAt", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as KanbanBoard));
};

export const createBoard = async (
  projectId: string,
  title: string,
  description?: string
): Promise<string> => {
  if (!projectId) throw new Error("projectId is required");
  const boardRef = doc(getProgressionCol(projectId));
  await setDoc(boardRef, {
    title,
    description: description || "",
    projectId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Initialiser les colonnes par défaut
  const defaultColumns = [
    { title: "À faire",     color: "#a3a3a3", position: 0 },
    { title: "En cours",    color: "#c7ff44", position: 1 },
    { title: "En révision", color: "#f59e0b", position: 2 },
    { title: "Blocage",     color: "#ef4444", position: 3 },
    { title: "Terminé",     color: "#22c55e", position: 4 },
  ];
  const batch = writeBatch(db);
  for (const col of defaultColumns) {
    const colRef = doc(getKanbanColumnsCol(projectId, boardRef.id));
    batch.set(colRef, {
      ...col,
      projectId,
      boardId: boardRef.id,
      cardLimit: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  await batch.commit();

  return boardRef.id;
};

export const updateBoard = async (
  projectId: string,
  boardId: string,
  data: Partial<KanbanBoard>
): Promise<void> => {
  if (!projectId || !boardId) throw new Error("projectId and boardId are required");
  await updateDoc(getBoardDoc(projectId, boardId), { ...data, updatedAt: Timestamp.now() });
};

export const deleteBoard = async (projectId: string, boardId: string): Promise<void> => {
  if (!projectId || !boardId) throw new Error("projectId and boardId are required");
  // Supprimer colonnes et cartes
  const batch = writeBatch(db);
  const colsSnap = await getDocs(getKanbanColumnsCol(projectId, boardId));
  colsSnap.forEach(d => batch.delete(d.ref));
  const cardsSnap = await getDocs(getKanbanCardsCol(projectId, boardId));
  cardsSnap.forEach(d => batch.delete(d.ref));
  batch.delete(getBoardDoc(projectId, boardId));
  await batch.commit();
};

export const subscribeToBoards = (
  projectId: string,
  onUpdate: (boards: KanbanBoard[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!projectId) return () => {};
  const q = query(getProgressionCol(projectId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() } as KanbanBoard))),
    err => { if (onError) onError(err); }
  );
};

// ─── LEGACY : vérifie si un board existe (pour compatibilité) ─────────────
export const projectHasKanban = async (projectId: string): Promise<boolean> => {
  try {
    if (!projectId) return false;
    const snap = await getDocs(query(getProgressionCol(projectId), limit(1)));
    return !snap.empty;
  } catch (error) {
    console.error("projectHasKanban error:", error);
    return false;
  }
};

// LEGACY : initialise un premier board par défaut (si besoin)
export const initializeProjectKanban = async (projectId: string, title = "Tableau principal"): Promise<string> => {
  return createBoard(projectId, title);
};

// ─── COLONNES ────────────────────────────────────────────────────────────────

export const getProjectColumns = async (projectId: string, boardId: string): Promise<KanbanColumn[]> => {
  if (!projectId || !boardId) return [];
  const q = query(getKanbanColumnsCol(projectId, boardId), orderBy("position", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as KanbanColumn));
};

export const createColumn = async (
  projectId: string,
  boardId: string,
  title: string,
  position: number,
  color?: string,
  cardLimit?: number | null
): Promise<string> => {
  if (!projectId || !boardId) throw new Error("projectId and boardId are required");
  const colRef = doc(getKanbanColumnsCol(projectId, boardId));
  await setDoc(colRef, {
    projectId,
    boardId,
    title,
    position,
    color: color ?? undefined,
    cardLimit: cardLimit ?? undefined,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return colRef.id;
};

export const updateColumn = async (
  projectId: string,
  boardId: string,
  columnId: string,
  data: Partial<KanbanColumn>
): Promise<void> => {
  if (!projectId || !boardId || !columnId) throw new Error("projectId, boardId and columnId are required");
  const cleanData = { ...data };
  if (cleanData.cardLimit === undefined) delete cleanData.cardLimit;
  await updateDoc(getKanbanColumnDoc(projectId, boardId, columnId), { ...cleanData, updatedAt: Timestamp.now() });
};

export const deleteColumn = async (projectId: string, boardId: string, columnId: string): Promise<void> => {
  if (!projectId || !boardId || !columnId) throw new Error("required params missing");
  const batch = writeBatch(db);
  const cardsSnap = await getDocs(
    query(getKanbanCardsCol(projectId, boardId), where("columnId", "==", columnId))
  );
  cardsSnap.forEach(d => batch.delete(d.ref));
  batch.delete(getKanbanColumnDoc(projectId, boardId, columnId));
  await batch.commit();
};

// ─── CARTES ───────────────────────────────────────────────────────────────────

export const createCard = async (
  projectId: string,
  boardId: string,
  columnId: string,
  title: string,
  createdBy: string,
  position: number,
  assignees: string[] = []
): Promise<string> => {
  if (!projectId || !boardId || !columnId) throw new Error("projectId, boardId and columnId are required");
  const cardRef = doc(getKanbanCardsCol(projectId, boardId));
  await setDoc(cardRef, {
    projectId,
    boardId,
    columnId,
    title,
    description: "",
    position,
    priority: "medium",
    labels: [],
    assignees,
    checklist: [],
    comments: [],
    attachments: [],
    archived: false,
    createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return cardRef.id;
};

export const updateCard = async (
  projectId: string,
  boardId: string,
  cardId: string,
  data: Partial<KanbanCard>
): Promise<void> => {
  if (!projectId || !boardId || !cardId) throw new Error("projectId, boardId and cardId are required");
  await updateDoc(getKanbanCardDoc(projectId, boardId, cardId), { ...data, updatedAt: Timestamp.now() });
};

export const moveCard = async (
  projectId: string,
  boardId: string,
  cardId: string,
  newColumnId: string,
  newPosition: number
): Promise<void> => {
  if (!projectId || !boardId || !cardId || !newColumnId) throw new Error("Missing required parameters");
  await updateDoc(getKanbanCardDoc(projectId, boardId, cardId), {
    columnId: newColumnId,
    position: newPosition,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCard = async (projectId: string, boardId: string, cardId: string): Promise<void> => {
  if (!projectId || !boardId || !cardId) throw new Error("projectId, boardId and cardId are required");
  await deleteDoc(getKanbanCardDoc(projectId, boardId, cardId));
};

export const archiveCard = async (projectId: string, boardId: string, cardId: string): Promise<void> => {
  if (!projectId || !boardId || !cardId) throw new Error("required params missing");
  await updateDoc(getKanbanCardDoc(projectId, boardId, cardId), { archived: true, updatedAt: Timestamp.now() });
};

// ─── REAL-TIME LISTENER ──────────────────────────────────────────────────────

export const subscribeToProjectKanban = (
  projectId: string,
  boardId: string,
  onColumnsUpdate: (columns: KanbanColumn[]) => void,
  onCardsUpdate:   (cards:   KanbanCard[])   => void,
  onError?:        (error:   Error)          => void
): Unsubscribe => {
  if (!projectId || !boardId) return () => {};

  const handleError = (error: Error) => {
    console.error("Firestore subscription error:", error);
    if (onError) onError(error);
  };

  const colQ  = query(getKanbanColumnsCol(projectId, boardId), orderBy("position", "asc"));
  const cardQ = query(
    getKanbanCardsCol(projectId, boardId),
    where("archived", "==", false),
    orderBy("position", "asc")
  );

  const unsubCols  = onSnapshot(colQ,  snap => onColumnsUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() } as KanbanColumn))),  handleError);
  const unsubCards = onSnapshot(cardQ, snap => onCardsUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() } as KanbanCard))), handleError);

  return () => { unsubCols(); unsubCards(); };
};

// ─── CHECKLIST ───────────────────────────────────────────────────────────────

export const addChecklistItem = async (
  projectId: string, boardId: string, cardId: string, currentChecklist: KanbanChecklist[], text: string
): Promise<void> => {
  const newItem: KanbanChecklist = { id: `chk_${Date.now()}`, text, done: false };
  await updateCard(projectId, boardId, cardId, { checklist: [...currentChecklist, newItem] });
};

export const toggleChecklistItem = async (
  projectId: string, boardId: string, cardId: string, checklist: KanbanChecklist[], itemId: string
): Promise<void> => {
  const updated = checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item);
  await updateCard(projectId, boardId, cardId, { checklist: updated });
};

export const deleteChecklistItem = async (
  projectId: string, boardId: string, cardId: string, checklist: KanbanChecklist[], itemId: string
): Promise<void> => {
  await updateCard(projectId, boardId, cardId, { checklist: checklist.filter(item => item.id !== itemId) });
};

// ─── COMMENTS ────────────────────────────────────────────────────────────────

export const addComment = async (
  projectId: string, boardId: string, cardId: string, currentComments: KanbanComment[],
  comment: Omit<KanbanComment, "id" | "createdAt">
): Promise<void> => {
  const newComment: KanbanComment = { ...comment, id: `cmt_${Date.now()}`, createdAt: Timestamp.now() };
  await updateCard(projectId, boardId, cardId, { comments: [...currentComments, newComment] });
};

export const deleteComment = async (
  projectId: string, boardId: string, cardId: string, comments: KanbanComment[], commentId: string
): Promise<void> => {
  await updateCard(projectId, boardId, cardId, { comments: comments.filter(c => c.id !== commentId) });
};

// ─── ASSIGNEES ───────────────────────────────────────────────────────────────

export const toggleCardAssignee = async (
  projectId: string, boardId: string, cardId: string, currentAssignees: string[], userId: string
): Promise<void> => {
  const updated = currentAssignees.includes(userId)
    ? currentAssignees.filter(uid => uid !== userId)
    : [...currentAssignees, userId];
  await updateCard(projectId, boardId, cardId, { assignees: updated });
};