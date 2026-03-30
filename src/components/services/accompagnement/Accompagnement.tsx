"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, X, Menu } from 'lucide-react';
import { isAdmin } from '@/utils/firebase-api';
import {
  FullAccompagnement,
  deleteAccompagnement,
  hasAccessToAccompagnement,
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

type SidebarView = 'toutes' | 'commentaires' | 'mes-accompagnements' | 'favoris';

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
  const [sidebarView, setSidebarView] = useState<SidebarView>('toutes');
  const [showEditor, setShowEditor] = useState(false);
  const [editingAccompagnement, setEditingAccompagnement] = useState<FullAccompagnement | null>(null);
  const [selectedAccompagnement, setSelectedAccompagnement] = useState<FullAccompagnement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const adminStatus = currentUser && isAdmin(currentUser.email);

  useEffect(() => {
    if (currentUser?.uid) {
      getUserFavorites(currentUser.uid).then(setFavorites).catch(() => {});
    }
  }, [currentUser?.uid]);

  const handleToggleFavorite = async (accompagnementId: string) => {
    if (!currentUser?.uid) return;
    try {
      const isNowFav = await toggleFavorite(currentUser.uid, accompagnementId);
      setFavorites((prev) =>
        isNowFav ? [...prev, accompagnementId] : prev.filter((id) => id !== accompagnementId)
      );
    } catch (err) {
      console.error('toggleFavorite:', err);
    }
  };

  const filtered = useMemo(() => {
    let list = [...accompagnements];
    if (sidebarView === 'mes-accompagnements') {
      list = list.filter((a) => currentUser && isUserInAccompagnement(a, currentUser.uid));
    } else if (sidebarView === 'favoris') {
      list = list.filter((a) => a.id && favorites.includes(a.id));
    }
    if (activeCategory !== 'Toutes') {
      list = list.filter((a) => a.category === activeCategory);
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
  }, [accompagnements, activeCategory, searchQuery, sidebarView, favorites, currentUser]);

  const handleAccompagnementClick = async (accompagnement: FullAccompagnement) => {
    if (!currentUser) {
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

  const getSectionTitle = () => {
    switch (sidebarView) {
      case 'mes-accompagnements': return 'Mes accompagnements';
      case 'favoris': return 'Mes favoris';
      case 'commentaires': return 'Commentaires';
      default: return 'Tous les accompagnements';
    }
  };

  const SidebarContent = () => (
    <>
      <div className={styles.sidebarSection}>
        <span className={styles.sidebarLabel}>Navigation</span>
        {([
          { id: 'toutes', label: 'Toutes' },
          { id: 'commentaires', label: 'Commentaires' },
          { id: 'mes-accompagnements', label: 'Mes accompagnements' },
          { id: 'favoris', label: 'Mes favoris' },
        ] as { id: SidebarView; label: string }[]).map((item) => (
          <button
            key={item.id}
            className={`${styles.sidebarItem} ${sidebarView === item.id ? styles.sidebarItemActive : ''}`}
            onClick={() => { setSidebarView(item.id); setSidebarOpen(false); }}
          >
            <span className={styles.sidebarDot} />
            {item.label}
            {item.id === 'toutes' && (
              <span className={styles.sidebarCount}>{accompagnements.length}</span>
            )}
            {item.id === 'favoris' && favorites.length > 0 && (
              <span className={styles.sidebarCount}>{favorites.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.sidebarDivider} />

      <div className={styles.sidebarSection}>
        <span className={styles.sidebarLabel}>Catégories</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.sidebarItem} ${activeCategory === cat ? styles.sidebarItemActive : ''}`}
            onClick={() => { setActiveCategory(cat); setSidebarOpen(false); }}
          >
            <span className={styles.sidebarDot} />
            {cat}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className={styles.container}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button className={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <Menu size={16} />
          </button>
          <h1 className={styles.pageTitle}>Accompagnements</h1>
          <span className={styles.countBadge}>{accompagnements.length}</span>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Rechercher…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {adminStatus && (
            <button
              className={styles.createBtn}
              onClick={() => { setEditingAccompagnement(null); setShowEditor(true); }}
            >
              <Plus size={13} />
              Nouveau
            </button>
          )}
        </div>
      </div>

      {/* LAYOUT */}
      <div className={styles.layout}>
        {/* SIDEBAR desktop */}
        <nav className={styles.sidebar}>
          <SidebarContent />
        </nav>

        {/* MOBILE SIDEBAR */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                className={styles.sidebarOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
              />
              <motion.nav
                className={styles.sidebarMobile}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
              >
                <div className={styles.sidebarMobileHeader}>
                  <span className={styles.sidebarMobileTitle}>Filtres</span>
                  <button className={styles.sidebarMobileClose} onClick={() => setSidebarOpen(false)}>
                    <X size={15} />
                  </button>
                </div>
                <div className={styles.sidebarMobileBody}>
                  <SidebarContent />
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>

        {/* MAIN */}
        <main className={styles.main}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>{getSectionTitle()}</span>
            <span className={styles.sectionCount}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {sidebarView === 'commentaires' ? (
            <div className={styles.emptyState}>
              <BookOpen size={44} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
              <h3 className={styles.emptyTitle}>Commentaires</h3>
              <p className={styles.emptyText}>La section commentaires arrive bientôt.</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className={styles.grid}>
              <AnimatePresence mode="popLayout">
                {filtered.map((accompagnement, i) => {
                  const isMember = currentUser && isUserInAccompagnement(accompagnement, currentUser.uid);
                  const isFav = accompagnement.id ? favorites.includes(accompagnement.id) : false;
                  return (
                    <AccompagnementCard
                      key={accompagnement.id || i}
                      accompagnement={accompagnement}
                      currentUser={currentUser}
                      isAdmin={adminStatus}
                      isMember={isMember}
                      isFavorite={isFav}
                      isDeleteConfirm={deleteConfirmId === (accompagnement.id || '')}
                      onEdit={(a) => { setEditingAccompagnement(a); setShowEditor(true); }}
                      onDelete={handleDelete}
                      onDeleteConfirm={setDeleteConfirmId}
                      onClick={handleAccompagnementClick}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <BookOpen size={44} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
              <h3 className={styles.emptyTitle}>
                {searchQuery ? 'Aucun accompagnement trouvé' : 'Aucun accompagnement disponible'}
              </h3>
              <p className={styles.emptyText}>
                {searchQuery
                  ? "Essayez avec d'autres termes"
                  : sidebarView === 'favoris'
                  ? 'Ajoutez des accompagnements à vos favoris'
                  : sidebarView === 'mes-accompagnements'
                  ? "Vous n'êtes inscrit dans aucun accompagnement"
                  : adminStatus
                  ? 'Créez votre premier accompagnement'
                  : 'Revenez bientôt'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* EDITOR */}
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

      {/* DETAIL */}
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