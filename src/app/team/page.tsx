"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { FolderKanban, ArrowLeft, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, setupAuthListener, canEditTeamMember } from '@/utils/firebase-api';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { 
  User, Info, Phone, Monitor, Laptop, MapPin,
  Save, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import Header from '@/components/app/Header/Header';
import Login from '@/components/app/Header/Login/Login';
import Profile from './slider/Profile';
import PersonalInfoLocation from './slider/PersonalInfoLocation';
import Contacts from './slider/Contacts';
import Role from './slider/Role';
import Equipment from './slider/Equipment';
import styles from './team.module.css';

interface TeamMember {
  id?: string;
  userId: string;
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
    district: string;
    districtPublic: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const sections = [
  { id: 'profile', label: 'Profil', icon: User, shortLabel: 'Profil' },
  { id: 'info', label: 'Infos', icon: Info, shortLabel: 'Infos' },
  { id: 'contacts', label: 'Contacts', icon: Phone, shortLabel: 'Contacts' },
  { id: 'role', label: 'Rôle', icon: Monitor, shortLabel: 'Rôle' },
  { id: 'equipment', label: 'Matériel', icon: Laptop, shortLabel: 'Matériel' },
];

const convertFirestoreDate = (date: any): Date => {
  if (!date) return new Date();
  
  if (date instanceof Date) {
    return date;
  }
  
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  
  if (typeof date === 'string') {
    return new Date(date);
  }
  
  if (typeof date === 'number') {
    return new Date(date);
  }
  
  return new Date();
};

function EquipePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [teamMember, setTeamMember] = useState<TeamMember>({
    userId: '',
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
        internet: 'wifi'
      },
      computer: {
        os: 'windows',
        ram: '',
        storage: '',
        gpu: ''
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
        await loadTeamMemberData(user.uid);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadTeamMemberData = async (userId: string) => {
    try {
      const db = getFirestore();
      const teamRef = doc(db, 'team', userId);
      const teamSnap = await getDoc(teamRef);
      
      if (teamSnap.exists()) {
        const data = teamSnap.data() as any;
        
        const canEdit = await canEditTeamMember(userId, auth.currentUser);
        if (!canEdit) {
          console.warn("L'utilisateur n'a pas la permission de modifier cette fiche");
          router.push('/team/view');
          return;
        }
        
        const createdAt = convertFirestoreDate(data.createdAt);
        const updatedAt = convertFirestoreDate(data.updatedAt);
        
        setTeamMember({
          ...data,
          userId: data.userId || userId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || currentUser?.email || '',
          phone: data.phone || '',
          age: data.age || 0,
          agePublic: data.agePublic !== undefined ? data.agePublic : true,
          image: data.image || '',
          contacts: data.contacts || [],
          roles: data.roles || [],
          equipment: {
            phone: {
              model: data.equipment?.phone?.model || '',
              internet: data.equipment?.phone?.internet || 'wifi'
            },
            computer: {
              os: data.equipment?.computer?.os || 'windows',
              ram: data.equipment?.computer?.ram || '',
              storage: data.equipment?.computer?.storage || '',
              gpu: data.equipment?.computer?.gpu || ''
            }
          },
          location: {
            country: data.location?.country || '',
            city: data.location?.city || '',
            district: data.location?.district || '',
            districtPublic: data.location?.districtPublic !== undefined ? data.location.districtPublic : true
          },
          createdAt,
          updatedAt
        });
      } else {
        setTeamMember(prev => ({
          ...prev,
          userId,
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
          ...(prev[mainField as keyof TeamMember] as any),
          [subField]: value
        },
        updatedAt: new Date()
      }));
    } else if (fieldParts.length === 3) {
      const [mainField, subField, subSubField] = fieldParts;
      setTeamMember(prev => {
        const mainObj = prev[mainField as keyof TeamMember] as any;
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

  const handleSave = async () => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    if (!teamMember.firstName.trim() || !teamMember.lastName.trim() || !teamMember.email.trim()) {
      alert('⚠️ Veuillez remplir les informations obligatoires (Prénom, Nom, Email)');
      return;
    }

    setIsSaving(true);
    try {
      const db = getFirestore();
      const teamRef = doc(db, 'team', currentUser.uid);
      
      if (teamMember.userId !== currentUser.uid) {
        alert('❌ Vous ne pouvez pas modifier cette fiche');
        return;
      }
      
      const teamData = {
        ...teamMember,
        userId: currentUser.uid,
        createdAt: teamMember.createdAt ? Timestamp.fromDate(new Date(teamMember.createdAt)) : Timestamp.now(),
        updatedAt: Timestamp.now(),
        phone: teamMember.phone || '',
        contacts: teamMember.contacts || [],
        roles: teamMember.roles || []
      };
      
      Object.keys(teamData).forEach(key => {
        if (teamData[key as keyof typeof teamData] === undefined) {
          delete teamData[key as keyof typeof teamData];
        }
      });
      
      await setDoc(teamRef, teamData, { merge: true });

      alert('✅ Profil enregistré avec succès!');
      
      if (projectId) {
        setTimeout(() => {
          router.push(`/projet-en-cours?project=${projectId}`);
        }, 1500);
      } else {
        setTimeout(() => {
          router.push('/team/view');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
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

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Profile
            teamMember={teamMember}
            onImageUpload={handleImageUpload}
          />
        );
      case 'info':
        return (
          <PersonalInfoLocation
            teamMember={teamMember}
            onUpdate={updateTeamMember}
          />
        );
      case 'contacts':
        return (
          <Contacts
            teamMember={teamMember}
            onUpdate={updateTeamMember}
            onAddContact={addContact}
            onRemoveContact={removeContact}
            onUpdateContactPrivacy={updateContactPrivacy}
          />
        );
      case 'role':
        return (
          <Role
            teamMember={teamMember}
            onUpdate={updateTeamMember}
          />
        );
      case 'equipment':
        return (
          <Equipment
            teamMember={teamMember}
            onUpdate={updateTeamMember}
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
            <User size={20} />
            Se connecter pour créer votre profil
          </button>
        </div>
        
        {showLogin && <Login onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <Header />
      
      <main className={styles.content}>
        <div className={styles.pageContainer}>
          <header className={styles.header}>
            {/* Mobile Menu Toggle */}
            <button
              className={styles.mobileMenuToggle}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
            
            <div className={styles.headerActions}>
              {/* Actions Desktop */}
              <div className={styles.desktopActions}>
                {projectId && (
                  <button
                    onClick={() => router.push(`/projet-en-cours?project=${projectId}`)}
                    className={styles.viewTeamButton}
                  >
                    <ArrowLeft size={16} />
                    <span>Retour</span>
                  </button>
                )}
                
                <button
                  onClick={() => router.push('/portfolio/projet-en-cours')}
                  className={styles.viewTeamButton}
                >
                  <FolderKanban size={16} />
                  <span>Projets</span>
                </button>
                
                {!projectId && (
                  <button
                    onClick={() => router.push('/team/view')}
                    className={styles.viewTeamButton}
                  >
                    <span>Équipe</span>
                  </button>
                )}
              </div>
              
              {/* Mobile Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`${styles.saveButton} ${styles.mobileSaveButton}`}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Save size={16} className={styles.saveIcon} />
                    <span className={styles.saveText}>Enregistrer</span>
                    <span className={styles.saveShortText}>Save</span>
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
              <span className={styles.navArrowShortText}>Préc.</span>
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
              <span className={styles.navArrowShortText}>Suiv.</span>
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