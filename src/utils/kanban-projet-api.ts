// utils/kanban-projet-api.ts
// API Firestore pour les Kanban liés aux projets
import {
  collection,
  doc,
  addDoc,
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

export interface KanbanCard {
  id?: string;
  title: string;
  description?: string;
  columnId: string;
  projectId: string;
  position: number;
  priority: KanbanPriority;
  labels: KanbanLabel[];
  assignees: string[];
  checklist: KanbanChecklist[];
  comments: KanbanComment[];
  attachments: KanbanAttachment[];
  coverColor?: string;
  dueDate?: any;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  archived: boolean;
}

export interface KanbanColumn {
  id?: string;
  title: string;
  projectId: string;
  position: number;
  color?: string;
  cardLimit?: number | null;
  createdAt: any;
  updatedAt: any;
}

// ─── INITIALISATION DU KANBAN POUR UN PROJET ────────────────────────────────

/**
 * Crée les colonnes par défaut pour un projet
 */
export const initializeProjectKanban = async (projectId: string): Promise<void> => {
  if (!projectId) throw new Error("projectId is required");
  
  const defaultColumns = [
    { title: "À faire", color: "#a3a3a3", position: 0 },
    { title: "En cours", color: "#c7ff44", position: 1 },
    { title: "En révision", color: "#f59e0b", position: 2 },
    { title: "Blocage", color: "#ef4444", position: 3 },
    { title: "Terminé", color: "#22c55e", position: 4 },
  ];

  const batch = writeBatch(db);
  
  for (const col of defaultColumns) {
    const colRef = doc(collection(db, "projects", projectId, "kanban_columns"));
    batch.set(colRef, {
      ...col,
      projectId,
      cardLimit: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  
  await batch.commit();
};

/**
 * Vérifie si un projet a un Kanban
 */
export const projectHasKanban = async (projectId: string): Promise<boolean> => {
  try {
    if (!projectId) return false;
    
    const columnsRef = collection(db, "projects", projectId, "kanban_columns");
    const snapshot = await getDocs(query(columnsRef, limit(1)));
    return !snapshot.empty;
  } catch (error) {
    console.error("projectHasKanban error:", error);
    return false;
  }
};

// ─── COLONNES ────────────────────────────────────────────────────────────────

export const getProjectColumns = async (projectId: string): Promise<KanbanColumn[]> => {
  if (!projectId) return [];
  
  const q = query(
    collection(db, "projects", projectId, "kanban_columns"),
    orderBy("position", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanColumn));
};

export const createColumn = async (
  projectId: string,
  title: string,
  position: number,
  color?: string,
  cardLimit?: number | null
): Promise<string> => {
  if (!projectId) throw new Error("projectId is required");
  
  const colRef = doc(collection(db, "projects", projectId, "kanban_columns"));
  const columnData: Omit<KanbanColumn, 'id'> = {
    projectId,
    title,
    position,
    color: color ?? undefined,
    cardLimit: cardLimit ?? undefined,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(colRef, columnData);
  return colRef.id;
};

export const updateColumn = async (
  projectId: string,
  columnId: string,
  data: Partial<KanbanColumn>
): Promise<void> => {
  if (!projectId || !columnId) throw new Error("projectId and columnId are required");
  
  const cleanData = { ...data };
  if (cleanData.cardLimit === undefined) delete cleanData.cardLimit;
  
  await updateDoc(doc(db, "projects", projectId, "kanban_columns", columnId), {
    ...cleanData,
    updatedAt: Timestamp.now(),
  });
};

export const deleteColumn = async (projectId: string, columnId: string): Promise<void> => {
  if (!projectId || !columnId) throw new Error("projectId and columnId are required");
  
  const batch = writeBatch(db);
  
  // Supprimer les cartes de la colonne
  const cardsSnap = await getDocs(
    query(collection(db, "projects", projectId, "kanban_cards"), where("columnId", "==", columnId))
  );
  cardsSnap.forEach((d) => batch.delete(d.ref));
  
  // Supprimer la colonne
  batch.delete(doc(db, "projects", projectId, "kanban_columns", columnId));
  
  await batch.commit();
};

export const reorderColumns = async (
  projectId: string,
  columns: { id: string; position: number }[]
): Promise<void> => {
  if (!projectId || !columns.length) return;
  
  const batch = writeBatch(db);
  columns.forEach(({ id, position }) => {
    batch.update(doc(db, "projects", projectId, "kanban_columns", id), {
      position,
      updatedAt: Timestamp.now(),
    });
  });
  await batch.commit();
};

// ─── CARTES ───────────────────────────────────────────────────────────────────

export const createCard = async (
  projectId: string,
  columnId: string,
  title: string,
  createdBy: string,
  position: number
): Promise<string> => {
  if (!projectId || !columnId) throw new Error("projectId and columnId are required");
  
  const cardRef = doc(collection(db, "projects", projectId, "kanban_cards"));
  const cardData: Omit<KanbanCard, 'id'> = {
    projectId,
    columnId,
    title,
    description: "",
    position,
    priority: "medium",
    labels: [],
    assignees: [],
    checklist: [],
    comments: [],
    attachments: [],
    archived: false,
    createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(cardRef, cardData);
  return cardRef.id;
};

export const getProjectCards = async (projectId: string): Promise<KanbanCard[]> => {
  if (!projectId) return [];
  
  const q = query(
    collection(db, "projects", projectId, "kanban_cards"),
    where("archived", "==", false),
    orderBy("position", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanCard));
};

export const getCard = async (projectId: string, cardId: string): Promise<KanbanCard | null> => {
  if (!projectId || !cardId) return null;
  
  const snap = await getDoc(doc(db, "projects", projectId, "kanban_cards", cardId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as KanbanCard;
};

export const updateCard = async (
  projectId: string,
  cardId: string,
  data: Partial<KanbanCard>
): Promise<void> => {
  if (!projectId || !cardId) throw new Error("projectId and cardId are required");
  
  await updateDoc(doc(db, "projects", projectId, "kanban_cards", cardId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const moveCard = async (
  projectId: string,
  cardId: string,
  newColumnId: string,
  newPosition: number
): Promise<void> => {
  if (!projectId || !cardId || !newColumnId) throw new Error("Missing required parameters");
  
  await updateDoc(doc(db, "projects", projectId, "kanban_cards", cardId), {
    columnId: newColumnId,
    position: newPosition,
    updatedAt: Timestamp.now(),
  });
};

export const reorderCards = async (
  projectId: string,
  cards: { id: string; columnId: string; position: number }[]
): Promise<void> => {
  if (!projectId || !cards.length) return;
  
  const batch = writeBatch(db);
  cards.forEach(({ id, columnId, position }) => {
    batch.update(doc(db, "projects", projectId, "kanban_cards", id), {
      columnId,
      position,
      updatedAt: Timestamp.now(),
    });
  });
  await batch.commit();
};

export const archiveCard = async (projectId: string, cardId: string): Promise<void> => {
  if (!projectId || !cardId) throw new Error("projectId and cardId are required");
  
  await updateDoc(doc(db, "projects", projectId, "kanban_cards", cardId), {
    archived: true,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCard = async (projectId: string, cardId: string): Promise<void> => {
  if (!projectId || !cardId) throw new Error("projectId and cardId are required");
  
  await deleteDoc(doc(db, "projects", projectId, "kanban_cards", cardId));
};

// ─── REAL-TIME LISTENER ──────────────────────────────────────────────────────

export const subscribeToProjectKanban = (
  projectId: string,
  onColumnsUpdate: (columns: KanbanColumn[]) => void,
  onCardsUpdate: (cards: KanbanCard[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!projectId) {
    const noop = () => {};
    return noop;
  }
  
  const colQ = query(
    collection(db, "projects", projectId, "kanban_columns"),
    orderBy("position", "asc")
  );
  
  const cardQ = query(
    collection(db, "projects", projectId, "kanban_cards"),
    where("archived", "==", false),
    orderBy("position", "asc")
  );

  const handleError = (error: Error) => {
    console.error("Firestore subscription error:", error);
    if (onError) onError(error);
  };

  const unsubCols = onSnapshot(
    colQ,
    (snap) => onColumnsUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanColumn))),
    handleError
  );

  const unsubCards = onSnapshot(
    cardQ,
    (snap) => onCardsUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanCard))),
    handleError
  );

  return () => {
    unsubCols();
    unsubCards();
  };
};

// ─── CHECKLIST ───────────────────────────────────────────────────────────────

export const addChecklistItem = async (
  projectId: string,
  cardId: string,
  currentChecklist: KanbanChecklist[],
  text: string
): Promise<void> => {
  if (!projectId || !cardId) throw new Error("projectId and cardId are required");
  
  const newItem: KanbanChecklist = {
    id: `chk_${Date.now()}`,
    text,
    done: false,
  };
  await updateCard(projectId, cardId, { checklist: [...currentChecklist, newItem] });
};

export const toggleChecklistItem = async (
  projectId: string,
  cardId: string,
  checklist: KanbanChecklist[],
  itemId: string
): Promise<void> => {
  if (!projectId || !cardId) throw new Error("projectId and cardId are required");
  
  const updated = checklist.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item
  );
  await updateCard(projectId, cardId, { checklist: updated });
};

export const deleteChecklistItem = async (
  projectId: string,
  cardId: string,
  checklist: KanbanChecklist[],
  itemId: string
): Promise<void> => {
  if (!projectId || !cardId) throw new Error("projectId and cardId are required");
  
  const updated = checklist.filter((item) => item.id !== itemId);
  await updateCard(projectId, cardId, { checklist: updated });
};

// ─── COMMENTS ────────────────────────────────────────────────────────────────

export const addComment = async (
  projectId: string,
  cardId: string,
  currentComments: KanbanComment[],
  comment: Omit<KanbanComment, "id" | "createdAt">
): Promise<void> => {
  if (!projectId || !cardId) throw new Error("projectId and cardId are required");
  
  const newComment: KanbanComment = {
    ...comment,
    id: `cmt_${Date.now()}`,
    createdAt: Timestamp.now(),
  };
  await updateCard(projectId, cardId, { comments: [...currentComments, newComment] });
};

export const deleteComment = async (
  projectId: string,
  cardId: string,
  comments: KanbanComment[],
  commentId: string
): Promise<void> => {
  if (!projectId || !cardId) throw new Error("projectId and cardId are required");
  
  const updated = comments.filter((c) => c.id !== commentId);
  await updateCard(projectId, cardId, { comments: updated });
};

// ─── ASSIGNEES ───────────────────────────────────────────────────────────────

export const toggleCardAssignee = async (
  projectId: string,
  cardId: string,
  currentAssignees: string[],
  userId: string
): Promise<void> => {
  if (!projectId || !cardId) throw new Error("projectId and cardId are required");
  
  const updated = currentAssignees.includes(userId)
    ? currentAssignees.filter((uid) => uid !== userId)
    : [...currentAssignees, userId];
  await updateCard(projectId, cardId, { assignees: updated });
};