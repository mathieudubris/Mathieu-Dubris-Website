"use client";

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Wrench, Users as UsersIcon, Percent, Globe, Lock, ChevronRight } from 'lucide-react';
import SoftwareList from '@/components/projet-en-cours/SoftwareList';
import UserList from '@/components/UserList/UserList';
import styles from './AutreEditor.module.css';

interface AutreEditorProps {
  progress: number;
  software: any[];
  teamMembers: string[];
  visibility: 'public' | 'early_access';
  allUsers: any[];
  onProgressChange: (value: number) => void;
  onSoftwareChange: (software: any[]) => void;
  onTeamMembersChange: (members: string[]) => void;
  onVisibilityChange: (visibility: 'public' | 'early_access') => void;
  projectId: string;
}

const AutreEditor: React.FC<AutreEditorProps> = ({
  progress,
  software,
  teamMembers,
  visibility,
  allUsers,
  onProgressChange,
  onSoftwareChange,
  onTeamMembersChange,
  onVisibilityChange,
  projectId
}) => {
  const [showSoftwareModal, setShowSoftwareModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const handleSoftwareSave = (selectedSoftware: any[]) => {
    onSoftwareChange(selectedSoftware);
    setShowSoftwareModal(false);
  };

  // Afficher un aperçu des membres sélectionnés
  const renderSelectedMembers = () => {
    if (teamMembers.length === 0) {
      return (
        <div className={styles.noMembers}>
          <p>Aucun membre sélectionné</p>
        </div>
      );
    }

    const selectedUsers = allUsers
      .filter(user => teamMembers.includes(user.uid))
      .slice(0, 3);

    return (
      <div className={styles.selectedMembers}>
        {selectedUsers.map(user => (
          <div key={user.uid} className={styles.memberPreview}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Membre'} />
            ) : (
              <div className={styles.avatarPreview}>
                {user.displayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span>{user.displayName?.split(' ')[0] || 'Membre'}</span>
          </div>
        ))}
        {teamMembers.length > 3 && (
          <div className={styles.moreMembers}>
            +{teamMembers.length - 3}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.autreEditor}>
      {/* Section Progression */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          <Percent size={16} />
          <span>Progression du projet</span>
        </label>
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressValue}>{progress}%</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            className={styles.progressSlider}
          />
        </div>
      </div>

      {/* Section Logiciels */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          <Wrench size={16} />
          <span>Logiciels utilisés</span>
        </label>
        <button
          type="button"
          onClick={() => setShowSoftwareModal(true)}
          className={styles.sectionButton}
        >
          <span>Gérer les logiciels</span>
          <span className={styles.selectedCount}>
            {software.length} sélectionné{software.length > 1 ? 's' : ''}
            <ChevronRight size={14} />
          </span>
        </button>
        {software.length > 0 && (
          <div className={styles.softwarePreview}>
            {software.slice(0, 5).map((soft, index) => (
              <div key={index} className={styles.softwareTag} title={soft.name}>
                {soft.icon || '📦'}
              </div>
            ))}
            {software.length > 5 && (
              <div className={styles.moreSoftware}>+{software.length - 5}</div>
            )}
          </div>
        )}
      </div>

      {/* Section Membres */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          <UsersIcon size={16} />
          <span>Membres de l'équipe</span>
        </label>
        <button
          type="button"
          onClick={() => setShowMembersModal(true)}
          className={styles.sectionButton}
        >
          <span>Gérer les membres</span>
          <span className={styles.selectedCount}>
            {teamMembers.length} sélectionné{teamMembers.length > 1 ? 's' : ''}
            <ChevronRight size={14} />
          </span>
        </button>
        {renderSelectedMembers()}
      </div>

      {/* Section Visibilité */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          <Globe size={16} />
          <span>Visibilité du projet</span>
        </label>
        <div className={styles.visibilityOptions}>
          <label className={`${styles.visibilityOption} ${visibility === 'public' ? styles.active : ''}`}>
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === 'public'}
              onChange={() => onVisibilityChange('public')}
            />
            <div className={styles.visibilityContent}>
              <Globe size={18} />
              <div>
                <strong>Public</strong>
                <span>Visible par tous les visiteurs</span>
              </div>
            </div>
          </label>

          <label className={`${styles.visibilityOption} ${visibility === 'early_access' ? styles.active : ''}`}>
            <input
              type="radio"
              name="visibility"
              value="early_access"
              checked={visibility === 'early_access'}
              onChange={() => onVisibilityChange('early_access')}
            />
            <div className={styles.visibilityContent}>
              <Lock size={18} />
              <div>
                <strong>Accès anticipé</strong>
                <span>Visible uniquement par les membres sélectionnés</span>
              </div>
            </div>
          </label>
        </div>
        {visibility === 'early_access' && teamMembers.length === 0 && (
          <div className={styles.visibilityWarning}>
            <Lock size={14} />
            <span>Vous devez sélectionner au moins un membre pour l'accès anticipé</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSoftwareModal && (
          <SoftwareList
            projectId={projectId}
            isAdmin={true}
            compact={false}
            selectedSoftware={software}
            onClose={() => setShowSoftwareModal(false)}
            onSave={handleSoftwareSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMembersModal && (
          <UserList
            projectId={projectId}
            onClose={() => setShowMembersModal(false)}
            mode="integrated"
            initialSelectedUsers={teamMembers}
            onSelectionChange={onTeamMembersChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutreEditor;