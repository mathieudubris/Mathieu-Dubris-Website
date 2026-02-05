// components/app/ProjectCard/ProjectCard.tsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, MoreVertical, Users, Calendar } from 'lucide-react'; // Ajout de Calendar ici
import { Project as FirebaseProject } from '@/utils/firebase-api';
import SoftwareList from '@/components/projet-en-cours/SoftwareList';
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

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currentUser,
  isAdmin,
  isMember,
  isDeleteConfirm,
  onEdit,
  onDelete,
  onDeleteConfirm,
  onClick
}) => {
  const formatDate = (date: any) => {
    if (!date) return '';
    
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // Récupérer les premières lettres pour l'avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Afficher les avatars des membres (max 5)
  const displayMembers = (members: string[]) => {
    // Pour l'instant, on affiche des avatars placeholder
    // Dans une vraie implémentation, tu récupérerais les vrais avatars
    const visibleCount = Math.min(members.length, 5);
    const remainingCount = members.length - visibleCount;
    
    return (
      <div className={styles.memberAvatars}>
        {Array.from({ length: visibleCount }).map((_, index) => (
          <div key={index} className={styles.memberAvatar}>
            <div className={styles.avatarPlaceholder}>
              {String(index + 1)}
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className={styles.moreMembers}>
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  if (isDeleteConfirm && project.id) {
    return (
      <motion.div 
        className={styles.projectCard}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className={styles.deleteConfirmOverlay}>
          <div className={styles.deleteConfirmContent}>
            <div className={styles.deleteIcon}>🗑️</div>
            <h4 className={styles.deleteTitle}>Supprimer le projet ?</h4>
            <p className={styles.deleteMessage}>Cette action est irréversible</p>
            <div className={styles.deleteActions}>
              <button
                onClick={() => onDelete(project.id!)}
                className={styles.deleteConfirmBtn}
              >
                Supprimer
              </button>
              <button
                onClick={() => onDeleteConfirm(null)}
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
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onClick={() => onClick(project)}
    >
      {/* Header avec image du projet */}
      <div className={styles.projectImageContainer}>
        <img 
          src={project.image || '/default-project.jpg'} 
          alt={project.title}
          className={styles.projectImage}
          onError={(e) => {
            e.currentTarget.src = '/default-project.jpg';
          }}
        />
        {isMember && (
          <div className={styles.memberBadge}>
            <Users size={12} />
            <span>Membre</span>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className={styles.projectContent}>
        <div className={styles.projectHeader}>
          <h3 className={styles.projectTitle}>
            {project.title.length > 30 
              ? `${project.title.substring(0, 30)}...` 
              : project.title}
          </h3>
          <div className={styles.projectActions}>
            {isAdmin && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  className={styles.actionBtn}
                  title="Modifier"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConfirm(project.id || '');
                  }}
                  className={styles.actionBtn}
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button
              onClick={(e) => e.stopPropagation()}
              className={styles.actionBtn}
              title="Plus d'options"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Logiciels utilisés */}
        <div className={styles.softwareSection}>
          <SoftwareList 
            projectId={project.id || ''}
            isAdmin={isAdmin}
          />
        </div>

        {/* Membres du projet */}
        <div className={styles.membersSection}>
          <div className={styles.membersHeader}>
            <span className={styles.membersLabel}>Membres</span>
            {displayMembers(project.teamMembers || [])}
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${Math.min((project.teamMembers?.length || 0) * 20, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Description */}
        <p className={styles.projectDescription}>
          {project.description.length > 120
            ? `${project.description.substring(0, 120)}...`
            : project.description}
        </p>

        {/* Pied de carte */}
        <div className={styles.projectFooter}>
          <div className={styles.projectMeta}>
            <div className={styles.metaItem}>
              <Calendar size={12} />
              <span>{formatDate(project.createdAt)}</span>
            </div>
          </div>
          
          <div className={styles.projectStats}>
            <div className={styles.statItem}>
              <Users size={12} />
              <span>{(project.teamMembers || []).length}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;