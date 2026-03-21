"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Eye, BookOpen, Users, Target, Info, Clock,
  GraduationCap, Globe, DollarSign, ChevronDown, ChevronRight,
} from 'lucide-react';
import { FullFormation, incrementFormationViews } from '@/utils/formation-api';
import styles from './FormationDetail.module.css';

interface Props {
  formation: FullFormation;
  currentUser: any;
  onBack: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  débutant:      '#4ade80',
  intermédiaire: '#facc15',
  avancé:        '#f97316',
  expert:        '#f43f5e',
};

// Avatar membre (compte Google)
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

const FormationDetail: React.FC<Props> = ({ formation, currentUser, onBack }) => {
  const [views, setViews] = useState(formation.views ?? 0);
  const [hasIncremented, setHasIncremented] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (currentUser && !hasIncremented && formation.id) {
      incrementFormationViews(formation.id).then(() => {
        setViews((v) => v + 1);
        setHasIncremented(true);
      });
    }
  }, [formation.id, currentUser]);

  const toggleModule = (i: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const levelColor = LEVEL_COLORS[formation.level] || 'var(--primary)';

  const formatDate = (date: any) => {
    if (!date) return '—';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return '—'; }
  };

  const images: string[] = (formation.carouselImages || []).map((i) =>
    typeof i === 'string' ? i : (i as any).url
  ).filter(Boolean);

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className={styles.modal}>
        {/* ── HEADER ── */}
        <div className={styles.header}>
          <img
            src={formation.image || '/default-formation.jpg'}
            alt={formation.title}
            className={styles.headerThumb}
            onError={(e) => { e.currentTarget.src = '/default-formation.jpg'; }}
          />
          <div className={styles.headerInfo}>
            <span className={styles.headerCategory}>{formation.category}</span>
            <h1 className={styles.headerTitle}>{formation.title}</h1>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.levelPill} style={{ color: levelColor, borderColor: levelColor }}>
              {formation.level?.charAt(0).toUpperCase()}{formation.level?.slice(1)}
            </span>
            <span className={styles.viewsMeta}><Eye size={12} />{views} vue{views !== 1 ? 's' : ''}</span>
          </div>
          <button className={styles.closeBtn} onClick={onBack}><X size={17} /></button>
        </div>

        {/* ── CONTENT ── */}
        <div className={styles.content}>

          {/* Stats rapides */}
          <div className={styles.statsGrid}>
            {formation.duration && (
              <div className={styles.statBox}>
                <Clock size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{formation.duration}</span>
                <span className={styles.statLabel}>Durée</span>
              </div>
            )}
            {formation.modules && formation.modules.length > 0 && (
              <div className={styles.statBox}>
                <BookOpen size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{formation.modules.length}</span>
                <span className={styles.statLabel}>Module{formation.modules.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {formation.members && formation.members.length > 0 && (
              <div className={styles.statBox}>
                <Users size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{formation.members.length}</span>
                <span className={styles.statLabel}>Inscrit{formation.members.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {formation.language && (
              <div className={styles.statBox}>
                <Globe size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{formation.language}</span>
                <span className={styles.statLabel}>Langue</span>
              </div>
            )}
            {formation.price !== undefined && formation.price !== null && (
              <div className={styles.statBox}>
                <DollarSign size={16} className={styles.statIcon} />
                <span className={styles.statValue}>
                  {formation.price === 0 ? 'Gratuit' : `${formation.price} ${formation.currency || 'EUR'}`}
                </span>
                <span className={styles.statLabel}>Tarif</span>
              </div>
            )}
          </div>

          {/* Description */}
          {formation.description && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Info size={14} />
                <h2 className={styles.sectionTitle}>À propos</h2>
              </div>
              <p className={styles.sectionText}>{formation.description}</p>
            </div>
          )}

          {/* Objectif */}
          {formation.objective && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Target size={14} />
                <h2 className={styles.sectionTitle}>Objectif</h2>
              </div>
              <p className={styles.sectionText}>{formation.objective}</p>
            </div>
          )}

          {/* Prérequis + public */}
          {(formation.prerequisites || formation.targetAudience) && (
            <div className={styles.infoRow}>
              {formation.targetAudience && (
                <div className={styles.infoBox}>
                  <span className={styles.infoBoxLabel}><Users size={12} /> Public cible</span>
                  <p className={styles.infoBoxText}>{formation.targetAudience}</p>
                </div>
              )}
              {formation.prerequisites && (
                <div className={styles.infoBox}>
                  <span className={styles.infoBoxLabel}><GraduationCap size={12} /> Prérequis</span>
                  <p className={styles.infoBoxText}>{formation.prerequisites}</p>
                </div>
              )}
            </div>
          )}

          {/* Modules */}
          {formation.modules && formation.modules.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <BookOpen size={14} />
                <h2 className={styles.sectionTitle}>Programme ({formation.modules.length} modules)</h2>
              </div>
              <div className={styles.modulesList}>
                {[...formation.modules].sort((a, b) => a.order - b.order).map((mod, i) => {
                  const isOpen = expandedModules.has(i);
                  return (
                    <div key={mod.id} className={`${styles.moduleItem} ${isOpen ? styles.moduleOpen : ''}`}>
                      <button
                        className={styles.moduleToggle}
                        onClick={() => toggleModule(i)}
                      >
                        <div className={styles.moduleNum}>{i + 1}</div>
                        <span className={styles.moduleTitle}>{mod.title || 'Module sans titre'}</span>
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
              <div className={styles.sectionHeader}>
                <Info size={14} />
                <h2 className={styles.sectionTitle}>Galerie</h2>
              </div>
              <div className={styles.galleryGrid}>
                {images.map((url, i) => (
                  <div key={i} className={styles.galleryItem}>
                    <img src={url} alt={`Média ${i + 1}`} className={styles.galleryImg} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Membres */}
          {formation.members && formation.members.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Users size={14} />
                <h2 className={styles.sectionTitle}>Participants ({formation.members.length})</h2>
              </div>
              <div className={styles.membersGrid}>
                {formation.members.map((m: any, i: number) => (
                  <MemberCard key={i} member={m} />
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div className={styles.dateRow}>
            <span>Créée le {formatDate(formation.createdAt)}</span>
            {formation.updatedAt && <span> · Mise à jour le {formatDate(formation.updatedAt)}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FormationDetail;