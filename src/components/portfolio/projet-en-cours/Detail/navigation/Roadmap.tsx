"use client";

/**
 * Roadmap v5 — affichage fidèle à RoadmapEditor
 * - Utilise nodeW / nodeH sauvegardés pour positionner les flèches exactement comme dans l'éditeur
 * - Point de départ + tête de flèche directionnelle
 * - Navigation touch
 * - Pas de sous-étapes
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Circle, Clock, CheckCircle2, ZapIcon, AlertCircle, Loader2, Target } from 'lucide-react';
import type { RoadmapPhase } from '@/utils/projet-api';
import type { RoadmapArrow, RichPhase, ArrowSide } from '@/components/portfolio/projet-en-cours/Editor/navigation/RoadmapEditor';
import { getRoadmapCanvas } from '@/utils/roadmap-api';
import { useUsers } from '@/utils/UserContext';
import styles from './Roadmap.module.css';

interface RoadmapProps {
  phases: RoadmapPhase[];
  arrows?: RoadmapArrow[];
  projectId?: string;
  readOnly?: boolean;
}

const STATUS_META = {
  planned:       { label: 'À venir',  Icon: Circle,       col: '#6B7280' },
  'in-progress': { label: 'En cours', Icon: Clock,        col: '#0EA5E9' },
  completed:     { label: 'Terminé',  Icon: CheckCircle2, col: '#10B981' },
};

const DEFAULT_COLOR = '#7C3AED';
const NODE_W        = 220;   // Identique RoadmapEditor

/* ─────────────────────────────────────────────
   Helpers — identiques à RoadmapEditor
───────────────────────────────────────────── */
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
const Roadmap: React.FC<RoadmapProps> = ({
  phases,
  arrows = [],
  projectId,
  readOnly = true,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { users } = useUsers();

  const [richPhases,    setRichPhases]    = useState<RichPhase[]>([]);
  const [canvasArrows,  setCanvasArrows]  = useState<RoadmapArrow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [hasCanvasData, setHasCanvasData] = useState(false);
  const [initialDone,   setInitialDone]   = useState(false);

  /* ── Chargement des données canvas ── */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      if (!projectId) {
        if (mounted) {
          setRichPhases(phases as RichPhase[]);
          setCanvasArrows(arrows);
          setHasCanvasData(false);
          setLoading(false);
          setInitialDone(true);
        }
        return;
      }

      try {
        const data = await getRoadmapCanvas(projectId);
        if (!mounted) return;

        if (data?.phases?.length) {
          const merged = (phases as RichPhase[]).map(base => {
            const cp = data.phases.find((p: RichPhase) => p.id === base.id);
            return cp ? { ...base, ...cp, tasks: base.tasks } : base;
          });
          setRichPhases(merged);
          setCanvasArrows(data.arrows ?? []);
          setHasCanvasData(true);
        } else {
          setRichPhases(phases as RichPhase[]);
          setCanvasArrows(arrows);
          setHasCanvasData(false);
        }
      } catch {
        if (!mounted) return;
        setRichPhases(phases as RichPhase[]);
        setCanvasArrows(arrows);
        setHasCanvasData(false);
      } finally {
        if (mounted) { setLoading(false); setInitialDone(true); }
      }
    };

    load();
    return () => { mounted = false; };
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Pan / zoom ── */
  const ref      = useRef<HTMLDivElement>(null);
  const [pan,  setPan]  = useState({ x: 40, y: 20 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const start    = useRef({ x: 0, y: 0 });

  /* ── Mouse drag (pan) ── */
  const onMouseDown = (e: React.MouseEvent) => {
    if (!readOnly) return;
    const el = e.target as HTMLElement;
    if (!el.classList.contains(styles.world) && el !== ref.current
        && !el.classList.contains(styles.dotGrid)) return;
    dragging.current = true;
    start.current    = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !readOnly) return;
    setPan({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  };
  const onMouseUp = () => { dragging.current = false; };

  const onWheel = (e: React.WheelEvent) => {
    if (!readOnly) return;
    e.preventDefault();
    setZoom(z => Math.min(2.5, Math.max(0.15, z - e.deltaY * 0.001)));
  };

  /* ── Touch pan ── */
  const touchPanRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!readOnly || e.touches.length !== 1) return;
    const t = e.touches[0];
    touchPanRef.current = { x: t.clientX - pan.x, y: t.clientY - pan.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!readOnly || !touchPanRef.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    setPan({ x: t.clientX - touchPanRef.current.x, y: t.clientY - touchPanRef.current.y });
  };
  const onTouchEnd = () => { touchPanRef.current = null; };

  /* ── Recentrer ── */
  const centerView = useCallback(() => {
    if (!richPhases.length) return;
    const allX = richPhases.map(p => (p.canvasX ?? 60) + (p.nodeW ?? NODE_W));
    const allY = richPhases.map(p => (p.canvasY ?? 60) + (p.nodeH ?? 120));
    const minX = Math.min(...richPhases.map(p => p.canvasX ?? 60));
    const minY = Math.min(...richPhases.map(p => p.canvasY ?? 60));
    const maxX = Math.max(...allX);
    const maxY = Math.max(...allY);
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPan({
      x: rect.width  / 2 - ((minX + maxX) / 2) * zoom,
      y: rect.height / 2 - ((minY + maxY) / 2) * zoom,
    });
  }, [richPhases, zoom]);

  useEffect(() => {
    if (initialDone && richPhases.length > 0) setTimeout(centerView, 100);
  }, [initialDone, richPhases.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── États de chargement ── */
  if (loading) {
    return (
      <div className={styles.empty}>
        <Loader2 size={28} className={styles.spinner}/>
        <p>Chargement de la roadmap…</p>
      </div>
    );
  }
  if (!richPhases.length) {
    return (
      <div className={styles.empty}>
        <ZapIcon size={28} className={styles.emptyIcon}/>
        <p>Aucune phase de roadmap définie</p>
      </div>
    );
  }

  /* ── Canvas bounds ── */
  const canvasW = Math.max(1400, ...richPhases.map(p => (p.canvasX ?? 60) + (p.nodeW ?? NODE_W) + 200));
  const canvasH = Math.max(600,  ...richPhases.map(p => (p.canvasY ?? 60) + (p.nodeH ?? 120) + 200));

  const phaseMap = Object.fromEntries(richPhases.map(p => [p.id, p]));

  /* ── Flèches ── */
  const arrowEls = canvasArrows.map(arrow => {
    const from = phaseMap[arrow.fromPhaseId] as RichPhase | undefined;
    const to   = phaseMap[arrow.toPhaseId]   as RichPhase | undefined;
    if (!from || !to) return null;

    const { x: x1, y: y1 } = anchorOf(from, arrow.fromSide as ArrowSide);
    const { x: x2, y: y2 } = anchorOf(to,   arrow.toSide   as ArrowSide);
    const col  = from.color ?? DEFAULT_COLOR;
    const path = buildPath(x1, y1, x2, y2, arrow.fromSide as ArrowSide);
    const head = arrowHeadPoints(x2, y2, arrow.toSide as ArrowSide);

    return (
      <g key={arrow.id}>
        <path d={path} fill="none" stroke={col} strokeWidth="1.8" strokeOpacity="0.65" strokeDasharray="6 4"/>
        <circle cx={x1} cy={y1} r="4" fill={col} fillOpacity="0.85"/>
        <polygon points={head} fill={col} fillOpacity="0.9"/>
      </g>
    );
  });

  /* ─── Render ─── */
  return (
    <div
      className={styles.canvas}
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: dragging.current ? 'grabbing' : readOnly ? 'grab' : 'default' }}
    >
      <div className={styles.dotGrid}
        style={{ backgroundPosition: `${pan.x % 28}px ${pan.y % 28}px` }}/>

      {/* Contrôles */}
      <div className={styles.controls}>
        <button className={styles.centerBtn} onClick={centerView} title="Recentrer" aria-label="Recentrer">
          <Target size={14}/>
        </button>
        <div className={styles.nowPill}>
          <span className={styles.nowDot}/> Maintenant
        </div>
        <div className={styles.zoomHint}>{Math.round(zoom * 100)}%</div>
      </div>

      {/* Fallback */}
      {!hasCanvasData && projectId && (
        <div className={styles.fallbackHint}>
          <AlertCircle size={12}/>
          <span>Affichage standard (données visuelles non sauvegardées)</span>
        </div>
      )}

      <div
        className={styles.world}
        style={{
          transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: canvasW,
          height: canvasH,
        }}
      >
        {/* SVG arrows */}
        <svg width={canvasW} height={canvasH}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
          {arrowEls}
        </svg>

        {/* Phases */}
        {richPhases.map(phase => {
          const col    = phase.color ?? DEFAULT_COLOR;
          const meta   = STATUS_META[phase.status as keyof typeof STATUS_META] ?? STATUS_META.planned;
          const StIcon = meta.Icon;
          const done   = phase.tasks.filter(t => t.done).length;
          const total  = phase.tasks.length;

          return (
            <div
              key={phase.id}
              className={`${styles.node} ${phase.status === 'in-progress' ? styles.nodeActive : ''}`}
              style={{
                position: 'absolute',
                left:  phase.canvasX ?? 60,
                top:   phase.canvasY ?? 60,
                width: phase.nodeW ?? NODE_W,
                '--nc': col,
              } as React.CSSProperties}
            >
              <div className={styles.nodeBar} style={{ background: col }}/>
              <div className={styles.nodeInner}>
                <div className={styles.nodeTitleRow}>
                  <h3 className={styles.nodeTitle}>{phase.title}</h3>
                  <span
                    className={styles.nodeBadge}
                    style={{
                      color: meta.col,
                      background: `${meta.col}18`,
                      border: `1px solid ${meta.col}44`,
                    }}>
                    <StIcon size={9}/>{meta.label}
                  </span>
                </div>

                {phase.description && (
                  <p className={styles.nodeDesc}>{phase.description}</p>
                )}

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

                {total > 0 && (
                  <ul className={styles.taskList}>
                    {phase.tasks.slice(0, 3).map(t => (
                      <li key={t.id} className={`${styles.taskItem} ${t.done ? styles.taskDone : ''}`}>
                        <span className={styles.taskBullet}
                          style={{ background: t.done ? col : 'transparent', borderColor: t.done ? col : '#252840' }}/>
                        {t.title}
                      </li>
                    ))}
                    {phase.tasks.length > 3 && (
                      <li className={styles.taskMore}>+{phase.tasks.length - 3} autres</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {readOnly && (
        <div className={styles.dragHint}>⟵ Glisser pour naviguer · Scroll pour zoomer ⟶</div>
      )}
    </div>
  );
};

export default Roadmap;