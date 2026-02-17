"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Mail, 
  MapPin, 
  Settings, 
  ChevronRight, 
  User,
  Eye
} from 'lucide-react';
import { Project as FirebaseProject } from '@/utils/firebase-api';
import styles from './Membres.module.css';

// Définition des rôles avec leur catégorie de couleur
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

const getRoleColorClass = (roleName: string): string => {
  const role = rolesData.find(r => r.name === roleName);
  return role ? role.colorClass : '';
};

interface ProjectTeamMember {
  id?: string;
  userId: string;
  projectId: string;
  image: string;
  firstName: string;
  lastName: string;
  age: number;
  agePublic: boolean;
  email: string;
  phone: string;
  contacts: any[];
  roles: string[];
  equipment: any;
  location: {
    country: string;
    city: string;
    district: string;
    districtPublic: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface MembresProps {
  project: FirebaseProject;
  teamMembers: ProjectTeamMember[];
  currentUser: any;
  userTeamProfile: any;
  isInTeam: boolean;
  onViewAllMembers: () => void;
  onCreateProfile: () => void;
  onEditProfile: () => void;
}

const Membres: React.FC<MembresProps> = ({
  project,
  teamMembers,
  currentUser,
  userTeamProfile,
  isInTeam,
  onViewAllMembers,
  onCreateProfile,
  onEditProfile
}) => {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const displayedMembers = showAllMembers ? teamMembers : teamMembers.slice(0, 5);

  return (
    <div className={styles.membres}>
      <div className={styles.teamSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Users size={20} />
            <span>Équipe ({teamMembers.length})</span>
          </h2>
          
          {teamMembers.length > 5 && (
            <button 
              onClick={() => setShowAllMembers(!showAllMembers)}
              className={styles.toggleButton}
            >
              <Eye size={16} />
              <span>{showAllMembers ? 'Voir moins' : 'Voir tous'}</span>
            </button>
          )}
        </div>

        {teamMembers.length > 0 ? (
          <div className={styles.teamList}>
            {displayedMembers.map((member) => (
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
            <p>Aucun membre n'a encore été ajouté à ce projet.</p>
          </div>
        )}

        {/* Bouton "Voir tous les membres" (navigation) */}
        <button 
          onClick={onViewAllMembers}
          className={styles.viewAllMembersButton}
        >
          <Users size={16} />
          <span>Voir tous les membres du projet</span>
          <ChevronRight size={16} />
        </button>

        {/* Actions pour le membre connecté */}
        {isInTeam && (
          <div className={styles.profileActions}>
            {!userTeamProfile ? (
              <button onClick={onCreateProfile} className={styles.createProfileButton}>
                <Settings size={16} />
                <span>Créer mon profil</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={onEditProfile} className={styles.editProfileButton}>
                <Settings size={16} />
                <span>Modifier mon profil</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Membres;