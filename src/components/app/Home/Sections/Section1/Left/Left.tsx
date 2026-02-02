"use client";

import React from 'react';
import { motion } from 'framer-motion';
import styles from './Left.module.css';

const Left: React.FC = () => {
  return (
    <div className={styles.leftContent}>
      <div className={styles.imageWrapper}>
        <motion.img
          src="/assets/mathieu/images/png/profil.png"
          alt="Profil"
          className={styles.profileImg}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            y: [0, -10, 0] 
          }}
          transition={{
            opacity: { duration: 1.5, delay: 0.2, ease: "easeOut" },
            scale: { duration: 1.5, delay: 0.2, ease: "easeOut" },
            y: { 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          }}
        />
      </div>
    </div>
  );
};

export default Left;