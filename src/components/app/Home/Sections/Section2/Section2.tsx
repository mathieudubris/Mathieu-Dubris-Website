"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, Users, Tag, ArrowRight, Package } from 'lucide-react';
import { getNouveautes, Nouveaute } from '@/utils/nouveautes-api';
import { WHITE_LOGO_IDS } from '@/utils/software';
import styles from './Section2.module.css';

// ── Software icon (identique à ProjectCard) ───────────────────────────────────

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

// ── Section2 ──────────────────────────────────────────────────────────────────

const Section2: React.FC = () => {
  const [items, setItems] = useState<Nouveaute[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<1 | -1>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getNouveautes();
      setItems(data);
      setLoading(false);
    };
    load();
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (items.length > 1) {
      timerRef.current = setInterval(() => {
        setDirection(1);
        setCurrent(prev => (prev + 1) % items.length);
      }, 5000);
    }
  }, [items.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    resetTimer();
  };

  const prev = () => {
    setDirection(-1);
    setCurrent(prev => (prev - 1 + items.length) % items.length);
    resetTimer();
  };

  const next = () => {
    setDirection(1);
    setCurrent(prev => (prev + 1) % items.length);
    resetTimer();
  };

  if (loading) {
    return (
      <section className={styles.section2} id="nouveautes">
        <div className={styles.skeletonWrap}>
          <div className={styles.skeleton} />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  const item = items[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  // Software à afficher (projets)
  const softwareList: any[] = item.type === 'project' ? (item.software || []) : [];
  const maxSw = 6;
  const visibleSw = softwareList.slice(0, maxSw);
  const remainingSw = softwareList.length - maxSw;

  return (
    <section className={styles.section2} id="nouveautes">
      {/* Label flottant */}
      <div className={styles.sectionLabelRow}>
        <div className={styles.sectionLabel}>
          <span className={styles.labelDot} />
          Nouveautés
        </div>
        <a href="/communaute/actualite" className={styles.seeAllBtn}>
          Voir toute l&apos;actualité
          <ArrowRight size={14} />
        </a>
      </div>

      <div className={styles.carouselWrapper}>
        {/* Slide principal */}
        <div className={styles.slideTrack}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={item.id}
              className={styles.slide}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Image de fond */}
              <div className={styles.slideImageWrap}>
                <img
                  src={item.image || '/default-project.jpg'}
                  alt={item.title}
                  className={styles.slideImage}
                  onError={(e) => { e.currentTarget.src = '/default-project.jpg'; }}
                />
                <div className={styles.slideOverlay} />
              </div>

              {/* Contenu */}
              <div className={styles.slideContent}>
                {/* Badge type */}
                <div className={`${styles.typeBadge} ${item.type === 'project' ? styles.typeBadgeProject : styles.typeBadgeBlog}`}>
                  {item.type === 'project' ? '🚀 Projet' : '📝 Article'}
                </div>

                <h2 className={styles.slideTitle}>{item.title}</h2>
                <p className={styles.slideDesc}>{item.description}</p>

                {/* Software icons — style ProjectCard */}
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
                          <div className={styles.moreSoftware} title={`+${remainingSw} autres`}>
                            +{remainingSw}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Tags (blogs) */}
                {item.type === 'blog' && item.tags && item.tags.length > 0 && (
                  <div className={styles.tagsRow}>
                    <Tag size={12} />
                    {item.tags.slice(0, 3).map((t, i) => (
                      <span key={i} className={styles.tagChip}>{t}</span>
                    ))}
                  </div>
                )}

                {/* Membres (projets) */}
                {item.type === 'project' && item.members && item.members.length > 0 && (
                  <div className={styles.membersRow}>
                    <Users size={12} />
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

                {/* Barre de progression (projets) */}
                {item.type === 'project' && typeof item.progress === 'number' && (
                  <div className={styles.progressWrap}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${item.progress}%` }} />
                    </div>
                    <span className={styles.progressLabel}>{item.progress}%</span>
                  </div>
                )}

                {/* CTA */}
                <a
                  href={item.link}
                  className={styles.ctaBtn}
                  onClick={e => e.stopPropagation()}
                >
                  {item.ctaLabel || 'Voir'}
                  <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Contrôles */}
        {items.length > 1 && (
          <>
            <button className={`${styles.navBtn} ${styles.navBtnLeft}`} onClick={prev} aria-label="Précédent">
              <ChevronLeft size={20} />
            </button>
            <button className={`${styles.navBtn} ${styles.navBtnRight}`} onClick={next} aria-label="Suivant">
              <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className={styles.dots}>
              {items.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Miniatures latérales */}
            <div className={styles.thumbnails}>
              {items.map((it, i) => (
                <button
                  key={it.id}
                  className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`}
                  onClick={() => goTo(i)}
                >
                  <img
                    src={it.image || '/default-project.jpg'}
                    alt={it.title}
                    onError={(e) => { e.currentTarget.src = '/default-project.jpg'; }}
                  />
                  <span className={styles.thumbTitle}>{it.title}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Section2;