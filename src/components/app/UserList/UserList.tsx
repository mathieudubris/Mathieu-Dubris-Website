"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User as UserIcon, Mail, Check, Users, X as XIcon } from 'lucide-react';
import { db, getProjects, addMemberToProject, removeMemberFromProject, isAdmin } from '@/utils/firebase-api';
import { collection, getDocs, query, orderBy, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from './UserList.module.css';

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: string;
  lastLogin: string;
  isInProject?: boolean;
}

interface Props {
  projectId: string;
  onClose: () => void;
  onUserAdded: () => void;
}

const UserList: React.FC<Props> = ({ projectId, onClose, onUserAdded }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [projectMembers, setProjectMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Récupérer les utilisateurs et les membres du projet
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Récupérer le projet pour avoir les membres actuels
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        const members = projectData.teamMembers || [];
        setProjectMembers(members);
        setSelectedUsers(members); // Initialiser avec les membres actuels
      }

      // Récupérer tous les utilisateurs
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const usersList: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as UserData;
        const isMember = projectMembers.includes(doc.id);
        usersList.push({
          ...userData,
          uid: doc.id,
          isInProject: isMember
        });
      });
      
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (err: any) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
      setError("Impossible de charger la liste des utilisateurs.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Filtrer les utilisateurs selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users.map(user => ({
        ...user,
        isInProject: projectMembers.includes(user.uid)
      })));
      return;
    }

    const queryLower = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.displayName?.toLowerCase().includes(queryLower) ||
      user.email?.toLowerCase().includes(queryLower)
    ).map(user => ({
      ...user,
      isInProject: projectMembers.includes(user.uid)
    }));
    
    setFilteredUsers(filtered);
  }, [searchQuery, users, projectMembers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Gérer la sélection d'utilisateurs
  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Gérer la sélection/désélection de tous les utilisateurs
  const handleSelectAll = () => {
    const allUserIds = users.map(user => user.uid);
    setSelectedUsers(allUserIds);
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  // Sauvegarder les changements
  const handleSave = async () => {
    if (!projectId) return;

    setIsSaving(true);
    setError(null);

    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        teamMembers: selectedUsers,
        updatedAt: new Date()
      });

      // Mettre à jour l'état local
      setProjectMembers(selectedUsers);
      
      // Mettre à jour la liste des utilisateurs avec l'état isInProject
      setUsers(prev => prev.map(user => ({
        ...user,
        isInProject: selectedUsers.includes(user.uid)
      })));
      
      // Notifier le parent
      onUserAdded();
      
      // Fermer la modal après un délai
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour des membres:", err);
      setError("Impossible de sauvegarder les modifications.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Gérer le clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div 
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className={styles.modal}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>
              <Users size={20} />
              <span>Gérer l'équipe du projet</span>
            </h2>
            <p className={styles.subtitle}>
              Sélectionnez les membres à ajouter au projet
            </p>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            {searchQuery && (
              <button 
                className={styles.clearSearch}
                onClick={() => setSearchQuery('')}
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
          
          <div className={styles.selectionInfo}>
            <span className={styles.selectionCount}>
              {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
            </span>
            <div className={styles.selectionActions}>
              <button onClick={handleSelectAll} className={styles.selectAllButton}>
                Tout sélectionner
              </button>
              <button onClick={handleDeselectAll} className={styles.deselectAllButton}>
                Tout désélectionner
              </button>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p className={styles.errorText}>{error}</p>
              <button 
                className={styles.retryButton}
                onClick={fetchData}
              >
                Réessayer
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <UserIcon size={48} className={styles.emptyIcon} />
              <p className={styles.emptyText}>
                {searchQuery ? 'Aucun utilisateur trouvé pour cette recherche' : 'Aucun utilisateur enregistré'}
              </p>
              {searchQuery && (
                <button 
                  className={styles.clearSearchButton}
                  onClick={() => setSearchQuery('')}
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className={styles.usersList}>
              <AnimatePresence>
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.uid);
                  return (
                    <motion.div
                      key={user.uid}
                      className={`${styles.userCard} ${isSelected ? styles.selected : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggleUser(user.uid)}
                    >
                      <div className={styles.userInfo}>
                        <div className={styles.avatarContainer}>
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt={user.displayName}
                              className={styles.avatar}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove(styles.hidden);
                              }}
                            />
                          ) : null}
                          <div className={`${styles.avatarPlaceholder} ${user.photoURL ? styles.hidden : ''}`}>
                            {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                          </div>
                        </div>
                        
                        <div className={styles.userDetails}>
                          <h3 className={styles.userName}>
                            {user.displayName || 'Utilisateur sans nom'}
                          </h3>
                          <div className={styles.userEmail}>
                            <Mail size={12} />
                            <span>{user.email}</span>
                          </div>
                          <div className={styles.userMeta}>
                            <span className={styles.metaItem}>
                              Dernière connexion: {formatDate(user.lastLogin || user.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.selectionIndicator}>
                        {isSelected ? (
                          <div className={styles.selectedIndicator}>
                            <Check size={16} />
                            <span>Sélectionné</span>
                          </div>
                        ) : (
                          <div className={styles.notSelectedIndicator}>
                            <span>Sélectionner</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <div className={styles.footerActions}>
            <button
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className={styles.savingSpinner}></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Sauvegarder les changements</span>
                </>
              )}
            </button>
          </div>
          
          <p className={styles.footerInfo}>
            Les utilisateurs sélectionnés pourront accéder au projet et compléter leur profil d'équipe.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserList;