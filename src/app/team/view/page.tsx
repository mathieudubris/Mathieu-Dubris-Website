"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { User, Mail, Phone, MapPin, Monitor, Laptop } from 'lucide-react';
import Header from '@/components/app/Header/Header';
import styles from './view.module.css';

interface TeamMember {
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

export default function TeamViewPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const db = getFirestore();
      const teamCollection = collection(db, 'team');
      const snapshot = await getDocs(teamCollection);
      
      const members: TeamMember[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as TeamMember;
        members.push(data);
      });
      
      setTeamMembers(members);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    } finally {
      setLoading(false);
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
          <h1 className={styles.pageTitle}>Notre Équipe</h1>
          <p className={styles.pageSubtitle}>
            {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} dans l'équipe
          </p>
          
          <div className={styles.teamGrid}>
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.userId}
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
                      {member.location.city}, {member.location.country}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
              {/* Rôles */}
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
              
              {/* Localisation */}
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>
                  <MapPin size={18} />
                  <span>Localisation</span>
                </h3>
                <p className={styles.modalLocation}>
                  {selectedMember.location.city}, {selectedMember.location.country}
                  {selectedMember.location.districtPublic && selectedMember.location.district && (
                    <span className={styles.modalDistrict}>
                      • {selectedMember.location.district}
                    </span>
                  )}
                </p>
              </div>
              
              {/* Contacts */}
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
              
              {/* Matériel */}
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
    </div>
  );
}