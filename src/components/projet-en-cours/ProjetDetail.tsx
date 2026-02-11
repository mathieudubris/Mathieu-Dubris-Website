
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Users, 
  Calendar, 
  Mail,
  MapPin,
  Settings,
  ChevronRight,
  ChevronLeft,
  Eye,
  Wrench,
  ChevronDown,
  User
} from 'lucide-react';
import { 
  isUserInProject, 
  Project as FirebaseProject,
  TeamMember as FirebaseTeamMember,
  updateProject
} from '@/utils/firebase-api';
import styles from './ProjetDetail.module.css';

type Project = FirebaseProject;
type TeamMember = FirebaseTeamMember;

// Définition des rôles avec leur catégorie de couleur (identique à Role.tsx)
const rolesData = [
  // Direction & Management - Blanc
  { name: 'Game Director', description: 'Supervise la vision globale et la direction créative du jeu', colorClass: 'Direction' },
  { name: 'Creative Director', description: 'Dirige la direction artistique et créative du projet', colorClass: 'Direction' },
  { name: 'Technical Director', description: 'Responsable des aspects techniques et de l\'architecture du jeu', colorClass: 'Direction' },
  { name: 'Project Manager', description: 'Gère la planification, les ressources et les délais du projet', colorClass: 'Direction' },
  { name: 'Team Coordinator', description: 'Coordonne les différentes équipes et assure la communication', colorClass: 'Direction' },
  
  // Design - Rouge
  { name: 'Game Designer', description: 'Conçoit les mécaniques de jeu et les systèmes interactifs', colorClass: 'Design' },
  { name: 'Level Designer', description: 'Crée les niveaux, l\'environnement et le parcours du joueur', colorClass: 'Design' },
  { name: 'Gameplay Designer', description: 'Développe et équilibre les mécaniques de gameplay', colorClass: 'Design' },
  { name: 'Narrative Designer', description: 'Élabore l\'histoire, les dialogues et l\'univers narratif', colorClass: 'Design' },
  
  // Programmation - Orange
  { name: 'Game Programmer', description: 'Développe les fonctionnalités principales du jeu', colorClass: 'Programming' },
  { name: 'Engine Programmer', description: 'Travaille sur le moteur de jeu et les outils techniques', colorClass: 'Programming' },
  { name: 'AI Programmer', description: 'Programme l\'intelligence artificielle des ennemis et PNJ', colorClass: 'Programming' },
  { name: 'UI Programmer', description: 'Développe les interfaces utilisateur et les systèmes HUD', colorClass: 'Programming' },
  
  // Art 3D - Jaune
  { name: '3D Artist', description: 'Crée les modèles 3D des personnages et objets', colorClass: 'Art3D' },
  { name: '3D Cinematic', description: 'Réalise les cinématiques et séquences animées en 3D', colorClass: 'Art3D' },
  { name: 'Texture Artist', description: 'Crée les textures et matériaux pour les modèles 3D', colorClass: 'Art3D' },
  { name: 'Prop Artist', description: 'Modélise les objets et accessoires du jeu', colorClass: 'Art3D' },
  { name: 'Environment Artist', description: 'Construit les environnements et décors du jeu', colorClass: 'Art3D' },
  { name: '3D Animator', description: 'Anime les personnages et créatures en 3D', colorClass: 'Art3D' },
  { name: 'Mocap Actor', description: 'Effectue les performances pour la capture de mouvement', colorClass: 'Art3D' },
  { name: '3D Art Support', description: 'Assiste l\'équipe artistique sur les aspects techniques 3D', colorClass: 'Art3D' },
  { name: 'Technical Artist', description: 'Fait le pont entre artistes et programmeurs, crée des shaders', colorClass: 'Art3D' },
  
  // UI/UX - Vert
  { name: 'UX Designer', description: 'Conçoit l\'expérience utilisateur et la fluidité d\'interaction', colorClass: 'UIUX' },
  { name: 'UI Designer', description: 'Dessine les interfaces utilisateur et éléments d\'interface', colorClass: 'UIUX' },
  { name: 'UI Artist', description: 'Crée les assets graphiques pour les interfaces', colorClass: 'UIUX' },
  { name: 'UI Art Support', description: 'Assiste dans la création des éléments d\'interface', colorClass: 'UIUX' },
  
  // Audio - Turquoise
  { name: 'Music Composer', description: 'Compose la bande-son et les thèmes musicaux', colorClass: 'Audio' },
  { name: 'Sound Designer', description: 'Crée les effets sonores et l\'ambiance audio', colorClass: 'Audio' },
  { name: 'Voice Actor', description: 'Prête sa voix aux personnages du jeu', colorClass: 'Audio' },
  { name: 'Voice Director', description: 'Dirige les séances d\'enregistrement vocal', colorClass: 'Audio' },
  
  // Support & Marketing - Rose
  { name: 'Community Manager', description: 'Gère la relation avec la communauté de joueurs', colorClass: 'Support' },
  { name: 'Documentation Manager', description: 'Organise et maintient la documentation du projet', colorClass: 'Support' },
  { name: 'Content Creator', description: 'Crée du contenu promotionnel et éducatif autour du jeu', colorClass: 'Support' },
  { name: 'Marketing Manager', description: 'Gère la stratégie marketing et la promotion du jeu', colorClass: 'Support' },
  { name: 'QA Tester', description: 'Teste le jeu pour identifier les bugs et problèmes', colorClass: 'Support' }
];

// Fonction utilitaire pour obtenir la classe de couleur d'un rôle
const getRoleColorClass = (roleName: string): string => {
  const role = rolesData.find(r => r.name === roleName);
  return role ? role.colorClass : '';
};

interface ProjetDetailProps {
  project: Project;
  teamMembers: TeamMember[];
  currentUser: any;
  userTeamProfile: any;
  onBack: () => void;
  onEditProfile: () => void;
}

const ProjetDetail: React.FC<ProjetDetailProps> = ({
  project,
  teamMembers,
  currentUser,
  userTeamProfile,
  onBack,
  onEditProfile
}) => {
  const router = useRouter();
  const [isInTeam, setIsInTeam] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [views, setViews] = useState(project.views || 0);
  const [showAllMembers, setShowAllMembers] = useState(false);

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

  const handleViewAllMembers = () => {
    router.push(`/team/view?project=${project.id || ''}`);
  };

  // Afficher les logiciels utilisés - LECTURE SEULE
  const renderSoftwareList = () => {
    const softwareList = project.software || [];
    
    if (softwareList.length === 0) {
      return (
        <div className={styles.noSoftware}>
          Aucun logiciel spécifié
        </div>
      );
    }

    return (
      <div className={styles.softwareGrid}>
        {softwareList.slice(0, 10).map((soft: any, index: number) => (
          <div 
            key={index} 
            className={styles.softwareItem}
            title={soft.name}
          >
            <div className={styles.softwareLogo}>
              {soft.icon || '📦'}
            </div>
            <span className={styles.softwareName}>
              {soft.name}
            </span>
          </div>
        ))}
        {softwareList.length > 10 && (
          <div className={styles.moreSoftware}>
            <div className={styles.moreSoftwareIcon}>
              +{softwareList.length - 10}
            </div>
            <span className={styles.moreSoftwareText}>
              Plus
            </span>
          </div>
        )}
      </div>
    );
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
                  <h1 className={styles.projectTitle}>{project.title}</h1>
                  
                  <div className={styles.projectMeta}>
                    <div className={styles.metaItem}>
                      <Calendar size={16} />
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Eye size={16} />
                      <span>{views} vues</span>
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

                {/* Logiciels utilisés - LECTURE SEULE */}
                <div className={styles.softwareSection}>
                  <h2 className={styles.sectionTitle}>
                    <Wrench size={20} />
                    <span>Logiciels utilisés</span>
                  </h2>
                  {renderSoftwareList()}
                </div>
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
                
                {/* Bouton "Voir tous les membres" - TOUJOURS VISIBLE */}
                <button 
                  onClick={handleViewAllMembers}
                  className={styles.viewAllMembersButton}
                >
                  <User size={16} />
                  <span>Voir tous les membres</span>
                </button>
              </div>

              {teamMembers.length > 0 ? (
                <div className={styles.teamList}>
                  {teamMembers
                    .slice(0, showAllMembers ? teamMembers.length : 5)
                    .map((member) => (
                    <div key={member.id || member.userId} className={styles.memberItem}>
                      <div className={styles.memberAvatar}>
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
                              {member.roles.slice(0, 3).map((role, index) => {
                                const colorClass = getRoleColorClass(role);
                                return (
                                  <span key={index} className={`${styles.roleTag} ${styles[colorClass]}`}>
                                    {role}
                                  </span>
                                );
                              })}
                              {member.roles.length > 3 && (
                                <span className={styles.moreRoles}>
                                  +{member.roles.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyTeam}>
                  <Users size={48} className={styles.emptyIcon} />
                  <h3>Aucun membre</h3>
                  <p>
                    Aucun membre n'a encore été ajouté.
                  </p>
                </div>
              )}

              {/* Bouton "Gérer mes informations" - SEULEMENT SI MEMBRE */}
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
      </motion.div>
    </div>
  );
};

export default ProjetDetail;
