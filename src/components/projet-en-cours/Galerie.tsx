"use client";

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Galerie.module.css';

interface GalerieProps {
  images: string[];
  projectTitle: string;
}

const Galerie: React.FC<GalerieProps> = ({ images, projectTitle }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className={styles.empty}>
        <span>Aucune image dans la galerie.</span>
      </div>
    );
  }

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((i) => (i! - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((i) => (i! + 1) % images.length);
  };

  return (
    <>
      {/* Grille */}
      <div className={styles.grid}>
        {images.map((src, i) => (
          <button
            key={i}
            className={styles.cell}
            onClick={() => openLightbox(i)}
            aria-label={`Voir image ${i + 1}`}
          >
            <img src={src} alt={`${projectTitle} - ${i + 1}`} className={styles.thumb} />
            <div className={styles.cellOverlay} />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <button className={styles.lightboxClose} onClick={closeLightbox}>
            <X size={20} />
          </button>

          <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIndex]}
              alt={`${projectTitle} - ${lightboxIndex + 1}`}
              className={styles.lightboxImg}
            />
          </div>

          {images.length > 1 && (
            <>
              <button className={`${styles.lightboxArrow} ${styles.prev}`} onClick={prev}>
                <ChevronLeft size={24} />
              </button>
              <button className={`${styles.lightboxArrow} ${styles.next}`} onClick={next}>
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Compteur */}
          <span className={styles.counter}>
            {lightboxIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </>
  );
};

export default Galerie;