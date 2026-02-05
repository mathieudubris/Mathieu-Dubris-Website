// components/app/SoftwareList/SoftwareList.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Save } from 'lucide-react';
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
}

// Logiciels par défaut
const defaultSoftware: Software[] = [
  { id: '1', name: 'Figma', icon: '🎨', category: 'design' },
  { id: '2', name: 'VS Code', icon: '💻', category: 'dev' },
  { id: '3', name: 'Blender', icon: '🎬', category: '3d' },
  { id: '4', name: 'After Effects', icon: '✨', category: 'video' },
  { id: '5', name: 'Photoshop', icon: '🖼️', category: 'design' },
  { id: '6', name: 'Premiere Pro', icon: '🎥', category: 'video' },
  { id: '7', name: 'Audition', icon: '🎵', category: 'audio' },
  { id: '8', name: 'Unity', icon: '🎮', category: 'dev' },
];

const SoftwareList: React.FC<SoftwareListProps> = ({ projectId, isAdmin }) => {
  const [software, setSoftware] = useState<Software[]>(defaultSoftware.slice(0, 4));
  const [isEditing, setIsEditing] = useState(false);
  const [availableSoftware, setAvailableSoftware] = useState<Software[]>(defaultSoftware);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtrer les logiciels par catégorie
  const filteredSoftware = selectedCategory === 'all' 
    ? availableSoftware 
    : availableSoftware.filter(s => s.category === selectedCategory);

  // Toggle l'édition (admin seulement)
  const toggleEdit = () => {
    if (isAdmin) {
      setIsEditing(!isEditing);
    }
  };

  // Ajouter un logiciel
  const addSoftware = (soft: Software) => {
    if (!software.find(s => s.id === soft.id)) {
      setSoftware([...software, soft]);
    }
  };

  // Supprimer un logiciel
  const removeSoftware = (id: string) => {
    setSoftware(software.filter(s => s.id !== id));
  };

  // Sauvegarder les modifications
  const saveChanges = () => {
    // Ici, tu pourrais sauvegarder dans Firebase
    console.log('Software saved:', software);
    setIsEditing(false);
  };

  return (
    <div className={styles.softwareContainer}>
      <div className={styles.softwareHeader}>
        <h4 className={styles.softwareTitle}>Logiciels</h4>
        {isAdmin && (
          <button 
            onClick={toggleEdit} 
            className={styles.editButton}
            title={isEditing ? "Annuler" : "Modifier"}
          >
            {isEditing ? <X size={14} /> : <Edit2 size={14} />}
          </button>
        )}
      </div>

      {/* Liste des logiciels */}
      <div className={styles.softwareGrid}>
        {software.map(soft => (
          <div key={soft.id} className={styles.softwareItem}>
            <span className={styles.softwareIcon}>{soft.icon}</span>
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
        
        {isEditing && (
          <button 
            className={styles.addSoftwareBtn}
            onClick={() => {/* Ouvrir modal d'ajout */}}
            title="Ajouter un logiciel"
          >
            <Plus size={16} />
          </button>
        )}
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
              .filter(soft => !software.find(s => s.id === soft.id))
              .map(soft => (
                <div 
                  key={soft.id} 
                  className={styles.availableItem}
                  onClick={() => addSoftware(soft)}
                >
                  <span className={styles.availableIcon}>{soft.icon}</span>
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