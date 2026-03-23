"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { isAdmin } from '@/utils/firebase-api';
import {
  FullAccompagnement,
  deleteAccompagnement,
  hasAccessToAccompagnement,
  isUserInAccompagnement,
  getFullAccompagnement,
} from '@/utils/accompagnement-api';
import AccompagnementCard from './AccompagnementCard';
import AccompagnementEditor from './AccompagnementEditor';
import AccompagnementDetail from './AccompagnementDetail';
import styles from './Accompagnement.module.css';

const CATEGORIES = ['Toutes', 'Coaching', 'Mentorat', 'Conseil', 'Formation', 'Suivi', 'Autre'];
const LEVELS = ['Tous', 'débutant', 'intermédiaire', 'avancé', 'expert'];

interface AccompagnementProps {
  accompagnements: FullAccompagnement[];
  currentUser: any;
  allUsers: any[];
  fullAccompagnementCacheRef: React.MutableRefObject<Record<string, any>>;
  onReload: () => Promise<void>;
}

const Accompagnement: React.FC<AccompagnementProps> = ({
  accompagnements,
  currentUser,
  allUsers,
  fullAccompagnementCacheRef,
  onReload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Toutes');
  const [activeLevel, setActiveLevel] = useState('Tous');
  const [activeFilter, setActiveFilter] = useState<'all' | 'joined'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingAccompagnement, setEditingAccompagnement] = useState<FullAccompagnement | null>(null);
  const [selectedAccompagnement, setSelectedAccompagnement] = useState<FullAccompagnement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const adminStatus = currentUser && isAdmin(currentUser.email);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count active filters for badge
  const activeFilterCount = [
    activeFilter !== 'all',
    activeCategory !== 'Toutes',
    activeLevel !== 'Tous',
  ].filter(Boolean).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilterDropdown]);

  const filtered = useMemo(() => {
    let list = [...accompagnements];

    if (activeFilter === 'joined' && currentUser) {
      list = list.filter((a) => isUserInAccompagnement(a, currentUser.uid));
    }

    if (activeCategory !== 'Toutes') {
      list = list.filter((a) => a.category === activeCategory);
    }

    if (activeLevel !== 'Tous') {
      list = list.filter((a) => a.level === activeLevel);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [accompagnements, activeFilter, activeCategory, activeLevel, searchQuery, currentUser]);

  const handleAccompagnementClick = async (accompagnement: FullAccompagnement) => {
    if (!currentUser) {
      window.location.href = '/security/access';
      return;
    }

    if (!hasAccessToAccompagnement(accompagnement, currentUser?.uid) && !adminStatus) {
      window.location.href = '/security/access';
      return;
    }

    const cacheKey = accompagnement.slug || accompagnement.id!;
    const immediate = fullAccompagnementCacheRef.current[cacheKey] || accompagnement;
    setSelectedAccompagnement(immediate);

    const isFullyCached = fullAccompagnementCacheRef.current[cacheKey]?.modules !== undefined;
    if (!isFullyCached && accompagnement.id) {
      try {
        const full = await getFullAccompagnement(accompagnement.id);
        if (!full) return;
        fullAccompagnementCacheRef.current[cacheKey] = full;
        setSelectedAccompagnement((cur: any) => {
          if (cur?.id === full.id || cur?.slug === full.slug) return full;
          return cur;
        });
      } catch (err) {
        console.error('getFullAccompagnement bg error:', err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccompagnement(id);
      await onReload();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('deleteAccompagnement:', error);
    }
  };

  return (
    <main className={styles.container}>
      {/* ── TOOLBAR (single line) ── */}
      <div className={styles.toolbar}>
        {/* Title + count */}
        <div className={styles.toolbarTitle}>
          <h1 className={styles.heroTitle}>Accompagnements</h1>
          <span className={styles.heroCount}>{accompagnements.length}</span>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Rechercher…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter dropdown */}
        <div className={styles.filterDropdownWrap} ref={dropdownRef}>
          <button
            className={`${styles.filterTrigger} ${activeFilterCount > 0 ? styles.filterTriggerActive : ''}`}
            onClick={() => setShowFilterDropdown((v) => !v)}
          >
            <SlidersHorizontal size={14} />
            Filtres
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
            <ChevronDown size={13} style={{ opacity: 0.5, marginLeft: 2 }} />
          </button>

          <AnimatePresence>
            {showFilterDropdown && (
              <motion.div
                className={styles.filterDropdown}
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              >
                {/* Mes accompagnements */}
                {currentUser && (
                  <div className={styles.filterSection}>
                    <span className={styles.filterSectionLabel}>Affichage</span>
                    <div className={styles.filterChipsRow}>
                      <button
                        className={`${styles.filterChip} ${activeFilter === 'all' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('all')}
                      >Tous</button>
                      <button
                        className={`${styles.filterChip} ${activeFilter === 'joined' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('joined')}
                      >Mes accompagnements</button>
                    </div>
                  </div>
                )}

                <div className={styles.filterDivider} />

                {/* Catégorie */}
                <div className={styles.filterSection}>
                  <span className={styles.filterSectionLabel}>Catégorie</span>
                  <div className={styles.filterChipsRow}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        className={`${styles.filterChip} ${activeCategory === cat ? styles.activeSecondary : ''}`}
                        onClick={() => setActiveCategory(cat)}
                      >{cat}</button>
                    ))}
                  </div>
                </div>

                <div className={styles.filterDivider} />

                {/* Niveau */}
                <div className={styles.filterSection}>
                  <span className={styles.filterSectionLabel}>Niveau</span>
                  <div className={styles.filterChipsRow}>
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        className={`${styles.filterChip} ${activeLevel === lvl ? styles.activeTertiary : ''}`}
                        onClick={() => setActiveLevel(lvl)}
                      >{lvl === 'Tous' ? 'Tous niveaux' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New accompagnement button */}
        {adminStatus && (
          <button
            className={styles.createBtn}
            onClick={() => { setEditingAccompagnement(null); setShowEditor(true); }}
          >
            <Plus size={14} />
            Nouvel accompagnement
          </button>
        )}
      </div>

      {/* ── GRID ── */}
      {filtered.length > 0 ? (
        <>
          <div className={styles.sectionBar}>
            <span className={styles.sectionCount}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={styles.grid}>
            <AnimatePresence mode="popLayout">
              {filtered.map((accompagnement, i) => {
                const isMember = currentUser && isUserInAccompagnement(accompagnement, currentUser.uid);
                return (
                  <AccompagnementCard
                    key={accompagnement.id || i}
                    accompagnement={accompagnement}
                    currentUser={currentUser}
                    isAdmin={adminStatus}
                    isMember={isMember}
                    isDeleteConfirm={deleteConfirmId === (accompagnement.id || '')}
                    onEdit={(a) => { setEditingAccompagnement(a); setShowEditor(true); }}
                    onDelete={handleDelete}
                    onDeleteConfirm={setDeleteConfirmId}
                    onClick={handleAccompagnementClick}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <Users size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>
            {searchQuery || activeCategory !== 'Toutes' || activeFilter !== 'all'
              ? 'Aucun accompagnement trouvé'
              : 'Aucun accompagnement disponible'}
          </h3>
          <p className={styles.emptyText}>
            {searchQuery
              ? 'Essayez avec d\'autres termes ou réinitialisez les filtres'
              : adminStatus
              ? 'Créez votre premier accompagnement pour commencer'
              : 'Revenez bientôt ou contactez l\'administrateur'}
          </p>
          {adminStatus && !searchQuery && (
            <button
              className={styles.emptyBtn}
              onClick={() => { setEditingAccompagnement(null); setShowEditor(true); }}
            >
              <Plus size={14} /> Créer un accompagnement
            </button>
          )}
        </div>
      )}

      {/* ── EDITOR ── */}
      <AnimatePresence>
        {showEditor && (
          <AccompagnementEditor
            accompagnement={editingAccompagnement}
            currentUser={currentUser}
            allUsers={allUsers}
            onClose={() => { setShowEditor(false); setEditingAccompagnement(null); }}
            onSave={async () => {
              await onReload();
              setShowEditor(false);
              setEditingAccompagnement(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── DETAIL ── */}
      <AnimatePresence>
        {selectedAccompagnement && (
          <AccompagnementDetail
            accompagnement={selectedAccompagnement}
            currentUser={currentUser}
            onBack={() => setSelectedAccompagnement(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default Accompagnement;