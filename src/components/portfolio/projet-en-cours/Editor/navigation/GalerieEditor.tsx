"use client";

import React, { useState } from 'react';
import { Image as ImageIcon, Video, Layers, Play, Plus, X, Star, Tag, ChevronDown } from 'lucide-react';
import styles from './GalerieEditor.module.css';

export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'gif' | 'prototype';
  caption?: string;
}

interface GalerieEditorProps {
  mainImage: string;
  carouselImages: string[] | MediaItem[];
  onMainImageChange: (url: string) => void;
  onCarouselImagesChange: (images: MediaItem[]) => void;
}

const TYPE_OPTIONS: { value: MediaItem['type']; label: string; Icon: React.FC<any> }[] = [
  { value: 'image',     label: 'Image',     Icon: ImageIcon },
  { value: 'video',     label: 'Vidéo',     Icon: Video     },
  { value: 'gif',       label: 'GIF',       Icon: Play      },
  { value: 'prototype', label: 'Prototype', Icon: Layers    },
];

const TYPE_COLORS: Record<string, string> = {
  image:     'var(--line)',
  video:     '#60a5fa',
  gif:       '#a78bfa',
  prototype: 'var(--primary)',
};

function normalizeItems(items: string[] | MediaItem[]): MediaItem[] {
  return items.map((item) =>
    typeof item === 'string' ? { url: item, type: 'image' } : item
  );
}

function detectType(url: string): MediaItem['type'] {
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return 'video';
  if (/\.gif(\?|$)/i.test(url)) return 'gif';
  return 'image';
}

const GalerieEditor: React.FC<GalerieEditorProps> = ({
  mainImage,
  carouselImages,
  onMainImageChange,
  onCarouselImagesChange,
}) => {
  const items = normalizeItems(carouselImages);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [openTypeMenu, setOpenTypeMenu] = useState<number | null>(null);

  const update = (newItems: MediaItem[]) => onCarouselImagesChange(newItems);

  const openMainUpload = () => {
    if (typeof window !== 'undefined' && (window as any).cloudinary) {
      (window as any).cloudinary.createUploadWidget(
        { cloudName: 'dhqqx2m3y', uploadPreset: 'blog_preset', sources: ['local', 'url'], multiple: false, resourceType: 'image', theme: 'minimal' },
        (_: any, result: any) => { if (!_ && result?.event === 'success') onMainImageChange(result.info.secure_url); }
      ).open();
    }
  };

  const openMediaUpload = () => {
    if (typeof window !== 'undefined' && (window as any).cloudinary) {
      (window as any).cloudinary.createUploadWidget(
        { cloudName: 'dhqqx2m3y', uploadPreset: 'blog_preset', sources: ['local', 'url'], multiple: true, resourceType: 'auto', theme: 'minimal' },
        (_: any, result: any) => {
          if (!_ && result?.event === 'success') {
            const url = result.info.secure_url;
            const type = detectType(url);
            update([...items, { url, type }]);
          }
        }
      ).open();
    }
  };

  const remove = (i: number) => {
    update(items.filter((_, idx) => idx !== i));
    if (editingIndex === i) setEditingIndex(null);
  };

  const setAsCover = (i: number) => {
    const chosen = items[i].url;
    const prev = mainImage;
    onMainImageChange(chosen);
    update(items.map((item, idx) => idx === i ? { ...item, url: prev } : item));
  };

  const setType = (i: number, type: MediaItem['type']) => {
    update(items.map((item, idx) => idx === i ? { ...item, type } : item));
    setOpenTypeMenu(null);
  };

  const setCaption = (i: number, caption: string) => {
    update(items.map((item, idx) => idx === i ? { ...item, caption } : item));
  };

  const totalCount = (mainImage ? 1 : 0) + items.length;
  const typeCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.galerieEditor}>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <div className={styles.statChip}>
          <span className={styles.statNum}>{totalCount}</span>
          <span className={styles.statLabel}>média{totalCount !== 1 ? 's' : ''}</span>
        </div>
        {Object.entries(typeCounts).map(([type, count]) => {
          const opt = TYPE_OPTIONS.find(o => o.value === type);
          if (!opt) return null;
          return (
            <div key={type} className={styles.statChip} style={{ '--chip-color': TYPE_COLORS[type] } as any}>
              <opt.Icon size={11} />
              <span>{count} {opt.label}{count > 1 ? 's' : ''}</span>
            </div>
          );
        })}
      </div>

      {/* ── Couverture ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Star size={12} className={styles.sectionIconAccent} />
          <span className={styles.sectionTitle}>Couverture</span>
          <span className={styles.pill}>Principal</span>
        </div>

        <div
          className={`${styles.coverZone} ${mainImage ? styles.hasCover : ''}`}
          onClick={openMainUpload}
        >
          {mainImage ? (
            <>
              <img src={mainImage} alt="Couverture" className={styles.coverImg} />
              <div className={styles.coverOverlay}>
                <ImageIcon size={15} />
                <span>Remplacer</span>
              </div>
            </>
          ) : (
            <div className={styles.coverEmpty}>
              <div className={styles.coverEmptyIcon}><ImageIcon size={24} /></div>
              <span className={styles.coverEmptyTitle}>Ajouter une couverture</span>
              <span className={styles.coverEmptyHint}>16:9 recommandé</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Médias ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <ImageIcon size={12} className={styles.sectionIcon} />
          <span className={styles.sectionTitle}>Médias du projet</span>
          <span className={styles.sectionHint}>captures, vidéos, GIF, prototype, démo</span>
          <button type="button" className={styles.addBtn} onClick={openMediaUpload}>
            <Plus size={13} />
            <span>Ajouter</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.mediaEmpty} onClick={openMediaUpload}>
            <Plus size={20} />
            <span>Ajouter des médias au projet</span>
          </div>
        ) : (
          <div className={styles.mediaGrid}>
            {items.map((item, i) => {
              const opt = TYPE_OPTIONS.find(o => o.value === item.type) || TYPE_OPTIONS[0];
              const isEditing = editingIndex === i;
              return (
                <div key={i} className={`${styles.mediaCard} ${isEditing ? styles.mediaCardOpen : ''}`}>
                  {/* Thumbnail */}
                  <div className={styles.mediaThumbWrap}>
                    {item.type === 'video' ? (
                      <video src={item.url} className={styles.mediaThumb} muted />
                    ) : (
                      <img src={item.url} alt={item.caption || `Média ${i + 1}`} className={styles.mediaThumb} />
                    )}

                    {/* Actions hover */}
                    <div className={styles.mediaActions}>
                      <button
                        type="button"
                        className={styles.mediaAction}
                        onClick={() => setAsCover(i)}
                        title="Définir comme couverture"
                      >
                        <Star size={11} />
                      </button>
                      <button
                        type="button"
                        className={styles.mediaAction}
                        onClick={() => setEditingIndex(isEditing ? null : i)}
                        title="Modifier"
                      >
                        <Tag size={11} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.mediaAction} ${styles.mediaActionDelete}`}
                        onClick={() => remove(i)}
                        title="Supprimer"
                      >
                        <X size={11} />
                      </button>
                    </div>

                    {/* Index */}
                    <span className={styles.mediaIndex}>{i + 1}</span>

                    {/* Type badge */}
                    <span className={styles.mediaTypeBadge} style={{ color: TYPE_COLORS[item.type] }}>
                      <opt.Icon size={9} />
                      {opt.label}
                    </span>
                  </div>

                  {/* Editable panel */}
                  {isEditing && (
                    <div className={styles.mediaEditPanel}>
                      {/* Type selector */}
                      <div className={styles.editRow}>
                        <span className={styles.editLabel}>Type</span>
                        <div className={styles.typeSelect}>
                          <button
                            type="button"
                            className={styles.typeSelectBtn}
                            onClick={() => setOpenTypeMenu(openTypeMenu === i ? null : i)}
                          >
                            <opt.Icon size={11} />
                            <span>{opt.label}</span>
                            <ChevronDown size={10} />
                          </button>
                          {openTypeMenu === i && (
                            <div className={styles.typeMenu}>
                              {TYPE_OPTIONS.map((o) => (
                                <button
                                  key={o.value}
                                  type="button"
                                  className={`${styles.typeMenuItem} ${item.type === o.value ? styles.typeMenuActive : ''}`}
                                  onClick={() => setType(i, o.value)}
                                  style={{ '--item-color': TYPE_COLORS[o.value] } as any}
                                >
                                  <o.Icon size={11} />
                                  <span>{o.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Caption */}
                      <div className={styles.editRow}>
                        <span className={styles.editLabel}>Légende</span>
                        <input
                          type="text"
                          className={styles.captionInput}
                          value={item.caption || ''}
                          onChange={(e) => setCaption(i, e.target.value)}
                          placeholder="Description optionnelle…"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Inline add */}
            <button type="button" className={styles.inlineAdd} onClick={openMediaUpload}>
              <Plus size={18} />
              <span>Ajouter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalerieEditor;