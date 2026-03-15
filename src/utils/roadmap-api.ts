// roadmap-api.ts
// Gère les documents phases et canvas dans la sous-collection roadmap de chaque projet.
// Chemin : portfolio/projet-en-cours/projects/{slug}/roadmap/{phases|canvas}

import { getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { ROADMAP_PHASES_DOC, ROADMAP_CANVAS_DOC } from '@/utils/projet-api';
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
  arrows:    RoadmapArrow[];
  updatedAt: any;
}

export interface RoadmapPhasesDoc {
  phases:    RoadmapPhase[];
  updatedAt: any;
}

// ─────────────────────────────────────────────
// Sauvegarde des phases (données "pures")
// ─────────────────────────────────────────────

export const saveRoadmapPhases = async (
  projectId: string,
  phases: RoadmapPhase[]
): Promise<void> => {
  try {
    const phasesRef = ROADMAP_PHASES_DOC(projectId);
    await setDoc(phasesRef, {
      phases,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('saveRoadmapPhases:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Sauvegarde du canvas (positions + flèches)
// ─────────────────────────────────────────────

export const saveRoadmapCanvas = async (
  projectId: string,
  data: { phases: RichPhase[]; arrows: RoadmapArrow[] }
): Promise<void> => {
  try {
    const canvasRef = ROADMAP_CANVAS_DOC(projectId);

    const canvasPhases: CanvasPhaseData[] = data.phases.map(p => ({
      id:      p.id,
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
// Chargement des phases
// ─────────────────────────────────────────────

export const loadRoadmapPhases = async (
  projectId: string
): Promise<RoadmapPhase[] | null> => {
  try {
    const phasesRef = ROADMAP_PHASES_DOC(projectId);
    const snap = await getDoc(phasesRef);
    if (!snap.exists()) return null;
    return snap.data().phases || [];
  } catch (error) {
    console.error('loadRoadmapPhases:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// Chargement du canvas
// ─────────────────────────────────────────────

export const loadRoadmapCanvas = async (
  projectId: string
): Promise<RoadmapCanvasDoc | null> => {
  try {
    const canvasRef = ROADMAP_CANVAS_DOC(projectId);
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

export const mergeCanvasIntoPhases = (
  phases: RoadmapPhase[],
  canvas: RoadmapCanvasDoc | null
): RichPhase[] => {
  if (!canvas || !canvas.phases?.length) {
    return phases.map((p, idx) => ({
      ...p,
      canvasX: 60 + idx * 320,
      canvasY: 80,
      color:   PALETTE[idx % PALETTE.length],
    })) as RichPhase[];
  }

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

export const stripCanvasData = (phases: RichPhase[]): RoadmapPhase[] =>
  phases.map(({ canvasX: _x, canvasY: _y, nodeW: _w, nodeH: _h, color: _c, ...rest }) => rest);

// ─────────────────────────────────────────────
// Palette par défaut
// ─────────────────────────────────────────────

export const PALETTE = [
  '#7C3AED','#0EA5E9','#10B981','#F59E0B',
  '#EF4444','#EC4899','#6366F1','#14B8A6',
  '#F97316','#8B5CF6','#06B6D4','#84CC16',
];