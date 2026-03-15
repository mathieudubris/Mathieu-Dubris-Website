"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, User, Check, Search, Users, Mail, Save } from 'lucide-react';
import { addMemberToProject, removeMemberFromProject, getFullProject, updateProject } from '@/utils/projet-api';
import {  getAllUsers } from '@/utils/firebase-api';

import { useUsers } from '@/utils/UserContext';
import styles from './UserList.module.css';

interface UserListProps {
  projectId: string;
  onClose: () => void;
  onUserAdded?: () => void;
  // Nouvelle prop : mode de fonctionnement
  mode?: 'standalone' | 'integrated';
  // Nouvelles props pour le mode intégré
  initialSelectedUsers?: string[];
  onSelectionChange?: (selectedUserIds: string[]) => void;
}

const UserList: React.FC<UserListProps> = ({ 
  projectId, 
  onClose, 
  onUserAdded,
  mode = 'standalone',
  initialSelectedUsers = [],
  onSelectionChange
}) => {
  const { users, loading, refreshUsers } = useUsers();
  
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectMembers, setProjectMembers] = useState<string[]>([]);
  const [pendingMembers, setPendingMembers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [originalMembers, setOriginalMembers] = useState<string[]>([]);

  // Initialiser selon le mode
  useEffect(() => {
    if (mode === 'standalone') {
      loadProjectMembers();
    } else {
      // Mode intégré : utiliser les membres initiaux fournis
      setProjectMembers(initialSelectedUsers);
      setPendingMembers(initialSelectedUsers);
      setOriginalMembers(initialSelectedUsers);
    }
  }, [projectId, mode, initialSelectedUsers]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(user => 
          user.displayName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadProjectMembers = async () => {
    try {
      const project = await getFullProject(projectId);
      if (project) {
        const members = project.teamMembers || [];
        setProjectMembers(members);
        setPendingMembers(members);
        setOriginalMembers(members);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des membres du projet:', error);
      setError('Erreur lors du chargement des membres');
    }
  };

  const toggleUserInProject = (userId: string) => {
    let newPendingMembers;
    if (pendingMembers.includes(userId)) {
      newPendingMembers = pendingMembers.filter(id => id !== userId);
    } else {
      newPendingMembers = [...pendingMembers, userId];
    }
    
    setPendingMembers(newPendingMembers);
    
    // Notifier le parent des changements (mode intégré seulement)
    if (mode === 'integrated' && onSelectionChange) {
      onSelectionChange(newPendingMembers);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      if (mode === 'standalone') {
        // Mode standalone : modifier directement Firestore
        const membersToAdd = pendingMembers.filter(id => !originalMembers.includes(id));
        const membersToRemove = originalMembers.filter(id => !pendingMembers.includes(id));
        
        // Ajouter les nouveaux membres
        for (const userId of membersToAdd) {
          await addMemberToProject(projectId, userId);
        }
        
        // Retirer les membres supprimés
        for (const userId of membersToRemove) {
          await removeMemberFromProject(projectId, userId);
        }
        
        // Mettre à jour l'état local
        setProjectMembers(pendingMembers);
        setOriginalMembers(pendingMembers);
        
        // Notifier le parent
        if (onUserAdded) {
          onUserAdded();
        }
        
        // Fermer le modal
        onClose();
      } else {
        // Mode intégré : juste fermer, les changements sont déjà transmis via onSelectionChange
        onClose();
      }
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde des modifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = useCallback(() => {
    const allUserIds = users.map(user => user.uid);
    const newPendingMembers = [...new Set([...pendingMembers, ...allUserIds])];
    setPendingMembers(newPendingMembers);
    
    if (mode === 'integrated' && onSelectionChange) {
      onSelectionChange(newPendingMembers);
    }
  }, [users, pendingMembers, mode, onSelectionChange]);

  const handleDeselectAll = useCallback(() => {
    setPendingMembers([]);
    if (mode === 'integrated' && onSelectionChange) {
      onSelectionChange([]);
    }
  }, [mode, onSelectionChange]);

  const handleCancel = () => {
    // Revenir à l'état original
    setPendingMembers(originalMembers);
    
    if (mode === 'integrated' && onSelectionChange) {
      onSelectionChange(originalMembers);
    }
    
    onClose();
  };

  const hasChanges = () => {
    if (pendingMembers.length !== originalMembers.length) return true;
    
    const sortedPending = [...pendingMembers].sort();
    const sortedOriginal = [...originalMembers].sort();
    
    return !sortedPending.every((id, index) => id === sortedOriginal[index]);
  };

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }, [handleCancel]);

  if (loading && mode === 'standalone') {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <motion.div 
          className={styles.modal}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Chargement des utilisateurs...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <motion.div 
        className={styles.modal}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2>
              <Users size={24} />
              <span>
                {mode === 'standalone' ? 'Gérer l\'équipe' : 'Sélectionner les membres'}
              </span>
            </h2>
            <p>
              {mode === 'standalone' 
                ? `Sélectionnez les membres de l'équipe (${pendingMembers.length} sélectionné${pendingMembers.length > 1 ? 's' : ''})`
                : `Sélectionnez les membres pour ce projet (${pendingMembers.length} sélectionné${pendingMembers.length > 1 ? 's' : ''})`
              }
            </p>
          </div>
          <button 
            onClick={handleCancel} 
            className={styles.closeBtn}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Rechercher un utilisateur"
            />
            {searchQuery && (
              <button 
                className={styles.clearSearch}
                onClick={() => setSearchQuery('')}
                aria-label="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className={styles.selectionInfo}>
            <div className={styles.selectionCount}>
              {pendingMembers.length} membre{pendingMembers.length > 1 ? 's' : ''} sélectionné{pendingMembers.length > 1 ? 's' : ''}
              {hasChanges()}
            </div>
            <div className={styles.selectionActions}>
              <button 
                onClick={handleSelectAll} 
                className={styles.selectAllButton}
                disabled={isSaving}
              >
                Tout sélectionner
              </button>
              <button 
                onClick={handleDeselectAll} 
                className={styles.deselectAllButton}
                disabled={isSaving}
              >
                Tout désélectionner
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.content}>
          {error ? (
            <div className={styles.errorState}>
              <p className={styles.errorText}>{error}</p>
              <button onClick={loadProjectMembers} className={styles.retryButton}>
                Réessayer
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={48} className={styles.emptyIcon} />
              <h3>Aucun utilisateur trouvé</h3>
              <p className={styles.emptyText}>
                {searchQuery ? 'Essayez avec d\'autres termes de recherche' : 'Aucun utilisateur inscrit'}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchButton}
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className={styles.usersList}>
              {filteredUsers.map((user) => {
                const isMember = pendingMembers.includes(user.uid);
                
                return (
                  <div 
                    key={user.uid} 
                    className={`${styles.userCard} ${isMember ? styles.selected : ''}`}
                    onClick={() => toggleUserInProject(user.uid)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleUserInProject(user.uid);
                      }
                    }}
                    aria-label={`${isMember ? 'Désélectionner' : 'Sélectionner'} ${user.displayName || 'utilisateur'}`}
                  >
                    <div className={styles.userInfo}>
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          className={styles.avatar}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {user.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      
                      <div className={styles.userDetails}>
                        <h3 className={styles.userName}>
                          {user.displayName || 'Utilisateur sans nom'}
                        </h3>
                        <div className={styles.userEmail}>
                          <Mail size={12} />
                          <span title={user.email || ''}>
                            {user.email}
                          </span>
                        </div>
                        <div className={styles.userMeta}>
                          <span className={styles.metaItem} title={`Dernière connexion: ${new Date(user.lastLogin).toLocaleDateString('fr-FR')}`}>
                            Dern. connexion: {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.selectionIndicator}>
                      {isMember ? (
                        <div className={styles.selectedIndicator}>
                          <Check size={14} />
                          <span>Sélectionné</span>
                        </div>
                      ) : (
                        <div className={styles.notSelectedIndicator}>
                          Non sélectionné
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}
          
          <div className={styles.footerActions}>
            <button 
              onClick={handleCancel} 
              className={styles.cancelButton}
              disabled={isSaving}
            >
              Annuler
            </button>
            <button 
              onClick={handleSave} 
              className={styles.saveButton}
              disabled={isSaving || (!hasChanges() && mode === 'standalone')}
            >
              {isSaving ? (
                <>
                  <div className={styles.savingSpinner}></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {mode === 'standalone' ? 'Enregistrer' : 'Confirmer'}
                </>
              )}
            </button>
          </div>
          
          <p className={styles.footerInfo}>
            {hasChanges() 
              ? 'Vous avez des modifications non enregistrées' 
              : mode === 'standalone' 
                ? 'Les modifications sont sauvegardées lorsque vous cliquez sur Enregistrer'
                : 'Sélectionnez les membres et cliquez sur Confirmer'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default UserList;