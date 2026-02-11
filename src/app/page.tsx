'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';

export default function RootPage() {
  const router = useRouter();
  const [isFinished, setIsFinished] = useState(false);
  const [loadingBarWidth, setLoadingBarWidth] = useState<number | null>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const loadingContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ajuste la largeur de la barre de chargement à celle du texte
    const updateLoadingBarWidth = () => {
      if (textRef.current && loadingContainerRef.current) {
        const textWidth = textRef.current.offsetWidth;
        setLoadingBarWidth(textWidth);
        
        // Applique la largeur directement au conteneur
        loadingContainerRef.current.style.width = `${textWidth}px`;
      }
    };

    // Initial update
    updateLoadingBarWidth();

    // Update on window resize
    window.addEventListener('resize', updateLoadingBarWidth);

    // Cleanup
    return () => window.removeEventListener('resize', updateLoadingBarWidth);
  }, []);

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
              className={styles.contentContainer}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, filter: "blur(10px)" }}
            >
              <h1 className={styles.title}>
                <motion.span 
                  ref={textRef}
                  variants={itemVariants} 
                  className={styles.line}
                >
                  BIENVENUE
                </motion.span>
              </h1>

              <motion.div 
                ref={loadingContainerRef}
                className={styles.loadingContainer}
                variants={itemVariants}
                style={{
                  width: loadingBarWidth ? `${loadingBarWidth}px` : '100%'
                }}
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