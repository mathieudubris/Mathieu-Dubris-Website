// components/projet-en-cours/ProjectCard.tsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Users, Lock } from 'lucide-react';
import { Project as FirebaseProject } from '@/utils/firebase-api';
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

  // Récupérer les logiciels du projet (max 5 icônes + compteur)
  const renderSoftwareIcons = () => {
    const softwareList = project.software || [];
    const maxVisible = 5;
    const visibleSoftware = softwareList.slice(0, maxVisible);
    const remaining = softwareList.length - maxVisible;

    return (
      <div className={styles.softwareSection}>
        {visibleSoftware.map((software: any, index: number) => (
          <div key={index} className={styles.softwareIcon} title={software.name}>
            {software.icon || '📦'}
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

  // Afficher les avatars des membres comme dans la maquette - MAX 5 avec compteur +X
  const renderMemberAvatars = () => {
    const members = project.members || [];
    const maxVisible = 5;
    const visibleMembers = members.slice(0, maxVisible);
    const remaining = members.length - maxVisible;
    
    return (
      <div className={styles.memberAvatars}>
        {visibleMembers.map((member: any, index: number) => (
          <div key={index} className={styles.memberAvatar} title={member.displayName || 'Membre'}>
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
          <div className={styles.moreMembers} title={`+${remaining} autres membres`}>
            +{remaining}
          </div>
        )}
      </div>
    );
  };

  // Gestion du clic sur la carte (redirection ou accès anticipé)
  const handleCardClick = () => {
    // Si c'est un accès anticipé et que l'utilisateur n'est PAS membre et PAS admin
    if (project.visibility === 'early_access' && !isMember && !isAdmin) {
      // Rediriger vers la page de sécurité
      window.location.href = '/security/access';
      return;
    }
    
    // Sinon, ouvrir le projet normalement
    onClick(project);
  };

  // Vérifier si le contenu (sauf la date) doit être flou
  const isBlurred = project.visibility === 'early_access' && !isMember && !isAdmin;

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
      onClick={handleCardClick}
    >
      {/* Header avec badge membre, badge accès anticipé et actions admin */}
      <div className={styles.cardHeader}>
        {/* Badge "Vous êtes membre" si l'utilisateur est membre */}
        {isMember && (
          <div className={styles.memberBadge}>
            <Users size={10} />
            <span>Vous êtes membre</span>
          </div>
        )}

        {/* Badge "Accès anticipé" si le projet est en early access et que l'utilisateur n'est pas membre/admin */}
        {project.visibility === 'early_access' && !isMember && !isAdmin && (
          <div className={`${styles.memberBadge} ${styles.earlyAccessBadge}`}>
            <Lock size={10} />
            <span>Accès anticipé</span>
          </div>
        )}

        {/* Actions admin (toujours visibles pour l'admin même si flou) */}
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
              <Edit2 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
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

      {/* Image de couverture - MAINTENANT FLOUE SI ACCÈS ANTICIPÉ */}
      <div className={`${styles.coverImageContainer} ${isBlurred ? styles.blurredImage : ''}`}>
        <img 
          src={project.image || '/default-project.jpg'} 
          alt={project.title}
          className={styles.coverImage}
          onError={(e) => {
            e.currentTarget.src = '/default-project.jpg';
          }}
        />
      </div>

      {/* Contenu - avec structure spéciale pour que la date reste visible */}
      <div className={styles.cardContent}>
        {/* Partie floutée (tout sauf le footer) */}
        <div className={`${styles.blurrableContent} ${isBlurred ? styles.blurred : ''}`}>
          {/* Titre en gras avec effet multiligne + ellipsis */}
          <h3 className={styles.projectTitle}>
            {project.title || "Titre du projet"}
          </h3>

          {/* Description avec ellipsis */}
          <p className={styles.projectDescription}>
            {project.description || "Description du projet. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum."}
          </p>

          {/* Icônes des logiciels */}
          {renderSoftwareIcons()}

          {/* Barre de progression */}
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${project.progress || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Footer avec avatars et date - TOUJOURS VISIBLE (pas flouté) */}
        <div className={styles.cardFooter}>
          {renderMemberAvatars()}
          <span className={styles.projectDate}>{formatDate(project.createdAt) || "22/01/2025"}</span>
        </div>
      </div>

      {/* Overlay pour l'accès anticipé (message optionnel) */}
      {isBlurred && (
        <div className={styles.earlyAccessOverlay}>
          <Lock size={20} />
          <span>Projet en accès anticipé</span>
        </div>
      )}
    </motion.div>
  );
};

export default ProjectCard;