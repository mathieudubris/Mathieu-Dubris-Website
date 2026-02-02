"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import styles from './Right.module.css';

const Right: React.FC = () => {
  const router = useRouter();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.8, ease: [0.33, 1, 0.68, 1] }
    }
  };

  const handleContactClick = () => {
    router.push('/contact');
  };

  const handleDiscoverClick = () => {
    router.push('/pending');
  };

  return (
    <div className={styles.rightContent}>
      <motion.div 
        className={styles.textWrapper}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className={styles.title}>
          <motion.span variants={itemVariants} className={styles.line}>BECOME</motion.span>
          <motion.span variants={itemVariants} className={styles.line}>EVERYTHING</motion.span>
          <motion.span variants={itemVariants} className={styles.line}>YOU WANT</motion.span>
        </h1>

        <motion.p variants={itemVariants} className={styles.quote}>
          "Tools change, the goal remains: giving concrete shape to what was once just an idea."
        </motion.p>

        <div className={styles.actions}>
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${styles.btn} ${styles.btnDiscover}`}
            onClick={handleDiscoverClick}
          >
            <span>Discover</span>
          </motion.button>
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${styles.btn} ${styles.btnContact}`}
            onClick={handleContactClick}
          >
            <span>Contact me</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Right;