"use client";

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Layers, Play, Maximize2 } from 'lucide-react';
import styles from './Galerie.module.css';

interface MediaItem {
  url: string;
  type?: 'image' | 'video' | 'gif' | 'prototype';
  caption?: string;
}

interface GalerieProps {
  images: string[] | MediaItem[];
  projectTitle: string;
}

// Normalize: accepts plain strings or MediaItem objects
function normalize(items: string[] | MediaItem[]): MediaItem[] {
  return items.map((item) =>
    typeof item === 'string' ? { url: item, type: 'image' } : item
  );
}

function detectType(url: string): 'video' | 'gif' | 'image' {
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return 'video';
  if (/\.gif(\?|$)/i.test(url)) return 'gif';
  return 'image';
}

const TYPE_META: Record<string, { label: string; Icon: React.FC<any>; color: string }> = {
  image:     { label: 'Image',     Icon: ImageIcon, color: 'var(--line)' },
  video:     { label: 'Vidéo',     Icon: Video,     color: '#60a5fa' },
  gif:       { label: 'GIF',       Icon: Play,      color: '#a78bfa' },
  prototype: { label: 'Prototype', Icon: Layers,    color: 'var(--primary)' },
};

const Galerie: React.FC<GalerieProps> = ({ images, projectTitle }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  if (!images || images.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}><ImageIcon size={32} /></div>
        <p className={styles.emptyTitle}>Aucun média dans la galerie</p>
        <p className={styles.emptyHint}>Les captures d'écran, vidéos et GIFs apparaîtront ici.</p>
      </div>
    );
  }

  const items = normalize(images).map((item) => ({
    ...item,
    type: item.type || detectType(item.url),
  }));

  // Available type filters
  const types = ['all', ...Array.from(new Set(items.map((i) => i.type!)))];
  const filtered = activeFilter === 'all' ? items : items.filter((i) => i.type === activeFilter);

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setLightboxIndex((i) => (i! - 1 + filtered.length) % filtered.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setLightboxIndex((i) => (i! + 1) % filtered.length); };

  const currentItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <>
      {/* ── Filtres ── */}
      {types.length > 2 && (
        <div className={styles.filters}>
          {types.map((t) => {
            const meta = t !== 'all' ? TYPE_META[t] : null;
            return (
              <button
                key={t}
                className={`${styles.filterBtn} ${activeFilter === t ? styles.filterActive : ''}`}
                onClick={() => { setActiveFilter(t); setLightboxIndex(null); }}
              >
                {meta?.Icon && <meta.Icon size={12} />}
                <span>{t === 'all' ? `Tout (${items.length})` : `${meta?.label} (${items.filter(i => i.type === t).length})`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Grille masonry-like ── */}
      <div className={styles.grid}>
        {filtered.map((item, i) => {
          const meta = TYPE_META[item.type!] || TYPE_META.image;
          const isFirst = i === 0;
          return (
            <button
              key={i}
              className={`${styles.cell} ${isFirst ? styles.cellFeatured : ''}`}
              onClick={() => openLightbox(i)}
              aria-label={`Voir média ${i + 1}`}
            >
              {item.type === 'video' ? (
                <video src={item.url} className={styles.thumb} muted playsInline />
              ) : (
                <img src={item.url} alt={item.caption || `${projectTitle} — ${i + 1}`} className={styles.thumb} />
              )}

              {/* Overlay */}
              <div className={styles.cellOverlay}>
                <Maximize2 size={16} className={styles.overlayIcon} />
                {item.caption && <span className={styles.caption}>{item.caption}</span>}
              </div>

              {/* Type badge */}
              <span className={styles.typeBadge} style={{ color: meta.color }}>
                <meta.Icon size={10} />
                {meta.label}
              </span>

              {/* Play icon for video/gif */}
              {(item.type === 'video' || item.type === 'gif') && (
                <div className={styles.playBadge}><Play size={14} /></div>
              )}

              {/* Featured label */}
              {isFirst && <span className={styles.featuredBadge}>Couverture</span>}
            </button>
          );
        })}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && currentItem && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          {/* Header */}
          <div className={styles.lightboxHeader} onClick={(e) => e.stopPropagation()}>
            <div className={styles.lightboxMeta}>
              {(() => { const m = TYPE_META[currentItem.type!]; return <><m.Icon size={13} /><span>{m.label}</span></>; })()}
            </div>
            <span className={styles.lightboxCounter}>{lightboxIndex + 1} / {filtered.length}</span>
            <button className={styles.lightboxClose} onClick={closeLightbox}><X size={16} /></button>
          </div>

          {/* Media */}
          <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
            {currentItem.type === 'video' ? (
              <video src={currentItem.url} className={styles.lightboxMedia} controls autoPlay />
            ) : (
              <img src={currentItem.url} alt={currentItem.caption || `${projectTitle}`} className={styles.lightboxMedia} />
            )}
            {currentItem.caption && (
              <p className={styles.lightboxCaption}>{currentItem.caption}</p>
            )}
          </div>

          {/* Arrows */}
          {filtered.length > 1 && (
            <>
              <button className={`${styles.lightboxArrow} ${styles.prev}`} onClick={prev}><ChevronLeft size={22} /></button>
              <button className={`${styles.lightboxArrow} ${styles.next}`} onClick={next}><ChevronRight size={22} /></button>
            </>
          )}

          {/* Thumbnails strip */}
          {filtered.length > 1 && (
            <div className={styles.thumbStrip} onClick={(e) => e.stopPropagation()}>
              {filtered.map((item, i) => (
                <button
                  key={i}
                  className={`${styles.stripThumb} ${i === lightboxIndex ? styles.stripActive : ''}`}
                  onClick={() => setLightboxIndex(i)}
                >
                  {item.type === 'video'
                    ? <video src={item.url} className={styles.stripMedia} muted />
                    : <img src={item.url} alt="" className={styles.stripMedia} />
                  }
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Galerie;