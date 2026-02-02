"use client";

import React, { useState, useEffect } from 'react';
import { auth, signOut, User } from '@/utils/firebase-api';
import styles from './Profile.module.css';

interface Props {
  user: User | null;
  onClose: () => void;
}

const ProfilContent: React.FC<Props> = ({ user, onClose }) => {
  const [currentLang, setCurrentLang] = useState('en');
  const [activeTheme, setActiveTheme] = useState('dark');

  const translations: any = {
    fr: { close: "Fermer", language: "Langue", theme: "Thème", dark: "Sombre", light: "Clair", logout: "Déconnexion" },
    en: { close: "Close", language: "Language", theme: "Theme", dark: "Dark", light: "Light", logout: "Logout" }
  };

  useEffect(() => {
    const lang = localStorage.getItem('lang') || 'en';
    const theme = localStorage.getItem('theme') || 'dark';
    setCurrentLang(lang);
    setActiveTheme(theme);
    applyTheme(theme);
  }, []);

  const t = (key: string) => translations[currentLang][key];

  const changeLang = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
  };

  const changeTheme = (theme: string) => {
    setActiveTheme(theme);
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  };

  const applyTheme = (theme: string) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
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

  if (!user) return null;

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
          <img src={user.photoURL || ""} className={styles.largeAvatar} alt="Avatar" />
          <h2 className={styles.userName}>{user.displayName}</h2>
          <p className={styles.userEmail}>{user.email}</p>
        </div>

        <div className={styles.settingsSection}>
          <div className={styles.settingBlock}>
            <label>{t('language')}</label>
            <div className={styles.toggleGroup}>
              <button onClick={() => changeLang('fr')} className={currentLang === 'fr' ? styles.active : ''}>Français</button>
              <button onClick={() => changeLang('en')} className={currentLang === 'en' ? styles.active : ''}>English</button>
            </div>
          </div>

          <div className={styles.settingBlock}>
            <label>{t('theme')}</label>
            <div className={styles.toggleGroup}>
              <button onClick={() => changeTheme('dark')} className={activeTheme === 'dark' ? styles.active : ''}>{t('dark')}</button>
              <button onClick={() => changeTheme('light')} className={activeTheme === 'light' ? styles.active : ''}>{t('light')}</button>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>{t('logout')}</button>
      </div>
    </div>
  );
};

export default ProfilContent;