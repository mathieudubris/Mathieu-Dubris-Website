"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  auth, 
  setupAuthListener, 
  getProjectTeamMembers, 
  getProjectBySlug,
  isUserMemberOfProject
} from '@/utils/firebase-api';
import { 
  User, Mail, Phone, MapPin, Monitor, Laptop, FolderKanban, Code2,
  Instagram, MessageCircle, Youtube, Facebook, Twitter, Linkedin,
  Music, MessageSquare, Shield
} from 'lucide-react';
import Header from '@/components/app/Header/Header';
import Login from '@/components/app/Header/Login/Login';
import styles from './view.module.css';

interface ProjectTeamMember {
  id: string;
  userId: string;
  projectId: string;
  slug?: string;
  image: string;
  firstName: string;
  lastName: string;
  age: number;
  agePublic: boolean;
  email: string;
  phone?: string;
  skills?: string;
  skillsPublic?: boolean; // NOUVEAU
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
      isPublic: boolean;
    };
    computer: {
      os: 'windows' | 'mac' | 'linux';
      ram: string;
      storage: string;
      gpu?: string;
      isPublic: boolean;
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

const rolesData = [
  { name: 'Game Director', colorClass: 'Direction' },
  { name: 'Creative Director', colorClass: 'Direction' },
  { name: 'Technical Director', colorClass: 'Direction' },
  { name: 'Project Manager', colorClass: 'Direction' },
  { name: 'Team Coordinator', colorClass: 'Direction' },
  { name: 'Game Designer', colorClass: 'Design' },
  { name: 'Level Designer', colorClass: 'Design' },
  { name: 'Gameplay Designer', colorClass: 'Design' },
  { name: 'Narrative Designer', colorClass: 'Design' },
  { name: 'Game Programmer', colorClass: 'Programming' },
  { name: 'Engine Programmer', colorClass: 'Programming' },
  { name: 'AI Programmer', colorClass: 'Programming' },
  { name: 'UI Programmer', colorClass: 'Programming' },
  { name: '3D Artist', colorClass: 'Art3D' },
  { name: '3D Cinematic', colorClass: 'Art3D' },
  { name: 'Texture Artist', colorClass: 'Art3D' },
  { name: 'Prop Artist', colorClass: 'Art3D' },
  { name: 'Environment Artist', colorClass: 'Art3D' },
  { name: '3D Animator', colorClass: 'Art3D' },
  { name: 'Mocap Actor', colorClass: 'Art3D' },
  { name: '3D Art Support', colorClass: 'Art3D' },
  { name: 'Technical Artist', colorClass: 'Art3D' },
  { name: 'UX Designer', colorClass: 'UIUX' },
  { name: 'UI Designer', colorClass: 'UIUX' },
  { name: 'UI Artist', colorClass: 'UIUX' },
  { name: 'UI Art Support', colorClass: 'UIUX' },
  { name: 'Music Composer', colorClass: 'Audio' },
  { name: 'Sound Designer', colorClass: 'Audio' },
  { name: 'Voice Actor', colorClass: 'Audio' },
  { name: 'Voice Director', colorClass: 'Audio' },
  { name: 'Community Manager', colorClass: 'Support' },
  { name: 'Documentation Manager', colorClass: 'Support' },
  { name: 'Content Creator', colorClass: 'Support' },
  { name: 'Marketing Manager', colorClass: 'Support' },
  { name: 'QA Tester', colorClass: 'Support' }
];

const getRoleColorClass = (roleName: string): string => {
  const role = rolesData.find(r => r.name === roleName);
  return role ? role.colorClass : '';
};

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

const normalizeMemberData = (member: any): ProjectTeamMember => {
  return {
    ...member,
    id: member.id || '',
    userId: member.userId || '',
    projectId: member.projectId || '',
    firstName: member.firstName || '',
    lastName: member.lastName || '',
    age: member.age || 0,
    agePublic: member.agePublic !== undefined ? member.agePublic : true,
    email: member.email || '',
    phone: member.phone || '',
    image: member.image || '',
    skills: member.skills || '',
    skillsPublic: member.skillsPublic !== undefined ? member.skillsPublic : true, // NOUVEAU
    contacts: member.contacts || [],
    roles: member.roles || [],
    equipment: {
      phone: {
        model: member.equipment?.phone?.model || '',
        internet: member.equipment?.phone?.internet || 'wifi',
        isPublic: member.equipment?.phone?.isPublic !== undefined ? member.equipment.phone.isPublic : true
      },
      computer: {
        os: member.equipment?.computer?.os || 'windows',
        ram: member.equipment?.computer?.ram || '',
        storage: member.equipment?.computer?.storage || '',
        gpu: member.equipment?.computer?.gpu || '',
        isPublic: member.equipment?.computer?.isPublic !== undefined ? member.equipment.computer.isPublic : true
      }
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

function TeamViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get('project');
  
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<ProjectTeamMember | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<any>(null);
  const [isUserMember, setIsUserMember] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      if (user) {
        setCurrentUser(user);
      }
      if (projectSlug) {
        await loadProjectFromSlug(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectSlug]);

  const loadProjectFromSlug = async (user: any) => {
    if (!projectSlug) return;
    try {
      const projectData = await getProjectBySlug(projectSlug);
      if (projectData) {
        setProjectTitle(projectData.title);
        setProjectId(projectData.id || '');
        setProject(projectData);
        
        // Vérifier si l'utilisateur est membre du projet
        const userIsMember = user ? isUserMemberOfProject(projectData, user.uid) : false;
        setIsUserMember(userIsMember);
        
        await loadTeamMembers(projectData.id || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
    }
  };

  useEffect(() => {
    if (!projectSlug && !loading) {
      router.push('/portfolio/projet-en-cours');
    }
  }, [projectSlug, loading, router]);

  const loadTeamMembers = async (pid: string) => {
    try {
      const members = await getProjectTeamMembers(pid);
      const formattedMembers = members.map(member => 
        normalizeMemberData(member)
      );
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const handleEditProfile = () => {
    if (currentUser && projectSlug) {
      router.push(`/portfolio/team?project=${projectSlug}`);
    } else {
      setShowLogin(true);
    }
  };

  const handleBackToProjects = () => {
    router.push('/portfolio/projet-en-cours');
  };

  // Fonction pour vérifier si une information doit être affichée
  const shouldShowInfo = (isPublic: boolean): boolean => {
    // Si l'utilisateur est membre du projet, il voit tout (même les infos privées)
    if (isUserMember) return true;
    // Sinon, il ne voit que les infos publiques
    return isPublic;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>Chargement de l'équipe...</div>
      </div>
    );
  }

  if (!projectSlug) {
    return (
      <div className={styles.mainContainer}>
        <Header />
        <div className={styles.loginCenter}>
          <button
            onClick={handleBackToProjects}
            className={styles.loginCenterButton}
          >
            <FolderKanban size={20} />
            Retour aux projets
          </button>
        </div>
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
                    {projectTitle ? `Équipe - ${projectTitle}` : 'Équipe du projet'}
                  </h1>
                  <p className={styles.pageSubtitle}>
                    {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} dans l'équipe
                    {isUserMember && (
                      <span className={styles.memberBadge}>
                        <Shield size={12} />
                        Membre
                      </span>
                    )}
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
              
              {teamMembers.length > 0 ? (
                <div className={styles.teamGrid}>
                  {teamMembers.map((member, index) => {
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={styles.memberCard}
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className={styles.cardPhotoWrap}>
                          {member.image ? (
                            <img src={member.image} alt={`${member.firstName} ${member.lastName}`} className={styles.cardPhoto} />
                          ) : (
                            <div className={styles.cardPhotoPlaceholder}>
                              <User size={48} />
                            </div>
                          )}
                        </div>

                        <div className={styles.cardBody}>
                          <h3 className={styles.memberName}>
                            {member.firstName} {member.lastName}
                          </h3>
                          {shouldShowInfo(member.agePublic) && member.age > 0 && (
                            <p className={styles.memberAge}>{member.age} ans</p>
                          )}
                          <div className={styles.rolesList}>
                            {member.roles.slice(0, 2).map((role, i) => {
                              const colorClass = getRoleColorClass(role);
                              return (
                                <span key={i} className={`${styles.roleTag} ${styles[colorClass]}`}>
                                  {role}
                                </span>
                              );
                            })}
                            {member.roles.length > 2 && (
                              <span className={styles.moreRoles}>+{member.roles.length - 2}</span>
                            )}
                          </div>
                          <p className={styles.locationText}>
                            <MapPin size={11} style={{display:'inline', marginRight:'3px', flexShrink: 0}} />
                            {member.location?.city || '—'}, {member.location?.country || '—'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <User size={48} className={styles.emptyStateIcon} />
                  <h3 className={styles.emptyStateTitle}>
                    Aucun membre dans ce projet
                  </h3>
                  <p className={styles.emptyStateText}>
                    Soyez le premier à créer votre profil d'équipe
                  </p>
                  <button
                    onClick={handleEditProfile}
                    className={styles.emptyStateButton}
                  >
                    Créer mon profil
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

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
                  {isUserMember && selectedMember.userId === currentUser?.uid && (
                    <span className={styles.memberBadge}> (Vous)</span>
                  )}
                </h2>
                {shouldShowInfo(selectedMember.agePublic) && selectedMember.age > 0 && (
                  <div className={styles.modalAge}>
                    {selectedMember.age} ans
                  </div>
                )}
                <div className={styles.modalEmail}>
                  <Mail size={16} />
                  {selectedMember.email}
                </div>
              </div>
            </div>
            
            <div className={styles.modalSections}>
              {/* Rôles - Premier */}
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
              
              {/* Localisation - Deuxième */}
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>
                  <MapPin size={18} />
                  <span>Localisation</span>
                </h3>
                {selectedMember.location ? (
                  <>
                    <p className={styles.modalLocation}>
                      {selectedMember.location.city || 'Ville non renseignée'}, {selectedMember.location.country || 'Pays non renseigné'}
                    </p>
                    {shouldShowInfo(selectedMember.location.districtPublic) && selectedMember.location.district && (
                      <p className={styles.modalDistrict}>
                        {selectedMember.location.district}
                      </p>
                    )}
                  </>
                ) : (
                  <p className={styles.modalLocation}>Localisation non renseignée</p>
                )}
              </div>
              
              {/* Contacts - Troisième */}
              {selectedMember.contacts && selectedMember.contacts.filter(c => shouldShowInfo(c.isPublic)).length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>
                    <Phone size={18} />
                    <span>Contacts</span>
                  </h3>
                  <div className={styles.modalContacts}>
                    {selectedMember.contacts
                      .filter(contact => shouldShowInfo(contact.isPublic))
                      .map((contact, i) => {
                        const ContactIcon = getContactLucideIcon(contact.type);
                        
                        return (
                          <div key={i} className={styles.modalContact}>
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
                        );
                    })}
                  </div>
                </div>
              )}
              
              {/* Matériel - Quatrième */}
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>
                  <Laptop size={18} />
                  <span>Matériel utilisé</span>
                </h3>
                <div className={styles.modalEquipment}>
                  {/* Téléphone */}
                  {shouldShowInfo(selectedMember.equipment.phone.isPublic) && selectedMember.equipment.phone.model && (
                    <div className={styles.equipmentItem}>
                      <strong>Téléphone:</strong> {selectedMember.equipment.phone.model}
                      {selectedMember.equipment.phone.internet && (
                        <span className={styles.equipmentDetail}>
                          {" "}({selectedMember.equipment.phone.internet === 'wifi' ? 'Wi-Fi' : 
                                  selectedMember.equipment.phone.internet === 'mobile' ? 'Mobile' : 'Wi-Fi + Mobile'})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Ordinateur */}
                  {shouldShowInfo(selectedMember.equipment.computer.isPublic) && (
                    <>
                      {selectedMember.equipment.computer.os && (
                        <div className={styles.equipmentItem}>
                          <strong>OS:</strong> {selectedMember.equipment.computer.os === 'windows' ? 'Windows' :
                                                   selectedMember.equipment.computer.os === 'mac' ? 'macOS' : 'Linux'}
                        </div>
                      )}
                      {selectedMember.equipment.computer.ram && (
                        <div className={styles.equipmentItem}>
                          <strong>RAM:</strong> {selectedMember.equipment.computer.ram}
                        </div>
                      )}
                      {selectedMember.equipment.computer.storage && (
                        <div className={styles.equipmentItem}>
                          <strong>Stockage:</strong> {selectedMember.equipment.computer.storage}
                        </div>
                      )}
                      {selectedMember.equipment.computer.gpu && (
                        <div className={styles.equipmentItem}>
                          <strong>GPU:</strong> {selectedMember.equipment.computer.gpu}
                        </div>
                      )}
                    </>
                  )}
                  
                  {!shouldShowInfo(selectedMember.equipment.phone.isPublic) && 
                   !shouldShowInfo(selectedMember.equipment.computer.isPublic) && (
                    <p className={styles.noEquipment}>
                      Aucune information matérielle visible
                    </p>
                  )}
                </div>
              </div>
              
              {/* Compétences - Cinquième (à la fin) */}
              {selectedMember.skills && selectedMember.skills.trim() !== '' && shouldShowInfo(selectedMember.skillsPublic !== false) && (
                <div className={`${styles.modalSection} ${styles.skills}`}>
                  <h3 className={styles.modalSectionTitle}>
                    <Code2 size={18} />
                    <span>Compétences</span>
                  </h3>
                  <div className={styles.skillsContent}>
                    {selectedMember.skills}
                    <div className={styles.skillsWordCount}>
                      {selectedMember.skills.split(/\s+/).length} mots
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </>
  );
}

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