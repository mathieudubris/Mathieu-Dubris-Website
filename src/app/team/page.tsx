"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, setupAuthListener } from '@/utils/firebase-api';
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
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'info', label: 'Infos', icon: Info },
  { id: 'contacts', label: 'Contacts', icon: Phone },
  { id: 'role', label: 'Rôle', icon: Monitor },
  { id: 'equipment', label: 'Matériel', icon: Laptop },
];

export default function EquipePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  
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
        const data = teamSnap.data() as TeamMember;
        
        // Conversion sécurisée des dates
        const createdAt = data.createdAt instanceof Date 
          ? data.createdAt 
          : data.createdAt?.toDate 
            ? data.createdAt.toDate() 
            : new Date();
        
        const updatedAt = data.updatedAt instanceof Date 
          ? data.updatedAt 
          : data.updatedAt?.toDate 
            ? data.updatedAt.toDate() 
            : new Date();
        
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
        // Nouvel utilisateur
        setTeamMember(prev => ({
          ...prev,
          userId,
          email: currentUser?.email || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleImageUpload = () => {
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

    // Validation des champs obligatoires
    if (!teamMember.firstName.trim() || !teamMember.lastName.trim() || !teamMember.email.trim()) {
      alert('⚠️ Veuillez remplir les informations obligatoires (Prénom, Nom, Email)');
      return;
    }

    setIsSaving(true);
    try {
      const db = getFirestore();
      const teamRef = doc(db, 'team', currentUser.uid);
      
      // Créer l'objet pour Firestore
      const teamData = {
        ...teamMember,
        userId: currentUser.uid,
        // Convertir les dates en Timestamp Firestore
        createdAt: teamMember.createdAt ? Timestamp.fromDate(new Date(teamMember.createdAt)) : Timestamp.now(),
        updatedAt: Timestamp.now(),
        // S'assurer que tous les champs sont définis
        phone: teamMember.phone || '',
        contacts: teamMember.contacts || [],
        roles: teamMember.roles || []
      };
      
      // Supprimer les propriétés undefined
      Object.keys(teamData).forEach(key => {
        if (teamData[key as keyof typeof teamData] === undefined) {
          delete teamData[key as keyof typeof teamData];
        }
      });
      
      await setDoc(teamRef, teamData, { merge: true });

      alert('✅ Profil enregistré avec succès!');
      // Redirection vers la page view
      setTimeout(() => {
        window.location.href = '/team/view';
      }, 1500);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const addContact = (contact: any) => {
    setTeamMember(prev => ({
      ...prev,
      contacts: [...prev.contacts, { ...contact, isPublic: true }],
      updatedAt: new Date()
    }));
  };

  const removeContact = (index: number) => {
    setTeamMember(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
      updatedAt: new Date()
    }));
  };

  const updateContactPrivacy = (index: number, isPublic: boolean) => {
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
      <div className={styles.loginContainer}>
        <Header />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.loginContent}
          style={{ paddingTop: '80px' }}
        >
          <h1 className={styles.loginTitle}>Accès Équipe</h1>
          <p className={styles.loginSubtitle}>
            Connectez-vous pour créer ou modifier votre profil d'équipe
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className={styles.loginButton}
          >
            Se connecter avec Google
          </button>
        </motion.div>
        
        <AnimatePresence>
          {showLogin && <Login onClose={() => setShowLogin(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <Header />
      
      <main className={styles.content}>
        <div className={styles.pageContainer}>
          {/* Header de navigation */}
          <header className={styles.header}>
            <div className={styles.navButtons}>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`${styles.navButton} ${
                      activeSection === section.id ? styles.active : ''
                    }`}
                  >
                    <Icon size={14} />
                    {section.label}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={styles.saveButton}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </header>

          {/* Contenu Scrollable */}
          <div className={styles.mainContent}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer de navigation */}
          <footer className={styles.footer}>
            <button
              onClick={prevSection}
              disabled={activeSection === sections[0].id}
              className={styles.navArrow}
            >
              <ChevronLeft size={18} />
              Précédent
            </button>
            
            <div className={styles.navIndicator}>
              {sections.findIndex(s => s.id === activeSection) + 1} / {sections.length}
            </div>
            
            <button
              onClick={nextSection}
              disabled={activeSection === sections[sections.length - 1].id}
              className={styles.navArrow}
            >
              Suivant
              <ChevronRight size={18} />
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}