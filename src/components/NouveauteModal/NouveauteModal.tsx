"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ArrowLeftRight, CheckCircle2, Loader2 } from 'lucide-react';
import { getNouveautes, getNouveauteBySource, upsertNouveaute, removeNouveaute, Nouveaute, NouveauteType } from '@/utils/nouveautes-api';
import styles from './NouveauteModal.module.css';

interface NouveauteModalProps {
  sourceId: string;
  type: NouveauteType;
  title: string;
  description: string;
  image: string;
  link: string;
  /** membres pour les projets */
  members?: any[];
  software?: any[];
  progress?: number;
  /** tags pour les blogs */
  tags?: string[];
  category?: string;
  onClose: () => void;
}

const POSITIONS = [1, 2, 3, 4, 5];

const NouveauteModal: React.FC<NouveauteModalProps> = ({
  sourceId, type, title, description, image, link,
  members, software, progress, tags, category, onClose
}) => {
  const [allNouveautes, setAllNouveautes] = useState<Nouveaute[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Nouveaute | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [all, mine] = await Promise.all([
        getNouveautes(),
        getNouveauteBySource(sourceId)
      ]);
      setAllNouveautes(all);
      setCurrentEntry(mine);
      setSelectedPosition(mine?.position ?? null);
      setLoading(false);
    };
    load();
  }, [sourceId]);

  const getOccupant = (pos: number): Nouveaute | undefined =>
    allNouveautes.find(n => n.position === pos && n.sourceId !== sourceId);

  const handleSave = async () => {
    if (!selectedPosition) return;
    setSaving(true);
    try {
      await upsertNouveaute({
        sourceId,
        type,
        position: selectedPosition,
        title,
        description,
        image,
        link,
        ctaLabel: type === 'project' ? 'Voir le projet' : 'Lire l\'article',
        members: members || [],
        software: software || [],
        progress: progress ?? 0,
        tags: tags || [],
        category: category || '',
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeNouveaute(sourceId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <Star size={16} className={styles.starIcon} />
              <span className={styles.headerTitle}>
                {currentEntry ? 'Modifier la position' : 'Ajouter aux Nouveautés'}
              </span>
            </div>
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingWrap}>
              <Loader2 size={24} className={styles.spinner} />
            </div>
          ) : (
            <div className={styles.body}>
              {/* Aperçu */}
              <div className={styles.preview}>
                <img
                  src={image || '/default-project.jpg'}
                  alt={title}
                  className={styles.previewImg}
                  onError={e => { e.currentTarget.src = '/default-project.jpg'; }}
                />
                <div className={styles.previewInfo}>
                  <span className={styles.previewType}>
                    {type === 'project' ? '🚀 Projet' : '📝 Article'}
                  </span>
                  <p className={styles.previewTitle}>{title}</p>
                </div>
              </div>

              {/* Sélecteur de positions */}
              <p className={styles.hint}>
                Choisissez la position dans le carousel (1 = premier affiché)
              </p>

              <div className={styles.positions}>
                {POSITIONS.map(pos => {
                  const occupant = getOccupant(pos);
                  const isMine = currentEntry?.position === pos;
                  const isSelected = selectedPosition === pos;

                  return (
                    <button
                      key={pos}
                      className={`${styles.posBtn} ${isSelected ? styles.posBtnSelected : ''} ${isMine ? styles.posBtnMine : ''}`}
                      onClick={() => setSelectedPosition(pos)}
                    >
                      <span className={styles.posNumber}>{pos}</span>
                      <div className={styles.posInfo}>
                        {isMine ? (
                          <span className={styles.posLabel} style={{ color: 'var(--primary)' }}>
                            ✓ Position actuelle
                          </span>
                        ) : occupant ? (
                          <>
                            <div className={styles.occupantRow}>
                              <img
                                src={occupant.image || '/default-project.jpg'}
                                alt={occupant.title}
                                className={styles.occupantImg}
                                onError={e => { e.currentTarget.src = '/default-project.jpg'; }}
                              />
                              <span className={styles.occupantTitle}>{occupant.title}</span>
                            </div>
                            {isSelected && (
                              <span className={styles.swapHint}>
                                <ArrowLeftRight size={10} /> Échange automatique
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={styles.posLabel}>Libre</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                {currentEntry && (
                  <button
                    onClick={handleRemove}
                    disabled={removing}
                    className={styles.removeBtn}
                  >
                    {removing ? <Loader2 size={14} className={styles.spinner} /> : null}
                    Retirer des nouveautés
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !selectedPosition || success}
                  className={styles.saveBtn}
                >
                  {success ? (
                    <><CheckCircle2 size={16} /> Enregistré !</>
                  ) : saving ? (
                    <><Loader2 size={14} className={styles.spinner} /> Enregistrement...</>
                  ) : (
                    currentEntry ? 'Mettre à jour' : 'Ajouter'
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NouveauteModal;
