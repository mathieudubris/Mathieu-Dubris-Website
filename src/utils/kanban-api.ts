// kanban-api.ts - API Firestore pour le Kanban Board
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
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

/** Représente un membre assignable à une carte Kanban */
export interface KanbanMember {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface KanbanCard {
  id?: string;
  title: string;
  description?: string;
  columnId: string;
  boardId: string;
  position: number;
  priority: KanbanPriority;
  labels: KanbanLabel[];
  assignees: string[];               // UIDs
  checklist: KanbanChecklist[];
  comments: KanbanComment[];
  attachments: KanbanAttachment[];
  coverColor?: string;
  dueDate?: any;                     // Timestamp ou null
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  archived: boolean;
}

export interface KanbanColumn {
  id?: string;
  title: string;
  boardId: string;
  position: number;
  color?: string;
  cardLimit?: number | null;
  createdAt: any;
  updatedAt: any;
}

export interface KanbanBoard {
  id?: string;
  title: string;
  description?: string;
  createdBy: string;
  members: string[];                 // UIDs
  background?: string;
  /** Membres enrichis avec infos profil (pour l'affichage dans les cartes) */
  memberProfiles?: KanbanMember[];
  createdAt: any;
  updatedAt: any;
}

// ─── BOARDS ─────────────────────────────────────────────────────────────────

export const createBoard = async (
  title: string,
  description: string,
  createdBy: string
): Promise<string> => {
  const boardData: Omit<KanbanBoard, 'id'> = {
    title,
    description,
    createdBy,
    members: [createdBy],
    memberProfiles: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, "kanban_boards"), boardData);
  return ref.id;
};

export const getBoards = async (userId: string): Promise<KanbanBoard[]> => {
  const q = query(
    collection(db, "kanban_boards"),
    where("members", "array-contains", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanBoard));
};

export const getBoard = async (boardId: string): Promise<KanbanBoard | null> => {
  const snap = await getDoc(doc(db, "kanban_boards", boardId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as KanbanBoard;
};

export const updateBoard = async (
  boardId: string,
  data: Partial<KanbanBoard>
): Promise<void> => {
  await updateDoc(doc(db, "kanban_boards", boardId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteBoard = async (boardId: string): Promise<void> => {
  const batch = writeBatch(db);
  const colSnap = await getDocs(
    query(collection(db, "kanban_columns"), where("boardId", "==", boardId))
  );
  colSnap.forEach((d) => batch.delete(d.ref));
  const cardSnap = await getDocs(
    query(collection(db, "kanban_cards"), where("boardId", "==", boardId))
  );
  cardSnap.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "kanban_boards", boardId));
  await batch.commit();
};

/**
 * Synchronise les membres d'un projet avec un tableau Kanban.
 * Appelé depuis le projet lorsqu'on lie un Kanban à un projet.
 */
export const syncProjectMembersToBoard = async (
  boardId: string,
  projectMembers: KanbanMember[]
): Promise<void> => {
  const memberUids = projectMembers.map((m) => m.uid);
  await updateDoc(doc(db, "kanban_boards", boardId), {
    members: memberUids,
    memberProfiles: projectMembers,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Récupère les profils membres d'un tableau (enrichis).
 */
export const getBoardMemberProfiles = async (boardId: string): Promise<KanbanMember[]> => {
  const board = await getBoard(boardId);
  return board?.memberProfiles || [];
};

// ─── COLUMNS ────────────────────────────────────────────────────────────────

export const createColumn = async (
  boardId: string,
  title: string,
  position: number,
  color?: string,
  cardLimit?: number | null
): Promise<string> => {
  const columnData: Omit<KanbanColumn, 'id'> = {
    boardId,
    title,
    position,
    color: color ?? undefined,
    cardLimit: cardLimit ?? undefined,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, "kanban_columns"), columnData);
  return ref.id;
};

export const getColumns = async (boardId: string): Promise<KanbanColumn[]> => {
  const q = query(
    collection(db, "kanban_columns"),
    where("boardId", "==", boardId),
    orderBy("position", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanColumn));
};

export const updateColumn = async (
  columnId: string,
  data: Partial<KanbanColumn>
): Promise<void> => {
  const cleanData = { ...data };
  if (cleanData.cardLimit === undefined) delete cleanData.cardLimit;

  await updateDoc(doc(db, "kanban_columns", columnId), {
    ...cleanData,
    updatedAt: Timestamp.now(),
  });
};

export const deleteColumn = async (columnId: string): Promise<void> => {
  const batch = writeBatch(db);
  const cardSnap = await getDocs(
    query(collection(db, "kanban_cards"), where("columnId", "==", columnId))
  );
  cardSnap.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "kanban_columns", columnId));
  await batch.commit();
};

export const reorderColumns = async (
  columns: { id: string; position: number }[]
): Promise<void> => {
  const batch = writeBatch(db);
  columns.forEach(({ id, position }) => {
    batch.update(doc(db, "kanban_columns", id), {
      position,
      updatedAt: Timestamp.now(),
    });
  });
  await batch.commit();
};

// ─── CARDS ───────────────────────────────────────────────────────────────────

export const createCard = async (
  boardId: string,
  columnId: string,
  title: string,
  createdBy: string,
  position: number
): Promise<string> => {
  const cardData: Omit<KanbanCard, 'id'> = {
    boardId,
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

  const ref = await addDoc(collection(db, "kanban_cards"), cardData);
  return ref.id;
};

export const getCards = async (boardId: string): Promise<KanbanCard[]> => {
  const q = query(
    collection(db, "kanban_cards"),
    where("boardId", "==", boardId),
    where("archived", "==", false),
    orderBy("position", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanCard));
};

export const getCard = async (cardId: string): Promise<KanbanCard | null> => {
  const snap = await getDoc(doc(db, "kanban_cards", cardId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as KanbanCard;
};

export const updateCard = async (
  cardId: string,
  data: Partial<KanbanCard>
): Promise<void> => {
  await updateDoc(doc(db, "kanban_cards", cardId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const moveCard = async (
  cardId: string,
  newColumnId: string,
  newPosition: number
): Promise<void> => {
  await updateDoc(doc(db, "kanban_cards", cardId), {
    columnId: newColumnId,
    position: newPosition,
    updatedAt: Timestamp.now(),
  });
};

export const reorderCards = async (
  cards: { id: string; columnId: string; position: number }[]
): Promise<void> => {
  const batch = writeBatch(db);
  cards.forEach(({ id, columnId, position }) => {
    batch.update(doc(db, "kanban_cards", id), {
      columnId,
      position,
      updatedAt: Timestamp.now(),
    });
  });
  await batch.commit();
};

export const archiveCard = async (cardId: string): Promise<void> => {
  await updateDoc(doc(db, "kanban_cards", cardId), {
    archived: true,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCard = async (cardId: string): Promise<void> => {
  await deleteDoc(doc(db, "kanban_cards", cardId));
};

// ─── ASSIGNEES ───────────────────────────────────────────────────────────────

/**
 * Assigne ou désassigne un membre à une carte.
 */
export const toggleCardAssignee = async (
  cardId: string,
  currentAssignees: string[],
  userId: string
): Promise<void> => {
  const updated = currentAssignees.includes(userId)
    ? currentAssignees.filter((uid) => uid !== userId)
    : [...currentAssignees, userId];
  await updateCard(cardId, { assignees: updated });
};

// ─── CHECKLIST ───────────────────────────────────────────────────────────────

export const addChecklistItem = async (
  cardId: string,
  currentChecklist: KanbanChecklist[],
  text: string
): Promise<void> => {
  const newItem: KanbanChecklist = {
    id: `chk_${Date.now()}`,
    text,
    done: false,
  };
  await updateCard(cardId, { checklist: [...currentChecklist, newItem] });
};

export const toggleChecklistItem = async (
  cardId: string,
  checklist: KanbanChecklist[],
  itemId: string
): Promise<void> => {
  const updated = checklist.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item
  );
  await updateCard(cardId, { checklist: updated });
};

export const deleteChecklistItem = async (
  cardId: string,
  checklist: KanbanChecklist[],
  itemId: string
): Promise<void> => {
  const updated = checklist.filter((item) => item.id !== itemId);
  await updateCard(cardId, { checklist: updated });
};

// ─── COMMENTS ────────────────────────────────────────────────────────────────

export const addComment = async (
  cardId: string,
  currentComments: KanbanComment[],
  comment: Omit<KanbanComment, "id" | "createdAt">
): Promise<void> => {
  const newComment: KanbanComment = {
    ...comment,
    id: `cmt_${Date.now()}`,
    createdAt: Timestamp.now(),
  };
  await updateCard(cardId, { comments: [...currentComments, newComment] });
};

export const deleteComment = async (
  cardId: string,
  comments: KanbanComment[],
  commentId: string
): Promise<void> => {
  const updated = comments.filter((c) => c.id !== commentId);
  await updateCard(cardId, { comments: updated });
};

// ─── REAL-TIME LISTENER ──────────────────────────────────────────────────────

/**
 * S'abonne en temps réel aux colonnes et cartes d'un tableau Kanban.
 *
 * Le paramètre optionnel `onError` intercepte les erreurs de snapshot
 * (notamment permission-denied) pour éviter que Firebase les logue
 * directement dans la console et pour permettre à l'UI de réagir proprement.
 */
export const subscribeToBoard = (
  boardId: string,
  onColumnsUpdate: (columns: KanbanColumn[]) => void,
  onCardsUpdate: (cards: KanbanCard[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colQ = query(
    collection(db, "kanban_columns"),
    where("boardId", "==", boardId),
    orderBy("position", "asc")
  );
  const cardQ = query(
    collection(db, "kanban_cards"),
    where("boardId", "==", boardId),
    where("archived", "==", false),
    orderBy("position", "asc")
  );

  const handleError = (error: Error) => {
    if (onError) {
      onError(error);
    }
    // Ne pas re-lancer l'erreur : on l'intercepte pour éviter le log Firebase
  };

  const unsubCols = onSnapshot(
    colQ,
    (snap) => {
      onColumnsUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanColumn)));
    },
    handleError
  );

  const unsubCards = onSnapshot(
    cardQ,
    (snap) => {
      onCardsUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanCard)));
    },
    handleError
  );

  return () => {
    unsubCols();
    unsubCards();
  };
};

// ─── SEED DEFAULTS ──────────────────────────────────────────────────────────

export const seedDefaultColumns = async (boardId: string): Promise<void> => {
  const defaults = [
    { title: "À faire", color: "#a3a3a3" },
    { title: "En cours", color: "#c7ff44" },
    { title: "En révision", color: "#f59e0b" },
    { title: "Blocage", color: "#ef4444" },
    { title: "Terminé", color: "#22c55e" },
  ];

  const batch = writeBatch(db);
  defaults.forEach(({ title, color }, i) => {
    const ref = doc(collection(db, "kanban_columns"));
    const columnData: Omit<KanbanColumn, 'id'> = {
      boardId,
      title,
      position: i,
      color,
      cardLimit: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    batch.set(ref, columnData);
  });
  await batch.commit();
};