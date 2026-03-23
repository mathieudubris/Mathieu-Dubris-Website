"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, GraduationCap, Clock, BookOpen, ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
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

const formatDateShort = (date: any): string => {
  if (!date) return '—';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return '—'; }
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
}) => {
  // Tout est public — badge "Accès anticipé" pour les non-membres uniquement
  const isEarlyAccess = !isMember && !isAdmin;
  const levelColor = LEVEL_COLORS[formation.level] || 'var(--primary)';
  const levelLabel = LEVEL_LABELS[formation.level] || formation.level;

  const views = formation.views ?? 0;
  const purchases = formation.teamMembers?.length ?? 0;
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
        className={styles.card}
        style={{ minHeight: 340 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className={styles.deleteOverlay}>
          <div className={styles.deleteContent}>
            <div className={styles.deleteEmoji}>🗑️</div>
            <h4 className={styles.deleteTitle}>Supprimer la formation ?</h4>
            <p className={styles.deleteMsg}>Cette action est irréversible et supprimera<br />tous les modules et données associés.</p>
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

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      onClick={handleClick}
    >
      {/* ── COVER carré ── */}
      <div className={styles.coverWrap}>
        <img
          src={formation.image || '/default-formation.jpg'}
          alt={formation.title}
          className={styles.coverImg}
          onError={(e) => { e.currentTarget.src = '/default-formation.jpg'; }}
        />
        <div className={styles.coverGradient} />

        {/* Header: badges + admin actions */}
        <div className={styles.cardHeader}>
          <div className={styles.badgesLeft}>
            {isMember && (
              <div className={styles.memberBadge}>
                <GraduationCap size={9} />
                <span>Inscrit</span>
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
                onClick={(e) => { e.stopPropagation(); onEdit(formation); }}
                title="Modifier"
              >
                <Edit2 size={11} />
              </button>
              <button
                className={styles.actionBtn}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDeleteConfirm(formation.id || ''); }}
                title="Supprimer"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Footer cover: niveau + durée */}
        <div className={styles.coverFooter}>
          <span className={styles.levelBadge} style={{ color: levelColor, borderColor: levelColor }}>
            {levelLabel}
          </span>
          {formation.duration && (
            <span className={styles.durationChip}>
              <Clock size={9} />
              {formation.duration}
            </span>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className={styles.cardBody}>
        <div className={styles.bodyContent}>
          <div className={styles.topRow}>
            <span className={styles.category}>{formation.category || 'Non catégorisé'}</span>
          </div>
          <h3 className={styles.title}>{formation.title}</h3>
          <p className={styles.description}>
            {formation.description || 'Aucune description disponible.'}
          </p>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}</span>
            <span className={styles.statLabel}>Vues</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{purchases}</span>
            <span className={styles.statLabel}>Inscrits</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{moduleCount}</span>
            <span className={styles.statLabel}>Modules</span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.dateItem}>
            <CalendarDays size={9} />
            <span>{formatDateShort(formation.createdAt)}</span>
          </div>
          <div className={styles.openHint}>
            Ouvrir <ArrowRight size={11} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FormationCard;