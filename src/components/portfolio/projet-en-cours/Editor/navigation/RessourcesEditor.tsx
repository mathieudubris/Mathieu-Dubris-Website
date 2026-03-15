"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Search, X, Check, Plus, ZoomIn, ZoomOut, Target } from 'lucide-react';
import { ALL_SOFTWARE, WHITE_LOGO_IDS, SOFTWARE_CATEGORIES } from '@/utils/software';
import type { SoftwareItem } from '@/utils/software';
import styles from './RessourcesEditor.module.css';

// Re-export pour les composants qui importaient depuis ici
export type { SoftwareItem };
export { ALL_SOFTWARE };

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface RessourcesEditorProps {
  software: SoftwareItem[];
  onSoftwareChange: (software: SoftwareItem[]) => void;
}

// ─────────────────────────────────────────────
// FALLBACK IMAGE
// ─────────────────────────────────────────────

const SoftwareImage: React.FC<{ src: string; alt: string; className: string; color?: string; itemId?: string }> = ({
  src, alt, className, color, itemId,
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);
  const needsDarkBg = itemId ? WHITE_LOGO_IDS.has(itemId) : false;

  const handleError = () => {
    setFailed(true);
  };

  if (failed) {
    return (
      <div className={className} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.1)', borderRadius: '8px',
        color: color || '#c7ff44', fontSize: '18px', fontWeight: 'bold',
      }}>
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '8px',
      background: needsDarkBg ? 'rgba(0,0,0,0.6)' : 'transparent',
      padding: needsDarkBg ? '12%' : '0',
      boxSizing: 'border-box',
    }}>
      <img src={imgSrc} alt={alt} className={className} onError={handleError} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
};

// ─────────────────────────────────────────────
// CANVAS CONSTANTS
// ─────────────────────────────────────────────
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const CANVAS_W = 2600;
const CANVAS_H = 1800;
const DEFAULT_CHIP_SIZE = 64;
const MIN_CHIP_SIZE = 32;
const MAX_CHIP_SIZE = 120;

function autoLayout(items: SoftwareItem[]): SoftwareItem[] {
  const cols = Math.ceil(Math.sqrt(items.length * 1.7));
  const cellW = (CANVAS_W - 200) / cols;
  const cellH = cellW * 0.95;
  const rows = Math.ceil(items.length / cols);
  const offsetY = Math.max(80, (CANVAS_H - rows * cellH) / 2);
  return items.map((item, i) => {
    if (item.posX !== undefined && item.posY !== undefined) return item;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const seed = item.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
      ...item,
      posX: 100 + col * cellW + cellW / 2 + ((seed * 137) % 60) - 30,
      posY: offsetY + row * cellH + cellH / 2 + ((seed * 73) % 50) - 25,
      size: item.size || DEFAULT_CHIP_SIZE,
    };
  });
}

function calculateFitView(items: SoftwareItem[], w: number, h: number) {
  if (!items.length || !w || !h) return { zoom: 0.68, panX: 0, panY: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  items.forEach(({ posX, posY, size }) => {
    if (posX === undefined || posY === undefined) return;
    const s = (size || DEFAULT_CHIP_SIZE) / 2;
    if (posX - s < minX) minX = posX - s;
    if (posX + s > maxX) maxX = posX + s;
    if (posY - s < minY) minY = posY - s;
    if (posY + s > maxY) maxY = posY + s;
  });
  if (minX === Infinity) return { zoom: 0.68, panX: w / 2 - CANVAS_W * 0.34, panY: h / 2 - CANVAS_H * 0.34 };
  const m = Math.min(60, w * 0.05);
  minX = Math.max(0, minX - m); maxX = Math.min(CANVAS_W, maxX + m);
  minY = Math.max(0, minY - m); maxY = Math.min(CANVAS_H, maxY + m);
  const zoom = Math.max(0.4, Math.min(1.5, (w - 40) / (maxX - minX), (h - 40) / (maxY - minY)));
  return {
    zoom,
    panX: w / 2 - ((minX + maxX) / 2) * zoom,
    panY: h / 2 - ((minY + maxY) / 2) * zoom,
  };
}

// ─────────────────────────────────────────────
// SOFTWARE CANVAS (shared by editor + read-only)
// ─────────────────────────────────────────────
interface SoftwareCanvasProps {
  items: SoftwareItem[];
  editable?: boolean;
  onMove?: (id: string, x: number, y: number) => void;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: number) => void;
  onManage?: () => void;
  height?: string;
}

export const SoftwareCanvas: React.FC<SoftwareCanvasProps> = ({
  items, editable = false, onMove, onRemove, onResize, onManage, height = '520px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.68);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  const isPanningRef = useRef(false);
  const panStartRef  = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const draggingItemRef    = useRef<string | null>(null);
  const itemDragStartRef   = useRef({ mx: 0, my: 0, ix: 0, iy: 0 });
  const resizingItemRef    = useRef<string | null>(null);
  const resizeStartRef     = useRef({ startX: 0, startY: 0, startSize: 0 });

  const [hoveredId,   setHoveredId]   = useState<string | null>(null);
  const [draggingId,  setDraggingId]  = useState<string | null>(null);
  const [resizingId,  setResizingId]  = useState<string | null>(null);

  const touchRef = useRef<{
    mode: 'none' | 'pan' | 'pinch' | 'itemResize';
    lastDist: number; lastZoom: number; lastPan: { x: number; y: number };
    singleStart: { x: number; y: number; px: number; py: number } | null;
    resizeItemId: string | null; resizeStartY: number; resizeStartSize: number;
  }>({ mode: 'none', lastDist: 0, lastZoom: 0.68, lastPan: { x: 0, y: 0 },
       singleStart: null, resizeItemId: null, resizeStartY: 0, resizeStartSize: DEFAULT_CHIP_SIZE });

  const laid = useMemo(() => autoLayout(items), [items]);

  const clampPan = useCallback((p: { x: number; y: number }, z: number) => {
    if (!containerRef.current) return p;
    const { width, height: h } = containerRef.current.getBoundingClientRect();
    const m = 120;
    return {
      x: Math.min(m, Math.max(width  - CANVAS_W * z - m, p.x)),
      y: Math.min(m, Math.max(h      - CANVAS_H * z - m, p.y)),
    };
  }, []);

  const fitView = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height: h } = containerRef.current.getBoundingClientRect();
    const { zoom: z, panX, panY } = calculateFitView(autoLayout(items), width, h);
    setZoom(z); setPan({ x: panX, y: panY });
  }, [items]);

  useEffect(() => {
    const tryInit = () => {
      if (!containerRef.current) return;
      const { width, height: h } = containerRef.current.getBoundingClientRect();
      if (!width || !h) { requestAnimationFrame(tryInit); return; }
      if (items.length > 0) {
        const { zoom: z, panX, panY } = calculateFitView(autoLayout(items), width, h);
        setZoom(z); setPan({ x: panX, y: panY });
      } else {
        const z = 0.68;
        setZoom(z); setPan({ x: (width - CANVAS_W * z) / 2, y: (h - CANVAS_H * z) / 2 });
      }
      setReady(true);
    };
    tryInit();
  }, [items]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.91;
    setZoom(prev => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));
      setPan(p => clampPan({
        x: mx - (mx - p.x) * (next / prev),
        y: my - (my - p.y) * (next / prev),
      }, next));
      return next;
    });
  }, [clampPan]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const tr = touchRef.current;
    if (e.touches.length === 2) {
      tr.mode = 'pinch';
      tr.resizeItemId = null;
      if (resizingId) { setResizingId(null); resizingItemRef.current = null; }
      const t0 = e.touches[0]; const t1 = e.touches[1];
      tr.lastDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      tr.lastZoom = zoom; tr.lastPan = { x: pan.x, y: pan.y };
      tr.singleStart = null;
      return;
    }
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      const handle = target.closest<HTMLElement>('[data-resize]');
      const chipEl = target.closest<HTMLElement>('[data-itemid]');
      if (editable && handle && chipEl && onResize) {
        e.preventDefault();
        tr.mode = 'itemResize';
        tr.resizeItemId = chipEl.dataset.itemid!;
        const item = laid.find(i => i.id === tr.resizeItemId);
        tr.resizeStartY    = e.touches[0].clientY;
        tr.resizeStartSize = item?.size || DEFAULT_CHIP_SIZE;
        setResizingId(tr.resizeItemId);
        resizingItemRef.current = tr.resizeItemId;
        return;
      }
      tr.mode = 'pan';
      tr.singleStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: pan.x, py: pan.y };
    }
  }, [zoom, pan, editable, onResize, laid, resizingId]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const tr = touchRef.current;
    if (tr.mode === 'itemResize' && tr.resizeItemId && onResize) {
      const dy = e.touches[0].clientY - tr.resizeStartY;
      const newSize = Math.round(Math.min(MAX_CHIP_SIZE, Math.max(MIN_CHIP_SIZE, tr.resizeStartSize + dy * 0.8)));
      onResize(tr.resizeItemId, newSize);
      return;
    }
    if (tr.mode === 'pinch' && e.touches.length === 2) {
      if (!containerRef.current) return;
      const t0 = e.touches[0]; const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, tr.lastZoom * (dist / tr.lastDist)));
      const rect = containerRef.current.getBoundingClientRect();
      const midX = (t0.clientX + t1.clientX) / 2 - rect.left;
      const midY = (t0.clientY + t1.clientY) / 2 - rect.top;
      setZoom(newZoom);
      setPan(clampPan({
        x: midX - (midX - tr.lastPan.x) * (newZoom / tr.lastZoom),
        y: midY - (midY - tr.lastPan.y) * (newZoom / tr.lastZoom),
      }, newZoom));
      return;
    }
    if (tr.mode === 'pan' && tr.singleStart && e.touches.length === 1) {
      const { x, y, px, py } = tr.singleStart;
      const dx = e.touches[0].clientX - x;
      const dy = e.touches[0].clientY - y;
      setZoom(z => { setPan(clampPan({ x: px + dx, y: py + dy }, z)); return z; });
    }
  }, [clampPan, onResize]);

  const handleTouchEnd = useCallback(() => {
    const tr = touchRef.current;
    if (tr.mode === 'itemResize') {
      tr.resizeItemId = null;
      setResizingId(null);
      resizingItemRef.current = null;
    }
    tr.mode = 'none'; tr.singleStart = null;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend',  handleTouchEnd,  { passive: true });
    return () => {
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend',  handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  const onMouseDown = (e: React.MouseEvent) => {
    const chipEl      = (e.target as HTMLElement).closest<HTMLElement>('[data-itemid]');
    const resizeHandle = (e.target as HTMLElement).closest('[data-resize]');
    if (chipEl && editable) {
      const id   = chipEl.dataset.itemid!;
      const item = laid.find(i => i.id === id);
      if (!item) return;
      if (resizeHandle && onResize) {
        e.stopPropagation();
        resizingItemRef.current = id;
        resizeStartRef.current  = { startX: e.clientX, startY: e.clientY, startSize: item.size || DEFAULT_CHIP_SIZE };
        setResizingId(id);
        return;
      }
      e.stopPropagation();
      draggingItemRef.current  = id;
      itemDragStartRef.current = { mx: e.clientX, my: e.clientY, ix: item.posX!, iy: item.posY! };
      setDraggingId(id);
      return;
    }
    if ((e.target as HTMLElement).closest('[data-remove]')) return;
    isPanningRef.current = true;
    panStartRef.current  = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (resizingItemRef.current && onResize) {
      const { startX, startY, startSize } = resizeStartRef.current;
      const delta = ((e.clientX - startX) + (e.clientY - startY)) / 2;
      onResize(resizingItemRef.current, Math.round(Math.min(MAX_CHIP_SIZE, Math.max(MIN_CHIP_SIZE, startSize + delta * 0.5))));
      return;
    }
    if (draggingItemRef.current && onMove) {
      const { mx, my, ix, iy } = itemDragStartRef.current;
      const item = laid.find(i => i.id === draggingItemRef.current);
      const s    = (item?.size || DEFAULT_CHIP_SIZE) / 2;
      onMove(draggingItemRef.current,
        Math.max(s, Math.min(CANVAS_W - s, ix + (e.clientX - mx) / zoom)),
        Math.max(s, Math.min(CANVAS_H - s, iy + (e.clientY - my) / zoom)),
      );
      return;
    }
    if (isPanningRef.current) {
      const { mx, my, px, py } = panStartRef.current;
      setPan(clampPan({ x: px + e.clientX - mx, y: py + e.clientY - my }, zoom));
    }
  }, [zoom, clampPan, onMove, onResize, laid]);

  const onMouseUp = useCallback(() => {
    draggingItemRef.current = null;  setDraggingId(null);
    resizingItemRef.current = null;  setResizingId(null);
    isPanningRef.current = false;
  }, []);

  const zoomStep = (dir: 1 | -1) => setZoom(z => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, dir > 0 ? z * 1.2 : z / 1.2));
    setPan(p => clampPan(p, next));
    return next;
  });

  if (items.length === 0) {
    return (
      <div className={styles.canvasEmpty} style={{ height }}>
        <Wrench size={48} />
        <p>Aucune ressource sélectionnée</p>
        {editable && onManage && (
          <button type="button" className={styles.manageBtn} onClick={onManage}>
            <Plus size={13} /> Gérer les logiciels
          </button>
        )}
      </div>
    );
  }

  const canvasCursor = draggingId || resizingId ? 'grabbing'
    : isPanningRef.current ? 'grabbing'
    : editable ? 'default' : 'grab';

  return (
    <div
      ref={containerRef}
      className={styles.canvasWrapper}
      style={{ height, cursor: canvasCursor } as React.CSSProperties}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={handleTouchStart}
    >
      <div className={styles.topLeftControls}>
        <button
          type="button"
          className={`${styles.controlBtn} ${styles.fitViewBtn}`}
          onClick={fitView}
          title="Centrer la vue"
        >
          <Target size={13} />
          <span>Centrer</span>
        </button>
      </div>

      {editable && onManage && (
        <div className={styles.topRightControls}>
          <button
            type="button"
            className={styles.manageBtnCanvas}
            onClick={onManage}
            title="Gérer les logiciels"
          >
            <Plus size={13} /> Gérer les logiciels
          </button>
        </div>
      )}

      <div className={styles.controls}>
        {editable && (
          <>
            <span className={styles.editHint}>✦ Glissez · Poignée pour redimensionner</span>
            <div className={styles.controlDivider} />
          </>
        )}
        <div className={styles.controlGroup}>
          <button type="button" onClick={() => zoomStep(1)}  className={styles.controlBtn} title="Zoom +"><ZoomIn  size={13} /></button>
          <span className={styles.controlValue}>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => zoomStep(-1)} className={styles.controlBtn} title="Zoom −"><ZoomOut size={13} /></button>
        </div>
      </div>

      {ready && (
        <div
          className={styles.canvasWorld}
          style={{
            width: CANVAS_W, height: CANVAS_H,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <svg className={styles.dotGrid} width={CANVAS_W} height={CANVAS_H}>
            <defs>
              <pattern id="reDots" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
                <circle cx="22" cy="22" r="1.2" fill="rgba(255,255,255,0.055)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#reDots)" />
          </svg>

          {laid.map(item => {
            const isHov = hoveredId === item.id;
            const isDrg = draggingId === item.id;
            const isRes = resizingId === item.id;
            const sz    = item.size || DEFAULT_CHIP_SIZE;

            return (
              <div
                key={item.id}
                data-itemid={item.id}
                className={[
                  styles.chip,
                  isHov && !isDrg && !isRes ? styles.chipHov : '',
                  isDrg ? styles.chipDrag : '',
                  isRes ? styles.chipResize : '',
                  editable ? styles.chipEditable : '',
                ].join(' ')}
                style={{
                  left: item.posX, top: item.posY,
                  width: sz, height: sz,
                  transform: 'translate(-50%,-50%)',
                  '--glow': item.color || '#c7ff44',
                } as React.CSSProperties}
                onMouseEnter={() => !draggingId && !resizingId && setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <SoftwareImage src={item.logoUrl} alt={item.name} className={styles.chipImg} color={item.color} itemId={item.id} />

                {editable && (
                  <div
                    className={`${styles.resizeHandle} ${isHov || isRes ? styles.resizeHandleVisible : ''}`}
                    data-resize="true"
                    title="Glisser pour redimensionner"
                  >
                    <div className={styles.resizeHandleInner} />
                  </div>
                )}

                {isRes && <div className={styles.sizeIndicator}>{sz}px</div>}
                {isHov && !isDrg && !isRes && <span className={styles.chipLabel}>{item.name}</span>}

                {editable && isHov && !isDrg && !isRes && onRemove && (
                  <button
                    type="button"
                    data-remove="true"
                    className={styles.chipRemove}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                    title="Retirer"
                  >
                    <X size={9} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MODAL SÉLECTEUR
// ─────────────────────────────────────────────
interface SelectorModalProps {
  current: SoftwareItem[];
  onSave: (items: SoftwareItem[]) => void;
  onClose: () => void;
}

const SelectorModal: React.FC<SelectorModalProps> = ({ current, onSave, onClose }) => {
  const [selected, setSelected] = useState<SoftwareItem[]>(current);
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = ALL_SOFTWARE;
    if (activeCategory !== 'all') list = list.filter(s => s.category === activeCategory);
    if (query.trim()) list = list.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [activeCategory, query]);

  const isSelected = (id: string) => selected.some(s => s.id === id);
  const toggle = (item: SoftwareItem) =>
    setSelected(prev => prev.find(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item]);

  const handleSave = () => {
    const withPos = autoLayout(selected.map(item => {
      const ex = current.find(c => c.id === item.id);
      return { ...item, posX: ex?.posX, posY: ex?.posY, size: ex?.size || DEFAULT_CHIP_SIZE };
    }));
    onSave(withPos); onClose();
  };

  return (
    <motion.div className={styles.modalOverlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className={styles.modalPanel}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}>

        <div className={styles.mHeader}>
          <div className={styles.mHeaderLeft}>
            <h2 className={styles.mTitle}><Wrench size={18} /> Logiciels &amp; technologies</h2>
            <p className={styles.mSub}>{selected.length} sélectionné{selected.length !== 1 ? 's' : ''}</p>
          </div>
          <div className={styles.mSearch}>
            <Search size={14} className={styles.mSearchIco} />
            <input type="text" placeholder="Rechercher un logiciel..." value={query}
              onChange={e => setQuery(e.target.value)} className={styles.mSearchInput} autoFocus />
            {query && <button type="button" className={styles.mSearchClear} onClick={() => setQuery('')}><X size={12} /></button>}
          </div>
          <button type="button" className={styles.mCloseBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.mCats}>
          {SOFTWARE_CATEGORIES.map(({ key, label }) => {
            const count = key === 'all' ? ALL_SOFTWARE.length : ALL_SOFTWARE.filter(s => s.category === key).length;
            return (
              <button key={key} type="button"
                className={`${styles.mCatBtn} ${activeCategory === key ? styles.mCatActive : ''}`}
                onClick={() => setActiveCategory(key)}>
                {label} <span className={styles.mCatN}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.mBody}>
          {filtered.length === 0
            ? <div className={styles.mEmpty}><Wrench size={40} /><p>Aucun résultat pour « {query} »</p></div>
            : (
              <div className={styles.mGrid}>
                {filtered.map(item => {
                  const sel = isSelected(item.id);
                  return (
                    <button key={item.id} type="button"
                      className={`${styles.mCard} ${sel ? styles.mCardSel : ''}`}
                      onClick={() => toggle(item)}
                      style={{ '--glow': item.color || '#c7ff44' } as React.CSSProperties}>
                      {sel && <span className={styles.mCheck}><Check size={10} /></span>}
                      <SoftwareImage src={item.logoUrl} alt={item.name} className={styles.mCardImg} color={item.color} itemId={item.id} />
                      <span className={styles.mCardName}>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
        </div>

        <div className={styles.mFooter}>
          <span className={styles.mFooterTxt}>{selected.length} logiciel{selected.length !== 1 ? 's' : ''} sélectionné{selected.length !== 1 ? 's' : ''}</span>
          <div className={styles.mFooterBtns}>
            <button type="button" className={styles.mCancelBtn} onClick={onClose}>Annuler</button>
            <button type="button" className={styles.mSaveBtn} onClick={handleSave}><Check size={14} />Enregistrer ({selected.length})</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// ÉDITEUR PRINCIPAL
// ─────────────────────────────────────────────
const RessourcesEditor: React.FC<RessourcesEditorProps> = ({ software, onSoftwareChange }) => {
  const [showModal, setShowModal] = useState(false);

  const handleMove   = useCallback((id: string, x: number, y: number) =>
    onSoftwareChange(software.map(s => s.id === id ? { ...s, posX: x, posY: y } : s)),
    [software, onSoftwareChange]);

  const handleRemove = useCallback((id: string) =>
    onSoftwareChange(software.filter(s => s.id !== id)),
    [software, onSoftwareChange]);

  const handleResize = useCallback((id: string, size: number) =>
    onSoftwareChange(software.map(s => s.id === id ? { ...s, size } : s)),
    [software, onSoftwareChange]);

  return (
    <div className={styles.editor}>
      <SoftwareCanvas
        items={software}
        editable
        onMove={handleMove}
        onRemove={handleRemove}
        onResize={handleResize}
        onManage={() => setShowModal(true)}
        height="520px"
      />
      <AnimatePresence>
        {showModal && (
          <SelectorModal current={software} onSave={onSoftwareChange} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RessourcesEditor;