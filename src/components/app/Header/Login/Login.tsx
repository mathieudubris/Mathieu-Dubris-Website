"use client"; 

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { auth, provider, signInWithPopup } from '@/utils/firebase-api';
import { X } from 'lucide-react';
import styles from './Login.module.css';

interface Props {
  onClose: () => void;
}

const LoginContent: React.FC<Props> = ({ onClose }) => {

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setTimeout(() => {
          onClose();
        }, 300);
      }
    } catch (e: any) {
      if (e.code === 'auth/cancelled-popup-request' || e.code === 'auth/popup-closed-by-user') {
        console.warn("L'utilisateur a fermé la fenêtre de connexion.");
      } else {
        console.error("Erreur de connexion détaillée:", e);
      }
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <motion.div 
      className={styles.loginFullScreenWrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.meshGradient} />
      <div className={styles.noiseOverlay} />
      
      <motion.button 
        className={styles.closeBtn} 
        onClick={onClose} 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X size={20} />
      </motion.button>

      <motion.div 
        className={styles.loginCard}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div className={styles.header} variants={itemVariants}>
          <h2 className={styles.loginTitle}>Connexion</h2>
          <p className={styles.loginSubtitle}>
            Connectez-vous pour continuer
          </p>
        </motion.div>

        <motion.div className={styles.loginActions} variants={itemVariants}>
          <button onClick={loginWithGoogle} className={styles.btnGoogle}>
            <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continuer avec Google</span>
          </button>
        </motion.div>

        <motion.footer className={styles.loginFooter} variants={itemVariants}>
          <div className={styles.legalLinks}>
            <a href="/login/help/google" target="_blank" rel="noopener noreferrer">Aide</a>
            <span className={styles.dot} />
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Confidentialité</a>
          </div>
        </motion.footer>
      </motion.div>
    </motion.div>
  );
};

export default LoginContent;