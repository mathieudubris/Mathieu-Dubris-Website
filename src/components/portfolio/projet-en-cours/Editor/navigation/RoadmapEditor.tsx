"use client";

/**
 * RoadmapEditor v5
 * - Connexion auto sur bordures (zone épaisse invisible), sans ports fixes
 * - Flèches : point de départ + vraie tête de flèche à l'arrivée
 * - Taille conteneurs auto (height auto), nodeH mesuré et sauvegardé → cohérence avec Roadmap
 * - Navigation mobile (touch)
 * - Sous-étapes entièrement supprimées
 */

import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  Plus, X, Edit2, Check, ZoomIn, ZoomOut, Maximize2,
  Circle, Clock, CheckCircle2, Palette, Trash2,
} from 'lucide-react';
import type { RoadmapPhase } from '@/utils/projet-api';
import styles from './RoadmapEditor.module.css';

/* ─────────────────────────────────────────────
   Types exportés (consommés par Roadmap.tsx)
───────────────────────────────────────────── */
export type ArrowSide = 'top' | 'right' | 'bottom' | 'left';

export interface RoadmapArrow {
  id: string;
  fromPhaseId: string;
  toPhaseId: string;
  fromSide: ArrowSide;
  toSide: ArrowSide;
}

export interface RichPhase extends RoadmapPhase {
  canvasX?: number;
  canvasY?: number;
  nodeW?: number;   // largeur mesurée (sauvegardée)
  nodeH?: number;   // hauteur mesurée (sauvegardée)
  color?: string;
}

/* ─────────────────────────────────────────────
   Constantes
───────────────────────────────────────────── */
const NODE_W        = 220;
const BORDER_HIT    = 16;         // px — épaisseur zone de connexion invisible
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

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const uid = () => `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * Retourne le côté le plus proche si la souris est dans la zone de bordure.
 */
const hitBorder = (
  mx: number, my: number,
  nx: number, ny: number,
  nw: number, nh: number
): ArrowSide | null => {
  // Vérifier si on est dans le rectangle étendu
  if (mx < nx - BORDER_HIT || mx > nx + nw + BORDER_HIT) return null;
  if (my < ny - BORDER_HIT || my > ny + nh + BORDER_HIT) return null;

  const dTop    = Math.abs(my - ny);
  const dBottom = Math.abs(my - (ny + nh));
  const dLeft   = Math.abs(mx - nx);
  const dRight  = Math.abs(mx - (nx + nw));
  const minDist = Math.min(dTop, dBottom, dLeft, dRight);

  if (minDist > BORDER_HIT) return null;
  if (minDist === dTop)    return 'top';
  if (minDist === dBottom) return 'bottom';
  if (minDist === dLeft)   return 'left';
  return 'right';
};

/** Point d'ancrage au centre d'un côté du node */
const anchorOf = (phase: RichPhase, side: ArrowSide): { x: number; y: number } => {
  const x = phase.canvasX ?? 0;
  const y = phase.canvasY ?? 0;
  const w = phase.nodeW   ?? NODE_W;
  const h = phase.nodeH   ?? 120;
  switch (side) {
    case 'top':    return { x: x + w / 2, y };
    case 'bottom': return { x: x + w / 2, y: y + h };
    case 'left':   return { x,            y: y + h / 2 };
    case 'right':  return { x: x + w,     y: y + h / 2 };
  }
};

/** Courbe de Bézier cubique */
const buildPath = (x1: number, y1: number, x2: number, y2: number, fromSide: ArrowSide): string => {
  const d = Math.max(55, Math.abs(x2 - x1) * 0.45, Math.abs(y2 - y1) * 0.45);
  let cx1 = x1, cy1 = y1, cx2 = x2, cy2 = y2;
  switch (fromSide) {
    case 'right':  cx1 = x1 + d; cx2 = x2 - d; break;
    case 'left':   cx1 = x1 - d; cx2 = x2 + d; break;
    case 'bottom': cy1 = y1 + d; cy2 = y2 - d; break;
    case 'top':    cy1 = y1 - d; cy2 = y2 + d; break;
  }
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
};

/** Polygone de tête de flèche directionnelle */
const arrowHeadPoints = (x: number, y: number, toSide: ArrowSide): string => {
  const L = 13, W = 7;
  switch (toSide) {
    case 'left':   return `${x},${y} ${x+L},${y-W} ${x+L},${y+W}`;
    case 'right':  return `${x},${y} ${x-L},${y-W} ${x-L},${y+W}`;
    case 'top':    return `${x},${y} ${x-W},${y+L} ${x+W},${y+L}`;
    case 'bottom': return `${x},${y} ${x-W},${y-L} ${x+W},${y-L}`;
  }
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
interface RoadmapEditorProps {
  phases: RoadmapPhase[];
  onPhasesChange: (phases: RoadmapPhase[]) => void;
  arrows?: RoadmapArrow[];
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan,  setPan]  = useState({ x: 60, y: 40 });
  const [zoom, setZoom] = useState(1);
  const isPanning  = useRef(false);
  const panStart   = useRef({ x: 0, y: 0 });

  /* ── Node drag ── */
  const draggingNode = useRef<string | null>(null);
  const dragOffset   = useRef({ x: 0, y: 0 });

  /* ── Border hover (highlight) ── */
  const [borderHover, setBorderHover] = useState<{ phaseId: string; side: ArrowSide } | null>(null);

  /* ── Arrow drawing ── */
  const [drawingArrow, setDrawingArrow] = useState<{
    fromId: string; fromSide: ArrowSide; mx: number; my: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  /* ── Arrows state ── */
  const [arrows, setArrows] = useState<RoadmapArrow[]>(() => externalArrows);
  useEffect(() => {
    setArrows(externalArrows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(externalArrows)]);

  const emitArrows = useCallback((next: RoadmapArrow[]) => {
    setArrows(next);
    onArrowsChange?.(next);
  }, [onArrowsChange]);

  /* ── Editing ── */
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState<Partial<RichPhase>>({});
  const [showPalette, setShowPalette] = useState(false);

  /* ── Node DOM refs (mesure hauteur) ── */
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* ─── Init positions ─── */
  useEffect(() => {
    const needsInit = rich.some(p => p.canvasX === undefined);
    if (!needsInit) return;
    onPhasesChange(
      rich.map((p, idx) => ({
        ...p,
        canvasX: p.canvasX ?? 60 + idx * (NODE_W + 100),
        canvasY: p.canvasY ?? 80,
        color:   p.color   ?? PALETTE[idx % PALETTE.length],
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Mesure hauteur réelle → sauvegarde ─── */
  useLayoutEffect(() => {
    let changed = false;
    const updated = (phases as RichPhase[]).map(p => {
      const el = nodeRefs.current[p.id];
      if (!el) return p;
      const h = el.offsetHeight;
      const w = el.offsetWidth;
      if (h && (h !== p.nodeH || w !== p.nodeW)) {
        changed = true;
        return { ...p, nodeH: h, nodeW: w };
      }
      return p;
    });
    if (changed) onPhasesChange(updated);
  });

  /* ─── toCanvas helper ─── */
  const toCanvas = useCallback((cx: number, cy: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (cx - rect.left - pan.x) / zoom, y: (cy - rect.top - pan.y) / zoom };
  }, [pan, zoom]);

  /* ─── Window listeners (mouse) ─── */
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
    } else if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    }

    // Update border hover
    if (!draggingNode.current && !isPanning.current) {
      const c = toCanvas(e.clientX, e.clientY);
      let found: { phaseId: string; side: ArrowSide } | null = null;
      for (const p of sorted) {
        const side = hitBorder(c.x, c.y, p.canvasX ?? 0, p.canvasY ?? 0, p.nodeW ?? NODE_W, p.nodeH ?? 120);
        if (side) { found = { phaseId: p.id, side }; break; }
      }
      setBorderHover(prev => {
        if (!prev && !found) return prev;
        if (prev?.phaseId === found?.phaseId && prev?.side === found?.side) return prev;
        return found;
      });
    }
  }, [toCanvas, phases, sorted, onPhasesChange]);

  const onWinUp = useCallback((e: MouseEvent) => {
    if (drawingArrow) {
      const c = toCanvas(e.clientX, e.clientY);
      let target: { phaseId: string; side: ArrowSide } | null = null;
      for (const p of sorted) {
        if (p.id === drawingArrow.fromId) continue;
        const side = hitBorder(c.x, c.y, p.canvasX ?? 0, p.canvasY ?? 0, p.nodeW ?? NODE_W, p.nodeH ?? 120);
        if (side) { target = { phaseId: p.id, side }; break; }
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
            toPhaseId:   target.phaseId,
            fromSide:    drawingArrow.fromSide,
            toSide:      target.side,
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
    const c    = toCanvas(e.clientX, e.clientY);
    const side = hitBorder(c.x, c.y, phase.canvasX ?? 0, phase.canvasY ?? 0, phase.nodeW ?? NODE_W, phase.nodeH ?? 120);

    if (side) {
      // Démarrer connexion
      e.stopPropagation();
      setDrawingArrow({ fromId: phase.id, fromSide: side, mx: e.clientX, my: e.clientY });
      setMousePos({ x: e.clientX, y: e.clientY });
      attachWin();
      return;
    }

    // Déplacer le node
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

  const onCanvasMouseLeave = () => setBorderHover(null);

  /* ─── Touch support ─── */
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

  const onTouchEnd = () => {
    touchNodeRef.current = null;
    touchPanRef.current  = null;
  };

  /* ─── Zoom ─── */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(2.5, Math.max(0.15, z - e.deltaY * 0.001)));
  };

  /* ─── Phase CRUD ─── */
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

  /* ─── SVG arrows ─── */
  const phaseMap = Object.fromEntries(sorted.map(p => [p.id, p]));
  const canvasW  = Math.max(1600, ...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W) + 200));
  const canvasH  = Math.max(700,  ...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120) + 200));

  const renderArrows = () => {
    const els: React.ReactNode[] = [];

    arrows.forEach(arrow => {
      const from = phaseMap[arrow.fromPhaseId] as RichPhase | undefined;
      const to   = phaseMap[arrow.toPhaseId]   as RichPhase | undefined;
      if (!from || !to) return;

      const { x: x1, y: y1 } = anchorOf(from, arrow.fromSide);
      const { x: x2, y: y2 } = anchorOf(to,   arrow.toSide);
      const col  = from.color ?? DEFAULT_COLOR;
      const path = buildPath(x1, y1, x2, y2, arrow.fromSide);
      const head = arrowHeadPoints(x2, y2, arrow.toSide);
      const mx   = (x1 + x2) / 2;
      const my   = (y1 + y2) / 2 - 8;

      els.push(
        <g key={arrow.id}>
          <path d={path} fill="none" stroke={col} strokeWidth="1.8" strokeOpacity="0.65" strokeDasharray="6 4"/>
          {/* Point de départ */}
          <circle cx={x1} cy={y1} r="4" fill={col} fillOpacity="0.85"/>
          {/* Tête de flèche à l'arrivée */}
          <polygon points={head} fill={col} fillOpacity="0.9"/>
          {/* Supprimer */}
          <circle cx={mx} cy={my} r="8"
            fill="#EF444420" stroke="#EF4444" strokeOpacity="0.5" strokeWidth="1"
            style={{ cursor: 'pointer', pointerEvents: 'all' }}
            onClick={() => emitArrows(arrows.filter(a => a.id !== arrow.id))}/>
          <text x={mx} y={my + 4} textAnchor="middle" fontSize="11"
            fill="#EF4444" fillOpacity="0.8"
            style={{ cursor: 'pointer', userSelect: 'none', pointerEvents: 'all' }}
            onClick={() => emitArrows(arrows.filter(a => a.id !== arrow.id))}>×</text>
        </g>
      );
    });

    /* Flèche live en cours de dessin */
    if (drawingArrow) {
      const from = phaseMap[drawingArrow.fromId] as RichPhase | undefined;
      if (from) {
        const rect = canvasRef.current?.getBoundingClientRect();
        const { x: x1, y: y1 } = anchorOf(from, drawingArrow.fromSide);
        const x2 = rect ? (mousePos.x - rect.left - pan.x) / zoom : x1;
        const y2 = rect ? (mousePos.y - rect.top  - pan.y) / zoom : y1;
        const col  = from.color ?? DEFAULT_COLOR;
        const path = buildPath(x1, y1, x2, y2, drawingArrow.fromSide);
        els.push(
          <g key="live">
            <path d={path} fill="none" stroke={col} strokeWidth="1.8" strokeOpacity="0.5" strokeDasharray="5 3"/>
            <circle cx={x1} cy={y1} r="4" fill={col} fillOpacity="0.7"/>
            <circle cx={x2} cy={y2} r="5" fill={col} fillOpacity="0.35"/>
          </g>
        );
      }
    }

    return els;
  };

  /* ─── Render ─── */
  return (
    <div className={styles.wrapper}>

      {/* ── Toolbar ── */}
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

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        className={styles.canvas}
        style={{ cursor: drawingArrow || borderHover ? 'crosshair' : 'default' }}
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
          {/* SVG layer */}
          <svg width={canvasW} height={canvasH}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
            {renderArrows()}
          </svg>

          {/* Empty hint */}
          {sorted.length === 0 && (
            <div className={styles.emptyHint}>
              <p>Commencez par ajouter une phase</p>
              <span>Glissez les cartes · Approchez le bord pour connecter</span>
            </div>
          )}

          {/* ── Phase nodes ── */}
          {sorted.map(phase => {
            const rp     = phase as RichPhase;
            const col    = rp.color ?? DEFAULT_COLOR;
            const isEd   = editingId === phase.id;
            const st     = STATUS_LIST.find(s => s.value === phase.status) ?? STATUS_LIST[0];
            const StIcon = st.Icon;
            const done   = phase.tasks.filter(t => t.done).length;
            const total  = phase.tasks.length;
            const isHov  = borderHover?.phaseId === phase.id;

            return (
              <div
                key={phase.id}
                data-phaseid={phase.id}
                ref={el => { nodeRefs.current[phase.id] = el; }}
                className={`${styles.node} ${isEd ? styles.nodeOpen : ''} ${isHov ? styles.nodeBorderHover : ''}`}
                style={{
                  left: rp.canvasX ?? 0,
                  top:  rp.canvasY ?? 0,
                  width: NODE_W,
                  '--nc': col,
                } as React.CSSProperties}
                onMouseDown={e => onNodeMouseDown(e, rp)}
              >
                {/* Barre couleur */}
                <div className={styles.nodeBar} style={{ background: col }}/>

                {/* Zone de bordure invisible pour la connexion */}
                {!isEd && <div className={`${styles.borderZone} ${isHov ? styles.borderZoneActive : ''}`}/>}

                {isEd ? (
                  /* ── Formulaire ── */
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
                  /* ── Affichage ── */
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
                    <div className={styles.nodeActions} data-nodrag="1">
                      <button type="button" className={styles.aBtn}
                        onClick={() => startEdit(rp)} title="Modifier"><Edit2 size={11}/></button>
                      <button type="button" className={`${styles.aBtn} ${styles.aBtnDel}`}
                        onClick={() => deletePhase(phase.id)} title="Supprimer"><X size={11}/></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <span>🖱 Glisser le fond pour naviguer</span><span>·</span>
        <span>⚲ Scroll pour zoomer</span><span>·</span>
        <span>Glisser une carte pour la déplacer</span><span>·</span>
        <span>Approcher le <strong style={{ color: '#7C3AED' }}>bord</strong> d&apos;une carte pour connecter</span>
      </div>
    </div>
  );
};

export default RoadmapEditor;