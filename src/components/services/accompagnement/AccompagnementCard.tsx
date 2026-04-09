"use client";

import React from 'react';
import { Edit2, Trash2, Clock, BookOpen, Bookmark, CalendarDays } from 'lucide-react';
import { FullAccompagnement } from '@/utils/accompagnement-api';
import styles from './AccompagnementCard.module.css';

interface AccompagnementCardProps {
  accompagnement: FullAccompagnement;
  currentUser: any;
  isAdmin: boolean;
  isMember: boolean;
  isFavorite: boolean;
  isDeleteConfirm: boolean;
  isActive: boolean;
  isCentered: boolean;
  onActivate: () => void;
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
  isActive,
  isCentered,
  onActivate,
  onEdit,
  onDelete,
  onDeleteConfirm,
  onClick,
  onToggleFavorite,
}) => {
  const levelColor = LEVEL_COLORS[accompagnement.level] || '#34d399';
  const levelLabel = LEVEL_LABELS[accompagnement.level] || accompagnement.level;
  const moduleCount = accompagnement.modules?.length ?? 0;

  if (isDeleteConfirm && accompagnement.id) {
    return (
      <div className={`${styles.item} ${styles.itemActive}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.bg} style={{ backgroundImage: `url(${accompagnement.image || '/default-accompagnement.jpg'})` }} />
        <div className={styles.overlay} />
        <div className={styles.deleteContent}>
          <div className={styles.deleteEmoji}>🗑️</div>
          <h4 className={styles.deleteTitle}>Supprimer ?</h4>
          <p className={styles.deleteMsg}>Action irréversible.</p>
          <div className={styles.deleteActions}>
            <button onClick={(e) => { e.stopPropagation(); if (accompagnement.id) onDelete(accompagnement.id); }} className={styles.deleteConfirmBtn}>Supprimer</button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteConfirm(null); }} className={styles.deleteCancelBtn}>Annuler</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        styles.item,
        isActive ? styles.itemActive : '',
        isCentered && !isActive ? styles.itemCentered : '',
      ].filter(Boolean).join(' ')}
      onClick={onActivate}
    >
      <div className={styles.bg} style={{ backgroundImage: `url(${accompagnement.image || '/default-accompagnement.jpg'})` }} />
      <div className={styles.overlay} />

      {/* Tap hint — only visible when centered but not yet open */}
      {isCentered && !isActive && (
        <div className={styles.tapHint}>Appuyer pour ouvrir</div>
      )}

      {currentUser && accompagnement.id && (
        <button
          className={`${styles.favBtn} ${isFavorite ? styles.favBtnActive : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(accompagnement.id!); }}
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Bookmark size={12} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      )}

      {isAdmin && (
        <div className={styles.adminActions} onClick={(e) => e.stopPropagation()}>
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onEdit(accompagnement); }} title="Modifier">
            <Edit2 size={10} />
          </button>
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onDeleteConfirm(accompagnement.id || ''); }} title="Supprimer">
            <Trash2 size={10} />
          </button>
        </div>
      )}

      <div className={styles.itemDesc}>
        <div className={styles.metaTop}>
          <span className={styles.category}>{accompagnement.category || 'Non catégorisé'}</span>
          <span className={styles.levelBadge} style={{ color: levelColor, borderColor: levelColor }}>{levelLabel}</span>
        </div>
        <h3 className={styles.cardTitle}>{accompagnement.title}</h3>
        <p className={styles.description}>{accompagnement.description || 'Aucune description disponible.'}</p>
        <div className={styles.metaRow}>
          {accompagnement.duration && <div className={styles.metaItem}><Clock size={10} />{accompagnement.duration}</div>}
          {moduleCount > 0 && <div className={styles.metaItem}><BookOpen size={10} />{moduleCount} étape{moduleCount > 1 ? 's' : ''}</div>}
        </div>
        <div className={styles.ctaWrap}>
          <button className={styles.ctaBtn} onClick={(e) => {
            e.stopPropagation();
            if (!currentUser) { window.location.href = '/security/access'; return; }
            if (isMember) onClick(accompagnement);
            else window.location.href = '/services/booking';
          }}>
            {isMember ? <><BookOpen size={14} />Continuer</> : <><CalendarDays size={14} />Plus d'infos</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccompagnementCard;