"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, Users, Tag } from 'lucide-react';
import { getNouveautes, Nouveaute } from '@/utils/nouveautes-api';
import styles from './Section2.module.css';

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

  return (
    <section className={styles.section2} id="nouveautes">
      {/* Label flottant */}
      <div className={styles.sectionLabel}>
        <span className={styles.labelDot} />
        Nouveautés
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

                {/* Méta projet */}
                {item.type === 'project' && item.software && item.software.length > 0 && (
                  <div className={styles.softwareRow}>
                    {item.software.slice(0, 5).map((s: any, i: number) => (
                      <span key={i} className={styles.softwareChip} title={s.name}>
                        {s.icon || '📦'}
                      </span>
                    ))}
                    {item.software.length > 5 && (
                      <span className={styles.softwareMore}>+{item.software.length - 5}</span>
                    )}
                  </div>
                )}

                {/* Méta blog */}
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
