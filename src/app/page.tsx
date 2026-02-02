'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';

export default function RootPage() {
  const router = useRouter();
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Redirection après la fin du chargement
    const timer = setTimeout(() => {
      setIsFinished(true);
      setTimeout(() => {
        router.push('/home');
      }, 800);
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.4,
        staggerChildren: 0.15
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

  return (
    <div className={`${styles.page} ${isFinished ? styles.bgBlack : ''}`}>
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {!isFinished && (
            <motion.div 
              className={styles.textWrapper}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, filter: "blur(10px)" }}
            >
              <h1 className={styles.title}>
                <motion.span variants={itemVariants} className={styles.line}>
                  BIENVENUE
                </motion.span>
              </h1>

              <motion.div 
                className={styles.loadingContainer}
                variants={itemVariants}
              >
                <motion.div 
                  className={styles.loadingBar}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}