// Roadmap.tsx - Updated version with error handling
"use client";

import React, { useState } from 'react';
import { Map, ExternalLink, AlertCircle } from 'lucide-react';
import styles from './Roadmap.module.css';

interface RoadmapLink {
  id: string;
  label: string;
  url: string;
}

interface RoadmapProps {
  roadmapLinks: RoadmapLink[];
}

const Roadmap: React.FC<RoadmapProps> = ({ roadmapLinks }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [iframeError, setIframeError] = useState<boolean>(false);

  if (roadmapLinks.length === 0) {
    return (
      <div className={styles.roadmap}>
        <div className={styles.emptyState}>
          <Map size={48} className={styles.emptyIcon} />
          <h3>Aucune roadmap</h3>
          <p>Aucun lien roadmap n'a encore été ajouté à ce projet.</p>
        </div>
      </div>
    );
  }

  const activeLink = roadmapLinks[activeIndex];

  const handleIframeError = () => {
    setIframeError(true);
  };

  const handleTabChange = (index: number) => {
    setActiveIndex(index);
    setIframeError(false); // Reset error state when changing tabs
  };

  const openInNewTab = () => {
    window.open(activeLink.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.roadmap}>
      {/* Sélecteur de liens (si plusieurs) */}
      {roadmapLinks.length > 1 && (
        <div className={styles.tabSelector}>
          {roadmapLinks.map((link, index) => (
            <button
              key={link.id}
              className={`${styles.selectorTab} ${index === activeIndex ? styles.selectorTabActive : ''}`}
              onClick={() => handleTabChange(index)}
            >
              <span className={styles.selectorIndex}>{index + 1}</span>
              <span className={styles.selectorLabel}>{link.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Header with open button */}
      <div className={styles.iframeHeader}>
        <div className={styles.iframeTitle}>
          <Map size={15} />
          <span>{activeLink.label}</span>
        </div>
        <button 
          className={styles.openButton}
          onClick={openInNewTab}
          title="Ouvrir dans un nouvel onglet"
        >
          <ExternalLink size={14} />
          <span>Ouvrir</span>
        </button>
      </div>

      {/* Iframe embarquée ou message d'erreur */}
      <div className={styles.iframeWrapper}>
        {!iframeError ? (
          <iframe
            key={activeLink.id}
            src={activeLink.url}
            className={styles.iframe}
            title={activeLink.label}
            allowFullScreen
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation"
            onError={handleIframeError}
          />
        ) : (
          <div className={styles.errorState}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <h4>Impossible d'afficher cette page</h4>
            <p>Cette page ne peut pas être affichée dans l'iframe en raison de ses paramètres de sécurité.</p>
            <button onClick={openInNewTab} className={styles.openInNewTabBtn}>
              <ExternalLink size={16} />
              Ouvrir dans un nouvel onglet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roadmap;