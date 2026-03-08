"use client";

import React, { useEffect, useState } from 'react';
import { SoftwareCanvas } from '@/components/portfolio/projet-en-cours/Editor/navigation/RessourcesEditor';
import type { SoftwareItem } from '@/components/portfolio/projet-en-cours/Editor/navigation/RessourcesEditor';

interface RessourcesProps {
  software: SoftwareItem[];
}

/**
 * Vue publique des ressources.
 * Lecture seule : pas de drag, pas de bouton supprimer.
 * Le bouton "Centrer" est affiché en haut à gauche du canvas.
 * Auto-centrage au chargement.
 */
const Ressources: React.FC<RessourcesProps> = ({ software }) => {
  // Force le re-montage du canvas à chaque changement de software
  // pour déclencher l'auto-centrage dans SoftwareCanvas
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    setCanvasKey(prev => prev + 1);
  }, [software]);

  return (
    <SoftwareCanvas
      key={canvasKey}
      items={software}
      editable={false}
      height="calc(100vh - 120px)"
    />
  );
};

export default Ressources;