"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Package, Tag, Users, Calendar, TrendingUp, X, ArrowRight } from 'lucide-react';
import { getAllProjects, FullProject } from '@/utils/projet-api';
import { getBlogs, BlogPost } from '@/utils/firebase-api';
import { WHITE_LOGO_IDS } from '@/utils/software';
import Header from '@/components/app/Header/Header';
import styles from './actualite.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'project' | 'blog';

interface ActualiteItem {
  id: string;
  type: 'project' | 'blog';
  title: string;
  description: string;
  image: string;
  link: string;
  createdAt: any;
  // projets
  software?: any[];
  members?: any[];
  progress?: number;
  // blogs
  tags?: string[];
  category?: string;
  author?: string;
}

// ── Software icon ─────────────────────────────────────────────────────────────

const SoftwareIcon: React.FC<{ software: any }> = ({ software }) => {
  const [failed, setFailed] = useState(false);
  const logoUrl: string | undefined = software.logoUrl || software.icon;
  const needsDarkBg = WHITE_LOGO_IDS.has(software.id || '');

  const isUrl =
    logoUrl &&
    (logoUrl.startsWith('http') ||
      logoUrl.startsWith('data:') ||
      logoUrl.startsWith('/'));

  if (isUrl && !failed) {
    return (
      <div
        className={styles.swIconInner}
        style={{ background: needsDarkBg ? 'rgba(0,0,0,0.55)' : 'transparent' }}
      >
        <img
          src={logoUrl}
          alt={software.name}
          onError={() => setFailed(true)}
          draggable={false}
          className={styles.swIconImg}
          style={{ filter: needsDarkBg ? 'brightness(0) invert(1)' : 'none' }}
        />
      </div>
    );
  }

  if (logoUrl && !isUrl) {
    return <span className={styles.swIconEmoji}>{logoUrl}</span>;
  }

  return (
    <span
      className={styles.swIconLetter}
      style={{ color: software.color || 'var(--primary)' }}
    >
      {software.name?.charAt(0)?.toUpperCase() || '?'}
    </span>
  );
};

// ── Item card ─────────────────────────────────────────────────────────────────

const ActualiteCard: React.FC<{ item: ActualiteItem; index: number }> = ({ item, index }) => {
  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return ''; }
  };

  const softwareList = item.software || [];
  const maxSw = 5;
  const visibleSw = softwareList.slice(0, maxSw);
  const remainingSw = softwareList.length - maxSw;

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      {/* Image */}
      <div className={styles.cardImageWrap}>
        <img
          src={item.image || '/default-project.jpg'}
          alt={item.title}
          className={styles.cardImage}
          onError={e => { e.currentTarget.src = '/default-project.jpg'; }}
        />
        <div className={styles.cardImageOverlay} />
        {/* Badge type */}
        <div className={`${styles.typeBadge} ${item.type === 'project' ? styles.typeBadgeProject : styles.typeBadgeBlog}`}>
          {item.type === 'project' ? '🚀 Projet' : '📝 Article'}
        </div>
      </div>

      {/* Contenu */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardDesc}>{item.description}</p>

        {/* Software (projets) */}
        {item.type === 'project' && (
          <div className={styles.softwareSection}>
            {softwareList.length === 0 ? (
              <div className={styles.noSoftware}>
                <Package size={10} />
                <span>Aucun logiciel</span>
              </div>
            ) : (
              <>
                {visibleSw.map((sw: any, i: number) => (
                  <div key={sw.id || i} className={styles.softwareIcon} title={sw.name}>
                    <SoftwareIcon software={sw} />
                  </div>
                ))}
                {remainingSw > 0 && (
                  <div className={styles.moreSoftware}>+{remainingSw}</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tags (blogs) */}
        {item.type === 'blog' && item.tags && item.tags.length > 0 && (
          <div className={styles.tagsRow}>
            <Tag size={11} />
            {item.tags.slice(0, 3).map((t, i) => (
              <span key={i} className={styles.tagChip}>{t}</span>
            ))}
          </div>
        )}

        {/* Membres (projets) */}
        {item.type === 'project' && item.members && item.members.length > 0 && (
          <div className={styles.membersRow}>
            <Users size={11} />
            <div className={styles.avatarStack}>
              {item.members.slice(0, 4).map((m: any, i: number) => (
                <div key={i} className={styles.avatar} title={m.displayName || 'Membre'}>
                  {m.photoURL
                    ? <img src={m.photoURL} alt={m.displayName} />
                    : <span>{m.displayName?.[0]?.toUpperCase() || 'M'}</span>
                  }
                </div>
              ))}
              {item.members.length > 4 && (
                <div className={styles.avatarMore}>+{item.members.length - 4}</div>
              )}
            </div>
          </div>
        )}

        {/* Auteur (blogs) */}
        {item.type === 'blog' && item.author && (
          <div className={styles.authorRow}>
            <div className={styles.authorDot} />
            <span className={styles.authorName}>{item.author}</span>
          </div>
        )}

        {/* Barre de progression (projets) */}
        {item.type === 'project' && typeof item.progress === 'number' && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${item.progress}%` }} />
            </div>
            <span className={styles.progressLabel}>{item.progress}%</span>
          </div>
        )}

        <div className={styles.cardFooter}>
          <span className={styles.cardDate}>
            <Calendar size={11} />
            {formatDate(item.createdAt)}
          </span>
          <a href={item.link} className={styles.cardLink}>
            {item.type === 'project' ? 'Voir les projets' : 'Voir les articles'}
            <ArrowRight size={12} />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────

export default function ActualitePage() {
  const [items, setItems] = useState<ActualiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [projects, blogs] = await Promise.all([
          getAllProjects(),
          getBlogs(),
        ]);

        const projectItems: ActualiteItem[] = (projects as FullProject[]).map(p => ({
          id: p.id || '',
          type: 'project',
          title: p.title,
          description: p.description || '',
          image: p.image || '/default-project.jpg',
          link: `/portfolio/projet-en-cours`,
          createdAt: p.createdAt,
          software: p.software || [],
          members: p.members || [],
          progress: p.progress,
        }));

        const blogItems: ActualiteItem[] = blogs.map(b => ({
          id: b.id || '',
          type: 'blog',
          title: b.title,
          description: b.content?.replace(/<[^>]*>/g, '').slice(0, 150) || '',
          image: b.featuredImage || b.mediaUrl || '/default-project.jpg',
          link: `/communaute/blog`,
          createdAt: b.createdAt,
          tags: b.tags || [],
          category: b.category,
          author: b.author,
        }));

        // Tri par date décroissante
        const all = [...projectItems, ...blogItems].sort((a, b) => {
          const getTime = (d: any) => {
            if (!d) return 0;
            if (d.toDate) return d.toDate().getTime();
            return new Date(d).getTime();
          };
          return getTime(b.createdAt) - getTime(a.createdAt);
        });

        setItems(all);
      } catch (error) {
        console.error('ActualitePage load:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter(it => filter === 'all' || it.type === filter)
      .filter(it => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          it.title.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q) ||
          (it.tags || []).some(t => t.toLowerCase().includes(q)) ||
          (it.author || '').toLowerCase().includes(q)
        );
      });
  }, [items, filter, search]);

  const counts = useMemo(() => ({
    all: items.length,
    project: items.filter(i => i.type === 'project').length,
    blog: items.filter(i => i.type === 'blog').length,
  }), [items]);

  return (
    <main className={styles.page}>
      <Header />

      {/* Hero header */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLabel}>
            <span className={styles.labelDot} />
            Actualité
          </div>
          <h1 className={styles.heroTitle}>Toute l&apos;actualité</h1>
          <p className={styles.heroSub}>
            Retrouvez ici tous les projets et articles publiés, triés par date.
          </p>
        </div>
      </div>

      {/* Barre de contrôles */}
      <div className={styles.controls}>
        {/* Filtres */}
        <div className={styles.filters}>
          {(['all', 'project', 'blog'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' && <TrendingUp size={13} />}
              {f === 'project' && '🚀'}
              {f === 'blog' && '📝'}
              <span>
                {f === 'all' ? 'Tout' : f === 'project' ? 'Projets' : 'Articles'}
              </span>
              <span className={styles.filterCount}>{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Résultats count */}
      {!loading && (
        <div className={styles.resultsMeta}>
          <span>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
          {search && <span> pour &ldquo;{search}&rdquo;</span>}
        </div>
      )}

      {/* Grille */}
      <div className={styles.grid}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <SlidersHorizontal size={32} className={styles.emptyIcon} />
            <p>Aucun résultat trouvé</p>
            {search && (
              <button onClick={() => setSearch('')} className={styles.emptyReset}>
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <ActualiteCard key={`${item.type}-${item.id}`} item={item} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}