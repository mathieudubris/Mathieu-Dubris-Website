"use client";

import React, {
  useState, useRef, useCallback, useEffect, useLayoutEffect,
} from 'react';
import {
  Plus, X, Edit2, Check, ZoomIn, ZoomOut, Target,
  Circle, Clock, CheckCircle2, Palette, Trash2,
} from 'lucide-react';
import type { RoadmapPhase } from '@/utils/projet-api';
import styles from './RoadmapEditor.module.css';

export type ArrowSide = 'top' | 'right' | 'bottom' | 'left';

export interface RoadmapArrow {
  id: string;
  fromPhaseId: string;
  toPhaseId:   string;
  fromSide: ArrowSide;
  fromT:    number;
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

const NODE_W        = 220;
const HOVER_GAP     = 10;
const HIT_RING      = 18;
const DEFAULT_COLOR = '#c7ff44';
// MARKER_LEN = longueur du triangle de la flèche (= refX du marker)
const MARKER_LEN    = 10;

const PALETTE = [
  '#d60aff',
  '#3b82f6',
  '#10ce55',
  '#f97316',
  '#d30000',
  '#fbff11',
  '#6b7280',
  '#ffffff',
];

const STATUS_LIST = [
  { value: 'planned'     as const, label: 'À venir',  Icon: Circle,       col: '#6b7280' },
  { value: 'in-progress' as const, label: 'En cours', Icon: Clock,        col: '#3b82f6' },
  { value: 'completed'   as const, label: 'Terminé',  Icon: CheckCircle2, col: '#10ce55' },
];

const uid = () => `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/* ── Géométrie ── */
function projectOnBorder(
  mx: number, my: number,
  nx: number, ny: number,
  nw: number, nh: number
): { side: ArrowSide; t: number; x: number; y: number } {
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
                        return { side: 'right',  t: (cy - ny) / nh, x: nx + nw, y: cy };
}

/**
 * Retourne le point sur la bordure exacte
 */
function anchorOnBorder(phase: RichPhase, side: ArrowSide, t: number): { x: number; y: number } {
  const x = phase.canvasX ?? 0;
  const y = phase.canvasY ?? 0;
  const w = phase.nodeW ?? NODE_W;
  const h = phase.nodeH ?? 120;
  const tc = Math.max(0, Math.min(1, t));
  
  switch (side) {
    case 'top':    return { x: x + tc * w, y: y };
    case 'bottom': return { x: x + tc * w, y: y + h };
    case 'left':   return { x: x,          y: y + tc * h };
    case 'right':  return { x: x + w,      y: y + tc * h };
  }
}

/**
 * Ancre décalée vers l'EXTÉRIEUR du node de MARKER_LEN pixels.
 */
function anchorOutside(phase: RichPhase, side: ArrowSide, t: number): { x: number; y: number } {
  const x  = phase.canvasX ?? 0;
  const y  = phase.canvasY ?? 0;
  const w  = phase.nodeW   ?? NODE_W;
  const h  = phase.nodeH   ?? 120;
  const tc = Math.max(0, Math.min(1, t));
  const o  = MARKER_LEN;
  
  switch (side) {
    case 'top':    return { x: x + tc * w,  y: y - o };
    case 'bottom': return { x: x + tc * w,  y: y + h + o };
    case 'left':   return { x: x - o,        y: y + tc * h };
    case 'right':  return { x: x + w + o,    y: y + tc * h };
  }
}

function hitConnectionRing(
  mx: number, my: number,
  nx: number, ny: number,
  nw: number, nh: number
): ReturnType<typeof projectOnBorder> | null {
  const inOuter = mx >= nx - HIT_RING && mx <= nx + nw + HIT_RING &&
                  my >= ny - HIT_RING && my <= ny + nh + HIT_RING;
  if (!inOuter) return null;
  
  const dTop = Math.abs(my - ny), dBottom = Math.abs(my - (ny + nh));
  const dLeft = Math.abs(mx - nx), dRight = Math.abs(mx - (nx + nw));
  const minD = Math.min(dTop, dBottom, dLeft, dRight);
  const inInner = mx > nx + 4 && mx < nx + nw - 4 && my > ny + 4 && my < ny + nh - 4;
  
  if (inInner && minD > HIT_RING) return null;
  return projectOnBorder(mx, my, nx, ny, nw, nh);
}

function buildPath(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

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

  const canvasRef  = useRef<HTMLDivElement>(null);
  const [pan,  setPan]  = useState({ x: 60, y: 40 });
  const [zoom, setZoom] = useState(1);
  const isPanning  = useRef(false);
  const [isPanningState, setIsPanningState] = useState(false);
  const panStart   = useRef({ x: 0, y: 0 });
  // Refs miroir pour accès sans stale closure dans les handlers touch natifs
  const zoomRef = useRef(1);
  const panRef  = useRef({ x: 60, y: 40 });
  zoomRef.current = zoom;
  panRef.current  = pan;

  const draggingNode = useRef<string | null>(null);
  const dragOffset   = useRef({ x: 0, y: 0 });

  const [connHover, setConnHover] = useState<{ phaseId: string; proj: ReturnType<typeof projectOnBorder> } | null>(null);
  const [drawingArrow, setDrawingArrow] = useState<{ fromId: string; fromSide: ArrowSide; fromT: number; fromX: number; fromY: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [arrows, setArrows] = useState<RoadmapArrow[]>(() => externalArrows);
  const prevExtRef = useRef('');
  
  // Référence pour tracker si le centrage automatique a déjà été fait
  const hasCenteredRef = useRef(false);
  
  useEffect(() => {
    const s = JSON.stringify(externalArrows);
    if (s !== prevExtRef.current) { 
      prevExtRef.current = s; 
      setArrows(externalArrows); 
    }
  }, [externalArrows]);

  const emitArrows = useCallback((next: RoadmapArrow[]) => {
    setArrows(next); 
    onArrowsChange?.(next);
  }, [onArrowsChange]);

  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState<Partial<RichPhase>>({});
  const [showPalette, setShowPalette] = useState(false);

  const nodeRefs          = useRef<Record<string, HTMLDivElement | null>>({});
  const measuredRef       = useRef<Record<string, { w: number; h: number }>>({});
  const onPhasesChangeRef = useRef(onPhasesChange);
  
  useEffect(() => { onPhasesChangeRef.current = onPhasesChange; });

  useEffect(() => {
    const needsInit = rich.some(p => p.canvasX === undefined);
    if (!needsInit) return;
    onPhasesChangeRef.current(rich.map((p, idx) => ({
      ...p,
      canvasX: p.canvasX ?? 60 + idx * (NODE_W + 100),
      canvasY: p.canvasY ?? 80,
      color:   p.color   ?? PALETTE[idx % PALETTE.length],
    })));
  }, []);

  useLayoutEffect(() => {
    let changed = false;
    const updated = (phases as RichPhase[]).map(p => {
      const el = nodeRefs.current[p.id];
      if (!el) return p;
      const h = el.offsetHeight, w = el.offsetWidth;
      if (!h || !w) return p;
      const prev = measuredRef.current[p.id];
      if (prev?.h === h && prev?.w === w) return p;
      measuredRef.current[p.id] = { h, w };
      changed = true;
      return { ...p, nodeH: h, nodeW: w };
    });
    if (changed) onPhasesChangeRef.current(updated);
  });

  const centerView = useCallback(() => {
    if (!canvasRef.current || sorted.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cw = rect.width || 800, ch = rect.height || 500;
    const minX = Math.min(...sorted.map(p => p.canvasX ?? 0));
    const minY = Math.min(...sorted.map(p => p.canvasY ?? 0));
    const maxX = Math.max(...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W)));
    const maxY = Math.max(...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120)));
    
    // Éviter la division par zéro
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    
    const newZoom = Math.min(1, (cw - 80) / contentW, (ch - 80) / contentH);
    setPan({ 
      x: (cw - contentW * newZoom) / 2 - minX * newZoom, 
      y: (ch - contentH * newZoom) / 2 - minY * newZoom 
    });
    setZoom(newZoom);
  }, [sorted]);

  // Centrage automatique au chargement initial et quand les phases changent
  useEffect(() => {
    // Réinitialiser le flag quand les phases changent
    hasCenteredRef.current = false;
  }, [phases]);

  useEffect(() => {
    // Ne centrer qu'une fois et seulement si on a des phases
    if (hasCenteredRef.current || sorted.length === 0) return;
    
    // Vérifier que les positions sont définies
    const hasPositions = sorted.some(p => (p.canvasX ?? 0) > 0 || (p.canvasY ?? 0) > 0);
    if (!hasPositions && sorted.length > 1) return;
    
    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      centerView();
      hasCenteredRef.current = true;
    }, 100);
    
    return () => clearTimeout(timer);
  }, [sorted, centerView]);

  const toCanvas = useCallback((cx: number, cy: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { 
      x: (cx - rect.left - pan.x) / zoom, 
      y: (cy - rect.top - pan.y) / zoom 
    };
  }, [pan, zoom]);

  // Gestion du zoom avec la molette (desktop)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.91;
      setZoom(prev => {
        const next = Math.min(2.5, Math.max(0.15, prev * factor));
        setPan(p => ({ 
          x: mx - (mx - p.x) * (next / prev), 
          y: my - (my - p.y) * (next / prev) 
        }));
        return next;
      });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Gestion du zoom tactile (pinch) + pan sur mobile — logique ref-based (pas de stale closure)
  const touchRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    lastDist: number;
    lastZoom: number;
    lastPan: { x: number; y: number };
    singleStart: { x: number; y: number; px: number; py: number } | null;
  }>({ mode: 'none', lastDist: 0, lastZoom: 1, lastPan: { x: 0, y: 0 }, singleStart: null });

  const handleTouchStartNative = useCallback((e: TouchEvent) => {
    const tr = touchRef.current;
    if (e.touches.length === 2) {
      e.preventDefault();
      tr.mode = 'pinch';
      tr.singleStart = null;
      const t0 = e.touches[0]; const t1 = e.touches[1];
      tr.lastDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      // Capturer zoom et pan courants via setState callback au prochain tick n'est pas possible,
      // on lit les valeurs depuis des refs dédiées (voir zoomRef/panRef ci-dessous)
      tr.lastZoom = zoomRef.current;
      tr.lastPan  = { x: panRef.current.x, y: panRef.current.y };
      isPanning.current = false;
      setIsPanningState(false);
      return;
    }
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      if (target.closest('[data-phaseid]') || target.closest('button') || target.closest('[data-nodrag]')) return;
      e.preventDefault();
      tr.mode = 'pan';
      tr.singleStart = {
        x: e.touches[0].clientX, y: e.touches[0].clientY,
        px: panRef.current.x,    py: panRef.current.y,
      };
      isPanning.current = true;
      setIsPanningState(true);
    }
  }, []);

  const handleTouchMoveNative = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const tr = touchRef.current;
    if (tr.mode === 'pinch' && e.touches.length === 2) {
      const el = canvasRef.current;
      if (!el) return;
      const t0 = e.touches[0]; const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      if (tr.lastDist === 0) return;
      const newZoom = Math.min(2.5, Math.max(0.15, tr.lastZoom * (dist / tr.lastDist)));
      const rect = el.getBoundingClientRect();
      const midX = (t0.clientX + t1.clientX) / 2 - rect.left;
      const midY = (t0.clientY + t1.clientY) / 2 - rect.top;
      const newPan = {
        x: midX - (midX - tr.lastPan.x) * (newZoom / tr.lastZoom),
        y: midY - (midY - tr.lastPan.y) * (newZoom / tr.lastZoom),
      };
      setZoom(newZoom);
      setPan(newPan);
      // Mettre à jour les refs pour les mouvements suivants dans ce même geste
      tr.lastZoom = newZoom;
      tr.lastPan  = newPan;
      tr.lastDist = dist;
      return;
    }
    if (tr.mode === 'pan' && tr.singleStart && e.touches.length === 1) {
      const { x, y, px, py } = tr.singleStart;
      const dx = e.touches[0].clientX - x;
      const dy = e.touches[0].clientY - y;
      const newPan = { x: px + dx, y: py + dy };
      setPan(newPan);
      panRef.current = newPan;
    }
  }, []);

  const handleTouchEndNative = useCallback(() => {
    const tr = touchRef.current;
    tr.mode = 'none';
    tr.singleStart = null;
    isPanning.current = false;
    setIsPanningState(false);
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('touchstart',  handleTouchStartNative, { passive: false });
    el.addEventListener('touchmove',   handleTouchMoveNative,  { passive: false });
    el.addEventListener('touchend',    handleTouchEndNative);
    el.addEventListener('touchcancel', handleTouchEndNative);
    return () => {
      el.removeEventListener('touchstart',  handleTouchStartNative);
      el.removeEventListener('touchmove',   handleTouchMoveNative);
      el.removeEventListener('touchend',    handleTouchEndNative);
      el.removeEventListener('touchcancel', handleTouchEndNative);
    };
  }, [handleTouchStartNative, handleTouchMoveNative, handleTouchEndNative]);

  const onWinMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (draggingNode.current) {
      const c = toCanvas(e.clientX, e.clientY);
      onPhasesChange((phases as RichPhase[]).map(p =>
        p.id === draggingNode.current ? { 
          ...p, 
          canvasX: c.x - dragOffset.current.x, 
          canvasY: c.y - dragOffset.current.y 
        } : p
      ));
      return;
    }
    if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      return;
    }
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
  }, [toCanvas, phases, sorted, onPhasesChange, editingId, drawingArrow]);

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
            id: uid(), 
            fromPhaseId: drawingArrow.fromId, 
            toPhaseId: target.phaseId, 
            fromSide: drawingArrow.fromSide, 
            fromT: drawingArrow.fromT, 
            toSide: target.proj.side, 
            toT: target.proj.t 
          }]);
        }
      }
      setDrawingArrow(null);
    }
    draggingNode.current = null; 
    isPanning.current = false; 
    setIsPanningState(false);
    window.removeEventListener('mousemove', onWinMove);
    window.removeEventListener('mouseup',   onWinUp);
  }, [drawingArrow, arrows, sorted, toCanvas, emitArrows, onWinMove]);

  const attachWin = useCallback(() => {
    window.addEventListener('mousemove', onWinMove);
    window.addEventListener('mouseup',   onWinUp);
  }, [onWinMove, onWinUp]);

  const onNodeMouseDown = (e: React.MouseEvent, phase: RichPhase) => {
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return;
    const c = toCanvas(e.clientX, e.clientY);
    const proj = hitConnectionRing(
      c.x, c.y, 
      phase.canvasX ?? 0, phase.canvasY ?? 0, 
      phase.nodeW ?? NODE_W, phase.nodeH ?? 120
    );
    const inCenter = c.x > (phase.canvasX ?? 0) + 10 && 
                     c.x < (phase.canvasX ?? 0) + (phase.nodeW ?? NODE_W) - 10 &&
                     c.y > (phase.canvasY ?? 0) + 10 && 
                     c.y < (phase.canvasY ?? 0) + (phase.nodeH ?? 120) - 10;
    if (proj && !inCenter) {
      e.stopPropagation();
      const outside = anchorOutside(phase, proj.side, proj.t);
      setDrawingArrow({ 
        fromId: phase.id, 
        fromSide: proj.side, 
        fromT: proj.t, 
        fromX: outside.x, 
        fromY: outside.y 
      });
      setMousePos({ x: e.clientX, y: e.clientY });
      attachWin();
      return;
    }
    e.stopPropagation();
    draggingNode.current = phase.id;
    dragOffset.current   = { x: c.x - (phase.canvasX ?? 0), y: c.y - (phase.canvasY ?? 0) };
    attachWin();
  };

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest('[data-phaseid]') || el.closest('button') || el.closest('[data-nodrag]')) return;
    isPanning.current = true;
    setIsPanningState(true);
    panStart.current  = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    attachWin();
  };

  // Pan tactile géré via les listeners natifs (handleTouchStartNative etc.) — pas de handlers React inline

  const addPhase = () => {
    const maxX = sorted.length > 0 ? 
      Math.max(...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W) + 80)) : 60;
    const id = uid();
    const phase: RichPhase = {
      id, order: phases.length, title: `Phase ${phases.length + 1}`, 
      description: '', status: 'planned', startDate: '', endDate: '', tasks: [],
      canvasX: maxX, canvasY: 80, color: PALETTE[phases.length % PALETTE.length],
    };
    onPhasesChange([...phases, phase]);
    setEditingId(id); setEditForm(phase);
    
    // Réinitialiser le flag de centrage pour que la vue se centre après l'ajout
    hasCenteredRef.current = false;
  };

  const startEdit = (phase: RichPhase) => { 
    setEditingId(phase.id); setEditForm({ ...phase }); setShowPalette(false); 
  };
  
  const saveEdit  = () => {
    if (!editingId || !editForm.title?.trim()) return;
    onPhasesChange(phases.map(p => p.id === editingId ? { ...p, ...editForm } as RichPhase : p));
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
    
    // Réinitialiser le flag pour que la vue se recentre après suppression
    hasCenteredRef.current = false;
  };

  const phaseMap = Object.fromEntries(sorted.map(p => [p.id, p]));
  const canvasW  = Math.max(1600, ...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W) + 200));
  const canvasH  = Math.max(700,  ...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120) + 200));

  const renderArrows = () => {
    const els: React.ReactNode[] = [];
    arrows.forEach(arrow => {
      const from = phaseMap[arrow.fromPhaseId] as RichPhase | undefined;
      const to   = phaseMap[arrow.toPhaseId]   as RichPhase | undefined;
      if (!from || !to) return;

      // Point de départ : Déjà bon (on peut rester sur anchorOnBorder ou Outside selon l'effet désiré)
      const { x: x1Border, y: y1Border } = anchorOnBorder(from, arrow.fromSide, arrow.fromT ?? 0.5);
      
      /**
       * CORRECTION : Point d'arrivée
       * On utilise anchorOnBorder pour que la flèche se colle parfaitement à la bordure
       * au lieu de anchorOutside qui créait un décalage sur la zone de détection.
       */
      const { x: x2, y: y2 } = anchorOnBorder(to, arrow.toSide, arrow.toT ?? 0.5);
      
      const col  = from.color ?? DEFAULT_COLOR;
      const path = buildPath(x1Border, y1Border, x2, y2);
      const mid  = `marker_${arrow.id}`;
      const mx = (x1Border + x2) / 2;
      const my = (y1Border + y2) / 2;

      els.push(
        <g key={arrow.id}>
          <defs>
            <marker id={mid} markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 0, 10 4, 0 8" fill={col} fillOpacity="0.95" />
            </marker>
          </defs>
          <path d={path} fill="none" stroke={col} strokeWidth="2" strokeOpacity="0.7" strokeDasharray="6 4" markerEnd={`url(#${mid})`} />
          <circle cx={x1Border} cy={y1Border} r="4" fill={col} fillOpacity="0.9" />
          <g style={{ cursor: 'pointer' }} onClick={() => emitArrows(arrows.filter(a => a.id !== arrow.id))}>
            <circle cx={mx} cy={my} r="9" fill="var(--dark)" stroke={col} strokeOpacity="0.6" strokeWidth="1.5" />
            <line x1={mx-4} y1={my-4} x2={mx+4} y2={my+4} stroke={col} strokeWidth="1.5" strokeOpacity="0.9" strokeLinecap="round" />
            <line x1={mx+4} y1={my-4} x2={mx-4} y2={my+4} stroke={col} strokeWidth="1.5" strokeOpacity="0.9" strokeLinecap="round" />
          </g>
        </g>
      );
    });

    if (drawingArrow) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const x1 = drawingArrow.fromX, y1 = drawingArrow.fromY;
      const x2 = rect ? (mousePos.x - rect.left - pan.x) / zoom : x1;
      const y2 = rect ? (mousePos.y - rect.top  - pan.y) / zoom : y1;
      const col = (phaseMap[drawingArrow.fromId] as RichPhase | undefined)?.color ?? DEFAULT_COLOR;
      const path = buildPath(x1, y1, x2, y2);
      els.push(
        <g key="live">
          <defs>
            <marker id="live_head" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 0, 10 4, 0 8" fill={col} fillOpacity="0.6" />
            </marker>
          </defs>
          <path d={path} fill="none" stroke={col} strokeWidth="2" strokeOpacity="0.55" strokeDasharray="6 4" markerEnd="url(#live_head)" />
          <circle cx={x1} cy={y1} r="4" fill={col} fillOpacity="0.8" />
          <circle cx={x2} cy={y2} r="6" fill={col} fillOpacity="0.25" />
          <circle cx={x2} cy={y2} r="3" fill={col} fillOpacity="0.5" />
        </g>
      );
    }
    return els;
  };

  const renderHoverRings = () => {
    if (!connHover && !drawingArrow) return null;
    return sorted.map(phase => {
      const rp = phase as RichPhase;
      const isFrom = drawingArrow?.fromId === phase.id;
      const isTarget = connHover?.phaseId === phase.id;
      if (!isFrom && !isTarget) return null;
      const col = rp.color ?? DEFAULT_COLOR;
      const x = rp.canvasX ?? 0, y = rp.canvasY ?? 0, w = rp.nodeW ?? NODE_W, h = rp.nodeH ?? 120;
      return (
        <g key={`ring_${phase.id}`} style={{ pointerEvents: 'none' }}>
          <rect x={x - HOVER_GAP} y={y - HOVER_GAP} width={w + HOVER_GAP * 2} height={h + HOVER_GAP * 2} rx="10" ry="10" fill="none" stroke={col} strokeWidth="1.5" strokeOpacity={isFrom ? 0.5 : 0.8} strokeDasharray={isFrom ? '4 3' : 'none'} />
          {isTarget && connHover && <circle cx={connHover.proj.x} cy={connHover.proj.y} r="5" fill={col} fillOpacity="0.9" />}
        </g>
      );
    });
  };

  const globalCursor = drawingArrow ? 'crosshair' : connHover ? 'crosshair' : isPanningState ? 'grabbing' : 'grab';

  return (
    <div className={styles.wrapper}>
      <div 
        ref={canvasRef} 
        className={styles.canvas} 
        style={{ cursor: globalCursor }} 
        onMouseDown={onCanvasMouseDown} 
        onMouseLeave={() => setConnHover(null)} 
        onMouseMove={e => { if (drawingArrow) setMousePos({ x: e.clientX, y: e.clientY }); }}
      >
        <div className={styles.dotGrid} style={{ backgroundPosition: `${pan.x % 28}px ${pan.y % 28}px` }} />
        <div className={styles.topLeftControls}>
          <button type="button" className={`${styles.controlBtn} ${styles.fitViewBtn}`} onClick={centerView} title="Centrer la vue">
            <Target size={13} /><span className={styles.fitViewText}>Centrer</span>
          </button>
        </div>
        <div className={styles.topRightControls}>
          <button type="button" className={styles.addBtn} onClick={addPhase}><Plus size={13} /><span>Ajouter une phase</span></button>
        </div>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <button type="button" onClick={() => setZoom(z => Math.min(2.5, z * 1.2))} className={styles.controlBtn} title="Zoom +"><ZoomIn size={13} /></button>
            <span className={styles.controlValue}>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom(z => Math.max(0.15, z / 1.2))} className={styles.controlBtn} title="Zoom −"><ZoomOut size={13} /></button>
          </div>
        </div>
        <div className={styles.world} style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: canvasW, height: canvasH }}>
          {sorted.length === 0 && (
            <div className={styles.emptyHint}>
              <p>Commencez par ajouter une phase</p>
              <span>Glissez les cartes · Survolez le bord pour connecter</span>
            </div>
          )}
          {sorted.map(phase => {
            const rp = phase as RichPhase;
            const col = rp.color ?? DEFAULT_COLOR;
            const isEd = editingId === phase.id;
            const st = STATUS_LIST.find(s => s.value === phase.status) ?? STATUS_LIST[0];
            const StIcon = st.Icon;
            const done = phase.tasks.filter(t => t.done).length;
            const total = phase.tasks.length;
            const isHov = connHover?.phaseId === phase.id;
            return (
              <div key={phase.id} style={{ position: 'absolute', left: rp.canvasX ?? 0, top: rp.canvasY ?? 0, cursor: isHov && !isEd ? 'crosshair' : undefined }}>
                {!isEd && (
                  <div className={styles.nodeActionsFloat} data-nodrag="1">
                    <button type="button" className={styles.aBtn} onClick={e => { e.stopPropagation(); startEdit(rp); }} title="Modifier"><Edit2 size={11} /></button>
                    <button type="button" className={`${styles.aBtn} ${styles.aBtnDel}`} onClick={e => { e.stopPropagation(); deletePhase(phase.id); }} title="Supprimer"><X size={11} /></button>
                  </div>
                )}
                <div data-phaseid={phase.id} ref={el => { nodeRefs.current[phase.id] = el; }} className={`${styles.node} ${isEd ? styles.nodeOpen : ''}`} style={{ width: NODE_W, '--nc': col, backgroundColor: `${col}26` } as React.CSSProperties} onMouseDown={e => onNodeMouseDown(e, rp)}>
                  {isEd ? (
                    <div className={styles.editWrap} data-nodrag="1">
                      <input autoFocus className={styles.eTitle} style={{ '--ec': col } as React.CSSProperties} value={editForm.title ?? ''} placeholder="Nom de la phase…" onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                      <select className={styles.eSelect} value={editForm.status ?? 'planned'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as RichPhase['status'] }))}>
                        {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <div className={styles.colorRow} data-nodrag="1">
                        <button type="button" className={styles.paletteToggle} style={{ background: editForm.color ?? col }} onClick={() => setShowPalette(v => !v)}><Palette size={11} /></button>
                        {showPalette && (
                          <div className={styles.paletteGrid}>
                            {PALETTE.map(c => (
                              <button key={c} type="button" className={`${styles.palSwatch} ${(editForm.color ?? col) === c ? styles.palSwatchActive : ''}`} style={{ background: c }} onClick={() => { setEditForm(f => ({ ...f, color: c })); setShowPalette(false); }} />
                            ))}
                          </div>
                        )}
                      </div>
                      <textarea className={styles.eDesc} rows={2} value={editForm.description ?? ''} placeholder="Description…" onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                      <div className={styles.eDates}>
                        <label>Début<input type="date" className={styles.eDateInput} value={editForm.startDate ?? ''} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} /></label>
                        <span>→</span>
                        <label>Fin<input type="date" className={styles.eDateInput} value={editForm.endDate ?? ''} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} /></label>
                      </div>
                      <div className={styles.eActions}>
                        <button type="button" className={styles.eSave} style={{ background: col }} onClick={saveEdit}><Check size={11} />Enregistrer</button>
                        <button type="button" className={styles.eCancel} onClick={cancelEdit}>Annuler</button>
                        <button type="button" className={styles.eDelete} onClick={() => deletePhase(phase.id)}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.nodeBody}>
                      <h4 className={styles.nodeTitle}>{phase.title}</h4>
                      <span className={styles.nodeBadge} style={{ color: st.col, background: `${st.col}18`, border: `1px solid ${st.col}44` }}><StIcon size={9} />{st.label}</span>
                      {phase.description && <p className={styles.nodeDesc}>{phase.description}</p>}
                      {(phase.startDate || phase.endDate) && (
                        <div className={styles.nodeDates}>
                          {phase.startDate && <span>{new Date(phase.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                          {phase.startDate && phase.endDate && <span>→</span>}
                          {phase.endDate && <span>{new Date(phase.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                      )}
                      {total > 0 && (
                        <div className={styles.nodeProgress}>
                          <div className={styles.pBar}><div className={styles.pFill} style={{ width: `${(done / total) * 100}%`, background: col }} /></div>
                          <span style={{ color: col, fontSize: 10, fontWeight: 600 }}>{done}/{total}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <svg width={canvasW} height={canvasH} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 10 }}>
            {renderHoverRings()}
            <g style={{ pointerEvents: 'all' }}>{renderArrows()}</g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default RoadmapEditor;