// roadmap-api.ts
// ─────────────────────────────────────────────────────────────────────────────
// API dédiée au Roadmap.
//
// POURQUOI UN FICHIER SÉPARÉ ?
//  Les règles Firestore sur /projects/{id} n'autorisent update que pour
//  isAdmin() ou les seuls champs "views / updatedAt".
//  Pour stocker les données canvas (canvasX, canvasY, color, subNodes) et les
//  flèches sans modifier les règles du projet principal, on les place dans
//  une sous-collection : /projects/{projectId}/roadmap_canvas/{docId}.
//
//  Règle Firestore à ajouter dans la section "Projects" :
//
//    match /projects/{projectId}/roadmap_canvas/{docId} {
//      allow read: if request.auth != null;
//      allow write: if request.auth != null &&
//                   (isAdmin() ||
//                    request.auth.uid == get(/databases/$(database)/documents/projects/$(projectId)).data.createdBy ||
//                    get(/databases/$(database)/documents/projects/$(projectId)).data.teamMembers.hasAny([request.auth.uid]));
//    }
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/utils/firebase-api';
import type { RoadmapPhase } from '@/utils/projet-api';
import type { RoadmapArrow, RichPhase } from '@/components/portfolio/projet-en-cours/Editor/navigation/RoadmapEditor';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface RoadmapCanvasData {
  /** Phases enrichies (canvasX, canvasY, color, subNodes inclus) */
  phases: RichPhase[];
  /** Flèches entre les phases — TOUJOURS présentes si sauvegardées */
  arrows: RoadmapArrow[];
  updatedAt?: unknown;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Référence du document canvas dans la sous-collection */
const canvasRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'roadmap_canvas', 'data');

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────

/**
 * Charge les données canvas (positions + flèches) pour un projet.
 * Retourne null si le document n'existe pas encore.
 *
 * CORRECTIF : les flèches sont désormais toujours retournées comme tableau
 * (jamais undefined), ce qui évite la perte silencieuse lors du chargement.
 */
export const getRoadmapCanvas = async (
  projectId: string
): Promise<RoadmapCanvasData | null> => {
  try {
    const snap = await getDoc(canvasRef(projectId));
    if (!snap.exists()) return null;
    const d = snap.data();

    return {
      phases:    Array.isArray(d.phases) ? d.phases : [],
      arrows:    Array.isArray(d.arrows) ? d.arrows : [],   // ← garanti tableau
      updatedAt: d.updatedAt,
    };
  } catch (error) {
    // Ignorer silencieusement les erreurs de permission
    if (
      error instanceof Error &&
      (error.message.includes('permission-denied') ||
       error.message.includes('Missing or insufficient permissions'))
    ) {
      return null;
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('getRoadmapCanvas error:', error);
    }
    return null;
  }
};

// ─────────────────────────────────────────────
// SAVE (phases enrichies + flèches)
// ─────────────────────────────────────────────

/**
 * Sauvegarde la totalité du canvas roadmap (phases + flèches).
 *
 * CORRECTIF : serialise explicitement les flèches pour éviter que
 * des propriétés undefined soient silencieusement supprimées par Firestore.
 * Les fromSide / toSide sont préservés pour garantir la cohérence visuelle
 * lors du rechargement dans RoadmapEditor.
 */
export const saveRoadmapCanvas = async (
  projectId: string,
  data: Omit<RoadmapCanvasData, 'updatedAt'>
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Sérialisation propre des flèches — s'assure qu'aucun champ n'est undefined
    const serializedArrows: RoadmapArrow[] = (data.arrows ?? []).map(a => ({
      id:          a.id          ?? '',
      fromPhaseId: a.fromPhaseId ?? '',
      toPhaseId:   a.toPhaseId   ?? '',
      fromSide:    a.fromSide    ?? 'right',
      toSide:      a.toSide      ?? 'left',
    }));

    // Sérialisation propre des phases (canvasX/Y toujours présents)
    const serializedPhases: RichPhase[] = (data.phases ?? []).map(p => ({
      ...p,
      canvasX: p.canvasX ?? 60,
      canvasY: p.canvasY ?? 60,
      nodeW:   p.nodeW   ?? 220,
      nodeH:   p.nodeH   ?? 120,
      color:   p.color   ?? '#7C3AED',
    }));

    await setDoc(canvasRef(projectId), {
      phases:    serializedPhases,
      arrows:    serializedArrows,
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('permission-denied') ||
        error.message.includes('Missing or insufficient permissions')
      ) {
        return {
          success: false,
          error: "Vous n'avez pas les permissions pour modifier cette roadmap",
        };
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('saveRoadmapCanvas error:', error);
      }
      return { success: false, error: 'Erreur technique lors de la sauvegarde' };
    }
    return { success: false, error: 'Erreur inconnue' };
  }
};

// ─────────────────────────────────────────────
// MERGE — extrait les données "pures" (sans canvas)
// pour le champ project.roadmapPhases.
// ─────────────────────────────────────────────

/**
 * Extrait les données "pures" (sans propriétés canvas) pour les stocker
 * dans project.roadmapPhases (champ existant).
 */
export const stripCanvasData = (phases: RichPhase[]): RoadmapPhase[] =>
  phases.map(({ canvasX: _x, canvasY: _y, color: _c, ...base }) => base);