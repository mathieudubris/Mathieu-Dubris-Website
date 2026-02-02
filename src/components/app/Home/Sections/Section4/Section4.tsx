"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Chrome, 
  Flame, 
  Figma, 
  Slack, 
  PhoneCall, 
  Music, 
  Satellite, 
  Smartphone, 
  Cpu 
} from 'lucide-react';
import styles from './Section4.module.css';

const Section4 = () => {
  const partners = [
    { name: "Google", Icon: Chrome, url: "https://www.google.com" },
    { name: "Firebase", Icon: Flame, url: "https://firebase.google.com" },
    { name: "Adobe", Icon: Figma, url: "https://www.adobe.com" },
    { name: "Slack", Icon: Slack, url: "https://slack.com" },
    { name: "Ringover", Icon: PhoneCall, url: "https://www.ringover.com" },
    { name: "Spotify", Icon: Music, url: "https://www.spotify.com" },
    { name: "Starlink", Icon: Satellite, url: "https://www.starlink.com" },
    { name: "Yas", Icon: Smartphone, url: "https://www.yas.mg/" },
    { name: "Nvidia", Icon: Cpu, url: "https://www.nvidia.com" },
  ];

  // Triplé pour garantir une boucle infinie sans saccade sur n'importe quelle largeur d'écran
  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.tagline}>Trust & Reliability</p>
          <h2 className={styles.title}>Propulsé par les meilleurs de l'industrie</h2>
        </div>

        <div className={styles.marqueeWrapper}>
          <div className={styles.fadeLeft} />
          <div className={styles.fadeRight} />
          
          <motion.div 
            className={styles.marqueeContent}
            animate={{
              x: ["0%", "-33.333%"]
            }}
            transition={{
              duration: 40, // Vitesse lente pour une fluidité maximale
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop"
            }}
          >
            {duplicatedPartners.map((partner, index) => (
              <a 
                key={index} 
                href={partner.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.partnerCard}
              >
                <partner.Icon size={22} className={styles.partnerIcon} />
                <span className={styles.partnerName}>{partner.name}</span>
              </a>
            ))}
          </motion.div>
        </div>
        
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>150+</span>
            <span className={styles.statLabel}>Partenaires Globaux</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>10k+</span>
            <span className={styles.statLabel}>API Calls / min</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>99.9%</span>
            <span className={styles.statLabel}>Uptime SLA</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Section4;