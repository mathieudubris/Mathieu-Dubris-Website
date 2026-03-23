"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Edit2, Trash2, Clock, BookOpen, ArrowRight,
  MoreVertical, CheckCircle2, PlayCircle, Circle,
} from 'lucide-react';
import { FullFormation } from '@/utils/formation-api';
import styles from './FormationCard.module.css';

interface FormationCardProps {
  formation: FullFormation;
  currentUser: any;
  isAdmin: boolean;
  isMember: boolean;
  isDeleteConfirm: boolean;
  onEdit: (f: FullFormation) => void;
  onDelete: (id: string) => void;
  onDeleteConfirm: (id: string | null) => void;
  onClick: (f: FullFormation) => void;
  progress?: number;
  variant?: 'default' | 'progress';
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

const getStatusInfo = (progress: number, isMember: boolean) => {
  if (progress === 100) return { label: 'Terminé', cls: styles.statusTermine };
  if (progress > 0) return { label: 'En cours', cls: styles.statusEnCours };
  if (isMember) return { label: 'À commencer', cls: styles.statusACommencer };
  return { label: 'Catalogue', cls: styles.statusGris };
};

const getActionBtn = (progress: number, isMember: boolean) => {
  if (progress === 100) return { label: 'Voir le certificat', cls: styles.cardActionBtnOutline };
  if (progress > 0) return { label: 'Continuer', cls: styles.cardActionBtnPrimary };
  if (isMember) return { label: 'Commencer', cls: styles.cardActionBtnPrimary };
  return null;
};

const FormationCard: React.FC<FormationCardProps> = ({
  formation,
  currentUser,
  isAdmin,
  isMember,
  isDeleteConfirm,
  onEdit,
  onDelete,
  onDeleteConfirm,
  onClick,
  progress = 0,
  variant = 'default',
}) => {
  const levelColor = LEVEL_COLORS[formation.level] || '#34d399';
  const levelLabel = LEVEL_LABELS[formation.level] || formation.level;
  const status = getStatusInfo(progress, isMember);
  const actionBtn = getActionBtn(progress, isMember);

  const moduleCount = formation.modules?.length ?? 0;

  const handleClick = () => {
    if (!currentUser) {
      window.location.href = '/security/access';
      return;
    }
    onClick(formation);
  };

  if (isDeleteConfirm && formation.id) {
    return (
      <motion.div
        className={variant === 'progress' ? styles.progressCard : styles.card}
        style={{ minHeight: 220 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className={styles.deleteOverlay}>
          <div className={styles.deleteContent}>
            <div className={styles.deleteEmoji}>🗑️</div>
            <h4 className={styles.deleteTitle}>Supprimer la formation ?</h4>
            <p className={styles.deleteMsg}>Cette action est irréversible.</p>
            <div className={styles.deleteActions}>
              <button
                onClick={(e) => { e.stopPropagation(); if (formation.id) onDelete(formation.id); }}
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

  /* ── PROGRESS CARD (in-progress section) ── */
  if (variant === 'progress') {
    return (
      <motion.div
        className={styles.progressCard}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        onClick={handleClick}
      >
        <img
          src={formation.image || '/default-formation.jpg'}
          alt={formation.title}
          className={styles.progressThumb}
          onError={(e) => { e.currentTarget.src = '/default-formation.jpg'; }}
        />
        <div className={styles.progressBody}>
          <div className={styles.progressTop}>
            <h3 className={styles.progressTitle}>{formation.title}</h3>
            {isAdmin && (
              <button
                className={styles.progressMenuBtn}
                onClick={(e) => { e.stopPropagation(); onEdit(formation); }}
              >
                <MoreVertical size={14} />
              </button>
            )}
          </div>

          <div className={styles.progressMeta}>
            <span className={styles.progressPercent}>Progrès : {progress}%</span>
            <span className={styles.progressStatus}>Statut : En cours</span>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          <button
            className={styles.continueBtn}
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
          >
            Continuer
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── DEFAULT CARD ── */
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      onClick={handleClick}
    >
      {/* Cover */}
      <div className={styles.coverWrap}>
        <img
          src={formation.image || '/default-formation.jpg'}
          alt={formation.title}
          className={styles.coverImg}
          onError={(e) => { e.currentTarget.src = '/default-formation.jpg'; }}
        />
        <div className={styles.coverGradient} />

        {/* Status badge */}
        <div className={`${styles.statusBadge} ${status.cls}`}>
          {status.label}
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className={styles.adminActions}>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); onEdit(formation); }}
              title="Modifier"
            >
              <Edit2 size={10} />
            </button>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDeleteConfirm(formation.id || ''); }}
              title="Supprimer"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}

        {/* Level badge */}
        <span className={styles.levelBadge} style={{ color: levelColor, borderColor: levelColor }}>
          {levelLabel}
        </span>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <span className={styles.category}>{formation.category || 'Non catégorisé'}</span>
        <h3 className={styles.cardTitle}>{formation.title}</h3>
        <p className={styles.description}>
          {formation.description || 'Aucune description disponible.'}
        </p>

        {/* Mini progress bar if member with progress */}
        {isMember && progress > 0 && (
          <div className={styles.miniProgressWrap}>
            <div className={styles.miniProgressMeta}>
              <span className={styles.miniProgressPct}>{progress}%</span>
              <span className={styles.miniProgressLabel}>
                {progress === 100 ? 'Terminé' : 'En cours'}
              </span>
            </div>
            <div className={styles.miniBar}>
              <div className={styles.miniBarFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Meta */}
        <div className={styles.metaRow}>
          {formation.duration && (
            <div className={styles.metaItem}>
              <Clock size={10} />
              {formation.duration}
            </div>
          )}
          {moduleCount > 0 && (
            <div className={styles.metaItem}>
              <BookOpen size={10} />
              {moduleCount} module{moduleCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Action button */}
        {actionBtn && (
          <button
            className={`${styles.cardActionBtn} ${actionBtn.cls}`}
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
          >
            {actionBtn.label}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default FormationCard;
