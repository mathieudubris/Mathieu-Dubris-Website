"use client";

import React, { useState, useEffect } from 'react';
import { auth, signOut, User, saveUserPreferences, getUserPreferences, onAuthStateChanged } from '@/utils/firebase-api';
import styles from './Profile.module.css';

interface Props {
  user: User | null;
  onClose: () => void;
}

const ProfilContent: React.FC<Props> = ({ user, onClose }) => {
  const [activeTheme, setActiveTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  // S'assurer que l'utilisateur est à jour
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserPreferences();
    }
  }, [currentUser]);

  const loadUserPreferences = async () => {
    setIsLoading(true);
    try {
      let theme = 'dark';
      
      if (currentUser) {
        const prefs = await getUserPreferences(currentUser.uid);
        theme = prefs?.theme || 'dark';
      } else {
        const savedTheme = localStorage.getItem('theme');
        theme = savedTheme || 'dark';
      }
      
      setActiveTheme(theme);
      applyTheme(theme);
    } catch (error) {
      console.error("Erreur lors du chargement des préférences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async (theme: string) => {
    setActiveTheme(theme);
    applyTheme(theme);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('theme', theme);
    
    // Sauvegarder dans Firestore pour les utilisateurs connectés
    if (currentUser) {
      try {
        await saveUserPreferences(currentUser.uid, { theme: theme as 'dark' | 'light' });
      } catch (error) {
        console.error("Erreur lors de la sauvegarde du thème:", error);
      }
    }
  };

  const applyTheme = (theme: string) => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  if (!currentUser) return null;
  
  if (isLoading) {
    return (
      <div className={styles.profilOverlayWrapper}>
        <div className={styles.profilCard}>
          <p>Chargement des préférences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilOverlayWrapper}>
      <button className={styles.closeOverlayBtn} onClick={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className={styles.profilCard}>
        <div className={styles.profilHeader}>
          <img src={currentUser.photoURL || ""} className={styles.largeAvatar} alt="Avatar" />
          <h2 className={styles.userName}>{currentUser.displayName}</h2>
          <p className={styles.userEmail}>{currentUser.email}</p>
        </div>

        <div className={styles.settingsSection}>
          <div className={styles.settingBlock}>
            <label>Thème</label>
            <div className={styles.toggleGroup}>
              <button 
                onClick={() => changeTheme('dark')} 
                className={activeTheme === 'dark' ? styles.active : ''}
              >
                Sombre
              </button>
              <button 
                onClick={() => changeTheme('light')} 
                className={activeTheme === 'light' ? styles.active : ''}
              >
                Clair
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default ProfilContent;