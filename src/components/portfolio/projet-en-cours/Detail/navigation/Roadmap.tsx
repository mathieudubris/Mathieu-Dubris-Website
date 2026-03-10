"use client";

/**
 * Roadmap — Vue publique (lecture seule)
 * Corrections :
 * - FIX #3 : flèches avec direction correcte (pointe vers le node cible)
 * - FIX #3 : têtes de flèches à l'extérieur des nodes (ancres sur les bords)
 * - FIX #1 : côtés calculés dynamiquement selon positions relatives
 * - Pas de drag, pas d'édition
 * - Boutons zoom + centrer
 */

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import type { RoadmapArrow, RichPhase } from '@/components/portfolio/projet-en-cours/Editor/navigation/RoadmapEditor';
import type { RoadmapPhase } from '@/utils/projet-api';
import styles from './Roadmap.module.css';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type ArrowSide = 'top' | 'right' | 'bottom' | 'left';

interface RoadmapProps {
  phases: RoadmapPhase[];
  arrows?: RoadmapArrow[];
}

/* ─────────────────────────────────────────────
   Constantes
───────────────────────────────────────────── */
const NODE_W        = 220;
const DEFAULT_COLOR = '#7C3AED';

const STATUS_LIST = [
  { value: 'planned'     as const, label: 'À venir',  Icon: Circle,       col: '#6B7280' },
  { value: 'in-progress' as const, label: 'En cours', Icon: Clock,        col: '#0EA5E9' },
  { value: 'completed'   as const, label: 'Terminé',  Icon: CheckCircle2, col: '#10B981' },
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

/** Calcule dynamiquement le meilleur côté selon positions relatives */
const bestSides = (
  from: RichPhase,
  to: RichPhase
): { fromSide: ArrowSide; toSide: ArrowSide } => {
  const fx = (from.canvasX ?? 0) + (from.nodeW ?? NODE_W) / 2;
  const fy = (from.canvasY ?? 0) + (from.nodeH ?? 120) / 2;
  const tx = (to.canvasX   ?? 0) + (to.nodeW   ?? NODE_W) / 2;
  const ty = (to.canvasY   ?? 0) + (to.nodeH   ?? 120) / 2;
  const dx = tx - fx;
  const dy = ty - fy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { fromSide: 'right', toSide: 'left' }
      : { fromSide: 'left',  toSide: 'right' };
  } else {
    return dy >= 0
      ? { fromSide: 'bottom', toSide: 'top' }
      : { fromSide: 'top',    toSide: 'bottom' };
  }
};

/** Point d'ancrage sur le bord extérieur du node */
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

/** Courbe de Bézier */
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

/**
 * FIX — Tête de flèche correcte :
 * La flèche pointe VERS le node cible depuis l'extérieur.
 * toSide = côté du node cible où la flèche arrive.
 * La pointe doit donc pointer dans la direction d'entrée dans ce côté.
 */
const arrowHeadPoints = (x: number, y: number, toSide: ArrowSide): string => {
  const L = 11, W = 6;
  switch (toSide) {
    // Arrive par le côté gauche → pointe vers la droite (→) pour entrer
    case 'left':   return `${x},${y} ${x-L},${y-W} ${x-L},${y+W}`;
    // Arrive par le côté droit → pointe vers la gauche (←)
    case 'right':  return `${x},${y} ${x+L},${y-W} ${x+L},${y+W}`;
    // Arrive par le haut → pointe vers le bas (↓)
    case 'top':    return `${x},${y} ${x-W},${y-L} ${x+W},${y-L}`;
    // Arrive par le bas → pointe vers le haut (↑)
    case 'bottom': return `${x},${y} ${x-W},${y+L} ${x+W},${y+L}`;
  }
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const Roadmap: React.FC<RoadmapProps> = ({ phases, arrows = [] }) => {
  const rich   = phases as RichPhase[];
  const sorted = [...rich].sort((a, b) => a.order - b.order);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan,  setPan]  = useState({ x: 60, y: 40 });
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });

  /* ── Mesure des hauteurs pour alignement correct des ancres ── */
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [measuredPhases, setMeasuredPhases] = useState<RichPhase[]>(rich);

  useLayoutEffect(() => {
    let changed = false;
    const updated = rich.map(p => {
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
    if (changed) setMeasuredPhases(updated);
  });

  /* Sync quand phases change depuis l'extérieur */
  useEffect(() => {
    setMeasuredPhases(phases as RichPhase[]);
  }, [phases]);

  /* ── Auto-centre au chargement ── */
  useEffect(() => {
    if (sorted.length === 0) return;
    const minX = Math.min(...sorted.map(p => p.canvasX ?? 0));
    const minY = Math.min(...sorted.map(p => p.canvasY ?? 0));
    const maxX = Math.max(...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W)));
    const maxY = Math.max(...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120)));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cw = rect.width  || 800;
    const ch = rect.height || 400;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scaleX = cw / (contentW + 120);
    const scaleY = ch / (contentH + 120);
    const newZoom = Math.min(1, scaleX, scaleY);
    const px = (cw - contentW * newZoom) / 2 - minX * newZoom;
    const py = (ch - contentH * newZoom) / 2 - minY * newZoom;
    setPan({ x: px, y: py });
    setZoom(newZoom);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Pan (drag fond) ── */
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (
      !el.classList.contains(styles.world) &&
      !el.classList.contains(styles.dotGrid) &&
      el !== canvasRef.current
    ) return;
    isPanning.current = true;
    panStart.current  = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    const onMove = (ev: MouseEvent) => {
      if (!isPanning.current) return;
      setPan({ x: ev.clientX - panStart.current.x, y: ev.clientY - panStart.current.y });
    };
    const onUp = () => {
      isPanning.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(2.5, Math.max(0.15, z - e.deltaY * 0.001)));
  };

  /* ── Touch pan ── */
  const touchPan = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchPan.current = { x: t.clientX - pan.x, y: t.clientY - pan.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchPan.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    setPan({ x: t.clientX - touchPan.current.x, y: t.clientY - touchPan.current.y });
  };
  const onTouchEnd = () => { touchPan.current = null; };

  /* ── Centre ── */
  const centerView = () => {
    if (sorted.length === 0) return;
    const minX = Math.min(...sorted.map(p => p.canvasX ?? 0));
    const minY = Math.min(...sorted.map(p => p.canvasY ?? 0));
    const maxX = Math.max(...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W)));
    const maxY = Math.max(...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120)));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cw = rect.width  || 800;
    const ch = rect.height || 400;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scaleX = cw / (contentW + 120);
    const scaleY = ch / (contentH + 120);
    const newZoom = Math.min(1, scaleX, scaleY);
    const px = (cw - contentW * newZoom) / 2 - minX * newZoom;
    const py = (ch - contentH * newZoom) / 2 - minY * newZoom;
    setPan({ x: px, y: py });
    setZoom(newZoom);
  };

  /* ── SVG arrows ── */
  const phaseMap = Object.fromEntries(measuredPhases.map(p => [p.id, p]));
  const canvasW  = Math.max(1600, ...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W) + 200));
  const canvasH  = Math.max(700,  ...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120) + 200));

  const renderArrows = () =>
    arrows.map(arrow => {
      const from = phaseMap[arrow.fromPhaseId] as RichPhase | undefined;
      const to   = phaseMap[arrow.toPhaseId]   as RichPhase | undefined;
      if (!from || !to) return null;

      // Côtés dynamiques selon positions actuelles
      const { fromSide, toSide } = bestSides(from, to);
      const { x: x1, y: y1 } = anchorOf(from, fromSide);
      const { x: x2, y: y2 } = anchorOf(to,   toSide);
      const col  = from.color ?? DEFAULT_COLOR;
      const path = buildPath(x1, y1, x2, y2, fromSide);
      const head = arrowHeadPoints(x2, y2, toSide);

      return (
        <g key={arrow.id}>
          <path d={path} fill="none" stroke={col} strokeWidth="1.8" strokeOpacity="0.65" strokeDasharray="6 4"/>
          <circle cx={x1} cy={y1} r="4" fill={col} fillOpacity="0.85"/>
          <polygon points={head} fill={col} fillOpacity="0.9"/>
        </g>
      );
    });

  /* ── Render ── */
  return (
    <div className={styles.wrapper}>
      {/* Toolbar lecture seule */}
      <div className={styles.toolbar}>
        <div className={styles.tbL}>
          <span className={styles.tbTitle}>Roadmap</span>
          <span className={styles.tbBadge}>{phases.length} phase{phases.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.tbR}>
          <button type="button" className={styles.tbBtn}
            onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(1)))}><ZoomIn size={13}/></button>
          <span className={styles.tbZoom}>{Math.round(zoom * 100)}%</span>
          <button type="button" className={styles.tbBtn}
            onClick={() => setZoom(z => Math.max(0.15, +(z - 0.1).toFixed(1)))}><ZoomOut size={13}/></button>
          <button type="button" className={styles.tbBtn} title="Centrer" onClick={centerView}>
            <Maximize2 size={13}/>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={styles.canvas}
        style={{ cursor: 'grab' }}
        onMouseDown={onCanvasMouseDown}
        onWheel={onWheel}
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
          <svg width={canvasW} height={canvasH}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
            {renderArrows()}
          </svg>

          {sorted.length === 0 && (
            <div className={styles.emptyHint}>
              <p>Aucune phase pour le moment</p>
            </div>
          )}

          {sorted.map(phase => {
            const rp     = phase as RichPhase;
            const col    = rp.color ?? DEFAULT_COLOR;
            const st     = STATUS_LIST.find(s => s.value === phase.status) ?? STATUS_LIST[0];
            const StIcon = st.Icon;
            const done   = phase.tasks.filter(t => t.done).length;
            const total  = phase.tasks.length;

            return (
              <div
                key={phase.id}
                data-phaseid={phase.id}
                ref={el => { nodeRefs.current[phase.id] = el; }}
                className={styles.node}
                style={{
                  left:   rp.canvasX ?? 0,
                  top:    rp.canvasY ?? 0,
                  width:  NODE_W,
                  cursor: 'default',
                  '--nc': col,
                } as React.CSSProperties}
              >
                <div className={styles.nodeBar} style={{ background: col }}/>
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>🖱 Glisser pour naviguer</span><span>·</span>
        <span>⚲ Scroll pour zoomer</span>
      </div>
    </div>
  );
};

export default Roadmap;