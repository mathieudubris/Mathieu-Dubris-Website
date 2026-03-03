"use client";

import React, { useState, useEffect } from 'react';
import { auth, signOut, User, onAuthStateChanged } from '@/utils/firebase-api';
import { useTheme } from '@/utils/ThemeProvider';
import styles from './Profile.module.css';

interface Props {
  user: User | null;
  onClose: () => void;
}

const ProfilContent: React.FC<Props> = ({ user, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  if (!currentUser) return null;

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
                onClick={() => setTheme('dark')}
                className={theme === 'dark' ? styles.active : ''}
              >
                Sombre
              </button>
              <button
                onClick={() => setTheme('light')}
                className={theme === 'light' ? styles.active : ''}
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
