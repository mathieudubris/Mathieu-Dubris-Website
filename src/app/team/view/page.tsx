"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { auth, setupAuthListener, getTeamMembers } from '@/utils/firebase-api';
import { User, Mail, Phone, MapPin, Monitor, Laptop } from 'lucide-react';
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

export default function TeamViewPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadTeamMembers();
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const members = await getTeamMembers();
      
      // Normaliser les données de chaque membre
      const formattedMembers = members.map(member => 
        normalizeMemberData(member)
      );
      
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const getContactIcon = (type: string) => {
    const icons = {
      instagram: '📸',
      whatsapp: '💬',
      discord: '🎮',
      tiktok: '🎵',
      youtube: '🎥',
      facebook: '📘',
      twitter: '🐦',
      linkedin: '💼'
    };
    return icons[type as keyof typeof icons] || '📱';
  };

  const handleEditProfile = () => {
    if (currentUser) {
      router.push('/team');
    } else {
      setShowLogin(true);
    }
  };

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Chargement de l'équipe...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <Header />
      
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
                  <h1 className={styles.pageTitle}>Notre Équipe</h1>
                  <p className={styles.pageSubtitle}>
                    {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} dans l'équipe
                  </p>
                </div>
                
                <button
                  onClick={handleEditProfile}
                  className={styles.editProfileButton}
                >
                  <User size={16} />
                  Mon Profil
                </button>
              </div>
              
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
                              {member.roles.slice(0, 3).map((role, i) => (
                                <span key={i} className={styles.roleTag}>
                                  {role}
                                </span>
                              ))}
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
                  <h3 className={styles.emptyStateTitle}>Aucun membre dans l'équipe</h3>
                  <p className={styles.emptyStateText}>
                    Créez votre profil pour être le premier membre de l'équipe
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
                    {selectedMember.roles.map((role, i) => (
                      <span key={i} className={styles.modalRoleTag}>
                        {role}
                      </span>
                    ))}
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
                      .map((contact, i) => (
                        <div key={i} className={styles.modalContact}>
                          <span className={styles.contactIcon}>
                            {getContactIcon(contact.type)}
                          </span>
                          <span className={styles.contactType}>
                            {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}:
                          </span>
                          <span className={styles.contactValue}>
                            {contact.value}
                          </span>
                        </div>
                    ))}
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
    </div>
  );
}