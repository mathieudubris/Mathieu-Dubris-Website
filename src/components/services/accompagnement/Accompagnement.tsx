"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookMarked, Users } from 'lucide-react';
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
  const [showEditor, setShowEditor] = useState(false);
  const [editingAccompagnement, setEditingAccompagnement] = useState<FullAccompagnement | null>(null);
  const [selectedAccompagnement, setSelectedAccompagnement] = useState<FullAccompagnement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const adminStatus = currentUser && isAdmin(currentUser.email);

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
      {/* ── HERO HEADER ── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroIcon}>
              <Users size={22} />
            </div>
            <div>
              <h1 className={styles.heroTitle}>Accompagnements</h1>
              <p className={styles.heroSubtitle}>
                {accompagnements.length} accompagnement{accompagnements.length !== 1 ? 's' : ''} disponible{accompagnements.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {adminStatus && (
            <button className={styles.createBtn} onClick={() => { setEditingAccompagnement(null); setShowEditor(true); }}>
              <Plus size={15} />
              <span>Nouvel accompagnement</span>
            </button>
          )}
        </div>

        {/* Barre de recherche */}
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Rechercher un accompagnement…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filtres */}
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            {currentUser && (
              <>
                <button
                  className={`${styles.filterChip} ${activeFilter === 'all' ? styles.active : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  Tous
                </button>
                <button
                  className={`${styles.filterChip} ${activeFilter === 'joined' ? styles.active : ''}`}
                  onClick={() => setActiveFilter('joined')}
                >
                  Mes accompagnements
                </button>
              </>
            )}
          </div>

          <div className={styles.filterDivider} />

          <div className={styles.filterGroup}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`${styles.filterChip} ${activeCategory === cat ? styles.activeSecondary : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.filterDivider} />

          <div className={styles.filterGroup}>
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                className={`${styles.filterChip} ${activeLevel === lvl ? styles.activeTertiary : ''}`}
                onClick={() => setActiveLevel(lvl)}
              >
                {lvl === 'Tous' ? 'Tous niveaux' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GRILLE ── */}
      {filtered.length > 0 ? (
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
      ) : (
        <div className={styles.emptyState}>
          <Users size={44} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>
            {searchQuery || activeCategory !== 'Toutes' || activeFilter !== 'all'
              ? 'Aucun accompagnement trouvé'
              : 'Aucun accompagnement disponible'}
          </h3>
          <p className={styles.emptyText}>
            {searchQuery
              ? 'Essayez avec d\'autres termes'
              : adminStatus
              ? 'Créez votre premier accompagnement'
              : 'Revenez bientôt ou contactez l\'administrateur'}
          </p>
          {adminStatus && !searchQuery && (
            <button className={styles.emptyBtn} onClick={() => { setEditingAccompagnement(null); setShowEditor(true); }}>
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
