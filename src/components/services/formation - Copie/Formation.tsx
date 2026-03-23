"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { isAdmin } from '@/utils/firebase-api';
import {
  FullFormation,
  deleteFormation,
  hasAccessToFormation,
  isUserInFormation,
  getFullFormation,
} from '@/utils/formation-api';
import FormationCard from './FormationCard';
import FormationEditor from './FormationEditor';
import FormationDetail from './FormationDetail';
import styles from './Formation.module.css';

const CATEGORIES = ['Toutes', 'Développement', 'Design', 'Marketing', 'Business', 'Data', 'Autre'];
const LEVELS = ['Tous', 'débutant', 'intermédiaire', 'avancé', 'expert'];

interface FormationProps {
  formations: FullFormation[];
  currentUser: any;
  allUsers: any[];
  fullFormationCacheRef: React.MutableRefObject<Record<string, any>>;
  onReload: () => Promise<void>;
}

const Formation: React.FC<FormationProps> = ({
  formations,
  currentUser,
  allUsers,
  fullFormationCacheRef,
  onReload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Toutes');
  const [activeLevel, setActiveLevel] = useState('Tous');
  const [activeFilter, setActiveFilter] = useState<'all' | 'joined'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingFormation, setEditingFormation] = useState<FullFormation | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<FullFormation | null>(null);
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
    let list = [...formations];
    if (activeFilter === 'joined' && currentUser) {
      list = list.filter((f) => isUserInFormation(f, currentUser.uid));
    }
    if (activeCategory !== 'Toutes') {
      list = list.filter((f) => f.category === activeCategory);
    }
    if (activeLevel !== 'Tous') {
      list = list.filter((f) => f.level === activeLevel);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.title?.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [formations, activeFilter, activeCategory, activeLevel, searchQuery, currentUser]);

  const handleFormationClick = async (formation: FullFormation) => {
    if (!currentUser) {
      window.location.href = '/security/access';
      return;
    }
    if (!hasAccessToFormation(formation, currentUser?.uid) && !adminStatus) {
      window.location.href = '/security/access';
      return;
    }
    const cacheKey = formation.slug || formation.id!;
    const immediate = fullFormationCacheRef.current[cacheKey] || formation;
    setSelectedFormation(immediate);

    const isFullyCached = fullFormationCacheRef.current[cacheKey]?.modules !== undefined;
    if (!isFullyCached && formation.id) {
      try {
        const full = await getFullFormation(formation.id);
        if (!full) return;
        fullFormationCacheRef.current[cacheKey] = full;
        setSelectedFormation((cur: any) => {
          if (cur?.id === full.id || cur?.slug === full.slug) return full;
          return cur;
        });
      } catch (err) {
        console.error('getFullFormation bg error:', err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFormation(id);
      await onReload();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('deleteFormation:', error);
    }
  };

  return (
    <main className={styles.container}>
      {/* ── TOOLBAR (single line) ── */}
      <div className={styles.toolbar}>
        {/* Title + count */}
        <div className={styles.toolbarTitle}>
          <h1 className={styles.heroTitle}>Formations</h1>
          <span className={styles.heroCount}>{formations.length}</span>
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
                {/* Mes formations */}
                {currentUser && (
                  <div className={styles.filterSection}>
                    <span className={styles.filterSectionLabel}>Affichage</span>
                    <div className={styles.filterChipsRow}>
                      <button
                        className={`${styles.filterChip} ${activeFilter === 'all' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('all')}
                      >Toutes</button>
                      <button
                        className={`${styles.filterChip} ${activeFilter === 'joined' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('joined')}
                      >Mes formations</button>
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

        {/* New formation button */}
        {adminStatus && (
          <button
            className={styles.createBtn}
            onClick={() => { setEditingFormation(null); setShowEditor(true); }}
          >
            <Plus size={14} />
            Nouvelle formation
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
              {filtered.map((formation, i) => {
                const isMember = currentUser && isUserInFormation(formation, currentUser.uid);
                return (
                  <FormationCard
                    key={formation.id || i}
                    formation={formation}
                    currentUser={currentUser}
                    isAdmin={adminStatus}
                    isMember={isMember}
                    isDeleteConfirm={deleteConfirmId === (formation.id || '')}
                    onEdit={(f) => { setEditingFormation(f); setShowEditor(true); }}
                    onDelete={handleDelete}
                    onDeleteConfirm={setDeleteConfirmId}
                    onClick={handleFormationClick}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>
            {searchQuery || activeCategory !== 'Toutes' || activeFilter !== 'all'
              ? 'Aucune formation trouvée'
              : 'Aucune formation disponible'}
          </h3>
          <p className={styles.emptyText}>
            {searchQuery
              ? 'Essayez avec d\'autres termes ou réinitialisez les filtres'
              : adminStatus
              ? 'Créez votre première formation pour commencer'
              : 'Revenez bientôt ou contactez l\'administrateur'}
          </p>
          {adminStatus && !searchQuery && (
            <button
              className={styles.emptyBtn}
              onClick={() => { setEditingFormation(null); setShowEditor(true); }}
            >
              <Plus size={14} /> Créer une formation
            </button>
          )}
        </div>
      )}

      {/* ── EDITOR ── */}
      <AnimatePresence>
        {showEditor && (
          <FormationEditor
            formation={editingFormation}
            currentUser={currentUser}
            allUsers={allUsers}
            onClose={() => { setShowEditor(false); setEditingFormation(null); }}
            onSave={async () => {
              await onReload();
              setShowEditor(false);
              setEditingFormation(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── DETAIL ── */}
      <AnimatePresence>
        {selectedFormation && (
          <FormationDetail
            formation={selectedFormation}
            currentUser={currentUser}
            onBack={() => setSelectedFormation(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default Formation;