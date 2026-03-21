"use client";

import React from 'react';
import { motion } from 'framer-motion';
import styles from './Section5.module.css';

const Section4 = () => {
const partners = [
  // Big Tech / Infrastructure
  { name: "Microsoft", logo: "/assets/partenaire/images/png/microsoft.png", url: "https://www.microsoft.com" },
  { name: "Google", logo: "/assets/partenaire/images/png/google.png", url: "https://www.google.com" },
  { name: "Nvidia", logo: "/assets/partenaire/images/png/nvidia.png", url: "https://www.nvidia.com" },

  // Development & Cloud Tools
  { name: "GitHub", logo: "/assets/partenaire/images/png/github.png", url: "https://github.com" },
  { name: "Firebase", logo: "/assets/partenaire/images/png/firebase.png", url: "https://firebase.google.com" },
  { name: "Cloudinary", logo: "/assets/partenaire/images/png/cloudinary.png", url: "https://cloudinary.com/" },

  // Creative & Design Tools
  { name: "Adobe", logo: "/assets/partenaire/images/png/adobe.png", url: "https://www.adobe.com" },

  // Collaboration / Communication
  { name: "Slack", logo: "/assets/partenaire/images/png/slack.png", url: "https://slack.com" },

  // Gaming Industry
  { name: "Ubisoft", logo: "/assets/partenaire/images/png/ubisoft.png", url: "https://www.ubisoft.com" },

  // Education / Schools
  { name: "Rubika", logo: "/assets/partenaire/images/png/rubika.png", url: "https://www.rubika-edu.com" },
  { name: "Université Grenoble", logo: "/assets/partenaire/images/png/uga.png", url: "https://www.univ-grenoble-alpes.fr" },

  // Telecom / Local Infrastructure
  { name: "Orange Madagascar", logo: "/assets/partenaire/images/png/orange.png", url: "https://www.orange.mg" },

  // Other Brands
  { name: "Spotify", logo: "/assets/partenaire/images/png/spotify.png", url: "https://www.spotify.com" },
  { name: "Harmonie Mutuelle", logo: "/assets/partenaire/images/png/harmonie.png", url: "https://www.harmonie-mutuelle.fr" },
];

  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.tagline}>Confiance & Constance</p>
          <h2 className={styles.title}>Propulsé par les meilleurs des industries</h2>
        </div>

        <div className={styles.marqueeWrapper}>
          <div className={styles.fadeLeft} />
          <div className={styles.fadeRight} />
          
          <motion.div 
            className={styles.marqueeContent}
            animate={{ x: ["0%", "-33.333%"] }}
            transition={{
              duration: 45,
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
                <div className={styles.imageWrapper}>
                  {/* ✅ <img> classique au lieu de <Image /> de Next.js */}
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className={styles.partnerImage}
                  />
                </div>
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