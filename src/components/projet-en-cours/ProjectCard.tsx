// components/projet-en-cours/ProjectCard.tsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Users, MoreVertical } from 'lucide-react';
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
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // Calculer le pourcentage de progression (basé sur le nombre de membres)
  const progressPercentage = Math.min((project.teamMembers?.length || 0) * 10, 100);

  // Afficher les avatars des membres (max 5 visibles)
  const displayMembers = (members: string[]) => {
    const visibleCount = Math.min(members.length, 5);
    const remainingCount = members.length - visibleCount;
    
    return (
      <div className={styles.memberAvatars}>
        {Array.from({ length: visibleCount }).map((_, index) => (
          <div key={index} className={styles.memberAvatar}>
            <div className={styles.avatarPlaceholder}>
              {index + 1}
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

  // Gestion de la confirmation de suppression
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
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id!);
                }}
                className={styles.deleteConfirmBtn}
              >
                Supprimer
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConfirm(null);
                }}
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
      onClick={() => onClick(project)}
    >
      {/* Header avec badge et actions admin */}
      <div className={styles.cardHeader}>
        <div className={styles.memberBadge}>
          <Users size={14} />
          <span>Membre</span>
        </div>

        {isAdmin && (
          <div className={styles.adminActions}>
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
            <button
              onClick={(e) => e.stopPropagation()}
              className={styles.actionBtn}
              title="Plus"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Image de couverture arrondie */}
      <div className={styles.coverImageContainer}>
        <img 
          src={project.image || '/default-project.jpg'} 
          alt={project.title}
          className={styles.coverImage}
          onError={(e) => {
            e.currentTarget.src = '/default-project.jpg';
          }}
        />
      </div>

      {/* Titre du projet */}
      <div className={styles.cardContent}>
        <h3 className={styles.projectTitle}>
          {project.title}
        </h3>

        {/* Description */}
        <p className={styles.projectDescription}>
          {project.description.length > 120
            ? `${project.description.substring(0, 120)}...`
            : project.description}
        </p>

        {/* Liste des logiciels */}
        <div className={styles.softwareSection}>
          <SoftwareList 
            projectId={project.id || ''}
            isAdmin={isAdmin}
            compact={true}
          />
        </div>

        {/* Barre de progression */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Footer avec avatars et date */}
        <div className={styles.cardFooter}>
          {displayMembers(project.teamMembers || [])}
          <span className={styles.projectDate}>{formatDate(project.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
