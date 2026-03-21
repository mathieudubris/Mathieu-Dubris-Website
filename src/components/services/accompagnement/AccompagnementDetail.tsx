"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Eye, BookMarked, Users, Target, Info, Clock,
  Globe, DollarSign, ChevronDown, ChevronRight,
} from 'lucide-react';
import { FullAccompagnement, incrementAccompagnementViews } from '@/utils/accompagnement-api';
import styles from './AccompagnementDetail.module.css';

interface Props {
  accompagnement: FullAccompagnement;
  currentUser: any;
  onBack: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  débutant:      '#4ade80',
  intermédiaire: '#facc15',
  avancé:        '#f97316',
  expert:        '#f43f5e',
};

const MemberCard: React.FC<{ member: any }> = ({ member }) => {
  const [failed, setFailed] = useState(false);
  const name = member.displayName || member.email || 'Membre';
  const letter = name.charAt(0).toUpperCase();

  return (
    <div className={styles.memberCard}>
      <div className={styles.memberAvatar}>
        {member.photoURL && !failed ? (
          <img src={member.photoURL} alt={name} onError={() => setFailed(true)} />
        ) : (
          <div className={styles.memberAvatarLetter}>{letter}</div>
        )}
      </div>
      <div className={styles.memberInfo}>
        <span className={styles.memberName}>{name}</span>
        {member.email && <span className={styles.memberEmail}>{member.email}</span>}
      </div>
    </div>
  );
};

const AccompagnementDetail: React.FC<Props> = ({ accompagnement, currentUser, onBack }) => {
  const [views, setViews] = useState(accompagnement.views ?? 0);
  const [hasIncremented, setHasIncremented] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (currentUser && !hasIncremented && accompagnement.id) {
      incrementAccompagnementViews(accompagnement.id).then(() => {
        setViews((v) => v + 1);
        setHasIncremented(true);
      });
    }
  }, [accompagnement.id, currentUser]);

  const toggleModule = (i: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const levelColor = LEVEL_COLORS[accompagnement.level] || 'var(--primary)';

  const formatDate = (date: any) => {
    if (!date) return '—';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return '—'; }
  };

  const images: string[] = (accompagnement.carouselImages || []).map((i) =>
    typeof i === 'string' ? i : (i as any).url
  ).filter(Boolean);

  return (
    <div className={styles.overlay} onClick={onBack}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <img
            src={accompagnement.image || '/default-accompagnement.jpg'}
            alt={accompagnement.title}
            className={styles.headerThumb}
            onError={(e) => { e.currentTarget.src = '/default-accompagnement.jpg'; }}
          />
          <div className={styles.headerInfo}>
            <span className={styles.headerCategory}>{accompagnement.category}</span>
            <h1 className={styles.headerTitle}>{accompagnement.title}</h1>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.levelPill} style={{ color: levelColor, borderColor: levelColor }}>
              {accompagnement.level?.charAt(0).toUpperCase()}{accompagnement.level?.slice(1)}
            </span>
            <span className={styles.viewsMeta}><Eye size={12} />{views} vue{views !== 1 ? 's' : ''}</span>
          </div>
          <button className={styles.closeBtn} onClick={onBack}><X size={17} /></button>
        </div>

        {/* Content */}
        <div className={styles.content}>

          {/* Stats rapides */}
          <div className={styles.statsGrid}>
            {accompagnement.duration && (
              <div className={styles.statBox}>
                <Clock size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{accompagnement.duration}</span>
                <span className={styles.statLabel}>Durée</span>
              </div>
            )}
            {accompagnement.modules && accompagnement.modules.length > 0 && (
              <div className={styles.statBox}>
                <BookMarked size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{accompagnement.modules.length}</span>
                <span className={styles.statLabel}>Étape{accompagnement.modules.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {accompagnement.members && accompagnement.members.length > 0 && (
              <div className={styles.statBox}>
                <Users size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{accompagnement.members.length}</span>
                <span className={styles.statLabel}>Bénéficiaire{accompagnement.members.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {accompagnement.language && (
              <div className={styles.statBox}>
                <Globe size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{accompagnement.language}</span>
                <span className={styles.statLabel}>Langue</span>
              </div>
            )}
            {accompagnement.price !== undefined && accompagnement.price !== null && (
              <div className={styles.statBox}>
                <DollarSign size={16} className={styles.statIcon} />
                <span className={styles.statValue}>
                  {accompagnement.price === 0 ? 'Gratuit' : `${accompagnement.price} ${accompagnement.currency || 'EUR'}`}
                </span>
                <span className={styles.statLabel}>Tarif</span>
              </div>
            )}
          </div>

          {/* Description */}
          {accompagnement.description && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}><Info size={14} /><h2 className={styles.sectionTitle}>À propos</h2></div>
              <p className={styles.sectionText}>{accompagnement.description}</p>
            </div>
          )}

          {/* Objectif */}
          {accompagnement.objective && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}><Target size={14} /><h2 className={styles.sectionTitle}>Objectif</h2></div>
              <p className={styles.sectionText}>{accompagnement.objective}</p>
            </div>
          )}

          {/* Prérequis + public */}
          {(accompagnement.prerequisites || accompagnement.targetAudience) && (
            <div className={styles.infoRow}>
              {accompagnement.targetAudience && (
                <div className={styles.infoBox}>
                  <span className={styles.infoBoxLabel}><Users size={12} /> Public cible</span>
                  <p className={styles.infoBoxText}>{accompagnement.targetAudience}</p>
                </div>
              )}
              {accompagnement.prerequisites && (
                <div className={styles.infoBox}>
                  <span className={styles.infoBoxLabel}><BookMarked size={12} /> Prérequis</span>
                  <p className={styles.infoBoxText}>{accompagnement.prerequisites}</p>
                </div>
              )}
            </div>
          )}

          {/* Étapes */}
          {accompagnement.modules && accompagnement.modules.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <BookMarked size={14} />
                <h2 className={styles.sectionTitle}>Contenu ({accompagnement.modules.length} étape{accompagnement.modules.length > 1 ? 's' : ''})</h2>
              </div>
              <div className={styles.modulesList}>
                {[...accompagnement.modules].sort((a, b) => a.order - b.order).map((mod, i) => {
                  const isOpen = expandedModules.has(i);
                  return (
                    <div key={mod.id} className={`${styles.moduleItem} ${isOpen ? styles.moduleOpen : ''}`}>
                      <button className={styles.moduleToggle} onClick={() => toggleModule(i)}>
                        <div className={styles.moduleNum}>{i + 1}</div>
                        <span className={styles.moduleTitle}>{mod.title || 'Étape sans titre'}</span>
                        <div className={styles.moduleRight}>
                          {mod.duration && <span className={styles.moduleDuration}><Clock size={10} />{mod.duration}</span>}
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      </button>
                      {isOpen && mod.description && (
                        <div className={styles.moduleDesc}>{mod.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Galerie */}
          {images.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}><Info size={14} /><h2 className={styles.sectionTitle}>Galerie</h2></div>
              <div className={styles.galleryGrid}>
                {images.map((url, i) => (
                  <div key={i} className={styles.galleryItem}>
                    <img src={url} alt={`Média ${i + 1}`} className={styles.galleryImg} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bénéficiaires */}
          {accompagnement.members && accompagnement.members.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Users size={14} />
                <h2 className={styles.sectionTitle}>Bénéficiaires ({accompagnement.members.length})</h2>
              </div>
              <div className={styles.membersGrid}>
                {accompagnement.members.map((m: any, i: number) => (
                  <MemberCard key={i} member={m} />
                ))}
              </div>
            </div>
          )}

          <div className={styles.dateRow}>
            <span>Créé le {formatDate(accompagnement.createdAt)}</span>
            {accompagnement.updatedAt && <span> · Mis à jour le {formatDate(accompagnement.updatedAt)}</span>}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccompagnementDetail;
