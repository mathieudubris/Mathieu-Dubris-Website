"use client";

/**
 * Roadmap — Vue publique (lecture seule)
 * FIXES :
 * - Boucle infinie : useLayoutEffect avec dépendances stables (ref + flag)
 * - Flèches : ancres libres (fromT/toT), identiques à l'éditeur v7
 * - Toolbar identique à l'éditeur pour cohérence visuelle
 */

import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import type { RoadmapArrow, RichPhase } from '@/components/portfolio/projet-en-cours/Editor/navigation/RoadmapEditor';
import type { RoadmapPhase } from '@/utils/projet-api';
import styles from '@/components/portfolio/projet-en-cours/Editor/navigation/RoadmapEditor.module.css'; // ← même CSS que l'éditeur pour cohérence

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

/**
 * Calcule les coordonnées absolues d'un point d'ancrage
 * à partir de { side, t } stockés dans la flèche.
 * Identique à anchorFromSideT dans RoadmapEditor v7.
 */
const anchorFromSideT = (
  phase: RichPhase,
  side:  ArrowSide,
  t:     number
): { x: number; y: number } => {
  const x  = phase.canvasX ?? 0;
  const y  = phase.canvasY ?? 0;
  const w  = phase.nodeW   ?? NODE_W;
  const h  = phase.nodeH   ?? 120;
  const tc = Math.max(0, Math.min(1, t ?? 0.5));
  switch (side) {
    case 'top':    return { x: x + tc * w, y };
    case 'bottom': return { x: x + tc * w, y: y + h };
    case 'left':   return { x,             y: y + tc * h };
    case 'right':  return { x: x + w,      y: y + tc * h };
  }
};

/**
 * Courbe de Bézier cubique avec tangentes basées sur les deux côtés.
 * Identique à buildPath dans RoadmapEditor v7.
 */
const buildPath = (
  x1: number, y1: number,
  x2: number, y2: number,
  fromSide: ArrowSide,
  toSide:   ArrowSide
): string => {
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
  return `M ${x1} ${y1} C ${x1+dx1} ${y1+dy1}, ${x2-dx2} ${y2-dy2}, ${x2} ${y2}`;
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const Roadmap: React.FC<RoadmapProps> = ({ phases, arrows = [] }) => {
  const canvasRef  = useRef<HTMLDivElement>(null);
  const nodeRefs   = useRef<Record<string, HTMLDivElement | null>>({});
  const measuredRef = useRef<Record<string, { w: number; h: number }>>({});

  // ── State local des phases (avec nodeH/W mesurés) ──
  const [localPhases, setLocalPhases] = useState<RichPhase[]>(() => phases as RichPhase[]);
  const prevPhasesJsonRef = useRef('');

  // Sync quand phases change depuis l'extérieur (rechargement projet avec données canvas)
  // On compare par JSON pour ne déclencher que si les données ont vraiment changé.
  useEffect(() => {
    const json = JSON.stringify(phases);
    if (json === prevPhasesJsonRef.current) return;
    prevPhasesJsonRef.current = json;
    setLocalPhases(phases as RichPhase[]);
    // Reset mesures pour forcer une re-mesure avec les nouvelles phases
    measuredRef.current = {};
  }, [phases]);

  const sorted = [...localPhases].sort((a, b) => a.order - b.order);

  const [pan,  setPan]  = useState({ x: 60, y: 40 });
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });

  // Ref stable vers setLocalPhases pour le useLayoutEffect
  const setLocalPhasesRef = useRef(setLocalPhases);
  useEffect(() => { setLocalPhasesRef.current = setLocalPhases; });

  /* ── Mesure des hauteurs — FIX boucle infinie ──
     Tourne après chaque render mais ne setState que si les dimensions DOM
     ont réellement changé. measuredRef est resetté quand phases change
     depuis l'extérieur (voir useEffect ci-dessus), ce qui force une
     nouvelle mesure après rechargement des données canvas. */
  useLayoutEffect(() => {
    let changed = false;
    const next = localPhases.map(p => {
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
    if (changed) setLocalPhasesRef.current(next);
  // Pas de deps : tourne après chaque render, mais ne setState que si DOM a changé.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  /* ── Auto-centre quand les phases sont chargées (avec leurs positions canvas) ── */
  const hasCenteredRef = useRef(false);
  useEffect(() => {
    // Se re-centre à chaque fois que les phases changent depuis l'extérieur
    hasCenteredRef.current = false;
  }, [phases]);

  useEffect(() => {
    if (hasCenteredRef.current) return;
    if (sorted.length === 0) return;
    // Vérifier qu'au moins une phase a une position canvas (pas juste 0,0)
    const hasPositions = sorted.some(p => (p.canvasX ?? 0) > 0 || (p.canvasY ?? 0) > 0);
    if (!hasPositions && sorted.length > 1) return; // Attendre les vraies positions

    const minX = Math.min(...sorted.map(p => p.canvasX ?? 0));
    const minY = Math.min(...sorted.map(p => p.canvasY ?? 0));
    const maxX = Math.max(...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W)));
    const maxY = Math.max(...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120)));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cw = rect.width  || 800;
    const ch = rect.height || 400;
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const scaleX = cw / (contentW + 120);
    const scaleY = ch / (contentH + 120);
    const newZoom = Math.min(1, scaleX, scaleY);
    const px = (cw - contentW * newZoom) / 2 - minX * newZoom;
    const py = (ch - contentH * newZoom) / 2 - minY * newZoom;
    setPan({ x: px, y: py });
    setZoom(newZoom);
    hasCenteredRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPhases]);

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
  const centerView = useCallback(() => {
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
  }, [sorted]);

  /* ── SVG arrows ── */
  const phaseMap = Object.fromEntries(localPhases.map(p => [p.id, p]));
  const canvasW  = Math.max(1600, ...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W) + 200));
  const canvasH  = Math.max(700,  ...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120) + 200));

  const renderArrows = () =>
    arrows.map(arrow => {
      const from = phaseMap[arrow.fromPhaseId] as RichPhase | undefined;
      const to   = phaseMap[arrow.toPhaseId]   as RichPhase | undefined;
      if (!from || !to) return null;

      // Utilise les ancres stockées (side + t) pour un placement fidèle à l'éditeur
      const fromT = (arrow as any).fromT ?? 0.5;
      const toT   = (arrow as any).toT   ?? 0.5;
      const { x: x1, y: y1 } = anchorFromSideT(from, arrow.fromSide, fromT);
      const { x: x2, y: y2 } = anchorFromSideT(to,   arrow.toSide,   toT);
      const col  = from.color ?? DEFAULT_COLOR;
      const path = buildPath(x1, y1, x2, y2, arrow.fromSide, arrow.toSide);
      const mid  = `vm_${arrow.id}`;

      return (
        <g key={arrow.id}>
          <defs>
            <marker id={mid} markerWidth="10" markerHeight="7"
              refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={col} fillOpacity="0.9"/>
            </marker>
          </defs>
          <path
            d={path}
            fill="none"
            stroke={col}
            strokeWidth="1.8"
            strokeOpacity="0.7"
            strokeDasharray="6 4"
            markerEnd={`url(#${mid})`}
          />
          <circle cx={x1} cy={y1} r="4.5" fill={col} fillOpacity="0.9"/>
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
                  left:   rp.canvasX ?? 0,
                  top:    rp.canvasY ?? 0,
                  width:  NODE_W,
                  cursor: 'default',
                  '--nc': col,
                } as React.CSSProperties}
              >
                {/* Barre couleur */}
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