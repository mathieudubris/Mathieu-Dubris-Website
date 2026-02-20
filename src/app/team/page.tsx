"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { FolderKanban, ArrowLeft, Menu, X, User as UserIcon, Save, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  auth,
  setupAuthListener,
  saveProjectTeamMember,
  getUserProjectTeamProfile,
  getProjectBySlug
} from '@/utils/firebase-api';
import Header from '@/components/app/Header/Header';
import Login from '@/components/app/Header/Login/Login';
import Profile from './slider/Profile';
import PersonalInfoLocation from './slider/PersonalInfoLocation';
import Contacts from './slider/Contacts';
import Role from './slider/Role';
import Equipment from './slider/Equipment';
import styles from './team.module.css';

interface ProjectTeamMember {
  id?: string;
  userId: string;
  projectId: string;
  slug?: string;
  image: string;
  firstName: string;
  lastName: string;
  age: number;
  agePublic: boolean;
  email: string;
  phone: string;
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
    district: string;
    districtPublic: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const sections = [
  { id: 'profile', label: 'Profil', icon: UserIcon, shortLabel: 'Profil' },
  { id: 'info', label: 'Infos', icon: UserIcon, shortLabel: 'Infos' },
  { id: 'contacts', label: 'Contacts', icon: UserIcon, shortLabel: 'Contacts' },
  { id: 'role', label: 'Rôle', icon: UserIcon, shortLabel: 'Rôle' },
  { id: 'equipment', label: 'Matériel', icon: UserIcon, shortLabel: 'Matériel' },
];

const convertFirestoreDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  if (typeof date === 'string' || typeof date === 'number') {
    return new Date(date);
  }
  return new Date();
};

function EquipePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get('project');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [isMember, setIsMember] = useState<boolean>(false);
  const [accessError, setAccessError] = useState<string>('');
  
  const [teamMember, setTeamMember] = useState<ProjectTeamMember>({
    userId: '',
    projectId: '',
    image: '',
    firstName: '',
    lastName: '',
    age: 0,
    agePublic: true,
    email: '',
    phone: '',
    contacts: [],
    roles: [],
    equipment: {
      phone: {
        model: '',
        internet: 'wifi',
        isPublic: true
      },
      computer: {
        os: 'windows',
        ram: '',
        storage: '',
        gpu: '',
        isPublic: true
      }
    },
    location: {
      country: '',
      city: '',
      district: '',
      districtPublic: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      if (user) {
        setCurrentUser(user);
        if (projectSlug) {
          await loadProjectFromSlug(user);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [projectSlug]);

  const loadProjectFromSlug = async (user: any) => {
    if (!projectSlug || !user) return;
    
    try {
      const project = await getProjectBySlug(projectSlug);
      if (project) {
        setProjectTitle(project.title);
        setProjectId(project.id || '');
        
        const userIsMember = project.teamMembers?.includes(user.uid) || 
                            project.createdBy === user.uid;
        
        setIsMember(userIsMember);
        
        if (!userIsMember) {
          setAccessError("Vous n'êtes pas membre de ce projet. Vous ne pouvez pas accéder à la page d'équipe.");
          return;
        }
        
        await loadTeamMemberData(user.uid, project.id || '');
      } else {
        router.push('/portfolio/projet-en-cours');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      setAccessError("Erreur lors du chargement du projet");
    }
  };

  useEffect(() => {
    if (!projectSlug && !isLoading) {
      router.push('/portfolio/projet-en-cours');
    }
  }, [projectSlug, isLoading, router]);

  const loadTeamMemberData = async (userId: string, pid: string) => {
    try {
      const profile = await getUserProjectTeamProfile(userId, pid);
      
      if (profile) {
        const createdAt = convertFirestoreDate(profile.createdAt);
        const updatedAt = convertFirestoreDate(profile.updatedAt);
        
        setTeamMember({
          ...profile,
          userId: profile.userId || userId,
          projectId: pid,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || currentUser?.email || '',
          phone: profile.phone || '',
          age: profile.age || 0,
          agePublic: profile.agePublic !== undefined ? profile.agePublic : true,
          image: profile.image || '',
          contacts: profile.contacts || [],
          roles: profile.roles || [],
          equipment: {
            phone: {
              model: profile.equipment?.phone?.model || '',
              internet: profile.equipment?.phone?.internet || 'wifi',
              isPublic: profile.equipment?.phone?.isPublic !== undefined ? profile.equipment.phone.isPublic : true
            },
            computer: {
              os: profile.equipment?.computer?.os || 'windows',
              ram: profile.equipment?.computer?.ram || '',
              storage: profile.equipment?.computer?.storage || '',
              gpu: profile.equipment?.computer?.gpu || '',
              isPublic: profile.equipment?.computer?.isPublic !== undefined ? profile.equipment.computer.isPublic : true
            }
          },
          location: {
            country: profile.location?.country || '',
            city: profile.location?.city || '',
            district: profile.location?.district || '',
            districtPublic: profile.location?.districtPublic !== undefined ? profile.location.districtPublic : true
          },
          createdAt,
          updatedAt
        });
      } else {
        setTeamMember(prev => ({
          ...prev,
          userId,
          projectId: pid,
          email: currentUser?.email || '',
          firstName: currentUser?.displayName?.split(' ')[0] || '',
          lastName: currentUser?.displayName?.split(' ').slice(1).join(' ') || '',
          image: currentUser?.photoURL || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleImageUpload = () => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    if (typeof window !== "undefined" && (window as any).cloudinary) {
      const widget = (window as any).cloudinary.createUploadWidget({
        cloudName: 'dhqqx2m3y',
        uploadPreset: 'team-profil-preset',
        sources: ['local', 'url'],
        multiple: false,
        resourceType: 'image',
        theme: "minimal",
      }, (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          updateTeamMember('image', result.info.secure_url);
        }
      });
      widget.open();
    }
  };

  const updateTeamMember = (field: string, value: any) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    const fieldParts = field.split('.');
    
    if (fieldParts.length === 1) {
      setTeamMember(prev => ({ 
        ...prev, 
        [field]: value,
        updatedAt: new Date()
      }));
    } else if (fieldParts.length === 2) {
      const [mainField, subField] = fieldParts;
      setTeamMember(prev => ({
        ...prev,
        [mainField]: {
          ...(prev[mainField as keyof ProjectTeamMember] as any),
          [subField]: value
        },
        updatedAt: new Date()
      }));
    } else if (fieldParts.length === 3) {
      const [mainField, subField, subSubField] = fieldParts;
      setTeamMember(prev => {
        const mainObj = prev[mainField as keyof ProjectTeamMember] as any;
        const subObj = mainObj[subField];
        
        return {
          ...prev,
          [mainField]: {
            ...mainObj,
            [subField]: {
              ...subObj,
              [subSubField]: value
            }
          },
          updatedAt: new Date()
        };
      });
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background-color: ${type === 'success' ? 'var(--primary)' : 'var(--dark-red)'};
      color: ${type === 'success' ? 'var(--dark)' : 'var(--light)'};
      padding: 1rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  };

  const handleSave = async () => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    if (!projectId) {
      showNotification('❌ Erreur: Aucun projet sélectionné', 'error');
      return;
    }

    const errors = [];
    
    if (!teamMember.image) {
      errors.push("Photo de profil");
    }
    
    if (!teamMember.firstName.trim()) {
      errors.push("Prénom");
    }
    if (!teamMember.lastName.trim()) {
      errors.push("Nom");
    }
    
    if (!teamMember.age || teamMember.age <= 0) {
      errors.push("Âge");
    }
    
    if (!teamMember.location?.country.trim()) {
      errors.push("Pays");
    }
    if (!teamMember.location?.city.trim()) {
      errors.push("Ville");
    }
    
    if (!teamMember.roles || teamMember.roles.length === 0) {
      errors.push("Au moins un rôle");
    }
    
    if (!teamMember.equipment?.phone?.model.trim()) {
      errors.push("Modèle de téléphone");
    }
    
    if (errors.length > 0) {
      showNotification(`⚠️ Champs obligatoires manquants : ${errors.join(', ')}`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      await saveProjectTeamMember(currentUser.uid, projectId, {
        ...teamMember,
        userId: currentUser.uid,
        projectId: projectId,
        email: teamMember.email || currentUser.email || '',
        updatedAt: new Date()
      });

      showNotification('✅ Profil enregistré avec succès!', 'success');
      
      setTimeout(() => {
        router.push(`/portfolio/projet-en-cours?project=${projectSlug}`);
      }, 1500);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showNotification('❌ Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addContact = (contact: any) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    setTeamMember(prev => ({
      ...prev,
      contacts: [...prev.contacts, { ...contact, isPublic: true }],
      updatedAt: new Date()
    }));
  };

  const removeContact = (index: number) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    setTeamMember(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
      updatedAt: new Date()
    }));
  };

  const updateContactPrivacy = (index: number, isPublic: boolean) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    setTeamMember(prev => {
      const newContacts = [...prev.contacts];
      newContacts[index] = { ...newContacts[index], isPublic };
      return { 
        ...prev, 
        contacts: newContacts,
        updatedAt: new Date()
      };
    });
  };

  const nextSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
  };

  const prevSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  };

  const handleBackToProjects = () => {
    router.push('/portfolio/projet-en-cours');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Profile
            teamMember={teamMember}
            onImageUpload={handleImageUpload}
            hideTitle={true}
          />
        );
      case 'info':
        return (
          <PersonalInfoLocation
            teamMember={teamMember}
            onUpdate={updateTeamMember}
            hideTitle={true}
          />
        );
      case 'contacts':
        return (
          <Contacts
            teamMember={teamMember}
            onAddContact={addContact}
            onRemoveContact={removeContact}
            onUpdateContactPrivacy={updateContactPrivacy}
            hideTitle={true}
          />
        );
      case 'role':
        return (
          <Role
            teamMember={teamMember}
            onUpdate={updateTeamMember}
            hideTitle={true}
          />
        );
      case 'equipment':
        return (
          <Equipment
            teamMember={teamMember}
            onUpdate={updateTeamMember}
            hideTitle={true}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>Chargement...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={styles.mainContainer}>
        <Header />
        <div className={styles.loginCenter}>
          <button
            onClick={() => setShowLogin(true)}
            className={styles.loginCenterButton}
          >
            <UserIcon size={20} />
            Se connecter pour créer votre profil
          </button>
        </div>
        
        {showLogin && <Login onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  if (accessError) {
    return (
      <div className={styles.mainContainer}>
        <Header />
        <div className={styles.accessDenied}>
          <div className={styles.accessDeniedContent}>
            <p>{accessError}</p>
            <button
              onClick={handleBackToProjects}
              className={styles.backButton}
            >
              <ArrowLeft size={16} />
              Retour aux projets
            </button>
          </div>
        </div>
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
    <div className={styles.mainContainer}>
      <Header />
      
      <main className={styles.content}>
        <div className={styles.pageContainer}>
          <div className={styles.projectTitleRow}>
            <h1 className={styles.projectTitle}>
              {projectTitle ? `Équipe - ${projectTitle}` : 'Équipe du projet'}
            </h1>
          </div>

          <header className={styles.header}>
            <div className={styles.navLeftSection}>
              <button
                className={styles.mobileMenuToggle}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              <div className={`${styles.navButtons} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`${styles.navButton} ${
                        activeSection === section.id ? styles.active : ''
                      }`}
                    >
                      <Icon size={16} />
                      <span className={styles.navLabel}>{section.label}</span>
                      <span className={styles.navShortLabel}>{section.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className={styles.headerActions}>
              <button
                onClick={handleBackToProjects}
                className={styles.projectsButton}
                title="Retour aux projets"
              >
                <FolderKanban size={16} />
                <span className={styles.buttonText}>Projets</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={styles.saveButton}
                title="Enregistrer"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    <span className={styles.saveText}>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </header>

          <div className={styles.mainContent}>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderSection()}
            </motion.div>
          </div>

          <footer className={styles.footer}>
            <button
              onClick={prevSection}
              disabled={activeSection === sections[0].id}
              className={styles.navArrow}
            >
              <ChevronLeft size={18} />
              <span className={styles.navArrowText}>Précédent</span>
            </button>
            
            <div className={styles.navIndicator}>
              <span className={styles.navIndicatorText}>
                {sections.findIndex(s => s.id === activeSection) + 1} / {sections.length}
              </span>
            </div>
            
            <button
              onClick={nextSection}
              disabled={activeSection === sections[sections.length - 1].id}
              className={styles.navArrow}
            >
              <span className={styles.navArrowText}>Suivant</span>
              <ChevronRight size={18} />
            </button>
          </footer>
        </div>
      </main>

      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </div>
  );
}

export default function EquipePage() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>Chargement...</div>
      </div>
    }>
      <EquipePageContent />
    </Suspense>
  );
}