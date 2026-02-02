"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Check, Search, Users, Mail } from 'lucide-react'; // Ajout de Mail
import { getAllUsers, addMemberToProject, removeMemberFromProject, getProject } from '@/utils/firebase-api';
import styles from './UserList.module.css';

interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLogin: string;
}

interface UserListProps {
  projectId: string;
  onClose: () => void;
  onUserAdded: () => void;
}

const UserList: React.FC<UserListProps> = ({ projectId, onClose, onUserAdded }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState<string[]>([]);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [projectId]);

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Charger tous les utilisateurs
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
      
      // Charger les membres du projet
      const project = await getProject(projectId);
      if (project) {
        setProjectMembers(project.teamMembers || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserInProject = async (userId: string) => {
    if (processingUser) return;
    
    setProcessingUser(userId);
    try {
      if (projectMembers.includes(userId)) {
        // Retirer l'utilisateur
        await removeMemberFromProject(projectId, userId);
        setProjectMembers(prev => prev.filter(id => id !== userId));
      } else {
        // Ajouter l'utilisateur
        await addMemberToProject(projectId, userId);
        setProjectMembers(prev => [...prev, userId]);
      }
      
      // Notifier le parent
      onUserAdded();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification des membres');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleSelectAll = () => {
    const allUserIds = users.map(user => user.uid);
    setProjectMembers([...new Set([...projectMembers, ...allUserIds])]);
  };

  const handleDeselectAll = () => {
    setProjectMembers([]);
  };

  const handleSave = () => {
    // Ici, normalement on enregistrerait les changements, mais c'est déjà fait en temps réel
    onClose();
  };

  if (loading) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <motion.div 
          className={styles.modal}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
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
    <div className={styles.overlay} onClick={onClose}>
      <motion.div 
        className={styles.modal}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>
              <Users size={24} />
              <span>Gérer l'équipe du projet</span>
            </h2>
            <p className={styles.subtitle}>
              Ajoutez ou retirez des membres de l'équipe
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
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button 
                className={styles.clearSearch}
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className={styles.selectionInfo}>
            <div className={styles.selectionCount}>
              {projectMembers.length} membre{projectMembers.length > 1 ? 's' : ''} sélectionné{projectMembers.length > 1 ? 's' : ''}
            </div>
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
          {error ? (
            <div className={styles.errorState}>
              <p className={styles.errorText}>{error}</p>
              <button onClick={loadData} className={styles.retryButton}>
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
                const isMember = projectMembers.includes(user.uid);
                const isProcessing = processingUser === user.uid;
                
                return (
                  <div 
                    key={user.uid} 
                    className={`${styles.userCard} ${isMember ? styles.selected : ''}`}
                    onClick={() => toggleUserInProject(user.uid)}
                  >
                    <div className={styles.userInfo}>
                      <div className={styles.avatarContainer}>
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || 'User'} className={styles.avatar} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {user.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
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
                          <span className={styles.metaItem}>Dernière connexion: {new Date(user.lastLogin).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.selectionIndicator}>
                      {isProcessing ? (
                        <div className={styles.savingSpinner}></div>
                      ) : isMember ? (
                        <div className={styles.selectedIndicator}>
                          <Check size={14} />
                          <span>Ajouté</span>
                        </div>
                      ) : (
                        <div className={styles.notSelectedIndicator}>
                          Cliquer pour ajouter
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
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <div className={styles.footerActions}>
            <button onClick={onClose} className={styles.cancelButton}>
              Annuler
            </button>
            <button onClick={handleSave} className={styles.saveButton}>
              Enregistrer les modifications
            </button>
          </div>
          
          <p className={styles.footerInfo}>
            Les modifications sont appliquées immédiatement. Les membres ajoutés auront accès au projet.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default UserList;