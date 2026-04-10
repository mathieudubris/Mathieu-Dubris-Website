// hooks/useProjectProgress.ts
// Calcule la progression réelle d'un projet depuis ses tableaux Kanban.
// Règle : seules les cartes dont columnId correspond à une colonne
//         dont le titre est exactement "Terminé" comptent comme "done".
// Retourne { total, done, percent } en temps réel via onSnapshot.

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/utils/firebase-api";

export interface ProjectProgress {
  total:   number;
  done:    number;
  percent: number;   // 0-100, arrondi à l'entier
}

// ─── chemins Firestore (miroir de kanban-projet-api) ─────────────────────────

const progressionCol = (projectId: string) =>
  collection(db, "portfolio", "projet-en-cours", "projects", projectId, "progression");

const columnsCol = (projectId: string, boardId: string) =>
  collection(db, "portfolio", "projet-en-cours", "projects", projectId, "progression", boardId, "kanban_columns");

const cardsCol = (projectId: string, boardId: string) =>
  collection(db, "portfolio", "projet-en-cours", "projects", projectId, "progression", boardId, "kanban_cards");

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useProjectProgress(projectId: string): ProjectProgress {
  const [progress, setProgress] = useState<ProjectProgress>({ total: 0, done: 0, percent: 0 });

  useEffect(() => {
    if (!projectId) return;

    // boardId → Set<columnId> des colonnes "Terminé"
    const doneColumnsByBoard = new Map<string, Set<string>>();
    // boardId → Map<cardId, columnId>
    const cardsByBoard       = new Map<string, Map<string, string>>();

    const unsubs: Unsubscribe[] = [];

    const recalculate = () => {
      let total = 0;
      let done  = 0;

      for (const [boardId, cardMap] of cardsByBoard.entries()) {
        const doneColIds = doneColumnsByBoard.get(boardId) ?? new Set();
        for (const colId of cardMap.values()) {
          total++;
          if (doneColIds.has(colId)) done++;
        }
      }

      const percent = total === 0 ? 0 : Math.round((done / total) * 100);
      setProgress({ total, done, percent });
    };

    // 1. S'abonner à la liste des boards du projet
    const boardsQ = query(progressionCol(projectId), orderBy("createdAt", "asc"));

    const unsubBoards = onSnapshot(boardsQ, async (boardsSnap) => {
      const currentBoardIds = new Set(boardsSnap.docs.map(d => d.id));

      // Nettoyer les boards supprimés
      for (const bid of [...doneColumnsByBoard.keys()]) {
        if (!currentBoardIds.has(bid)) {
          doneColumnsByBoard.delete(bid);
          cardsByBoard.delete(bid);
        }
      }

      for (const boardDoc of boardsSnap.docs) {
        const boardId = boardDoc.id;

        // Éviter de re-s'abonner si le board est déjà suivi
        if (doneColumnsByBoard.has(boardId)) continue;

        doneColumnsByBoard.set(boardId, new Set());
        cardsByBoard.set(boardId, new Map());

        // 2. S'abonner aux colonnes pour trouver les IDs "Terminé"
        const colQ = query(columnsCol(projectId, boardId), orderBy("position", "asc"));
        const unsubCols = onSnapshot(colQ, colsSnap => {
          const doneIds = new Set<string>();
          for (const colDoc of colsSnap.docs) {
            const title: string = colDoc.data().title ?? "";
            if (title.trim().toLowerCase() === "terminé") {
              doneIds.add(colDoc.id);
            }
          }
          doneColumnsByBoard.set(boardId, doneIds);
          recalculate();
        });
        unsubs.push(unsubCols);

        // 3. S'abonner aux cartes non archivées
        const cardQ = query(cardsCol(projectId, boardId));
        const unsubCards = onSnapshot(cardQ, cardsSnap => {
          const cardMap = new Map<string, string>();
          for (const cardDoc of cardsSnap.docs) {
            const data = cardDoc.data();
            if (!data.archived) {
              cardMap.set(cardDoc.id, data.columnId as string);
            }
          }
          cardsByBoard.set(boardId, cardMap);
          recalculate();
        });
        unsubs.push(unsubCards);
      }

      recalculate();
    });

    unsubs.push(unsubBoards);

    return () => unsubs.forEach(u => u());
  }, [projectId]);

  return progress;
}