// app/portfolio/projet-realise/page.tsx
"use client";

import React, { useState } from 'react';
import styles from './projet-realise.module.css';
import Link from 'next/link';
import { Info } from 'lucide-react';

export default function ProjetRealisePage() {
  const [accessKey, setAccessKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [accessGranted, setAccessGranted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessKey.trim()) {
      setErrorMessage('Veuillez saisir une clé d\'accès');
      return;
    }
    
    setIsLoading(true);
    
    // Simulation de validation
    setTimeout(() => {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      // Toujours invalide
      if (newAttempts >= 3) {
        setErrorMessage('Clé invalide. Veuillez contacter le support.');
      } else {
        setErrorMessage('Clé invalide.');
      }
      
      setIsLoading(false);
    }, 800);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    
    // Formater avec des tirets
    value = value.replace(/[^A-Z0-9-]/g, '');
    
    if (value.length > 4 && value[4] !== '-') {
      value = value.substring(0, 4) + '-' + value.substring(4);
    }
    if (value.length > 9 && value[9] !== '-') {
      value = value.substring(0, 9) + '-' + value.substring(9);
    }
    if (value.length > 14 && value[14] !== '-') {
      value = value.substring(0, 14) + '-' + value.substring(14);
    }
    
    if (value.length > 19) {
      value = value.substring(0, 19);
    }
    
    setAccessKey(value);
    if (errorMessage) setErrorMessage('');
  };

  if (accessGranted) {
    return (
      <div className={styles.portfolioContainer}>
        <h1>Portfolio</h1>
        <p>Accès accordé</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Overlay flou pour le popup */}
      {showInfo && (
        <div className={styles.overlay} onClick={() => setShowInfo(false)}>
          <div className={styles.infoPopup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3>Accès restreint</h3>
              <button 
                onClick={() => setShowInfo(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div className={styles.popupContent}>
              <p>
                Ce portfolio contient des projets réalisés en collaboration avec des partenaires 
                ayant choisi de préserver leur anonymat dans le cadre d'accords de confidentialité stricts.
              </p>
              <p>
                Les codes sources et détails complets ne sont accessibles que sur demande spécifique, 
                réservée aux clients ayant validé un entretien préalable en visioconférence.
              </p>
            </div>
            <div className={styles.popupActions}>
              <Link href="/contact" className={styles.contactButton}>
                Contacter le support
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.content}>
        <div className={styles.header}>
          <p className={styles.subtitle}>Authentification requise</p>
        </div>
        
        <button 
          onClick={() => setShowInfo(true)}
          className={styles.infoCircleButton}
          aria-label="Informations"
        >
          <Info size={20} />
        </button>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={accessKey}
              onChange={handleKeyChange}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className={styles.input}
              maxLength={19}
            />
          </div>
          
          <div className={`${styles.errorContainer} ${errorMessage ? styles.visible : ''}`}>
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
            {attempts >= 3 && errorMessage && (
              <Link href="/contact" className={styles.supportLink}>
                Contacter le support
              </Link>
            )}
          </div>
          
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading || !accessKey.trim()}
          >
            {isLoading ? 'Validation...' : 'Valider'}
          </button>
        </form>
      </div>
    </div>
  );
}