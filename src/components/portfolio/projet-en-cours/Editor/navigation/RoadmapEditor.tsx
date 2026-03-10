"use client";

/**
 * RoadmapEditor v7
 *
 * NOUVEAUTÉS :
 * - Bordure hover visible (anneau coloré) + curseur crosshair/+ au survol
 * - Ancres LIBRES : le point de connexion est exactement là où la souris
 *   touche le périmètre du node (pas seulement les 4 centres fixes)
 * - Recalcul automatique des ancres quand un node est déplacé
 * - Vraie tête de flèche SVG (marker orient="auto") pointant dans la
 *   bonne direction à l'arrivée
 * - Boucle infinie corrigée (onPhasesChangeRef stable)
 * - Boutons Edit/Delete extérieurs au node (taille identique vue publique)
 */

import React, {
  useState, useRef, useCallback, useEffect, useLayoutEffect,
} from 'react';
import {
  Plus, X, Edit2, Check, ZoomIn, ZoomOut, Maximize2,
  Circle, Clock, CheckCircle2, Palette, Trash2,
} from 'lucide-react';
import type { RoadmapPhase } from '@/utils/projet-api';
import styles from './RoadmapEditor.module.css';

/* ─────────────────────────────────────────────
   Types exportés
───────────────────────────────────────────── */
export type ArrowSide = 'top' | 'right' | 'bottom' | 'left';

export interface RoadmapArrow {
  id: string;
  fromPhaseId: string;
  toPhaseId:   string;
  // Coordonnées normalisées [0-1] sur le périmètre du node
  // fromT / toT = position exacte sur le bord (0 = début du bord, 1 = fin)
  fromSide: ArrowSide;
  fromT:    number;   // position sur le bord (0..1)
  toSide:   ArrowSide;
  toT:      number;
}

export interface RichPhase extends RoadmapPhase {
  canvasX?: number;
  canvasY?: number;
  nodeW?:   number;
  nodeH?:   number;
  color?:   string;
}

/* ─────────────────────────────────────────────
   Constantes
───────────────────────────────────────────── */
const NODE_W        = 220;
const HOVER_GAP     = 10;   // px entre le node et l'anneau hover
const HIT_RING      = 18;   // épaisseur de la zone de clic pour démarrer une flèche
const DEFAULT_COLOR = '#7C3AED';

const PALETTE = [
  '#7C3AED','#0EA5E9','#10B981','#F59E0B',
  '#EF4444','#EC4899','#6366F1','#14B8A6',
  '#F97316','#8B5CF6','#06B6D4','#84CC16',
];
const STATUS_LIST = [
  { value: 'planned'     as const, label: 'À venir',  Icon: Circle,       col: '#6B7280' },
  { value: 'in-progress' as const, label: 'En cours', Icon: Clock,        col: '#0EA5E9' },
  { value: 'completed'   as const, label: 'Terminé',  Icon: CheckCircle2, col: '#10B981' },
];

const uid = () => `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/* ─────────────────────────────────────────────
   Helpers géométrie — ancres libres
───────────────────────────────────────────── */

/**
 * Projette le point (mx, my) sur le périmètre du rectangle du node.
 * Retourne { side, t, x, y } où :
 *   side = côté le plus proche
 *   t    = position normalisée [0..1] sur ce côté (0=début, 1=fin)
 *   x, y = coordonnées absolues sur le bord
 */
function projectOnBorder(
  mx: number, my: number,
  nx: number, ny: number,
  nw: number, nh: number
): { side: ArrowSide; t: number; x: number; y: number } {
  // Clamp le point dans le rectangle étendu puis projeter sur le bord le plus proche
  const cx = Math.max(nx, Math.min(nx + nw, mx));
  const cy = Math.max(ny, Math.min(ny + nh, my));

  const dTop    = Math.abs(cy - ny);
  const dBottom = Math.abs(cy - (ny + nh));
  const dLeft   = Math.abs(cx - nx);
  const dRight  = Math.abs(cx - (nx + nw));
  const minD    = Math.min(dTop, dBottom, dLeft, dRight);

  if (minD === dTop)    return { side: 'top',    t: (cx - nx) / nw, x: cx,      y: ny };
  if (minD === dBottom) return { side: 'bottom', t: (cx - nx) / nw, x: cx,      y: ny + nh };
  if (minD === dLeft)   return { side: 'left',   t: (cy - ny) / nh, x: nx,      y: cy };
  /* right */           return { side: 'right',  t: (cy - ny) / nh, x: nx + nw, y: cy };
}

/**
 * Calcule les coordonnées absolues d'un point d'ancrage à partir de
 * { side, t } stockés dans la flèche + les dimensions actuelles du node.
 * Utilisé pour recalculer les ancres après déplacement d'un node.
 */
function anchorFromSideT(
  phase: RichPhase,
  side: ArrowSide,
  t: number
): { x: number; y: number } {
  const x  = phase.canvasX ?? 0;
  const y  = phase.canvasY ?? 0;
  const w  = phase.nodeW   ?? NODE_W;
  const h  = phase.nodeH   ?? 120;
  const tc = Math.max(0, Math.min(1, t));
  switch (side) {
    case 'top':    return { x: x + tc * w,      y };
    case 'bottom': return { x: x + tc * w,      y: y + h };
    case 'left':   return { x,                  y: y + tc * h };
    case 'right':  return { x: x + w,           y: y + tc * h };
  }
}

/**
 * Vérifie si la souris est dans la zone de connexion (anneau autour du node).
 * Retourne les coordonnées projetées si oui, null sinon.
 */
function hitConnectionRing(
  mx: number, my: number,
  nx: number, ny: number,
  nw: number, nh: number
): ReturnType<typeof projectOnBorder> | null {
  // Zone externe : dans les HIT_RING px autour du rectangle
  const inOuter = mx >= nx - HIT_RING && mx <= nx + nw + HIT_RING &&
                  my >= ny - HIT_RING && my <= ny + nh + HIT_RING;
  if (!inOuter) return null;

  // Zone interne : si la souris est à l'intérieur du node on n'est PAS sur la bordure
  const inInner = mx > nx + 4 && mx < nx + nw - 4 &&
                  my > ny + 4 && my < ny + nh - 4;
  // Distance minimum au bord
  const dTop    = Math.abs(my - ny);
  const dBottom = Math.abs(my - (ny + nh));
  const dLeft   = Math.abs(mx - nx);
  const dRight  = Math.abs(mx - (nx + nw));
  const minD    = Math.min(dTop, dBottom, dLeft, dRight);

  if (inInner && minD > HIT_RING) return null;

  return projectOnBorder(mx, my, nx, ny, nw, nh);
}

/**
 * Construit un chemin de Bézier cubique entre deux points avec tangeantes
 * basées sur les côtés de départ/arrivée.
 */
function buildPath(
  x1: number, y1: number, x2: number, y2: number,
  fromSide: ArrowSide, toSide: ArrowSide
): string {
  const d = Math.max(60, Math.abs(x2 - x1) * 0.5, Math.abs(y2 - y1) * 0.5);
  const tangent = (side: ArrowSide): [number, number] => {
    switch (side) {
      case 'right':  return [+d, 0];
      case 'left':   return [-d, 0];
      case 'bottom': return [0, +d];
      case 'top':    return [0, -d];
    }
  };
  const [dx1, dy1] = tangent(fromSide);
  const [dx2, dy2] = tangent(toSide);
  // Le ctrl-point d'arrivée est inversé (on arrive depuis l'extérieur)
  return `M ${x1} ${y1} C ${x1+dx1} ${y1+dy1}, ${x2-dx2} ${y2-dy2}, ${x2} ${y2}`;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
interface RoadmapEditorProps {
  phases:          RoadmapPhase[];
  onPhasesChange:  (phases: RoadmapPhase[]) => void;
  arrows?:         RoadmapArrow[];
  onArrowsChange?: (arrows: RoadmapArrow[]) => void;
}

const RoadmapEditor: React.FC<RoadmapEditorProps> = ({
  phases, onPhasesChange,
  arrows: externalArrows = [],
  onArrowsChange,
}) => {
  const rich   = phases as RichPhase[];
  const sorted = [...rich].sort((a, b) => a.order - b.order);

  /* ── Pan / zoom ── */
  const canvasRef  = useRef<HTMLDivElement>(null);
  const [pan,  setPan]  = useState({ x: 60, y: 40 });
  const [zoom, setZoom] = useState(1);
  const isPanning  = useRef(false);
  const panStart   = useRef({ x: 0, y: 0 });

  /* ── Node drag ── */
  const draggingNode = useRef<string | null>(null);
  const dragOffset   = useRef({ x: 0, y: 0 });

  /* ── Hover connexion ── */
  // null = pas de hover ; sinon l'id du node survolé + coords projetées
  const [connHover, setConnHover] = useState<{
    phaseId: string;
    proj: ReturnType<typeof projectOnBorder>;
  } | null>(null);

  /* ── Arrow drawing ── */
  const [drawingArrow, setDrawingArrow] = useState<{
    fromId:   string;
    fromSide: ArrowSide;
    fromT:    number;
    fromX:    number;   // ancre départ en coordonnées canvas
    fromY:    number;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  /* ── Arrows state ── */
  const [arrows, setArrows] = useState<RoadmapArrow[]>(() => externalArrows);
  const prevExtRef = useRef('');
  useEffect(() => {
    const s = JSON.stringify(externalArrows);
    if (s !== prevExtRef.current) { prevExtRef.current = s; setArrows(externalArrows); }
  }, [externalArrows]);

  const emitArrows = useCallback((next: RoadmapArrow[]) => {
    setArrows(next);
    onArrowsChange?.(next);
  }, [onArrowsChange]);

  /* ── Editing ── */
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState<Partial<RichPhase>>({});
  const [showPalette, setShowPalette] = useState(false);

  /* ── Node refs + mesure ── */
  const nodeRefs          = useRef<Record<string, HTMLDivElement | null>>({});
  const measuredRef       = useRef<Record<string, { w: number; h: number }>>({});
  const onPhasesChangeRef = useRef(onPhasesChange);
  useEffect(() => { onPhasesChangeRef.current = onPhasesChange; });

  /* Init positions canvas */
  useEffect(() => {
    const needsInit = rich.some(p => p.canvasX === undefined);
    if (!needsInit) return;
    onPhasesChangeRef.current(
      rich.map((p, idx) => ({
        ...p,
        canvasX: p.canvasX ?? 60 + idx * (NODE_W + 100),
        canvasY: p.canvasY ?? 80,
        color:   p.color   ?? PALETTE[idx % PALETTE.length],
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Mesure hauteur DOM — anti boucle infinie */
  useLayoutEffect(() => {
    let changed = false;
    const updated = (phases as RichPhase[]).map(p => {
      const el = nodeRefs.current[p.id];
      if (!el) return p;
      const h = el.offsetHeight;
      const w = el.offsetWidth;
      if (!h || !w) return p;
      const prev = measuredRef.current[p.id];
      if (prev?.h === h && prev?.w === w) return p;
      measuredRef.current[p.id] = { h, w };
      changed = true;
      return { ...p, nodeH: h, nodeW: w };
    });
    if (changed) onPhasesChangeRef.current(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  /* ─── toCanvas helper ─── */
  const toCanvas = useCallback((cx: number, cy: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (cx - rect.left - pan.x) / zoom, y: (cy - rect.top - pan.y) / zoom };
  }, [pan, zoom]);

  /* ─── Window listeners ─── */
  const onWinMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    if (draggingNode.current) {
      const c = toCanvas(e.clientX, e.clientY);
      onPhasesChange(
        (phases as RichPhase[]).map(p =>
          p.id === draggingNode.current
            ? { ...p, canvasX: c.x - dragOffset.current.x, canvasY: c.y - dragOffset.current.y }
            : p
        )
      );
      return;
    }
    if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      return;
    }

    // Hover connexion : chercher si la souris est sur l'anneau d'un node
    const c = toCanvas(e.clientX, e.clientY);
    let found: typeof connHover = null;
    for (const p of sorted) {
      if (p.id === editingId) continue;
      if (drawingArrow && p.id === drawingArrow.fromId) continue;
      const proj = hitConnectionRing(
        c.x, c.y,
        p.canvasX ?? 0, p.canvasY ?? 0,
        p.nodeW ?? NODE_W, p.nodeH ?? 120
      );
      if (proj) { found = { phaseId: p.id, proj }; break; }
    }
    setConnHover(prev => {
      if (!prev && !found) return prev;
      if (prev?.phaseId === found?.phaseId &&
          prev?.proj.side === found?.proj.side &&
          Math.abs((prev?.proj.t ?? 0) - (found?.proj.t ?? 0)) < 0.01) return prev;
      return found;
    });
  }, [toCanvas, phases, sorted, onPhasesChange, editingId, drawingArrow, connHover]);

  const onWinUp = useCallback((e: MouseEvent) => {
    if (drawingArrow) {
      const c = toCanvas(e.clientX, e.clientY);
      let target: { phaseId: string; proj: ReturnType<typeof projectOnBorder> } | null = null;
      for (const p of sorted) {
        if (p.id === drawingArrow.fromId) continue;
        const proj = hitConnectionRing(
          c.x, c.y,
          p.canvasX ?? 0, p.canvasY ?? 0,
          p.nodeW ?? NODE_W, p.nodeH ?? 120
        );
        if (proj) { target = { phaseId: p.id, proj }; break; }
      }
      if (target) {
        const already = arrows.some(a =>
          (a.fromPhaseId === drawingArrow.fromId && a.toPhaseId === target!.phaseId) ||
          (a.fromPhaseId === target!.phaseId     && a.toPhaseId === drawingArrow.fromId)
        );
        if (!already) {
          emitArrows([...arrows, {
            id:          uid(),
            fromPhaseId: drawingArrow.fromId,
            toPhaseId:   target.phaseId,
            fromSide:    drawingArrow.fromSide,
            fromT:       drawingArrow.fromT,
            toSide:      target.proj.side,
            toT:         target.proj.t,
          }]);
        }
      }
      setDrawingArrow(null);
    }
    draggingNode.current = null;
    isPanning.current    = false;
    window.removeEventListener('mousemove', onWinMove);
    window.removeEventListener('mouseup',   onWinUp);
  }, [drawingArrow, arrows, sorted, toCanvas, onWinMove, emitArrows]);

  const attachWin = useCallback(() => {
    window.addEventListener('mousemove', onWinMove);
    window.addEventListener('mouseup',   onWinUp);
  }, [onWinMove, onWinUp]);

  /* ─── Node mousedown ─── */
  const onNodeMouseDown = (e: React.MouseEvent, phase: RichPhase) => {
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return;
    const c = toCanvas(e.clientX, e.clientY);

    // Clic sur l'anneau de connexion ?
    const proj = hitConnectionRing(
      c.x, c.y,
      phase.canvasX ?? 0, phase.canvasY ?? 0,
      phase.nodeW ?? NODE_W, phase.nodeH ?? 120
    );
    // On démarre une flèche si on est sur la bordure (pas au centre du node)
    const inCenter = c.x > (phase.canvasX ?? 0) + 10 &&
                     c.x < (phase.canvasX ?? 0) + (phase.nodeW ?? NODE_W) - 10 &&
                     c.y > (phase.canvasY ?? 0) + 10 &&
                     c.y < (phase.canvasY ?? 0) + (phase.nodeH ?? 120) - 10;

    if (proj && !inCenter) {
      e.stopPropagation();
      setDrawingArrow({
        fromId:   phase.id,
        fromSide: proj.side,
        fromT:    proj.t,
        fromX:    proj.x,
        fromY:    proj.y,
      });
      setMousePos({ x: e.clientX, y: e.clientY });
      attachWin();
      return;
    }

    // Drag du node
    e.stopPropagation();
    draggingNode.current = phase.id;
    dragOffset.current   = { x: c.x - (phase.canvasX ?? 0), y: c.y - (phase.canvasY ?? 0) };
    attachWin();
  };

  /* ─── Canvas pan ─── */
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (
      !el.classList.contains(styles.world) &&
      !el.classList.contains(styles.dotGrid) &&
      el !== canvasRef.current
    ) return;
    isPanning.current = true;
    panStart.current  = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    attachWin();
  };

  const onCanvasMouseLeave = () => { setConnHover(null); };

  /* ─── Touch ─── */
  const touchPanRef  = useRef<{ x: number; y: number } | null>(null);
  const touchNodeRef = useRef<string | null>(null);
  const touchOffRef  = useRef({ x: 0, y: 0 });

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t  = e.touches[0];
    const el = e.target as HTMLElement;
    const nodeEl = el.closest('[data-phaseid]') as HTMLElement | null;
    if (nodeEl && !el.closest('[data-nodrag]')) {
      const phaseId = nodeEl.dataset.phaseid!;
      const phase   = sorted.find(p => p.id === phaseId);
      if (!phase) return;
      const c = toCanvas(t.clientX, t.clientY);
      touchNodeRef.current = phaseId;
      touchOffRef.current  = { x: c.x - (phase.canvasX ?? 0), y: c.y - (phase.canvasY ?? 0) };
    } else {
      touchPanRef.current = { x: t.clientX - pan.x, y: t.clientY - pan.y };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    if (touchNodeRef.current) {
      const c = toCanvas(t.clientX, t.clientY);
      onPhasesChange(
        (phases as RichPhase[]).map(p =>
          p.id === touchNodeRef.current
            ? { ...p, canvasX: c.x - touchOffRef.current.x, canvasY: c.y - touchOffRef.current.y }
            : p
        )
      );
    } else if (touchPanRef.current) {
      setPan({ x: t.clientX - touchPanRef.current.x, y: t.clientY - touchPanRef.current.y });
    }
  };
  const onTouchEnd = () => { touchNodeRef.current = null; touchPanRef.current = null; };

  /* ─── Zoom ─── */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(2.5, Math.max(0.15, z - e.deltaY * 0.001)));
  };

  /* ─── CRUD phases ─── */
  const addPhase = () => {
    const maxX = sorted.length > 0
      ? Math.max(...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W) + 80))
      : 60;
    const id = uid();
    const phase: RichPhase = {
      id, order: phases.length,
      title: `Phase ${phases.length + 1}`,
      description: '', status: 'planned',
      startDate: '', endDate: '', tasks: [],
      canvasX: maxX, canvasY: 80,
      color: PALETTE[phases.length % PALETTE.length],
    };
    onPhasesChange([...phases, phase]);
    setEditingId(id);
    setEditForm(phase);
  };

  const startEdit = (phase: RichPhase) => {
    setEditingId(phase.id);
    setEditForm({ ...phase });
    setShowPalette(false);
  };

  const saveEdit = () => {
    if (!editingId || !editForm.title?.trim()) return;
    onPhasesChange(phases.map(p =>
      p.id === editingId ? { ...p, ...editForm } as RichPhase : p
    ));
    setEditingId(null); setEditForm({}); setShowPalette(false);
  };

  const cancelEdit = () => {
    const p = phases.find(p => p.id === editingId) as RichPhase | undefined;
    if (p && !p.title?.trim()) onPhasesChange(phases.filter(q => q.id !== editingId));
    setEditingId(null); setEditForm({}); setShowPalette(false);
  };

  const deletePhase = (id: string) => {
    onPhasesChange(phases.filter(p => p.id !== id).map((p, i) => ({ ...p, order: i })));
    emitArrows(arrows.filter(a => a.fromPhaseId !== id && a.toPhaseId !== id));
    if (editingId === id) { setEditingId(null); setEditForm({}); }
  };

  /* ─── SVG helpers ─── */
  const phaseMap = Object.fromEntries(sorted.map(p => [p.id, p]));
  const canvasW  = Math.max(1600, ...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W) + 200));
  const canvasH  = Math.max(700,  ...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120) + 200));

  /* ─── Render arrows SVG ─── */
  const renderArrows = () => {
    const els: React.ReactNode[] = [];

    arrows.forEach(arrow => {
      const from = phaseMap[arrow.fromPhaseId] as RichPhase | undefined;
      const to   = phaseMap[arrow.toPhaseId]   as RichPhase | undefined;
      if (!from || !to) return;

      // Recalculer les ancres à partir des t stockés + positions actuelles
      const { x: x1, y: y1 } = anchorFromSideT(from, arrow.fromSide, arrow.fromT ?? 0.5);
      const { x: x2, y: y2 } = anchorFromSideT(to,   arrow.toSide,   arrow.toT   ?? 0.5);
      const col  = from.color ?? DEFAULT_COLOR;
      const path = buildPath(x1, y1, x2, y2, arrow.fromSide, arrow.toSide);
      const mx   = (x1 + x2) / 2;
      const my   = (y1 + y2) / 2 - 12;
      const mid  = `marker_${arrow.id}`;

      els.push(
        <g key={arrow.id}>
          <defs>
            {/* Marqueur tête de flèche propre orienté automatiquement */}
            <marker
              id={mid}
              markerWidth="10" markerHeight="7"
              refX="9" refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={col}
                fillOpacity="0.9"
              />
            </marker>
          </defs>

          {/* Ligne pointillée */}
          <path
            d={path}
            fill="none"
            stroke={col}
            strokeWidth="2"
            strokeOpacity="0.7"
            strokeDasharray="7 4"
            markerEnd={`url(#${mid})`}
          />

          {/* Point de départ (cercle plein) */}
          <circle cx={x1} cy={y1} r="5" fill={col} fillOpacity="0.9"/>

          {/* Bouton supprimer flèche (×) au milieu */}
          <circle
            cx={mx} cy={my} r="9"
            fill="#0D1020" stroke={col} strokeOpacity="0.4" strokeWidth="1"
            style={{ cursor: 'pointer', pointerEvents: 'all' }}
            onClick={() => emitArrows(arrows.filter(a => a.id !== arrow.id))}
          />
          <text
            x={mx} y={my + 4.5}
            textAnchor="middle"
            fontSize="13"
            fill={col}
            fillOpacity="0.8"
            style={{ cursor: 'pointer', userSelect: 'none', pointerEvents: 'all', fontWeight: 'bold' }}
            onClick={() => emitArrows(arrows.filter(a => a.id !== arrow.id))}
          >×</text>
        </g>
      );
    });

    /* Flèche live en cours de dessin */
    if (drawingArrow) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const x1   = drawingArrow.fromX;
      const y1   = drawingArrow.fromY;
      const x2   = rect ? (mousePos.x - rect.left - pan.x) / zoom : x1;
      const y2   = rect ? (mousePos.y - rect.top  - pan.y) / zoom : y1;
      const col  = (phaseMap[drawingArrow.fromId] as RichPhase | undefined)?.color ?? DEFAULT_COLOR;

      // Estimer le côté d'arrivée depuis la direction de la souris
      const dx = x2 - x1;
      const dy = y2 - y1;
      const toSide: ArrowSide = Math.abs(dx) >= Math.abs(dy)
        ? (dx >= 0 ? 'left' : 'right')
        : (dy >= 0 ? 'top'  : 'bottom');

      const path = buildPath(x1, y1, x2, y2, drawingArrow.fromSide, toSide);
      els.push(
        <g key="live">
          <defs>
            <marker id="live_head" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={col} fillOpacity="0.6"/>
            </marker>
          </defs>
          <path
            d={path}
            fill="none"
            stroke={col}
            strokeWidth="2"
            strokeOpacity="0.55"
            strokeDasharray="6 3"
            markerEnd="url(#live_head)"
          />
          <circle cx={x1} cy={y1} r="5" fill={col} fillOpacity="0.8"/>
          {/* Point d'arrivée animé */}
          <circle cx={x2} cy={y2} r="6" fill={col} fillOpacity="0.25"/>
          <circle cx={x2} cy={y2} r="3" fill={col} fillOpacity="0.5"/>
        </g>
      );
    }

    return els;
  };

  /* ─── Render anneau hover connexion ─── */
  const renderHoverRings = () => {
    if (!connHover && !drawingArrow) return null;

    return sorted.map(phase => {
      const rp       = phase as RichPhase;
      const isFrom   = drawingArrow?.fromId === phase.id;
      const isTarget = connHover?.phaseId === phase.id;

      if (!isFrom && !isTarget) return null;

      const col  = rp.color ?? DEFAULT_COLOR;
      const x    = rp.canvasX ?? 0;
      const y    = rp.canvasY ?? 0;
      const w    = rp.nodeW ?? NODE_W;
      const h    = rp.nodeH ?? 120;
      const gap  = HOVER_GAP;
      const r    = 10; // border-radius du ring

      // Rectangle arrondi autour du node
      const rx = x - gap;
      const ry = y - gap;
      const rw = w + gap * 2;
      const rh = h + gap * 2;

      return (
        <g key={`ring_${phase.id}`} style={{ pointerEvents: 'none' }}>
          <rect
            x={rx} y={ry} width={rw} height={rh}
            rx={r} ry={r}
            fill="none"
            stroke={col}
            strokeWidth="1.5"
            strokeOpacity={isFrom ? 0.5 : 0.8}
            strokeDasharray={isFrom ? '4 3' : 'none'}
          />
          {/* Point de connexion exact */}
          {isTarget && connHover && (
            <circle
              cx={connHover.proj.x}
              cy={connHover.proj.y}
              r="5"
              fill={col}
              fillOpacity="0.9"
            />
          )}
        </g>
      );
    });
  };

  /* Curseur global */
  const isOnRing = !!connHover;
  const globalCursor = drawingArrow ? 'crosshair' : isOnRing ? 'crosshair' : 'default';

  /* ─── Render ─── */
  return (
    <div className={styles.wrapper}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tbL}>
          <span className={styles.tbTitle}>Canvas Roadmap</span>
          <span className={styles.tbBadge}>{phases.length} phase{phases.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.tbR}>
          <button type="button" className={styles.tbBtn}
            onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(1)))}><ZoomIn size={13}/></button>
          <span className={styles.tbZoom}>{Math.round(zoom * 100)}%</span>
          <button type="button" className={styles.tbBtn}
            onClick={() => setZoom(z => Math.max(0.15, +(z - 0.1).toFixed(1)))}><ZoomOut size={13}/></button>
          <button type="button" className={styles.tbBtn} title="Reset vue"
            onClick={() => { setPan({ x: 60, y: 40 }); setZoom(1); }}>
            <Maximize2 size={13}/>
          </button>
          <div className={styles.tbSep}/>
          <button type="button" className={styles.addBtn} onClick={addPhase}>
            <Plus size={13}/>Ajouter une phase
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={styles.canvas}
        style={{ cursor: globalCursor }}
        onMouseDown={onCanvasMouseDown}
        onMouseLeave={onCanvasMouseLeave}
        onWheel={onWheel}
        onMouseMove={e => {
          if (drawingArrow) setMousePos({ x: e.clientX, y: e.clientY });
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.dotGrid}
          style={{ backgroundPosition: `${pan.x % 28}px ${pan.y % 28}px` }}/>

        <div
          className={styles.world}
          style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: canvasW,
            height: canvasH,
          }}
        >
          {/* SVG : flèches + anneaux hover */}
          <svg
            width={canvasW} height={canvasH}
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
            // Les pointerEvents sont gérés par nœud dans renderArrows
          >
            {/* Anneaux de connexion (derrière les nodes) */}
            {renderHoverRings()}
            {/* Flèches (devant les anneaux) */}
            {renderArrows()}
          </svg>

          {sorted.length === 0 && (
            <div className={styles.emptyHint}>
              <p>Commencez par ajouter une phase</p>
              <span>Glissez les cartes · Survolez le bord pour connecter</span>
            </div>
          )}

          {sorted.map(phase => {
            const rp     = phase as RichPhase;
            const col    = rp.color ?? DEFAULT_COLOR;
            const isEd   = editingId === phase.id;
            const st     = STATUS_LIST.find(s => s.value === phase.status) ?? STATUS_LIST[0];
            const StIcon = st.Icon;
            const done   = phase.tasks.filter(t => t.done).length;
            const total  = phase.tasks.length;
            const isHov  = connHover?.phaseId === phase.id;

            return (
              <div
                key={phase.id}
                style={{
                  position: 'absolute',
                  left: rp.canvasX ?? 0,
                  top:  rp.canvasY ?? 0,
                  // Quand on est sur l'anneau, curseur crosshair sur tout le wrapper
                  cursor: isHov && !isEd ? 'crosshair' : undefined,
                }}
              >
                {/* Boutons Edit/Delete flottants EXTÉRIEURS au node */}
                {!isEd && (
                  <div className={styles.nodeActionsFloat} data-nodrag="1">
                    <button type="button" className={styles.aBtn}
                      onClick={e => { e.stopPropagation(); startEdit(rp); }} title="Modifier">
                      <Edit2 size={11}/>
                    </button>
                    <button type="button" className={`${styles.aBtn} ${styles.aBtnDel}`}
                      onClick={e => { e.stopPropagation(); deletePhase(phase.id); }} title="Supprimer">
                      <X size={11}/>
                    </button>
                  </div>
                )}

                {/* Node */}
                <div
                  data-phaseid={phase.id}
                  ref={el => { nodeRefs.current[phase.id] = el; }}
                  className={`${styles.node} ${isEd ? styles.nodeOpen : ''}`}
                  style={{ width: NODE_W, '--nc': col } as React.CSSProperties}
                  onMouseDown={e => onNodeMouseDown(e, rp)}
                >
                  <div className={styles.nodeBar} style={{ background: col }}/>

                  {isEd ? (
                    /* Formulaire d'édition */
                    <div className={styles.editWrap} data-nodrag="1">
                      <input
                        autoFocus className={styles.eTitle}
                        style={{ '--ec': col } as React.CSSProperties}
                        value={editForm.title ?? ''} placeholder="Nom de la phase…"
                        onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}/>

                      <select className={styles.eSelect}
                        value={editForm.status ?? 'planned'}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value as RichPhase['status'] }))}>
                        {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>

                      <div className={styles.colorRow} data-nodrag="1">
                        <button type="button" className={styles.paletteToggle}
                          style={{ background: editForm.color ?? col }}
                          onClick={() => setShowPalette(v => !v)}>
                          <Palette size={11}/>
                        </button>
                        {showPalette && (
                          <div className={styles.paletteGrid}>
                            {PALETTE.map(c => (
                              <button key={c} type="button"
                                className={`${styles.palSwatch} ${(editForm.color ?? col) === c ? styles.palSwatchActive : ''}`}
                                style={{ background: c }}
                                onClick={() => { setEditForm(f => ({ ...f, color: c })); setShowPalette(false); }}/>
                            ))}
                          </div>
                        )}
                      </div>

                      <textarea className={styles.eDesc} rows={2}
                        value={editForm.description ?? ''} placeholder="Description…"
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}/>

                      <div className={styles.eDates}>
                        <label>Début
                          <input type="date" className={styles.eDateInput}
                            value={editForm.startDate ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}/>
                        </label>
                        <span>→</span>
                        <label>Fin
                          <input type="date" className={styles.eDateInput}
                            value={editForm.endDate ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}/>
                        </label>
                      </div>

                      <div className={styles.eActions}>
                        <button type="button" className={styles.eSave}
                          style={{ background: col }} onClick={saveEdit}>
                          <Check size={11}/>Enregistrer
                        </button>
                        <button type="button" className={styles.eCancel} onClick={cancelEdit}>Annuler</button>
                        <button type="button" className={styles.eDelete}
                          onClick={() => deletePhase(phase.id)}><Trash2 size={11}/></button>
                      </div>
                    </div>
                  ) : (
                    /* Affichage */
                    <div className={styles.nodeBody}>
                      <h4 className={styles.nodeTitle}>{phase.title}</h4>
                      <span className={styles.nodeBadge}
                        style={{ color: st.col, background: `${st.col}18`, border: `1px solid ${st.col}44` }}>
                        <StIcon size={9}/>{st.label}
                      </span>
                      {phase.description && <p className={styles.nodeDesc}>{phase.description}</p>}
                      {(phase.startDate || phase.endDate) && (
                        <div className={styles.nodeDates}>
                          {phase.startDate && (
                            <span>{new Date(phase.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                          )}
                          {phase.startDate && phase.endDate && <span>→</span>}
                          {phase.endDate && (
                            <span>{new Date(phase.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                          )}
                        </div>
                      )}
                      {total > 0 && (
                        <div className={styles.nodeProgress}>
                          <div className={styles.pBar}>
                            <div className={styles.pFill} style={{ width: `${(done / total) * 100}%`, background: col }}/>
                          </div>
                          <span style={{ color: col, fontSize: 10, fontWeight: 600 }}>{done}/{total}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>🖱 Glisser le fond pour naviguer</span><span>·</span>
        <span>⚲ Scroll pour zoomer</span><span>·</span>
        <span>Glisser une carte pour la déplacer</span><span>·</span>
        <span>Survoler le <strong style={{ color: '#7C3AED' }}>bord</strong> d&apos;une carte puis glisser pour connecter</span>
      </div>
    </div>
  );
};

export default RoadmapEditor;