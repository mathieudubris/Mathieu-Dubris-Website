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
  ArrowLeft,
  ExternalLink,
  UserPlus,
  User,
  Mail,
  Phone,
  MapPin,
  Monitor,
  Laptop,
  Settings,
  ChevronRight
} from 'lucide-react';
import { 
  isAdmin, 
  isUserInProject, 
  Project as FirebaseProject,
  TeamMember as FirebaseTeamMember 
} from '@/utils/firebase-api';
import styles from './ProjetDetail.module.css';

// Utiliser les interfaces importées de firebase-api
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

  useEffect(() => {
    if (currentUser && project) {
      setIsInTeam(isUserInProject(project, currentUser.uid));
    }
  }, [currentUser, project]);

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

  const handleGoToTeam = () => {
    router.push(`/team?project=${project.id || ''}`);
  };

  return (
    <div className={styles.modalOverlay} onClick={onBack}>
      <motion.div 
        className={styles.modalContent}
        initial={{ y: "100vh" }}
        animate={{ y: 0 }}
        exit={{ y: "100vh" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onBack}>
          <X size={24} />
        </button>

        <div className={styles.modalMain}>
          {/* Colonne de gauche - Contenu du projet */}
          <div className={styles.leftColumn}>
            <div className={styles.modalHeader}>
              <div className={styles.headerImageContainer}>
                <img 
                  src={project.image || "/default-project.jpg"} 
                  alt={project.title} 
                  className={styles.headerImage} 
                />
                <div className={styles.imageOverlay}></div>
              </div>
              <div className={styles.headerContent}>
                <div className={styles.container}>
                  <div className={styles.headerActions}>
                    <button onClick={onBack} className={styles.backButton}>
                      <ArrowLeft size={16} />
                      <span>Retour aux projets</span>
                    </button>
                    
                    {currentUser && isAdmin(currentUser.email) && (
                      <div className={styles.adminActions}>
                        <button onClick={onEditProject} className={styles.editButton}>
                          <Edit2 size={16} />
                          <span>Modifier le projet</span>
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
                  </div>
                  
                  <h1 className={styles.projectTitle}>{project.title}</h1>
                  
                  <div className={styles.projectMeta}>
                    <div className={styles.metaItem}>
                      <Calendar size={16} />
                      <span>Créé le {formatDate(project.createdAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Users size={16} />
                      <span>{(project.teamMembers || []).length} membre(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.container}>
                <div className={styles.descriptionSection}>
                  <h2 className={styles.sectionTitle}>Description du projet</h2>
                  <p className={styles.projectDescription}>{project.description}</p>
                </div>

                {/* Bouton pour modifier le profil pour les membres */}
                {isInTeam && (
                  <div className={styles.profileActions}>
                    <button onClick={onEditProfile} className={styles.editProfileButton}>
                      <Settings size={16} />
                      <span>Gérer mes informations dans ce projet</span>
                      <ChevronRight size={16} />
                    </button>
                    
                    <button onClick={handleGoToTeam} className={styles.viewTeamButton}>
                      <Users size={16} />
                      <span>Voir tous les membres</span>
                      <ChevronRight size={16} />
                    </button>
                    
                    {!userTeamProfile && (
                      <div className={styles.callToAction}>
                        <h3>Complétez votre profil d'équipe</h3>
                        <p>
                          Vous êtes membre de ce projet mais n'avez pas encore complété votre profil d'équipe.
                          Complétez-le pour apparaître dans la liste des membres.
                        </p>
                        <button onClick={onEditProfile} className={styles.ctaButton}>
                          <User size={16} />
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
                  <span>Équipe du projet</span>
                </h2>
                {currentUser && isAdmin(currentUser.email) && (
                  <button onClick={onManageTeam} className={styles.addMemberButton}>
                    <UserPlus size={16} />
                    <span>Gérer l'équipe</span>
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
                              <span>{member.location.city}, {member.location.country}</span>
                            </div>
                          )}
                          
                          {member.roles && member.roles.length > 0 && (
                            <div className={styles.memberRoles}>
                              {member.roles.slice(0, 2).map((role, index) => (
                                <span key={index} className={styles.roleTag}>
                                  {role}
                                </span>
                              ))}
                              {member.roles.length > 2 && (
                                <span className={styles.moreRoles}>
                                  +{member.roles.length - 2} autres
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
                        <span>Voir</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyTeam}>
                  <Users size={48} className={styles.emptyIcon} />
                  <h3>Aucun membre dans l'équipe</h3>
                  <p>
                    {currentUser && isAdmin(currentUser.email)
                      ? 'Ajoutez des membres pour constituer l\'équipe du projet.'
                      : 'L\'administrateur n\'a pas encore ajouté de membres à ce projet.'}
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