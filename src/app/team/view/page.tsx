"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { auth, setupAuthListener, getTeamMembers, getProject } from '@/utils/firebase-api';
import { 
  User, Mail, Phone, MapPin, Monitor, Laptop, FolderKanban,
  Instagram, MessageCircle, Youtube, Facebook, Twitter, Linkedin,
  Music, MessageSquare
} from 'lucide-react';
import Header from '@/components/app/Header/Header';
import Login from '@/components/app/Header/Login/Login';
import styles from './view.module.css';

interface TeamMember {
  id: string;
  userId: string;
  image: string;
  firstName: string;
  lastName: string;
  age: number;
  agePublic: boolean;
  email: string;
  phone?: string;
  contacts: {
    type: 'instagram' | 'whatsapp' | 'discord' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
    value: string;
    label?: string;
    isPublic: boolean;
  }[];
  roles: string[];
  equipment: {
    phone: {
      model: string;
      internet: 'wifi' | 'mobile' | 'both';
    };
    computer: {
      os: 'windows' | 'mac' | 'linux';
      ram: string;
      storage: string;
      gpu?: string;
    };
  };
  location: {
    country: string;
    city: string;
    district?: string;
    districtPublic: boolean;
  };
  createdAt: Date;
}

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

// Fonction pour générer l'URL correcte en fonction du type de contact
const generateContactUrl = (contact: TeamMember['contacts'][0]): string => {
  const { type, value } = contact;
  
  // Si la valeur commence déjà par http/https, on l'utilise directement
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  
  switch (type) {
    case 'instagram':
      const instaUser = value.replace('@', '').trim();
      return `https://instagram.com/${instaUser}`;
    case 'facebook':
      const fbUser = value.replace('@', '').trim();
      return `https://facebook.com/${fbUser}`;
    case 'twitter':
      const twitterUser = value.replace('@', '').trim();
      return `https://twitter.com/${twitterUser}`;
    case 'youtube':
      if (value.includes('youtube.com') || value.includes('youtu.be')) {
        return value.includes('://') ? value : `https://${value}`;
      }
      const ytUser = value.replace('@', '').trim();
      return `https://youtube.com/@${ytUser}`;
    case 'linkedin':
      if (value.includes('linkedin.com')) {
        return value.includes('://') ? value : `https://${value}`;
      }
      const linkedinUser = value.trim();
      return `https://linkedin.com/in/${linkedinUser}`;
    case 'whatsapp':
      const phoneNumber = value.replace(/[^\d+]/g, '');
      return `https://wa.me/${phoneNumber}`;
    case 'discord':
      const discordUser = value.trim();
      return `https://discord.com/users/${discordUser}`;
    case 'tiktok':
      const tiktokUser = value.replace('@', '').trim();
      return `https://tiktok.com/@${tiktokUser}`;
    default:
      return '#';
  }
};

// Fonction pour obtenir l'icône Lucide correspondante
const getContactLucideIcon = (type: string) => {
  const icons = {
    instagram: Instagram,
    whatsapp: MessageCircle,
    discord: MessageSquare,
    tiktok: Music,
    youtube: Youtube,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin
  };
  return icons[type as keyof typeof icons] || MessageCircle;
};

// Fonction utilitaire pour normaliser les données des membres
const normalizeMemberData = (member: any): TeamMember => {
  return {
    ...member,
    id: member.id || '',
    userId: member.userId || '',
    firstName: member.firstName || '',
    lastName: member.lastName || '',
    age: member.age || 0,
    agePublic: member.agePublic !== undefined ? member.agePublic : true,
    email: member.email || '',
    phone: member.phone || '',
    image: member.image || '',
    contacts: member.contacts || [],
    roles: member.roles || [],
    equipment: member.equipment || {
      phone: { model: '', internet: 'wifi' },
      computer: { os: 'windows', ram: '', storage: '', gpu: '' }
    },
    location: member.location || {
      country: '',
      city: '',
      district: '',
      districtPublic: true
    },
    createdAt: member.createdAt?.toDate ? member.createdAt.toDate() : new Date(member.createdAt || Date.now())
  };
};

// Create a component that uses useSearchParams
function TeamViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string>('');

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadTeamMembers();
        if (projectId) {
          await loadProjectInfo();
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const loadProjectInfo = async () => {
    if (!projectId) return;
    
    try {
      const project = await getProject(projectId);
      if (project) {
        setProjectTitle(project.title);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const members = await getTeamMembers();
      
      // Filtrer par projet si projectId existe
      let filteredMembers = members;
      if (projectId) {
        // Récupérer le projet pour obtenir les membres
        const project = await getProject(projectId);
        if (project && project.teamMembers) {
          filteredMembers = members.filter(member => 
            project.teamMembers.includes(member.userId)
          );
        }
      }
      
      // Normaliser les données de chaque membre
      const formattedMembers = filteredMembers.map(member => 
        normalizeMemberData(member)
      );
      
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const handleEditProfile = () => {
    if (currentUser) {
      const url = projectId ? `/team?project=${projectId}` : '/team';
      router.push(url);
    } else {
      setShowLogin(true);
    }
  };

  const handleBackToProjects = () => {
    router.push('/portfolio/projet-en-cours');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>Chargement de l'équipe...</div>
      </div>
    );
  }

  return (
    <>
      <main className={styles.content}>
        <div className={styles.viewContainer}>
          {!currentUser ? (
            <div className={styles.loginCenter}>
              <button
                onClick={() => setShowLogin(true)}
                className={styles.loginCenterButton}
              >
                <User size={20} />
                Se connecter pour voir l'équipe
              </button>
            </div>
          ) : (
            <>
              <div className={styles.pageHeader}>
                <div>
                  <h1 className={styles.pageTitle}>
                    {projectTitle ? `Équipe - ${projectTitle}` : 'Notre Équipe'}
                  </h1>
                  <p className={styles.pageSubtitle}>
                    {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} dans l'équipe
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleBackToProjects}
                    className={styles.editProfileButton}
                  >
                    <FolderKanban size={16} />
                    Projets
                  </button>
                  
                  <button
                    onClick={handleEditProfile}
                    className={styles.editProfileButton}
                  >
                    <User size={16} />
                    Mon Profil
                  </button>
                </div>
              </div>
              
              {projectTitle && (
                <div className={styles.projectTitle}>
                  📁 Projet en cours : {projectTitle}
                </div>
              )}
              
              {teamMembers.length > 0 ? (
                <div className={styles.teamGrid}>
                  {teamMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={styles.memberCard}
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.avatar}>
                          {member.image ? (
                            <img src={member.image} alt={`${member.firstName} ${member.lastName}`} />
                          ) : (
                            <User size={32} />
                          )}
                        </div>
                        <div className={styles.memberInfo}>
                          <h3 className={styles.memberName}>
                            {member.firstName} {member.lastName}
                          </h3>
                          {member.agePublic && member.age > 0 && (
                            <div className={styles.memberAge}>{member.age} ans</div>
                          )}
                        </div>
                      </div>
                      
                      <div className={styles.cardContent}>
                        {member.roles && member.roles.length > 0 && (
                          <div className={styles.rolesSection}>
                            <h4 className={styles.sectionTitle}>
                              <Monitor size={14} />
                              <span>Rôles</span>
                            </h4>
                            <div className={styles.rolesList}>
                              {member.roles.slice(0, 3).map((role, i) => {
                                const colorClass = getRoleColorClass(role);
                                return (
                                  <span key={i} className={`${styles.roleTag} ${styles[colorClass]}`}>
                                    {role}
                                  </span>
                                );
                              })}
                              {member.roles.length > 3 && (
                                <span className={styles.moreRoles}>
                                  +{member.roles.length - 3} autres
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className={styles.locationSection}>
                          <h4 className={styles.sectionTitle}>
                            <MapPin size={14} />
                            <span>Localisation</span>
                          </h4>
                          <p className={styles.locationText}>
                            {member.location ? (
                              <>
                                {member.location.city || 'Ville non renseignée'}, {member.location.country || 'Pays non renseigné'}
                              </>
                            ) : (
                              'Localisation non renseignée'
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <User size={48} className={styles.emptyStateIcon} />
                  <h3 className={styles.emptyStateTitle}>
                    {projectTitle ? 'Aucun membre dans ce projet' : 'Aucun membre dans l\'équipe'}
                  </h3>
                  <p className={styles.emptyStateText}>
                    {projectTitle 
                      ? 'Les membres apparaîtront ici une fois ajoutés au projet'
                      : 'Créez votre profil pour être le premier membre de l\'équipe'
                    }
                  </p>
                  {!projectTitle && (
                    <button
                      onClick={handleEditProfile}
                      className={styles.emptyStateButton}
                    >
                      Créer mon profil
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de détail */}
      {selectedMember && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMember(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.closeModal}
              onClick={() => setSelectedMember(null)}
            >
              &times;
            </button>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalAvatar}>
                {selectedMember.image ? (
                  <img src={selectedMember.image} alt={`${selectedMember.firstName} ${selectedMember.lastName}`} />
                ) : (
                  <User size={64} />
                )}
              </div>
              <div className={styles.modalInfo}>
                <h2 className={styles.modalName}>
                  {selectedMember.firstName} {selectedMember.lastName}
                </h2>
                {selectedMember.agePublic && selectedMember.age > 0 && (
                  <div className={styles.modalAge}>{selectedMember.age} ans</div>
                )}
                <div className={styles.modalEmail}>
                  <Mail size={16} />
                  {selectedMember.email}
                </div>
              </div>
            </div>
            
            <div className={styles.modalSections}>
              {selectedMember.roles && selectedMember.roles.length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>
                    <Monitor size={18} />
                    <span>Rôles dans l'équipe</span>
                  </h3>
                  <div className={styles.modalRoles}>
                    {selectedMember.roles.map((role, i) => {
                      const colorClass = getRoleColorClass(role);
                      return (
                        <span key={i} className={`${styles.modalRoleTag} ${styles[colorClass]}`}>
                          {role}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>
                  <MapPin size={18} />
                  <span>Localisation</span>
                </h3>
                <p className={styles.modalLocation}>
                  {selectedMember.location ? (
                    <>
                      {selectedMember.location.city || 'Ville non renseignée'}, {selectedMember.location.country || 'Pays non renseigné'}
                      {selectedMember.location.districtPublic && selectedMember.location.district && (
                        <span className={styles.modalDistrict}>
                          • {selectedMember.location.district}
                        </span>
                      )}
                    </>
                  ) : (
                    'Localisation non renseignée'
                  )}
                </p>
              </div>
              
              {selectedMember.contacts && selectedMember.contacts.filter(c => c.isPublic).length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>
                    <Phone size={18} />
                    <span>Contacts</span>
                  </h3>
                  <div className={styles.modalContacts}>
                    {selectedMember.contacts
                      .filter(contact => contact.isPublic)
                      .map((contact, i) => {
                        const ContactIcon = getContactLucideIcon(contact.type);
                        const contactUrl = generateContactUrl(contact);
                        
                        return (
                          <a
                            key={i}
                            href={contactUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.modalContactLink}
                          >
                            <div className={styles.modalContact}>
                              <span className={styles.contactIcon}>
                                <ContactIcon size={20} />
                              </span>
                              <span className={styles.contactType}>
                                {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}:
                              </span>
                              <span className={styles.contactValue}>
                                {contact.value}
                              </span>
                            </div>
                          </a>
                        );
                    })}
                  </div>
                </div>
              )}
              
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>
                  <Laptop size={18} />
                  <span>Matériel utilisé</span>
                </h3>
                <div className={styles.modalEquipment}>
                  {selectedMember.equipment.phone.model && (
                    <div className={styles.equipmentItem}>
                      <strong>Téléphone:</strong> {selectedMember.equipment.phone.model}
                    </div>
                  )}
                  {selectedMember.equipment.computer.ram && (
                    <div className={styles.equipmentItem}>
                      <strong>Ordinateur:</strong> {selectedMember.equipment.computer.os} • {selectedMember.equipment.computer.ram}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </>
  );
}

// Main component with Suspense boundary
export default function TeamViewPage() {
  return (
    <div className={styles.mainContainer}>
      <Header />
      <Suspense fallback={
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Chargement...</div>
        </div>
      }>
        <TeamViewContent />
      </Suspense>
    </div>
  );
}