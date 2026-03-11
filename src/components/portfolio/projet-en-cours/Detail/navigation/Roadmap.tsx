"use client";

import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Target } from 'lucide-react';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import type { RoadmapArrow, RichPhase } from '@/components/portfolio/projet-en-cours/Editor/navigation/RoadmapEditor';
import type { RoadmapPhase } from '@/utils/projet-api';
import styles from './Roadmap.module.css';

type ArrowSide = 'top' | 'right' | 'bottom' | 'left';

interface RoadmapProps {
  phases: RoadmapPhase[];
  arrows?: RoadmapArrow[];
}

const NODE_W        = 220;
const DEFAULT_COLOR = '#c7ff44';
// ARROW_OFFSET = 0 : le path se termine exactement sur le bord du node.
// markerEnd avec refX=8 (pointe du triangle) est aligné sur ce point.
// => La pointe de flèche touche le bord, rien ne rentre dans le node.
const ARROW_OFFSET  = 0;

const STATUS_LIST = [
  { value: 'planned'     as const, label: 'À venir',  Icon: Circle,       col: '#6b7280' },
  { value: 'in-progress' as const, label: 'En cours', Icon: Clock,        col: '#3b82f6' },
  { value: 'completed'   as const, label: 'Terminé',  Icon: CheckCircle2, col: '#10ce55' },
];

function anchorOutside(phase: RichPhase, side: ArrowSide, t: number): { x: number; y: number } {
  const x  = phase.canvasX ?? 0;
  const y  = phase.canvasY ?? 0;
  const w  = phase.nodeW   ?? NODE_W;
  const h  = phase.nodeH   ?? 120;
  const tc = Math.max(0, Math.min(1, t ?? 0.5));
  const o  = ARROW_OFFSET;
  switch (side) {
    case 'top':    return { x: x + tc * w, y: y - o };
    case 'bottom': return { x: x + tc * w, y: y + h + o };
    case 'left':   return { x: x - o,      y: y + tc * h };
    case 'right':  return { x: x + w + o,  y: y + tc * h };
  }
}

function buildPath(x1: number, y1: number, x2: number, y2: number, fromSide: ArrowSide, toSide: ArrowSide): string {
  const d = Math.max(60, Math.abs(x2 - x1) * 0.5, Math.abs(y2 - y1) * 0.5);
  const tangent = (s: ArrowSide): [number, number] => {
    switch (s) {
      case 'right':  return [+d, 0];
      case 'left':   return [-d, 0];
      case 'bottom': return [0, +d];
      case 'top':    return [0, -d];
    }
  };
  const [dx1, dy1] = tangent(fromSide);
  const [dx2, dy2] = tangent(toSide);
  return `M ${x1} ${y1} C ${x1+dx1} ${y1+dy1}, ${x2-dx2} ${y2-dy2}, ${x2} ${y2}`;
}

const Roadmap: React.FC<RoadmapProps> = ({ phases, arrows = [] }) => {
  // Un seul ref sur le wrapper — plus de canvasInner séparé
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const nodeRefs    = useRef<Record<string, HTMLDivElement | null>>({});
  const measuredRef = useRef<Record<string, { w: number; h: number }>>({});

  const [localPhases, setLocalPhases] = useState<RichPhase[]>(() => phases as RichPhase[]);
  const prevPhasesJsonRef = useRef('');

  useEffect(() => {
    const json = JSON.stringify(phases);
    if (json === prevPhasesJsonRef.current) return;
    prevPhasesJsonRef.current = json;
    setLocalPhases(phases as RichPhase[]);
    measuredRef.current = {};
  }, [phases]);

  const sorted = [...localPhases].sort((a, b) => a.order - b.order);

  const [pan,  setPan]  = useState({ x: 60, y: 40 });
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });

  const setLocalPhasesRef = useRef(setLocalPhases);
  useEffect(() => { setLocalPhasesRef.current = setLocalPhases; });

  /* Mesure hauteur des nodes */
  useLayoutEffect(() => {
    let changed = false;
    const next = localPhases.map(p => {
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
    if (changed) setLocalPhasesRef.current(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  /* Centre la vue */
  const centerView = useCallback(() => {
    if (!wrapperRef.current || sorted.length === 0) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const cw = rect.width  || 800;
    const ch = rect.height || 500;
    const minX = Math.min(...sorted.map(p => p.canvasX ?? 0));
    const minY = Math.min(...sorted.map(p => p.canvasY ?? 0));
    const maxX = Math.max(...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W)));
    const maxY = Math.max(...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120)));
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const newZoom = Math.min(1, (cw - 80) / contentW, (ch - 80) / contentH);
    setPan({
      x: (cw - contentW * newZoom) / 2 - minX * newZoom,
      y: (ch - contentH * newZoom) / 2 - minY * newZoom,
    });
    setZoom(newZoom);
  }, [sorted]);

  /* Auto-centre au chargement */
  const hasCenteredRef = useRef(false);
  useEffect(() => { hasCenteredRef.current = false; }, [phases]);
  useEffect(() => {
    if (hasCenteredRef.current || sorted.length === 0) return;
    const hasPositions = sorted.some(p => (p.canvasX ?? 0) > 0 || (p.canvasY ?? 0) > 0);
    if (!hasPositions && sorted.length > 1) return;
    centerView();
    hasCenteredRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPhases]);

  /* Zoom molette vers le curseur */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.91;
      setZoom(prev => {
        const next = Math.min(2.5, Math.max(0.15, prev * factor));
        setPan(p => ({
          x: mx - (mx - p.x) * (next / prev),
          y: my - (my - p.y) * (next / prev),
        }));
        return next;
      });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  /* Pan souris */
  const onMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-phaseid]')) return;
    e.preventDefault();
    isPanning.current = true;
    panStart.current  = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    const onMove = (ev: MouseEvent) => {
      if (!isPanning.current) return;
      setPan({ x: ev.clientX - panStart.current.x, y: ev.clientY - panStart.current.y });
    };
    const onUp = () => {
      isPanning.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /* Pan tactile */
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

  const phaseMap = Object.fromEntries(localPhases.map(p => [p.id, p]));
  const canvasW  = Math.max(1600, ...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W) + 200));
  const canvasH  = Math.max(700,  ...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120) + 200));

  const renderArrows = () =>
    arrows.map(arrow => {
      const from = phaseMap[arrow.fromPhaseId] as RichPhase | undefined;
      const to   = phaseMap[arrow.toPhaseId]   as RichPhase | undefined;
      if (!from || !to) return null;
      const fromT = (arrow as any).fromT ?? 0.5;
      const toT   = (arrow as any).toT   ?? 0.5;
      const { x: x1, y: y1 } = anchorOutside(from, arrow.fromSide, fromT);
      const { x: x2, y: y2 } = anchorOutside(to,   arrow.toSide,   toT);
      const col  = from.color ?? DEFAULT_COLOR;
      const path = buildPath(x1, y1, x2, y2, arrow.fromSide, arrow.toSide);
      const mid  = `vm_${arrow.id}`;
      return (
        <g key={arrow.id}>
          <defs>
            <marker id={mid} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 8 3, 0 6" fill={col} fillOpacity="0.95" />
            </marker>
          </defs>
          <path d={path} fill="none" stroke={col} strokeWidth="2" strokeOpacity="0.7" strokeDasharray="6 4" markerEnd={`url(#${mid})`} />
          <circle cx={x1} cy={y1} r="4" fill={col} fillOpacity="0.95" />
        </g>
      );
    });

  return (
    <div
      ref={wrapperRef}
      className={styles.canvas}
      style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Grille de fond */}
      <div
        className={styles.dotGrid}
        style={{ backgroundPosition: `${pan.x % 28}px ${pan.y % 28}px` }}
      />

      {/* Bouton Centrer — haut gauche */}
      <div className={styles.topLeftControls}>
        <button
          type="button"
          className={`${styles.controlBtn} ${styles.fitViewBtn}`}
          onClick={centerView}
          title="Centrer la vue"
        >
          <Target size={13} /><span>Centrer</span>
        </button>
      </div>

      {/* Boutons Zoom — bas droite */}
      <div className={styles.zoomControls}>
        <div className={styles.controlGroup}>
          <button type="button" className={styles.controlBtn} onClick={() => setZoom(z => Math.min(2.5, z * 1.2))} title="Zoom +">
            <ZoomIn size={13} />
          </button>
          <span className={styles.controlValue}>{Math.round(zoom * 100)}%</span>
          <button type="button" className={styles.controlBtn} onClick={() => setZoom(z => Math.max(0.15, z / 1.2))} title="Zoom −">
            <ZoomOut size={13} />
          </button>
        </div>
      </div>

      {/* Monde pannable */}
      <div
        className={styles.world}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: canvasW,
          height: canvasH,
        }}
      >
        {sorted.length === 0 && (
          <div className={styles.emptyHint}>
            <p>Aucune phase pour le moment</p>
            <span>Créez des phases dans l&apos;éditeur de roadmap</span>
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
                position: 'absolute',
                left:   rp.canvasX ?? 0,
                top:    rp.canvasY ?? 0,
                width:  NODE_W,
                '--nc': col,
                backgroundColor: `${col}33`,
              } as React.CSSProperties}
            >
              <div className={styles.nodeBody}>
                <h4 className={styles.nodeTitle}>{phase.title}</h4>
                <span
                  className={styles.nodeBadge}
                  style={{ color: st.col, background: `${st.col}18`, border: `1px solid ${st.col}44` }}
                >
                  <StIcon size={9} />{st.label}
                </span>
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
                    <div className={styles.pBar}>
                      <div className={styles.pFill} style={{ width: `${(done / total) * 100}%`, background: col }} />
                    </div>
                    <span style={{ color: col, fontSize: 10, fontWeight: 600 }}>{done}/{total}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* SVG rendu APRÈS les nodes → flèches par-dessus les nodes */}
        <svg
          width={canvasW}
          height={canvasH}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}
        >
          {renderArrows()}
        </svg>
      </div>
    </div>
  );
};

export default Roadmap;