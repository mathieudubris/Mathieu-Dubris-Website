"use client";

import React from 'react';
import {
  User, Mail, Phone, MapPin, Monitor, Laptop, Code2,
  Instagram, MessageCircle, Youtube, Facebook, Twitter, Linkedin,
  Music, MessageSquare, Wifi, Signal, Globe
} from 'lucide-react';
import { ProjectTeamMember, getRoleColorClass } from '../page';
import styles from './detailView.module.css';

interface DetailViewProps {
  member: ProjectTeamMember;
  isUserMember: boolean;
  currentUser: any;
  shouldShowInfo: (isPublic: boolean) => boolean;
  onClose: () => void;
}

const getContactLucideIcon = (type: string) => {
  const icons: Record<string, any> = {
    instagram: Instagram,
    whatsapp: MessageCircle,
    discord: MessageSquare,
    tiktok: Music,
    youtube: Youtube,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
  };
  return icons[type] || MessageCircle;
};

const internetInfo = {
  wifi:   { label: 'Wi-Fi uniquement',  Icon: Wifi   },
  mobile: { label: 'Mobile uniquement', Icon: Signal },
  both:   { label: 'Wi-Fi + Mobile',    Icon: Globe  },
};

const getOsLabel = (os: 'windows' | 'mac' | 'linux') =>
  os === 'windows' ? 'Windows' : os === 'mac' ? 'macOS' : 'Linux';

export default function DetailView({ member, isUserMember, currentUser, shouldShowInfo, onClose }: DetailViewProps) {
  const { internet, phones, computers } = member.equipment;
  const visiblePhones    = phones.filter(p => shouldShowInfo(p.isPublic) && p.model);
  const visibleComputers = computers.filter(c => shouldShowInfo(c.isPublic));
  const hasEquipment     = visiblePhones.length > 0 || visibleComputers.length > 0;

  const { label: internetLabel, Icon: InternetIcon } = internetInfo[internet] ?? internetInfo.wifi;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeModal} onClick={onClose}>&times;</button>

        {/* ── En-tête ── */}
        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar}>
            {member.image
              ? <img src={member.image} alt={`${member.firstName} ${member.lastName}`} />
              : <User size={64} />}
          </div>
          <div className={styles.modalInfo}>
            <h2 className={styles.modalName}>
              {member.firstName} {member.lastName}
              {isUserMember && member.userId === currentUser?.uid && (
                <span className={styles.memberBadge}> (Vous)</span>
              )}
            </h2>
            {shouldShowInfo(member.agePublic) && member.age > 0 && (
              <div className={styles.modalAge}>{member.age} ans</div>
            )}
            <div className={styles.modalEmail}>
              <Mail size={16} />
              {member.email}
            </div>
          </div>
        </div>

        <div className={styles.modalSections}>

          {/* ── Rôles ── */}
          {member.roles && member.roles.length > 0 && (
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>
                <Monitor size={18} />
                <span>Rôles dans l'équipe</span>
              </h3>
              <div className={styles.modalRoles}>
                {member.roles.map((role, i) => {
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

          {/* ── Localisation ── */}
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>
              <MapPin size={18} />
              <span>Localisation</span>
            </h3>
            {member.location ? (
              <>
                <p className={styles.modalLocation}>
                  {member.location.city || 'Ville non renseignée'}, {member.location.country || 'Pays non renseigné'}
                </p>
                {shouldShowInfo(member.location.districtPublic) && member.location.district && (
                  <p className={styles.modalDistrict}>{member.location.district}</p>
                )}
              </>
            ) : (
              <p className={styles.modalLocation}>Localisation non renseignée</p>
            )}
          </div>

          {/* ── Contacts ── */}
          {member.contacts && member.contacts.filter(c => shouldShowInfo(c.isPublic)).length > 0 && (
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>
                <Phone size={18} />
                <span>Contacts</span>
              </h3>
              <div className={styles.modalContacts}>
                {member.contacts
                  .filter(contact => shouldShowInfo(contact.isPublic))
                  .map((contact, i) => {
                    const ContactIcon = getContactLucideIcon(contact.type);
                    return (
                      <div key={i} className={styles.modalContact}>
                        <span className={styles.contactIcon}><ContactIcon size={20} /></span>
                        <span className={styles.contactType}>
                          {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}:
                        </span>
                        <span className={styles.contactValue}>{contact.value}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Matériel ── */}
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>
              <Laptop size={18} />
              <span>Matériel utilisé</span>
            </h3>

            {/* Connexion Internet */}
            <div className={styles.internetBadge}>
              <InternetIcon size={15} />
              <span>{internetLabel}</span>
            </div>

            {hasEquipment ? (
              <div className={styles.equipmentGrid}>

                {/* Téléphones */}
                {visiblePhones.map((phone, i) => (
                  <div key={i} className={styles.equipmentCard}>
                    <div className={styles.equipmentCardHeader}>
                      <Phone size={14} />
                      <span>Téléphone{visiblePhones.length > 1 ? ` ${i + 1}` : ''}</span>
                    </div>
                    <div className={styles.equipmentCardBody}>
                      <div className={styles.equipmentRow}>
                        <span className={styles.equipmentLabel}>Modèle</span>
                        <span className={styles.equipmentValue}>{phone.model}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Ordinateurs */}
                {visibleComputers.map((computer, i) => (
                  <div key={i} className={styles.equipmentCard}>
                    <div className={styles.equipmentCardHeader}>
                      <Laptop size={14} />
                      <span>Ordinateur{visibleComputers.length > 1 ? ` ${i + 1}` : ''}</span>
                    </div>
                    <div className={styles.equipmentCardBody}>
                      {computer.os && (
                        <div className={styles.equipmentRow}>
                          <span className={styles.equipmentLabel}>OS</span>
                          <span className={styles.equipmentValue}>{getOsLabel(computer.os)}</span>
                        </div>
                      )}
                      {computer.ram && (
                        <div className={styles.equipmentRow}>
                          <span className={styles.equipmentLabel}>RAM</span>
                          <span className={styles.equipmentValue}>{computer.ram}</span>
                        </div>
                      )}
                      {computer.storage && (
                        <div className={styles.equipmentRow}>
                          <span className={styles.equipmentLabel}>Stockage</span>
                          <span className={styles.equipmentValue}>{computer.storage}</span>
                        </div>
                      )}
                      {computer.gpu && (
                        <div className={styles.equipmentRow}>
                          <span className={styles.equipmentLabel}>GPU</span>
                          <span className={styles.equipmentValue}>{computer.gpu}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              </div>
            ) : (
              <p className={styles.noEquipment}>Aucune information matérielle visible</p>
            )}
          </div>

          {/* ── Compétences ── */}
          {member.skills && member.skills.trim() !== '' && shouldShowInfo(member.skillsPublic !== false) && (
            <div className={`${styles.modalSection} ${styles.skills}`}>
              <h3 className={styles.modalSectionTitle}>
                <Code2 size={18} />
                <span>Compétences</span>
              </h3>
              <div className={styles.skillsContent}>
                {member.skills}
                <div className={styles.skillsWordCount}>
                  {member.skills.split(/\s+/).length} mots
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}