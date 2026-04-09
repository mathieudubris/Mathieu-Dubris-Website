"use client";

import React from 'react';
import { 
  Users, 
  Mail, 
  MapPin, 
  Settings, 
  ChevronRight
} from 'lucide-react';
import { Project as FirebaseProject } from '@/utils/projet-api';
import { rolesData, getRoleColorClass } from '@/utils/roles';
import styles from './Equipe.module.css';

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
  return (
    <div className={styles.membres}>
      <div className={styles.teamSection}>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Users size={20} />
            <span>Équipe ({teamMembers.length})</span>
          </h2>
        </div>

        {/* Boutons EN HAUT, avant la grille */}
        <div className={styles.footerActions}>
          <button onClick={onViewAllMembers} className={styles.viewAllMembersButton}>
            <Users size={16} />
            <span>Détails des membres</span>
            <ChevronRight size={16} />
          </button>

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

        {teamMembers.length > 0 ? (
          <div className={styles.teamList}>
            {teamMembers.map((member) => (
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

      </div>
    </div>
  );
};

export default Membres;