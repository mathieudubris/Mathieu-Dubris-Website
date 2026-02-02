'use client';

import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './pending.module.css';

const PendingPage = () => {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:mathieudubris@gmail.com';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "easeOut",
        duration: 0.4,
      },
    },
  };

  const closeButtonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    },
    hover: { 
      scale: 1.1,
      backgroundColor: 'rgba(199, 255, 68, 0.1)',
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Effects */}
      <div className={styles.backgroundEffects}>
        <div className={styles.gridPattern} />
        <div className={styles.gradientOrb} />
      </div>

      {/* Close Button */}
      <motion.button
        className={styles.closeButton}
        onClick={handleClose}
        variants={closeButtonVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap={{ scale: 0.9 }}
        aria-label="Fermer et retourner à la page précédente"
      >
        <X size={20} />
      </motion.button>

      {/* Main Content - No visible container */}
      <motion.div 
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className={styles.iconSection}
          variants={itemVariants}
        >
          <motion.div
            className={styles.clockIcon}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Clock className={styles.icon} />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h1 className={styles.title}>
            Services
            <br />
            <span className={styles.highlight}>En Révision</span>
          </h1>
        </motion.div>

        <motion.div 
          className={styles.statusIndicator}
          variants={itemVariants}
        >
          <div className={styles.statusPulse} />
          <span>PAUSE STRATÉGIQUE</span>
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className={styles.message}>
            Nos services sont actuellement en cours d'optimisation pour offrir une meilleure 
            expérience. Cette pause stratégique nous permet de nous concentrer sur la qualité 
            et l'innovation.
          </p>
        </motion.div>

        <motion.div 
          className={styles.contactSection}
          variants={itemVariants}
        >
          <button 
            className={styles.emailButton}
            onClick={handleEmailClick}
          >
            <span className={styles.emailLabel}>Pour toute question :</span>
            <span className={styles.emailAddress}>mathieudubris@gmail.com</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PendingPage;