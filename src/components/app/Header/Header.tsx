"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/utils/firebase-api';
import { onAuthStateChanged, User } from 'firebase/auth';
import styles from './Header.module.css';

// Vos imports demandés
import SearchBar from '@/components/app/Header/SearchBar/SearchBar';
import Humberger from '@/components/app/Header/Humberger/Humberger';
import UserComp from '@/components/app/Header/User/User';
import LoginContent from '@/components/app/Header/Login/Login';
import ProfilContent from '@/components/app/Header/Profile/Profile';

interface HeaderProps {
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm = '', setSearchTerm = () => {} }) => {
  const [activeOverlay, setActiveOverlay] = useState<'login' | 'profil' | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleProfileClick = () => {
    setActiveOverlay(user ? 'profil' : 'login');
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        
        <div className={`${styles.headerHalf} ${styles.leftHalf}`}>
          <Humberger 
            user={user} 
            onRequireLogin={() => setActiveOverlay('login')} 
            onProfileClick={handleProfileClick}
          />
          <button className={`${styles.quoteBtn} ${styles.mobileOnlyBtn}`}>
            Free Quote
          </button>
        </div>

        <div className={`${styles.headerHalf} ${styles.rightHalf}`}>
          <div className={styles.searchAnchor}>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
          <div className={`${styles.userAnchor} ${styles.desktopOnly}`}>
            <UserComp user={user} onProfileClick={handleProfileClick} />
          </div>
        </div>

      </div>

      <AnimatePresence>
        {activeOverlay && (
          <motion.div 
            className={styles.fullOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button className={styles.closeOverlay} onClick={() => setActiveOverlay(null)}>&times;</button>
            {activeOverlay === 'login' && <LoginContent onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'profil' && <ProfilContent user={user} onClose={() => setActiveOverlay(null)} />}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;