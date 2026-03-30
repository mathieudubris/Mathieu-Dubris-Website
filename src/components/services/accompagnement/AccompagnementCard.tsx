"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Edit2, Trash2, Clock, BookOpen, Heart, CalendarDays,
} from 'lucide-react';
import { FullAccompagnement } from '@/utils/accompagnement-api';
import styles from './AccompagnementCard.module.css';

interface AccompagnementCardProps {
  accompagnement: FullAccompagnement;
  currentUser: any;
  isAdmin: boolean;
  isMember: boolean;
  isFavorite: boolean;
  isDeleteConfirm: boolean;
  onEdit: (a: FullAccompagnement) => void;
  onDelete: (id: string) => void;
  onDeleteConfirm: (id: string | null) => void;
  onClick: (a: FullAccompagnement) => void;
  onToggleFavorite: (id: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  débutant:      '#4ade80',
  intermédiaire: '#facc15',
  avancé:        '#f97316',
  expert:        '#f43f5e',
};

const LEVEL_LABELS: Record<string, string> = {
  débutant:      'Débutant',
  intermédiaire: 'Intermédiaire',
  avancé:        'Avancé',
  expert:        'Expert',
};

const AccompagnementCard: React.FC<AccompagnementCardProps> = ({
  accompagnement,
  currentUser,
  isAdmin,
  isMember,
  isFavorite,
  isDeleteConfirm,
  onEdit,
  onDelete,
  onDeleteConfirm,
  onClick,
  onToggleFavorite,
}) => {
  const levelColor = LEVEL_COLORS[accompagnement.level] || '#34d399';
  const levelLabel = LEVEL_LABELS[accompagnement.level] || accompagnement.level;
  const moduleCount = accompagnement.modules?.length ?? 0;

  const handleClick = () => {
    if (!currentUser) {
      window.location.href = '/security/access';
      return;
    }
    onClick(accompagnement);
  };

  if (isDeleteConfirm && accompagnement.id) {
    return (
      <motion.div
        className={styles.card}
        style={{ minHeight: 120 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className={styles.deleteOverlay}>
          <div className={styles.deleteContent}>
            <div className={styles.deleteEmoji}>🗑️</div>
            <h4 className={styles.deleteTitle}>Supprimer l'accompagnement ?</h4>
            <p className={styles.deleteMsg}>Cette action est irréversible.</p>
            <div className={styles.deleteActions}>
              <button
                onClick={(e) => { e.stopPropagation(); if (accompagnement.id) onDelete(accompagnement.id); }}
                className={styles.deleteConfirmBtn}
              >
                Supprimer
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteConfirm(null); }}
                className={styles.deleteCancelBtn}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      onClick={handleClick}
    >
      {/* LEFT — Fixed cover */}
      <div className={styles.coverWrap}>
        <img
          src={accompagnement.image || '/default-accompagnement.jpg'}
          alt={accompagnement.title}
          className={styles.coverImg}
          onError={(e) => { e.currentTarget.src = '/default-accompagnement.jpg'; }}
        />
        <div className={styles.coverGradient} />

        {/* Level badge */}
        <span className={styles.levelBadge} style={{ color: levelColor, borderColor: levelColor }}>
          {levelLabel}
        </span>

        {/* Member badge */}
        {isMember && (
          <div className={`${styles.statusBadge} ${styles.statusMember}`}>
            Inscrit
          </div>
        )}

        {/* Favorite button */}
        {currentUser && accompagnement.id && (
          <button
            className={`${styles.favBtn} ${isFavorite ? styles.favBtnActive : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(accompagnement.id!); }}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={11} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <div className={styles.adminActions}>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); onEdit(accompagnement); }}
              title="Modifier"
            >
              <Edit2 size={10} />
            </button>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDeleteConfirm(accompagnement.id || ''); }}
              title="Supprimer"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT — Content */}
      <div className={styles.cardBody}>
        <span className={styles.category}>{accompagnement.category || 'Non catégorisé'}</span>
        <h3 className={styles.cardTitle}>{accompagnement.title}</h3>
        <p className={styles.description}>
          {accompagnement.description || 'Aucune description disponible.'}
        </p>

        {/* Meta */}
        <div className={styles.metaRow}>
          {accompagnement.duration && (
            <div className={styles.metaItem}>
              <Clock size={10} />
              {accompagnement.duration}
            </div>
          )}
          {moduleCount > 0 && (
            <div className={styles.metaItem}>
              <BookOpen size={10} />
              {moduleCount} étape{moduleCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* CTA — animated button → /services/booking */}
        <div className={styles.ctaWrap}>
          <button
            data-tooltip="Prendre un RDV"
            className={styles.animBtn}
            onClick={(e) => {
              e.stopPropagation();
              if (!currentUser) { window.location.href = '/security/access'; return; }
              window.location.href = '/services/booking';
            }}
          >
            <div className={styles.animBtnWrapper}>
              <div className={styles.animBtnText}>Plus d'infos</div>
              <span className={styles.animBtnIcon}>
                <CalendarDays size={20} />
              </span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AccompagnementCard;