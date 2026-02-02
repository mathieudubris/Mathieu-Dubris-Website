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
  Cpu,
  Building2,
  University,
  Gamepad2,
  Palette,
  HeartPulse,
  GitBranch,
  Briefcase
} from 'lucide-react';
import styles from './Section4.module.css';

const Section4 = () => {
  const partners = [
    { name: "Microsoft", Icon: Building2, url: "https://www.microsoft.com" },
    { name: "GitHub", Icon: GitBranch, url: "https://github.com" },
    { name: "Nvidia", Icon: Cpu, url: "https://www.nvidia.com" },
    { name: "Orange Madagascar", Icon: PhoneCall, url: "https://www.orange.mg" },
    { name: "Université Grenoble", Icon: University, url: "https://www.univ-grenoble-alpes.fr" },
    { name: "Ubisoft", Icon: Gamepad2, url: "https://www.ubisoft.com" },
    { name: "Rubika", Icon: Palette, url: "https://www.rubika-edu.com" },
    { name: "Harmonie Mutuelle", Icon: HeartPulse, url: "https://www.harmonie-mutuelle.fr" },
    { name: "Google", Icon: Chrome, url: "https://www.google.com" },
    { name: "Adobe", Icon: Figma, url: "https://www.adobe.com" },
    { name: "Slack", Icon: Slack, url: "https://slack.com" },
    { name: "Spotify", Icon: Music, url: "https://www.spotify.com" },
  ];

  // Triplé pour garantir une boucle infinie sans saccade
  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.tagline}>Confiance & Constance</p>
          <h2 className={styles.title}>Propulser par les meilleur des indusrtier</h2>
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
              duration: 45, // Vitesse légèrement réduite pour plus d'élégance
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
                aria-label={`Visiter ${partner.name}`}
              >
                <partner.Icon size={20} className={styles.partnerIcon} />
                <span className={styles.partnerName}>{partner.name}</span>
              </a>
            ))}
          </motion.div>
        </div>
        
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>48</span>
            <span className={styles.statLabel}>Partenaires Globaux</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>82%</span>
            <span className={styles.statLabel}>Qualité de Service</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>3.1K+</span>
            <span className={styles.statLabel}>Visites</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Section4;