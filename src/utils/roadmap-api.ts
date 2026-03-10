// roadmap-api.ts
// Gère la sous-collection roadmap_canvas de chaque projet.
// Les données "canvas" (positions X/Y, taille, couleur, flèches) sont
// stockées séparément du document projet principal pour ne pas dépasser
// les limites de taille Firestore et respecter les règles de sécurité.

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/utils/firebase-api';
import type { RoadmapArrow, RichPhase } from '@/components/portfolio/projet-en-cours/Editor/navigation/RoadmapEditor';
import type { RoadmapPhase } from '@/utils/projet-api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CanvasPhaseData {
  id: string;
  canvasX: number;
  canvasY: number;
  nodeW?: number;
  nodeH?: number;
  color?: string;
}

export interface RoadmapCanvasDoc {
  phases:    CanvasPhaseData[];
  arrows:    RoadmapArrow[];   // contient désormais fromT / toT
  updatedAt: any;
}

// ─────────────────────────────────────────────
// Sauvegarde canvas
// ─────────────────────────────────────────────

/**
 * Sauvegarde les données canvas dans la sous-collection
 * projects/{projectId}/roadmap_canvas/main
 */
export const saveRoadmapCanvas = async (
  projectId: string,
  data: { phases: RichPhase[]; arrows: RoadmapArrow[] }
): Promise<void> => {
  try {
    const canvasRef = doc(db, 'projects', projectId, 'roadmap_canvas', 'main');

    // Extraire seulement les données canvas (pas les données métier)
    const canvasPhases: CanvasPhaseData[] = data.phases.map(p => ({
      id: p.id,
      canvasX: p.canvasX ?? 0,
      canvasY: p.canvasY ?? 0,
      nodeW:   p.nodeW,
      nodeH:   p.nodeH,
      color:   p.color,
    }));

    await setDoc(canvasRef, {
      phases:    canvasPhases,
      arrows:    data.arrows,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('saveRoadmapCanvas:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Chargement canvas
// ─────────────────────────────────────────────

/**
 * Charge les données canvas depuis la sous-collection.
 * Retourne null si aucune donnée n'existe encore.
 */
export const loadRoadmapCanvas = async (
  projectId: string
): Promise<RoadmapCanvasDoc | null> => {
  try {
    const canvasRef = doc(db, 'projects', projectId, 'roadmap_canvas', 'main');
    const snap = await getDoc(canvasRef);
    if (!snap.exists()) return null;
    return snap.data() as RoadmapCanvasDoc;
  } catch (error) {
    console.error('loadRoadmapCanvas:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// Fusion canvas + phases
// ─────────────────────────────────────────────

/**
 * Fusionne les données canvas (positions, couleurs) avec les phases métier.
 * Les phases sans position canvas reçoivent une position auto calculée.
 */
export const mergeCanvasIntoPhases = (
  phases: RoadmapPhase[],
  canvas: RoadmapCanvasDoc | null
): RichPhase[] => {
  if (!canvas || !canvas.phases?.length) {
    // Aucune donnée canvas → init positions en ligne
    return phases.map((p, idx) => ({
      ...p,
      canvasX: 60 + idx * 320,
      canvasY: 80,
      color:   PALETTE[idx % PALETTE.length],
    })) as RichPhase[];
  }

  // Map canvas par id pour lookup rapide
  const canvasMap = Object.fromEntries(canvas.phases.map(c => [c.id, c]));

  return phases.map((p, idx) => {
    const c = canvasMap[p.id];
    if (c) {
      return {
        ...p,
        canvasX: c.canvasX,
        canvasY: c.canvasY,
        nodeW:   c.nodeW,
        nodeH:   c.nodeH,
        color:   c.color,
      } as RichPhase;
    }
    // Phase sans données canvas → position auto à droite des autres
    return {
      ...p,
      canvasX: 60 + idx * 320,
      canvasY: 80,
      color:   PALETTE[idx % PALETTE.length],
    } as RichPhase;
  });
};

// ─────────────────────────────────────────────
// stripCanvasData
// ─────────────────────────────────────────────

/**
 * Retire les champs canvas des phases avant sauvegarde
 * dans le document projet principal (Firestore a une limite de 1 Mo).
 * Seules les données métier (titre, statut, dates, tâches, ordre) sont conservées.
 */
export const stripCanvasData = (phases: RichPhase[]): RoadmapPhase[] =>
  phases.map(({ canvasX: _x, canvasY: _y, nodeW: _w, nodeH: _h, color: _c, ...rest }) => rest);

// ─────────────────────────────────────────────
// Palette par défaut (cohérence Editor ↔ Viewer)
// ─────────────────────────────────────────────
export const PALETTE = [
  '#7C3AED','#0EA5E9','#10B981','#F59E0B',
  '#EF4444','#EC4899','#6366F1','#14B8A6',
  '#F97316','#8B5CF6','#06B6D4','#84CC16',
];