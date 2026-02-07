// ProjetDetail.tsx - AVEC CAROUSEL ET VUES
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Users, 
  Calendar, 
  Edit2, 
  Trash2,
  ExternalLink,
  UserPlus,
  Mail,
  MapPin,
  Settings,
  ChevronRight,
  ChevronLeft,
  Eye
} from 'lucide-react';
import { 
  isAdmin, 
  isUserInProject, 
  Project as FirebaseProject,
  TeamMember as FirebaseTeamMember,
  updateProject
} from '@/utils/firebase-api';
import SoftwareList from '@/components/projet-en-cours/SoftwareList';
import styles from './ProjetDetail.module.css';

type Project = FirebaseProject;
type TeamMember = FirebaseTeamMember;

interface ProjetDetailProps {
  project: Project;
  teamMembers: TeamMember[];
  currentUser: any;
  userTeamProfile: any;
  onBack: () => void;
  onEditProject: () => void;
  onManageTeam: () => void;
  onDeleteProject: () => void;
  onEditProfile: () => void;
}

const ProjetDetail: React.FC<ProjetDetailProps> = ({
  project,
  teamMembers,
  currentUser,
  userTeamProfile,
  onBack,
  onEditProject,
  onManageTeam,
  onDeleteProject,
  onEditProfile
}) => {
  const router = useRouter();
  const [isInTeam, setIsInTeam] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [views, setViews] = useState(project.views || 0);

  // Images du carousel: image principale + carouselImages
  const carouselImages = [
    project.image || '/default-project.jpg',
    ...(project.carouselImages || [])
  ];

  useEffect(() => {
    if (currentUser && project) {
      setIsInTeam(isUserInProject(project, currentUser.uid));
      incrementViews();
    }
  }, [currentUser, project]);

  // Carousel automatique
  useEffect(() => {
    if (carouselImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
      }, 5000); // Change toutes les 5 secondes

      return () => clearInterval(interval);
    }
  }, [carouselImages.length]);

  const incrementViews = async () => {
    if (!project.id) return;
    
    try {
      const newViews = (project.views || 0) + 1;
      await updateProject(project.id, { views: newViews });
      setViews(newViews);
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation des vues:', error);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/team?userId=${userId}&project=${project.id || ''}`);
  };

  return (
    <div className={styles.modalOverlay} onClick={onBack}>
      <motion.div 
        className={styles.modalContent}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compteur de vues */}
        <div className={styles.viewsCounter}>
          <Eye size={16} />
          <span>{views} vues</span>
        </div>

        {/* Bouton de fermeture */}
        <button className={styles.closeBtn} onClick={onBack}>
          <X size={24} />
        </button>

        <div className={styles.modalMain}>
          {/* Colonne de gauche - Contenu du projet */}
          <div className={styles.leftColumn}>
            {/* Header avec CAROUSEL */}
            <div className={styles.modalHeader}>
              <div className={styles.carouselWrapper}>
                {carouselImages.map((img, index) => (
                  <div 
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentSlide ? styles.active : ''}`}
                  >
                    <img 
                      src={img} 
                      alt={`${project.title} - Image ${index + 1}`} 
                      className={styles.carouselImage} 
                    />
                  </div>
                ))}
                
                <div className={styles.imageOverlay}></div>

                {/* Flèches de navigation */}
                {carouselImages.length > 1 && (
                  <>
                    <button 
                      className={`${styles.carouselArrow} ${styles.prev}`}
                      onClick={prevSlide}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      className={`${styles.carouselArrow} ${styles.next}`}
                      onClick={nextSlide}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Dots de navigation */}
                {carouselImages.length > 1 && (
                  <div className={styles.carouselControls}>
                    {carouselImages.map((_, index) => (
                      <button
                        key={index}
                        className={`${styles.carouselDot} ${index === currentSlide ? styles.active : ''}`}
                        onClick={() => goToSlide(index)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.headerContent}>
                <div className={styles.container}>
                  {/* Actions admin uniquement */}
                  {currentUser && isAdmin(currentUser.email) && (
                    <div className={styles.adminActions}>
                      <button onClick={onEditProject} className={styles.editButton}>
                        <Edit2 size={16} />
                        <span>Modifier</span>
                      </button>
                      <button onClick={onManageTeam} className={styles.teamButton}>
                        <UserPlus size={16} />
                        <span>Gérer l'équipe</span>
                      </button>
                      <button onClick={onDeleteProject} className={styles.deleteButton}>
                        <Trash2 size={16} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                  
                  <h1 className={styles.projectTitle}>{project.title}</h1>
                  
                  <div className={styles.projectMeta}>
                    <div className={styles.metaItem}>
                      <Calendar size={16} />
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Users size={16} />
                      <span>{(project.teamMembers || []).length} membre(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Corps du modal */}
            <div className={styles.modalBody}>
              <div className={styles.container}>
                {/* Description */}
                <div className={styles.descriptionSection}>
                  <h2 className={styles.sectionTitle}>Description du projet</h2>
                  <p className={styles.projectDescription}>{project.description}</p>
                </div>

                {/* Logiciels utilisés */}
                <div className={styles.softwareSection}>
                  <SoftwareList 
                    projectId={project.id || ''}
                    isAdmin={currentUser && isAdmin(currentUser.email)}
                    compact={false}
                    selectedSoftware={project.software || []}
                    onClose={() => {}}
                    onSave={() => {}}
                  />
                </div>

                {/* Actions pour les membres */}
                {isInTeam && (
                  <div className={styles.profileActions}>
                    <button onClick={onEditProfile} className={styles.editProfileButton}>
                      <Settings size={16} />
                      <span>Gérer mes informations</span>
                      <ChevronRight size={16} />
                    </button>
                    
                    {!userTeamProfile && (
                      <div className={styles.callToAction}>
                        <h3>Complétez votre profil d'équipe</h3>
                        <p>
                          Vous êtes membre de ce projet mais n'avez pas encore complété votre profil.
                        </p>
                        <button onClick={onEditProfile} className={styles.ctaButton}>
                          <Settings size={16} />
                          Compléter mon profil
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne de droite - Équipe du projet */}
          <div className={styles.rightColumn}>
            <div className={styles.teamSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Users size={20} />
                  <span>Équipe</span>
                </h2>
                {currentUser && isAdmin(currentUser.email) && (
                  <button onClick={onManageTeam} className={styles.addMemberButton}>
                    <UserPlus size={16} />
                  </button>
                )}
              </div>

              {teamMembers.length > 0 ? (
                <div className={styles.teamList}>
                  {teamMembers.map((member) => (
                    <div key={member.id || member.userId} className={styles.memberItem}>
                      <div 
                        className={styles.memberAvatar}
                        onClick={() => handleViewProfile(member.userId)}
                      >
                        {member.image ? (
                          <img src={member.image} alt={`${member.firstName} ${member.lastName}`} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {member.firstName?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.memberInfo}>
                        <h3 className={styles.memberName}>
                          {member.firstName} {member.lastName}
                        </h3>
                        
                        <div className={styles.memberDetails}>
                          {member.email && (
                            <div className={styles.detailItem}>
                              <Mail size={12} />
                              <span>{member.email}</span>
                            </div>
                          )}
                          
                          {member.location?.city && (
                            <div className={styles.detailItem}>
                              <MapPin size={12} />
                              <span>{member.location.city}</span>
                            </div>
                          )}
                          
                          {member.roles && member.roles.length > 0 && (
                            <div className={styles.memberRoles}>
                              {member.roles.slice(0, 3).map((role, index) => (
                                <span key={index} className={styles.roleTag}>
                                  {role}
                                </span>
                              ))}
                              {member.roles.length > 3 && (
                                <span className={styles.moreRoles}>
                                  +{member.roles.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleViewProfile(member.userId)}
                        className={styles.viewProfileButton}
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyTeam}>
                  <Users size={48} className={styles.emptyIcon} />
                  <h3>Aucun membre</h3>
                  <p>
                    {currentUser && isAdmin(currentUser.email)
                      ? 'Ajoutez des membres pour constituer l\'équipe.'
                      : 'Aucun membre n\'a encore été ajouté.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjetDetail;
