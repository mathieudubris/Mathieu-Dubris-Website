"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Sparkles, Users, Clock, BookMarked } from 'lucide-react';
import { FullAccompagnement } from '@/utils/accompagnement-api';
import styles from './AccompagnementCard.module.css';

interface AccompagnementCardProps {
  accompagnement: FullAccompagnement;
  currentUser: any;
  isAdmin: boolean;
  isMember: boolean;
  isDeleteConfirm: boolean;
  onEdit: (a: FullAccompagnement) => void;
  onDelete: (id: string) => void;
  onDeleteConfirm: (id: string | null) => void;
  onClick: (a: FullAccompagnement) => void;
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
  isDeleteConfirm,
  onEdit,
  onDelete,
  onDeleteConfirm,
  onClick,
}) => {
  // Tout est public — badge "Accès anticipé" pour les non-membres uniquement
  const isEarlyAccess = !isMember && !isAdmin;
  const levelColor = LEVEL_COLORS[accompagnement.level] || 'var(--primary)';
  const levelLabel = LEVEL_LABELS[accompagnement.level] || accompagnement.level;

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className={styles.deleteOverlay}>
          <div className={styles.deleteContent}>
            <div className={styles.deleteEmoji}>🗑️</div>
            <h4 className={styles.deleteTitle}>Supprimer l'accompagnement ?</h4>
            <p className={styles.deleteMsg}>Cette action est irréversible</p>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
    >
      {/* Badges + admin actions */}
      <div className={styles.cardHeader}>
        <div className={styles.badgesLeft}>
          {isMember && (
            <div className={styles.memberBadge}>
              <Users size={9} />
              <span>Suivi</span>
            </div>
          )}
          {isEarlyAccess && (
            <div className={styles.lockedBadge}>
              <Sparkles size={9} />
              <span>Accès anticipé</span>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className={styles.adminActions}>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); onEdit(accompagnement); }}
              title="Modifier"
            >
              <Edit2 size={11} />
            </button>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDeleteConfirm(accompagnement.id || ''); }}
              title="Supprimer"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Cover */}
      <div className={styles.coverWrap}>
        <img
          src={accompagnement.image || '/default-accompagnement.jpg'}
          alt={accompagnement.title}
          className={styles.coverImg}
          onError={(e) => { e.currentTarget.src = '/default-accompagnement.jpg'; }}
        />
        <span className={styles.levelBadge} style={{ color: levelColor, borderColor: levelColor }}>
          {levelLabel}
        </span>
      </div>

      {/* Content */}
      <div className={styles.cardBody}>
        <div className={styles.bodyContent}>
          <span className={styles.category}>{accompagnement.category || 'Non catégorisé'}</span>
          <h3 className={styles.title}>{accompagnement.title}</h3>
          <p className={styles.description}>
            {accompagnement.description || 'Aucune description disponible.'}
          </p>

          <div className={styles.metaRow}>
            {accompagnement.duration && (
              <span className={styles.metaItem}>
                <Clock size={10} />
                {accompagnement.duration}
              </span>
            )}
            {accompagnement.modules && accompagnement.modules.length > 0 && (
              <span className={styles.metaItem}>
                <BookMarked size={10} />
                {accompagnement.modules.length} étape{accompagnement.modules.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Footer simplifié - plus de liste de membres */}
        <div className={styles.cardFooter}>
          <div className={styles.dateLabel}>
            {accompagnement.createdAt
              ? (() => {
                  try {
                    const d = accompagnement.createdAt.toDate
                      ? accompagnement.createdAt.toDate()
                      : new Date(accompagnement.createdAt);
                    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  } catch { return ''; }
                })()
              : ''}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AccompagnementCard;