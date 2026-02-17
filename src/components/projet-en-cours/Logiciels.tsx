"use client";

import React from 'react';
import { Wrench, Package } from 'lucide-react';
import styles from './Logiciels.module.css';

interface LogicielsProps {
  software: any[];
}

const Logiciels: React.FC<LogicielsProps> = ({ software }) => {
  // Helper function to check if a string is an emoji or an image URL
  const isEmoji = (icon: string): boolean => {
    // Check if it's a single character or emoji sequence (not a URL)
    return Boolean(icon && icon.length < 10 && !icon.startsWith('http') && !icon.startsWith('/'));
  };

  if (software.length === 0) {
    return (
      <div className={styles.logiciels}>
        <div className={styles.noSoftware}>
          <Package size={32} className={styles.noSoftwareIcon} />
          <p>Aucun logiciel spécifié pour ce projet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.logiciels}>
      <div className={styles.softwareGrid}>
        {software.map((soft, index) => (
          <div 
            key={index} 
            className={styles.softwareItem}
            title={soft.name}
          >
            <div className={styles.softwareLogo}>
              {soft.icon ? (
                isEmoji(soft.icon) ? (
                  // If it's an emoji, display it as text
                  <span className={styles.softwareEmoji}>{soft.icon}</span>
                ) : (
                  // If it's an image URL, display as img
                  <img src={soft.icon} alt={soft.name} className={styles.softwareImage} />
                )
              ) : (
                <Wrench size={24} className={styles.defaultIcon} />
              )}
            </div>
            <span className={styles.softwareName}>
              {soft.name}
            </span>
            {soft.version && (
              <span className={styles.softwareVersion}>
                v{soft.version}
              </span>
            )}
          </div>
        ))}
      </div>

      {software.length > 12 && (
        <div className={styles.softwareFooter}>
          <span className={styles.totalSoftware}>
            +{software.length - 12} autres logiciels
          </span>
        </div>
      )}
    </div>
  );
};

export default Logiciels;