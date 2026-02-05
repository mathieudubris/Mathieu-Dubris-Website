// components/projet-en-cours/SoftwareList.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Figma, 
  Code2, 
  Box, 
  Video, 
  Music, 
  Layers, 
  Palette, 
  Film,
  Mic,
  Camera,
  Plus,
  X,
  Edit2,
  Save,
  Sparkles,
  Brush,
  Zap,
  Package
} from 'lucide-react';
import styles from './SoftwareList.module.css';

interface Software {
  id: string;
  name: string;
  icon: string;
  category: 'design' | 'dev' | 'video' | 'audio' | '3d';
}

interface SoftwareListProps {
  projectId: string;
  isAdmin: boolean;
  compact?: boolean;
}

// Mapping des icônes Lucide React
const iconMap: { [key: string]: any } = {
  figma: Figma,
  code: Code2,
  box: Box,
  video: Video,
  music: Music,
  layers: Layers,
  palette: Palette,
  film: Film,
  mic: Mic,
  camera: Camera,
  sparkles: Sparkles,
  brush: Brush,
  zap: Zap,
  package: Package,
};

// Liste complète des logiciels disponibles
const allSoftware: Software[] = [
  // Design
  { id: '1', name: 'Figma', icon: 'figma', category: 'design' },
  { id: '2', name: 'Photoshop', icon: 'palette', category: 'design' },
  { id: '3', name: 'Illustrator', icon: 'brush', category: 'design' },
  { id: '4', name: 'Adobe XD', icon: 'layers', category: 'design' },
  
  // Développement
  { id: '5', name: 'VS Code', icon: 'code', category: 'dev' },
  { id: '6', name: 'React', icon: 'zap', category: 'dev' },
  { id: '7', name: 'Next.js', icon: 'package', category: 'dev' },
  { id: '8', name: 'Unity', icon: 'box', category: 'dev' },
  
  // 3D
  { id: '9', name: 'Blender', icon: 'box', category: '3d' },
  { id: '10', name: 'Cinema 4D', icon: 'box', category: '3d' },
  { id: '11', name: 'Maya', icon: 'box', category: '3d' },
  
  // Vidéo
  { id: '12', name: 'After Effects', icon: 'sparkles', category: 'video' },
  { id: '13', name: 'Premiere Pro', icon: 'video', category: 'video' },
  { id: '14', name: 'Final Cut', icon: 'film', category: 'video' },
  { id: '15', name: 'DaVinci', icon: 'camera', category: 'video' },
  
  // Audio
  { id: '16', name: 'Audition', icon: 'music', category: 'audio' },
  { id: '17', name: 'Logic Pro', icon: 'mic', category: 'audio' },
  { id: '18', name: 'Ableton', icon: 'music', category: 'audio' },
];

const SoftwareList: React.FC<SoftwareListProps> = ({ 
  projectId, 
  isAdmin, 
  compact = false 
}) => {
  const [selectedSoftware, setSelectedSoftware] = useState<Software[]>(
    allSoftware.slice(0, 6)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Charger les logiciels depuis Firebase (à implémenter)
  useEffect(() => {
    // TODO: Charger depuis Firebase
    // const loadSoftware = async () => {
    //   const data = await getSoftwareForProject(projectId);
    //   setSelectedSoftware(data);
    // };
    // loadSoftware();
  }, [projectId]);

  // Filtrer par catégorie
  const filteredSoftware = selectedCategory === 'all' 
    ? allSoftware 
    : allSoftware.filter(s => s.category === selectedCategory);

  // Ajouter un logiciel
  const addSoftware = (soft: Software) => {
    if (!selectedSoftware.find(s => s.id === soft.id)) {
      setSelectedSoftware([...selectedSoftware, soft]);
    }
  };

  // Supprimer un logiciel
  const removeSoftware = (id: string) => {
    setSelectedSoftware(selectedSoftware.filter(s => s.id !== id));
  };

  // Sauvegarder
  const saveChanges = async () => {
    // TODO: Sauvegarder dans Firebase
    console.log('Saving software:', selectedSoftware);
    setIsEditing(false);
  };

  // Rendre une icône
  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Package;
    return <IconComponent size={16} />;
  };

  if (compact) {
    // Vue compacte pour la carte projet
    return (
      <div className={styles.softwareCompact}>
        {selectedSoftware.slice(0, 6).map(soft => (
          <div key={soft.id} className={styles.softwareIconBox}>
            {renderIcon(soft.icon)}
          </div>
        ))}
        {selectedSoftware.length > 6 && (
          <div className={styles.moreSoftware}>
            +{selectedSoftware.length - 6}
          </div>
        )}
      </div>
    );
  }

  // Vue complète pour l'édition
  return (
    <div className={styles.softwareContainer}>
      <div className={styles.softwareHeader}>
        <h4 className={styles.softwareTitle}>Logiciels utilisés</h4>
        {isAdmin && (
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className={styles.editButton}
            title={isEditing ? "Annuler" : "Modifier"}
          >
            {isEditing ? <X size={14} /> : <Edit2 size={14} />}
          </button>
        )}
      </div>

      {/* Liste des logiciels sélectionnés */}
      <div className={styles.softwareGrid}>
        {selectedSoftware.map(soft => (
          <div key={soft.id} className={styles.softwareItem}>
            <span className={styles.softwareIcon}>
              {renderIcon(soft.icon)}
            </span>
            <span className={styles.softwareName}>{soft.name}</span>
            {isEditing && (
              <button
                onClick={() => removeSoftware(soft.id)}
                className={styles.removeButton}
                title="Retirer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Éditeur (admin seulement) */}
      {isEditing && (
        <div className={styles.softwareEditor}>
          <div className={styles.editorHeader}>
            <h5 className={styles.editorTitle}>Ajouter des logiciels</h5>
            <div className={styles.categoryFilters}>
              {['all', 'design', 'dev', 'video', 'audio', '3d'].map(cat => (
                <button
                  key={cat}
                  className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'all' ? 'Tous' : 
                   cat === 'design' ? 'Design' :
                   cat === 'dev' ? 'Dev' :
                   cat === 'video' ? 'Vidéo' :
                   cat === 'audio' ? 'Audio' : '3D'}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.availableSoftware}>
            {filteredSoftware
              .filter(soft => !selectedSoftware.find(s => s.id === soft.id))
              .map(soft => (
                <div 
                  key={soft.id} 
                  className={styles.availableItem}
                  onClick={() => addSoftware(soft)}
                >
                  <span className={styles.availableIcon}>
                    {renderIcon(soft.icon)}
                  </span>
                  <span className={styles.availableName}>{soft.name}</span>
                  <Plus size={12} className={styles.addIcon} />
                </div>
              ))}
          </div>

          <div className={styles.editorActions}>
            <button onClick={saveChanges} className={styles.saveButton}>
              <Save size={14} />
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftwareList;
