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
const MARKER_LEN    = 10;

const STATUS_LIST = [
  { value: 'planned'     as const, label: 'À venir',  Icon: Circle,       col: '#6b7280' },
  { value: 'in-progress' as const, label: 'En cours', Icon: Clock,        col: '#3b82f6' },
  { value: 'completed'   as const, label: 'Terminé',  Icon: CheckCircle2, col: '#10ce55' },
];

/**
 * Calcule le point exact sur la bordure du node (identique à RoadmapEditor).
 */
function anchorOnBorder(phase: RichPhase, side: ArrowSide, t: number): { x: number; y: number } {
  const x = phase.canvasX ?? 0;
  const y = phase.canvasY ?? 0;
  const w = phase.nodeW ?? NODE_W;
  const h = phase.nodeH ?? 120;
  const tc = Math.max(0, Math.min(1, t ?? 0.5));
  
  switch (side) {
    case 'top':    return { x: x + tc * w, y: y };
    case 'bottom': return { x: x + tc * w, y: y + h };
    case 'left':   return { x: x,          y: y + tc * h };
    case 'right':  return { x: x + w,      y: y + tc * h };
  }
}

function buildPath(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

const Roadmap: React.FC<RoadmapProps> = ({ phases, arrows = [] }) => {
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const nodeRefs    = useRef<Record<string, HTMLDivElement | null>>({});
  const measuredRef = useRef<Record<string, { w: number; h: number }>>({});
  const [isMobile, setIsMobile] = useState(false);

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
  const zoomRef = useRef(1); // toujours à jour, safe dans les event listeners natifs
  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });

  const setLocalPhasesRef = useRef(setLocalPhases);
  useEffect(() => { setLocalPhasesRef.current = setLocalPhases; });

  // Garder zoomRef synchronisé
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  });

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
    
    // Sur mobile, on utilise un zoom légèrement différent pour mieux voir
    const padding = isMobile ? 40 : 80;
    const newZoom = Math.min(1, (cw - padding) / contentW, (ch - padding) / contentH);
    
    setPan({
      x: (cw - contentW * newZoom) / 2 - minX * newZoom,
      y: (ch - contentH * newZoom) / 2 - minY * newZoom,
    });
    setZoom(newZoom);
  }, [sorted, isMobile]);

  const hasCenteredRef = useRef(false);
  
  // Réinitialiser le flag quand les phases changent
  useEffect(() => { 
    hasCenteredRef.current = false; 
  }, [phases]);

  // Centrage automatique amélioré pour mobile
  useEffect(() => {
    // Ne centrer qu'une fois
    if (hasCenteredRef.current || sorted.length === 0) return;
    
    // Vérifier que les positions sont définies
    const hasPositions = sorted.some(p => (p.canvasX ?? 0) > 0 || (p.canvasY ?? 0) > 0);
    if (!hasPositions && sorted.length > 1) return;
    
    // Petit délai pour s'assurer que le DOM est prêt et que les dimensions sont calculées
    const timer = setTimeout(() => {
      // Vérifier que le wrapper a des dimensions valides
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          centerView();
          hasCenteredRef.current = true;
        } else {
          // Si les dimensions ne sont pas encore disponibles, réessayer
          setTimeout(() => {
            centerView();
            hasCenteredRef.current = true;
          }, 200);
        }
      }
    }, 300); // Délai plus long pour mobile
    
    return () => clearTimeout(timer);
  }, [sorted, centerView]);

  // Re-centrer lors du redimensionnement (surtout utile pour mobile/orientation)
  useEffect(() => {
    const handleResize = () => {
      if (sorted.length > 0) {
        // Petit délai pour laisser le temps au DOM de se mettre à jour
        setTimeout(() => {
          centerView();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sorted, centerView]);

  // Gestion du zoom avec la molette (desktop)
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

  // Gestion du zoom tactile (pinch) sur mobile
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let initialDistance = 0;
    let initialZoom = 1;
    let lastZoom = 1; // zoom de la frame précédente, local à ce gesture

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
        initialZoom = zoomRef.current;
        lastZoom = zoomRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (initialDistance > 0) {
          const rect = el.getBoundingClientRect();
          const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          
          const factor = currentDistance / initialDistance;
          const newZoom = Math.min(2.5, Math.max(0.15, initialZoom * factor));
          const prevZoom = lastZoom; // valeur de la frame précédente, toujours fraîche
          lastZoom = newZoom;

          setPan(p => ({
            x: mx - (mx - p.x) * (newZoom / prevZoom),
            y: my - (my - p.y) * (newZoom / prevZoom),
          }));
          setZoom(newZoom);
          zoomRef.current = newZoom;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialDistance = 0;
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []); // plus de dépendance sur zoom → pas de re-enregistrement pendant le pinch

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

  // Gestion du pan tactile améliorée
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-phaseid]')) return;
    e.preventDefault();
    const touch = e.touches[0];
    isPanning.current = true;
    panStart.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !isPanning.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    setPan({ x: touch.clientX - panStart.current.x, y: touch.clientY - panStart.current.y });
  };

  const onTouchEnd = () => {
    isPanning.current = false;
  };

  const phaseMap = Object.fromEntries(localPhases.map(p => [p.id, p]));
  const canvasW  = Math.max(1600, ...sorted.map(p => (p.canvasX ?? 0) + (p.nodeW ?? NODE_W) + 200));
  const canvasH  = Math.max(700,  ...sorted.map(p => (p.canvasY ?? 0) + (p.nodeH ?? 120) + 200));

  const renderArrows = () =>
    arrows.map(arrow => {
      const from = phaseMap[arrow.fromPhaseId] as RichPhase | undefined;
      const to   = phaseMap[arrow.toPhaseId]   as RichPhase | undefined;
      if (!from || !to) return null;
      
      const fromT = arrow.fromT ?? 0.5;
      const toT   = arrow.toT   ?? 0.5;
      
      const { x: x1, y: y1 } = anchorOnBorder(from, arrow.fromSide, fromT);
      const { x: x2, y: y2 } = anchorOnBorder(to, arrow.toSide, toT);
      
      const col  = from.color ?? DEFAULT_COLOR;
      const path = buildPath(x1, y1, x2, y2);
      const mid  = `vm_${arrow.id}`;
      
      return (
        <g key={arrow.id}>
          <defs>
            <marker 
              id={mid} 
              markerWidth="10" 
              markerHeight="8" 
              refX="10"
              refY="4" 
              orient="auto" 
              markerUnits="userSpaceOnUse"
            >
              <polygon points="0 0, 10 4, 0 8" fill={col} fillOpacity="0.95" />
            </marker>
          </defs>
          <path 
            d={path} 
            fill="none" 
            stroke={col} 
            strokeWidth="2" 
            strokeOpacity="0.7" 
            strokeDasharray="6 4" 
            markerEnd={`url(#${mid})`} 
          />
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
      onTouchCancel={onTouchEnd}
    >
      <div className={styles.dotGrid} style={{ backgroundPosition: `${pan.x % 28}px ${pan.y % 28}px` }} />
      <div className={styles.topLeftControls}>
        <button type="button" className={`${styles.controlBtn} ${styles.fitViewBtn}`} onClick={centerView} title="Centrer la vue">
          <Target size={13} /><span className={styles.fitViewText}>Centrer</span>
        </button>
      </div>
      <div className={styles.zoomControls}>
        <div className={styles.controlGroup}>
          <button type="button" className={styles.controlBtn} onClick={() => setZoom(z => Math.min(2.5, z * 1.2))} title="Zoom +"><ZoomIn size={13} /></button>
          <span className={styles.controlValue}>{Math.round(zoom * 100)}%</span>
          <button type="button" className={styles.controlBtn} onClick={() => setZoom(z => Math.max(0.15, z / 1.2))} title="Zoom −"><ZoomOut size={13} /></button>
        </div>
      </div>
      <div className={styles.world} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: canvasW, height: canvasH }}>
        {sorted.map(phase => {
          const rp = phase as RichPhase;
          const col = rp.color ?? DEFAULT_COLOR;
          const st = STATUS_LIST.find(s => s.value === phase.status) ?? STATUS_LIST[0];
          const StIcon = st.Icon;
          const done = phase.tasks.filter(t => t.done).length;
          const total = phase.tasks.length;
          return (
            <div key={phase.id} data-phaseid={phase.id} ref={el => { nodeRefs.current[phase.id] = el; }} className={styles.node} style={{ position: 'absolute', left: rp.canvasX ?? 0, top: rp.canvasY ?? 0, width: NODE_W, '--nc': col, backgroundColor: `${col}33` } as React.CSSProperties}>
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
            </div>
          );
        })}
        <svg width={canvasW} height={canvasH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
          {renderArrows()}
        </svg>
      </div>
    </div>
  );
};

export default Roadmap;