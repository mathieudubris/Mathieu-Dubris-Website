"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Users, Lock, Package } from 'lucide-react';
import { FullProject, ProjectTeamMember } from '@/utils/projet-api';
import { WHITE_LOGO_IDS } from '@/utils/software';
import styles from './ProjectCard.module.css';

type Project = FullProject;

interface ProjectCardProps {
  project: Project;
  currentUser: any;
  isAdmin: boolean;
  isMember: boolean;
  isDeleteConfirm: boolean;
  teamProfiles?: ProjectTeamMember[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onDeleteConfirm: (projectId: string | null) => void;
  onClick: (project: Project) => void;
}

// ── Software icon ─────────────────────────────────────────────────────────────

const SoftwareIcon: React.FC<{ software: any }> = ({ software }) => {
  const [failed, setFailed] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(software.logoUrl || software.icon);

  const logoUrl: string | undefined = software.logoUrl || software.icon;
  const needsDarkBg = WHITE_LOGO_IDS.has(software.id || '');

  const isUrl = logoUrl && (
    logoUrl.startsWith('http') ||
    logoUrl.startsWith('data:') ||
    logoUrl.startsWith('/')
  );

  const handleError = () => {
    setFailed(true);
  };

  if (isUrl && !failed && imgSrc) {
    return (
      // Wrapper interne qui clip l'image — séparé du conteneur externe (overflow:visible pour tooltip)
      <div className={styles.softwareIconInner} style={{ background: needsDarkBg ? 'rgba(0,0,0,0.55)' : 'transparent' }}>
        <img
          src={imgSrc}
          alt={software.name}
          onError={handleError}
          draggable={false}
          className={styles.softwareIconImg}
          style={{ filter: needsDarkBg ? 'brightness(0) invert(1)' : 'none' }}
        />
      </div>
    );
  }

  if (logoUrl && !isUrl) {
    return <span className={styles.softwareIconEmoji}>{logoUrl}</span>;
  }

  return (
    <span
      className={styles.softwareIconLetter}
      style={{ color: software.color || 'var(--primary)' }}
    >
      {software.name?.charAt(0)?.toUpperCase() || '?'}
    </span>
  );
};

// ── Member avatar ─────────────────────────────────────────────────────────────

interface MemberAvatarItemProps {
  src?: string;
  fallbackLetter: string;
  label: string;
}

const MemberAvatarItem: React.FC<MemberAvatarItemProps> = ({ src, fallbackLetter, label }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={styles.memberAvatar}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {src && !imgFailed ? (
        <img src={src} alt={label} onError={() => setImgFailed(true)} />
      ) : (
        <div className={styles.avatarPlaceholder}>{fallbackLetter}</div>
      )}
      {hovered && label && (
        <div className={styles.avatarTooltip}>{label}</div>
      )}
    </div>
  );
};

// ── ProjectCard ───────────────────────────────────────────────────────────────

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currentUser,
  isAdmin,
  isMember,
  isDeleteConfirm,
  teamProfiles = [],
  onEdit,
  onDelete,
  onDeleteConfirm,
  onClick,
}) => {
  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return ''; }
  };

  const renderSoftwareIcons = () => {
    const list = project.software || [];
    const maxVisible = 5;
    const visible = list.slice(0, maxVisible);
    const remaining = list.length - maxVisible;

    if (list.length === 0) {
      return (
        <div className={styles.softwareSection}>
          <div className={styles.noSoftware}>
            <Package size={10} />
            <span>Aucun logiciel</span>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.softwareSection}>
        {visible.map((sw: any, i: number) => (
          <div key={sw.id || i} className={styles.softwareIcon} title={sw.name}>
            <SoftwareIcon software={sw} />
          </div>
        ))}
        {remaining > 0 && (
          <div className={styles.moreSoftware} title={`+${remaining} autres logiciels`}>
            +{remaining}
          </div>
        )}
      </div>
    );
  };

  const renderMemberAvatars = () => {
    const googleMembers = project.members || [];
    const maxVisible = 5;
    const visible = googleMembers.slice(0, maxVisible);
    const remaining = googleMembers.length - maxVisible;

    return (
      <div className={styles.memberAvatars}>
        {visible.map((member: any, i: number) => {
          const teamProfile = teamProfiles.find(
            (tp) => tp.userId === (member.userId || member.uid)
          );
          const avatarSrc = teamProfile?.image || member.photoURL || undefined;
          const displayName = teamProfile
            ? `${teamProfile.firstName} ${teamProfile.lastName}`.trim()
            : (member.displayName || '');
          const fallbackLetter = teamProfile
            ? (teamProfile.firstName?.[0] || '').toUpperCase()
            : (member.displayName?.[0] || 'M').toUpperCase();

          return (
            <MemberAvatarItem
              key={i}
              src={avatarSrc}
              fallbackLetter={fallbackLetter || 'M'}
              label={displayName}
            />
          );
        })}
        {remaining > 0 && (
          <div className={styles.moreMembers} title={`+${remaining} autres membres`}>
            +{remaining}
          </div>
        )}
      </div>
    );
  };

  const handleCardClick = () => {
    if (project.visibility === 'early_access' && !isMember && !isAdmin) {
      window.location.href = '/security/access';
      return;
    }
    onClick(project);
  };

  const isBlurred = project.visibility === 'early_access' && !isMember && !isAdmin;

  if (isDeleteConfirm && project.id) {
    return (
      <motion.div
        className={styles.projectCard}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className={styles.deleteConfirmOverlay}>
          <div className={styles.deleteConfirmContent}>
            <div className={styles.deleteIcon}>🗑️</div>
            <h4 className={styles.deleteTitle}>Supprimer le projet ?</h4>
            <p className={styles.deleteMessage}>Cette action est irréversible</p>
            <div className={styles.deleteActions}>
              <button
                onClick={e => { e.stopPropagation(); if (project.id) onDelete(project.id); }}
                className={styles.deleteConfirmBtn}
              >
                Supprimer
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDeleteConfirm(null); }}
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
      className={styles.projectCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
    >
      <div className={styles.cardHeader}>
        {isMember && (
          <div className={styles.memberBadge}>
            <Users size={10} /><span>Vous êtes membre</span>
          </div>
        )}
        {project.visibility === 'early_access' && !isMember && !isAdmin && (
          <div className={`${styles.memberBadge} ${styles.earlyAccessBadge}`}>
            <Lock size={10} /><span>Accès anticipé</span>
          </div>
        )}
        {isAdmin && (
          <div className={styles.adminActions}>
            <button
              onClick={e => { e.stopPropagation(); onEdit(project); }}
              className={styles.actionBtn}
              title="Modifier"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                onDeleteConfirm(project.id || '');
              }}
              className={styles.actionBtn}
              title="Supprimer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className={`${styles.coverImageContainer} ${isBlurred ? styles.blurredImage : ''}`}>
        <img
          src={project.image || '/default-project.jpg'}
          alt={project.title}
          className={styles.coverImage}
          onError={e => { e.currentTarget.src = '/default-project.jpg'; }}
        />
      </div>

      <div className={styles.cardContent}>
        <div className={`${styles.blurrableContent} ${isBlurred ? styles.blurred : ''}`}>
          <h3 className={styles.projectTitle}>{project.title || 'Titre du projet'}</h3>
          <p className={styles.projectDescription}>
            {project.description || 'Description du projet.'}
          </p>
          {renderSoftwareIcons()}
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${project.progress || 0}%` }} />
          </div>
        </div>

        <div className={styles.cardFooter}>
          {renderMemberAvatars()}
          <span className={styles.projectDate}>{formatDate(project.createdAt) || '22/01/2025'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;