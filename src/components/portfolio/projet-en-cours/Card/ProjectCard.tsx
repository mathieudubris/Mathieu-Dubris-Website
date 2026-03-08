// components/projet-en-cours/ProjectCard.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Users, Lock, Package } from 'lucide-react';
import { Project as FirebaseProject } from '@/utils/projet-api';
import styles from './ProjectCard.module.css';

type Project = FirebaseProject;

interface ProjectCardProps {
  project: Project;
  currentUser: any;
  isAdmin: boolean;
  isMember: boolean;
  isDeleteConfirm: boolean;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onDeleteConfirm: (projectId: string | null) => void;
  onClick: (project: Project) => void;
}

// ── Software icon with SVG fallback ──────────────────────────────────────────
const SoftwareIcon: React.FC<{ software: any }> = ({ software }) => {
  const [failed, setFailed] = useState(false);

  // logoUrl comes from SoftwareItem (RessourcesEditor catalogue)
  const logoUrl: string | undefined = software.logoUrl || software.icon;

  // If it looks like a URL (http/data/svg path), render as <img>
  const isUrl = logoUrl && (
    logoUrl.startsWith('http') ||
    logoUrl.startsWith('data:') ||
    logoUrl.startsWith('/')
  );

  if (isUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={software.name}
        className={styles.softwareIconImg}
        onError={() => setFailed(true)}
        draggable={false}
      />
    );
  }

  // Emoji fallback or plain text icon
  if (logoUrl && !isUrl) {
    return <span className={styles.softwareIconEmoji}>{logoUrl}</span>;
  }

  // Ultimate fallback: first letter
  return (
    <span
      className={styles.softwareIconLetter}
      style={{ color: software.color || 'var(--primary)' }}
    >
      {software.name?.charAt(0)?.toUpperCase() || '?'}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currentUser,
  isAdmin,
  isMember,
  isDeleteConfirm,
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
    const visible   = list.slice(0, maxVisible);
    const remaining = list.length - maxVisible;

    return (
      <div className={styles.softwareSection}>
        {visible.map((sw: any, i: number) => (
          <div key={i} className={styles.softwareIcon} title={sw.name}>
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
    const members    = project.members || [];
    const maxVisible = 5;
    const visible    = members.slice(0, maxVisible);
    const remaining  = members.length - maxVisible;

    return (
      <div className={styles.memberAvatars}>
        {visible.map((member: any, i: number) => (
          <div key={i} className={styles.memberAvatar} title={member.displayName || 'Membre'}>
            {member.photoURL ? (
              <img src={member.photoURL} alt={member.displayName || 'Membre'} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {member.displayName?.[0]?.toUpperCase() || 'M'}
              </div>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className={styles.moreMembers} title={`+${remaining} autres membres`}>+{remaining}</div>
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

  // ── Delete confirm overlay ────────────────────────────────────────────────
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
              <button onClick={e => { e.stopPropagation(); onDelete(project.id!); }} className={styles.deleteConfirmBtn}>
                Supprimer
              </button>
              <button onClick={e => { e.stopPropagation(); onDeleteConfirm(null); }} className={styles.deleteCancelBtn}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Normal card ───────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.projectCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
    >
      {/* Header */}
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
            <button onClick={e => { e.stopPropagation(); onEdit(project); }} className={styles.actionBtn} title="Modifier">
              <Edit2 size={12} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDeleteConfirm(project.id || ''); }} className={styles.actionBtn} title="Supprimer">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Cover image */}
      <div className={`${styles.coverImageContainer} ${isBlurred ? styles.blurredImage : ''}`}>
        <img
          src={project.image || '/default-project.jpg'}
          alt={project.title}
          className={styles.coverImage}
          onError={e => { e.currentTarget.src = '/default-project.jpg'; }}
        />
      </div>

      {/* Content */}
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