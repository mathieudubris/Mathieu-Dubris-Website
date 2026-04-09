"use client";

import React, {
  useState, useMemo, useRef, useEffect, useCallback,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, BookOpen, X, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { isAdmin } from '@/utils/firebase-api';
import {
  FullAccompagnement,
  deleteAccompagnement,
  isUserInAccompagnement,
  getFullAccompagnement,
  getUserFavorites,
  toggleFavorite,
} from '@/utils/accompagnement-api';
import AccompagnementCard from './AccompagnementCard';
import AccompagnementEditor from './AccompagnementEditor';
import AccompagnementDetail from './AccompagnementDetail';
import styles from './Accompagnement.module.css';

const CATEGORIES = ['Toutes', 'Coaching', 'Mentorat', 'Conseil', 'Formation', 'Suivi', 'Autre'];
const GAP = 16;
// How many full copies of the list we render — 3 gives us one buffer on each side
const COPIES = 3;

type SidebarView = 'toutes' | 'mes-accompagnements' | 'favoris';

interface AccompagnementProps {
  accompagnements: FullAccompagnement[];
  currentUser: any;
  allUsers: any[];
  fullAccompagnementCacheRef: React.MutableRefObject<Record<string, any>>;
  onReload: () => Promise<void>;
}

/* ── easing & RAF animation ── */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function rafAnimate(
  from: number,
  to: number,
  duration: number,
  onTick: (v: number) => void,
  onDone?: () => void,
): () => void {
  const start = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    onTick(from + (to - from) * easeOutCubic(t));
    if (t < 1) raf = requestAnimationFrame(tick);
    else onDone?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

const Accompagnement: React.FC<AccompagnementProps> = ({
  accompagnements,
  currentUser,
  allUsers,
  fullAccompagnementCacheRef,
  onReload,
}) => {
  const [activeCategory, setActiveCategory] = useState('Toutes');
  const [sidebarView, setSidebarView] = useState<SidebarView>('toutes');
  const [showEditor, setShowEditor] = useState(false);
  const [editingAccompagnement, setEditingAccompagnement] = useState<FullAccompagnement | null>(null);
  const [selectedAccompagnement, setSelectedAccompagnement] = useState<FullAccompagnement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dotIndex, setDotIndex] = useState(0);
  const [activeRealIndex, setActiveRealIndex] = useState(0);

  const filterRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cancelAnim = useRef<() => void>(() => {});

  // Current translate X — mutated directly, never stored in state
  const xRef = useRef(0);
  const adminStatus = currentUser && isAdmin(currentUser.email);

  /* ── Apply translate ── */
  const applyX = useCallback((x: number) => {
    xRef.current = x;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${-x}px)`;
  }, []);

  /* ── Load data ── */
  useEffect(() => {
    if (currentUser?.uid) getUserFavorites(currentUser.uid).then(setFavorites).catch(() => {});
  }, [currentUser?.uid]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    if (filterOpen) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [filterOpen]);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    let list = [...accompagnements];
    if (sidebarView === 'mes-accompagnements')
      list = list.filter((a) => currentUser && isUserInAccompagnement(a, currentUser.uid));
    else if (sidebarView === 'favoris')
      list = list.filter((a) => a.id && favorites.includes(a.id));
    if (activeCategory !== 'Toutes')
      list = list.filter((a) => a.category === activeCategory);
    return list;
  }, [accompagnements, activeCategory, sidebarView, favorites, currentUser]);

  /* ── Triple the list for infinite loop ── */
  // displayItems = [copy0, copy1(real), copy2]
  // We start positioned in copy1 (middle) so both directions have a full buffer.
  const displayItems = useMemo(() => {
    if (filtered.length === 0) return [];
    return [...filtered, ...filtered, ...filtered]; // 3 copies
  }, [filtered]);

  // Index where the "middle" (real) copy starts
  const middleStart = filtered.length; // copy index 1 starts here

  /* ── Get pixel X of a display-item so it is centered in the stage ── */
  const getXCentered = useCallback((displayIdx: number): number => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return 0;
    const children = Array.from(track.children) as HTMLElement[];
    let left = 0;
    for (let i = 0; i < displayIdx; i++) left += (children[i]?.offsetWidth ?? 0) + GAP;
    const cardW = children[displayIdx]?.offsetWidth ?? 0;
    const stageW = stage.offsetWidth;
    // Center the card: scrollLeft = cardLeft - (stageW - cardW) / 2
    return left - (stageW - cardW) / 2;
  }, []);

  /* ── Width of one full copy of the list ── */
  const getOneCopyWidth = useCallback((): number => {
    const track = trackRef.current;
    if (!track || filtered.length === 0) return 0;
    const children = Array.from(track.children) as HTMLElement[];
    let w = 0;
    for (let i = 0; i < filtered.length; i++) w += (children[i]?.offsetWidth ?? 0) + GAP;
    return w;
  }, [filtered.length]);

  /* ── Teleport: if we've drifted into copy0 or copy2, jump to copy1 equivalent ── */
  const teleportIfNeeded = useCallback(() => {
    const copyW = getOneCopyWidth();
    if (copyW === 0) return;
    const x = xRef.current;

    // Boundaries of the middle copy
    const middleLeft  = getXCentered(middleStart) - /* first card offset */ 0;
    // Just use raw pixel offset comparison:
    // copy0: x range roughly [0 .. copyW)
    // copy1: x range roughly [copyW .. 2*copyW)
    // copy2: x range roughly [2*copyW .. 3*copyW)

    if (x < copyW * 0.5) {
      // We're too far left — jump right by one copy width
      applyX(x + copyW);
    } else if (x > copyW * 2.5) {
      // We're too far right — jump left by one copy width
      applyX(x - copyW);
    }
  }, [getOneCopyWidth, applyX, middleStart]);

  /* ── Navigate to a real index (centered, animated) ── */
  const goTo = useCallback((realIndex: number, animate = true) => {
    if (filtered.length === 0) return;
    const copyW = getOneCopyWidth();

    // Find the display index in the middle copy that is closest to current x
    // to avoid jumping across a big distance
    const middleDisplayIdx = middleStart + realIndex;
    // Also consider copy0 and copy2 equivalents
    const candidates = [
      filtered.length * 0 + realIndex, // copy0
      middleDisplayIdx,                  // copy1 (middle)
      filtered.length * 2 + realIndex,  // copy2
    ];

    // Pick the one whose centered X is closest to current xRef
    let best = middleDisplayIdx;
    let bestDist = Infinity;
    candidates.forEach((di) => {
      const tx = getXCentered(di);
      const dist = Math.abs(tx - xRef.current);
      if (dist < bestDist) { bestDist = dist; best = di; }
    });

    const targetX = getXCentered(best);

    setActiveRealIndex(realIndex);
    setDotIndex(realIndex);
    cancelAnim.current();

    if (animate) {
      cancelAnim.current = rafAnimate(xRef.current, targetX, 420, applyX, teleportIfNeeded);
    } else {
      applyX(targetX);
      teleportIfNeeded();
    }
  }, [filtered.length, middleStart, getOneCopyWidth, getXCentered, applyX, teleportIfNeeded]);

  /* ── Reset when list changes ── */
  useEffect(() => {
    cancelAnim.current();
    if (filtered.length === 0) { applyX(0); setActiveRealIndex(0); setDotIndex(0); return; }
    // Wait one frame for the DOM to render the new track children
    const raf = requestAnimationFrame(() => goTo(0, false));
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, sidebarView, activeCategory]);

  /* ── Drag / pointer logic ── */
  const drag = useRef({
    active: false,
    startX: 0,
    startTrackX: 0,
    startY: 0,
    moved: false,
    horizontal: null as boolean | null,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 2) return;
    cancelAnim.current();
    drag.current = {
      active: true,
      startX: e.clientX,
      startTrackX: xRef.current,
      startY: e.clientY,
      moved: false,
      horizontal: null,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    // Lock axis on first move > 4px
    if (d.horizontal === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      d.horizontal = Math.abs(dx) >= Math.abs(dy);
    }
    if (!d.horizontal) return; // vertical — let browser scroll

    if (Math.abs(dx) > 5) d.moved = true;

    const now = performance.now();
    const dt = now - d.lastTime;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastTime = now;

    const newX = d.startTrackX - dx;
    applyX(newX);
    teleportIfNeeded();
    e.preventDefault();
  }, [applyX, teleportIfNeeded]);

  const onPointerUp = useCallback(() => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (!d.moved) return; // tap — let click handler fire

    // Momentum
    const momentum = d.velocity * -200;
    const rawTarget = xRef.current + momentum;

    // Find nearest card center across all display items
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    const children = Array.from(track.children) as HTMLElement[];
    const stageCenterOffset = stage.offsetWidth / 2;

    let best = 0;
    let bestDist = Infinity;
    let accum = 0;
    children.forEach((el, i) => {
      const cardCenter = accum + el.offsetWidth / 2;
      const dist = Math.abs(cardCenter - (rawTarget + stageCenterOffset));
      if (dist < bestDist) { bestDist = dist; best = i; }
      accum += el.offsetWidth + GAP;
    });

    // Map display index → real index
    const realIdx = best % filtered.length;
    const targetX = getXCentered(best);

    setActiveRealIndex(realIdx);
    setDotIndex(realIdx);
    cancelAnim.current = rafAnimate(xRef.current, targetX, 420, applyX, teleportIfNeeded);
  }, [filtered.length, getXCentered, applyX, teleportIfNeeded]);

  const onPointerCancel = useCallback(() => { drag.current.active = false; }, []);

  /* ── Card click ── */
  const handleActivate = useCallback((realIdx: number) => {
    if (drag.current.moved) return;
    goTo(realIdx);
  }, [goTo]);

  /* ── Dot click ── */
  const handleDotClick = useCallback((realIdx: number) => {
    goTo(realIdx);
  }, [goTo]);

  /* ── Favorites / detail / delete ── */
  const handleToggleFavorite = async (id: string) => {
    if (!currentUser?.uid) return;
    try {
      const isNow = await toggleFavorite(currentUser.uid, id);
      setFavorites((p) => isNow ? [...p, id] : p.filter((x) => x !== id));
    } catch {}
  };

  const handleAccompagnementClick = async (a: FullAccompagnement) => {
    if (!currentUser) { window.location.href = '/security/access'; return; }
    const key = a.slug || a.id!;
    setSelectedAccompagnement(fullAccompagnementCacheRef.current[key] || a);
    if (!fullAccompagnementCacheRef.current[key]?.modules && a.id) {
      try {
        const full = await getFullAccompagnement(a.id);
        if (full) {
          fullAccompagnementCacheRef.current[key] = full;
          setSelectedAccompagnement((cur: any) => cur?.id === full.id ? full : cur);
        }
      } catch {}
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAccompagnement(id); await onReload(); setDeleteConfirmId(null); } catch {}
  };

  const getSectionTitle = () => {
    if (sidebarView === 'mes-accompagnements') return 'Mes accompagnements';
    if (sidebarView === 'favoris') return 'Mes favoris';
    return 'Tous les accompagnements';
  };

  const hasActiveFilters = sidebarView !== 'toutes' || activeCategory !== 'Toutes';

  const VIEW_OPTIONS: { id: SidebarView; label: string }[] = [
    { id: 'toutes', label: 'Toutes' },
    { id: 'mes-accompagnements', label: 'Mes accompagnements' },
    { id: 'favoris', label: 'Mes favoris' },
  ];

  return (
    <div className={styles.container}>
      {adminStatus && (
        <button className={styles.createBtn} onClick={() => { setEditingAccompagnement(null); setShowEditor(true); }}>
          <Plus size={15} />Nouveau
        </button>
      )}

      <main className={styles.main}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <span className={styles.sectionTitle}>{getSectionTitle()}</span>
            <span className={styles.sectionCount}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className={styles.filterWrap} ref={filterRef}>
            <button
              className={`${styles.filterBtn} ${hasActiveFilters ? styles.filterBtnActive : ''}`}
              onClick={() => setFilterOpen((v) => !v)}
            >
              <SlidersHorizontal size={13} />Filtres
              {hasActiveFilters && <span className={styles.filterDot} />}
              <ChevronDown size={12} className={filterOpen ? styles.chevronOpen : ''} />
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  className={styles.filterDropdown}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className={styles.dropSection}>
                    <span className={styles.dropLabel}>Vue</span>
                    {VIEW_OPTIONS.map((item) => (
                      <button key={item.id}
                        className={`${styles.dropItem} ${sidebarView === item.id ? styles.dropItemActive : ''}`}
                        onClick={() => setSidebarView(item.id)}
                      >
                        <span className={styles.dropDot} />{item.label}
                        {item.id === 'toutes' && <span className={styles.dropCount}>{accompagnements.length}</span>}
                        {item.id === 'favoris' && favorites.length > 0 && <span className={styles.dropCount}>{favorites.length}</span>}
                        {sidebarView === item.id && <Check size={11} className={styles.dropCheck} />}
                      </button>
                    ))}
                  </div>
                  <div className={styles.dropDivider} />
                  <div className={styles.dropSection}>
                    <span className={styles.dropLabel}>Catégories</span>
                    {CATEGORIES.map((cat) => (
                      <button key={cat}
                        className={`${styles.dropItem} ${activeCategory === cat ? styles.dropItemActive : ''}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        <span className={styles.dropDot} />{cat}
                        {activeCategory === cat && <Check size={11} className={styles.dropCheck} />}
                      </button>
                    ))}
                  </div>
                  {hasActiveFilters && (
                    <>
                      <div className={styles.dropDivider} />
                      <button className={styles.dropReset}
                        onClick={() => { setSidebarView('toutes'); setActiveCategory('Toutes'); setFilterOpen(false); }}
                      >
                        <X size={11} />Réinitialiser les filtres
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className={styles.sliderWrapper}>
            <div
              className={styles.stage}
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            >
              <div className={styles.track} ref={trackRef}>
                {displayItems.map((a, displayIdx) => {
                  const realIdx = displayIdx % filtered.length;
                  const isMember = !!(currentUser && isUserInAccompagnement(a, currentUser.uid));
                  const isFav = a.id ? favorites.includes(a.id) : false;
                  const cardId = a.id || String(realIdx);
                  // Only the middle copy gets admin controls (avoid duplicate interactions)
                  const isMiddleCopy = displayIdx >= middleStart && displayIdx < middleStart + filtered.length;

                  return (
                    <AccompagnementCard
                      key={`${displayIdx}-${cardId}`}
                      accompagnement={a}
                      currentUser={currentUser}
                      isAdmin={adminStatus && isMiddleCopy}
                      isMember={isMember}
                      isFavorite={isFav}
                      isDeleteConfirm={isMiddleCopy && deleteConfirmId === (a.id || '')}
                      isActive={activeRealIndex === realIdx}
                      isCentered={dotIndex === realIdx}
                      onActivate={() => handleActivate(realIdx)}
                      onEdit={(x) => { setEditingAccompagnement(x); setShowEditor(true); }}
                      onDelete={handleDelete}
                      onDeleteConfirm={isMiddleCopy ? setDeleteConfirmId : () => {}}
                      onClick={handleAccompagnementClick}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  );
                })}
              </div>
            </div>

            {filtered.length > 1 && (
              <div className={styles.dotsRow}>
                {filtered.map((a, i) => (
                  <button
                    key={a.id || i}
                    className={`${styles.dot} ${dotIndex === i ? styles.dotActive : ''}`}
                    onClick={() => handleDotClick(i)}
                    aria-label={`Aller à ${a.title}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <BookOpen size={44} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
            <h3 className={styles.emptyTitle}>Aucun accompagnement disponible</h3>
            <p className={styles.emptyText}>
              {sidebarView === 'favoris' ? 'Ajoutez des accompagnements à vos favoris'
                : sidebarView === 'mes-accompagnements' ? "Vous n'êtes inscrit dans aucun accompagnement"
                : adminStatus ? 'Créez votre premier accompagnement' : 'Revenez bientôt'}
            </p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showEditor && (
          <AccompagnementEditor
            accompagnement={editingAccompagnement}
            currentUser={currentUser}
            allUsers={allUsers}
            onClose={() => { setShowEditor(false); setEditingAccompagnement(null); }}
            onSave={async () => { await onReload(); setShowEditor(false); setEditingAccompagnement(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAccompagnement && (
          <AccompagnementDetail
            accompagnement={selectedAccompagnement}
            currentUser={currentUser}
            isMember={!!(currentUser && isUserInAccompagnement(selectedAccompagnement, currentUser.uid))}
            onBack={() => setSelectedAccompagnement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accompagnement;