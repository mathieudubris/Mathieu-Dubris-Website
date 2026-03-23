"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, Grid3X3, Tag, BarChart2, FolderOpen } from 'lucide-react';
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
const STATUTS = ['Tous', 'En cours', 'Terminé', 'À commencer'];

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
  const [activeStatut, setActiveStatut] = useState('Tous');
  const [showEditor, setShowEditor] = useState(false);
  const [editingFormation, setEditingFormation] = useState<FullFormation | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<FullFormation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const adminStatus = currentUser && isAdmin(currentUser.email);

  const filtered = useMemo(() => {
    let list = [...formations];
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
  }, [formations, activeCategory, activeLevel, searchQuery]);

  // Simulated progress per formation (you can connect to real data)
  const getProgress = (id?: string): number => {
    if (!id) return 0;
    // Derive a consistent pseudo-random progress for demo
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return [0, 15, 35, 55, 65, 85, 100][hash % 7];
  };

  const getStatut = (progress: number): 'terminé' | 'en cours' | 'à commencer' => {
    if (progress === 100) return 'terminé';
    if (progress > 0) return 'en cours';
    return 'à commencer';
  };

  const inProgress = useMemo(
    () =>
      currentUser
        ? filtered.filter((f) => {
            const p = getProgress(f.id);
            return p > 0 && p < 100 && isUserInFormation(f, currentUser.uid);
          })
        : [],
    [filtered, currentUser]
  );

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
    <div className={styles.container}>
      {/* ── TOP BAR ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h1 className={styles.pageTitle}>Liste des Formations</h1>
          <span className={styles.countBadge}>{formations.length}</span>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Rechercher une formation…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {adminStatus && (
            <button
              className={styles.createBtn}
              onClick={() => { setEditingFormation(null); setShowEditor(true); }}
            >
              <Plus size={13} />
              Nouvelle formation
            </button>
          )}
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div className={styles.layout}>
        {/* ── SIDEBAR ── */}
        <nav className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <span className={styles.sidebarLabel}>Catégories</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`${styles.sidebarItem} ${activeCategory === cat ? styles.sidebarItemActive : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span className={styles.sidebarDot} />
                {cat}
                {cat === 'Toutes' && (
                  <span className={styles.sidebarCount}>{formations.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.sidebarDivider} />

          <div className={styles.sidebarSection}>
            <span className={styles.sidebarLabel}>Statuts</span>
            {['À commencer', 'En cours', 'Terminé'].map((s) => (
              <button
                key={s}
                className={`${styles.sidebarItem} ${activeStatut === s ? styles.sidebarItemActive : ''}`}
                onClick={() => setActiveStatut(activeStatut === s ? 'Tous' : s)}
              >
                <span className={styles.sidebarDot} />
                {s}
              </button>
            ))}
          </div>

          <div className={styles.sidebarDivider} />

          <div className={styles.sidebarSection}>
            <span className={styles.sidebarLabel}>Niveau</span>
            {['Niveau 1', 'Niveau 2', 'Niveau 3'].map((n) => (
              <button
                key={n}
                className={styles.sidebarItem}
              >
                <span className={styles.sidebarDot} />
                {n}
              </button>
            ))}
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main className={styles.main}>
          {/* In-progress section */}
          {inProgress.length > 0 && (
            <>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>En cours ({inProgress.length})</span>
              </div>
              <div className={styles.inProgressRow}>
                <AnimatePresence mode="popLayout">
                  {inProgress.map((f, i) => {
                    const progress = getProgress(f.id);
                    return (
                      <FormationCard
                        key={f.id || i}
                        formation={f}
                        currentUser={currentUser}
                        isAdmin={adminStatus}
                        isMember={currentUser && isUserInFormation(f, currentUser.uid)}
                        isDeleteConfirm={deleteConfirmId === (f.id || '')}
                        onEdit={(f) => { setEditingFormation(f); setShowEditor(true); }}
                        onDelete={handleDelete}
                        onDeleteConfirm={setDeleteConfirmId}
                        onClick={handleFormationClick}
                        progress={progress}
                        variant="progress"
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* All formations */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Toutes les formations</span>
            <span className={styles.sectionCount}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {filtered.length > 0 ? (
            <div className={styles.grid}>
              <AnimatePresence mode="popLayout">
                {filtered.map((formation, i) => {
                  const progress = getProgress(formation.id);
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
                      progress={progress}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <BookOpen size={44} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
              <h3 className={styles.emptyTitle}>
                {searchQuery ? 'Aucune formation trouvée' : 'Aucune formation disponible'}
              </h3>
              <p className={styles.emptyText}>
                {searchQuery
                  ? 'Essayez avec d\'autres termes'
                  : adminStatus
                  ? 'Créez votre première formation'
                  : 'Revenez bientôt'}
              </p>
            </div>
          )}
        </main>
      </div>

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
    </div>
  );
};

export default Formation;
