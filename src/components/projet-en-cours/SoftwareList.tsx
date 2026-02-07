// SoftwareList.tsx - LISTE COMPLÈTE DE LOGICIELS
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Wrench } from 'lucide-react';
import styles from './SoftwareList.module.css';

interface Software {
  id: string;
  name: string;
  icon: string;
  category: 'design' | 'dev' | 'video' | 'audio' | '3d' | 'art';
}

interface SoftwareListProps {
  projectId: string;
  isAdmin: boolean;
  compact?: boolean;
  selectedSoftware?: any[];
  onClose?: () => void;
  onSave?: (software: any[]) => void;
}

// LISTE COMPLÈTE ET ÉTENDUE DES LOGICIELS
const allSoftware: Software[] = [
  // DESIGN - 15 logiciels
  { id: '1', name: 'Figma', icon: '🎨', category: 'design' },
  { id: '2', name: 'Photoshop', icon: '🖼️', category: 'design' },
  { id: '3', name: 'Illustrator', icon: '✏️', category: 'design' },
  { id: '4', name: 'Adobe XD', icon: '📐', category: 'design' },
  { id: '5', name: 'Sketch', icon: '💎', category: 'design' },
  { id: '6', name: 'InDesign', icon: '📄', category: 'design' },
  { id: '7', name: 'Affinity Designer', icon: '🎯', category: 'design' },
  { id: '8', name: 'CorelDRAW', icon: '🌀', category: 'design' },
  { id: '9', name: 'Canva', icon: '🖌️', category: 'design' },
  { id: '10', name: 'Framer', icon: '⚡', category: 'design' },
  { id: '11', name: 'InVision', icon: '👁️', category: 'design' },
  { id: '12', name: 'Procreate', icon: '🎭', category: 'design' },
  { id: '13', name: 'GIMP', icon: '🦊', category: 'design' },
  { id: '14', name: 'Krita', icon: '🖍️', category: 'design' },
  { id: '15', name: 'Inkscape', icon: '🔷', category: 'design' },
  
  // DÉVELOPPEMENT - 25 logiciels
  { id: '16', name: 'VS Code', icon: '💻', category: 'dev' },
  { id: '17', name: 'React', icon: '⚛️', category: 'dev' },
  { id: '18', name: 'Next.js', icon: '▲', category: 'dev' },
  { id: '19', name: 'Vue.js', icon: '💚', category: 'dev' },
  { id: '20', name: 'Angular', icon: '🅰️', category: 'dev' },
  { id: '21', name: 'Node.js', icon: '🟢', category: 'dev' },
  { id: '22', name: 'Python', icon: '🐍', category: 'dev' },
  { id: '23', name: 'Django', icon: '🎸', category: 'dev' },
  { id: '24', name: 'Flask', icon: '🧪', category: 'dev' },
  { id: '25', name: 'PHP', icon: '🐘', category: 'dev' },
  { id: '26', name: 'Laravel', icon: '🔺', category: 'dev' },
  { id: '27', name: 'Ruby', icon: '💎', category: 'dev' },
  { id: '28', name: 'Rails', icon: '🛤️', category: 'dev' },
  { id: '29', name: 'Java', icon: '☕', category: 'dev' },
  { id: '30', name: 'Spring', icon: '🍃', category: 'dev' },
  { id: '31', name: 'C#', icon: '🔷', category: 'dev' },
  { id: '32', name: '.NET', icon: '🟣', category: 'dev' },
  { id: '33', name: 'Go', icon: '🐹', category: 'dev' },
  { id: '34', name: 'Rust', icon: '🦀', category: 'dev' },
  { id: '35', name: 'TypeScript', icon: '🔷', category: 'dev' },
  { id: '36', name: 'JavaScript', icon: '🟨', category: 'dev' },
  { id: '37', name: 'Unity', icon: '🎮', category: 'dev' },
  { id: '38', name: 'Unreal', icon: '🕹️', category: 'dev' },
  { id: '39', name: 'Docker', icon: '🐳', category: 'dev' },
  { id: '40', name: 'Kubernetes', icon: '☸️', category: 'dev' },
  
  // 3D - 12 logiciels
  { id: '41', name: 'Blender', icon: '🔶', category: '3d' },
  { id: '42', name: 'Cinema 4D', icon: '🎬', category: '3d' },
  { id: '43', name: 'Maya', icon: '🗿', category: '3d' },
  { id: '44', name: '3ds Max', icon: '🏗️', category: '3d' },
  { id: '45', name: 'ZBrush', icon: '🗿', category: '3d' },
  { id: '46', name: 'Houdini', icon: '🌊', category: '3d' },
  { id: '47', name: 'Substance', icon: '🧱', category: '3d' },
  { id: '48', name: 'SketchUp', icon: '📦', category: '3d' },
  { id: '49', name: 'Rhino', icon: '🦏', category: '3d' },
  { id: '50', name: 'AutoCAD', icon: '📏', category: '3d' },
  { id: '51', name: 'Fusion 360', icon: '🔧', category: '3d' },
  { id: '52', name: 'SolidWorks', icon: '⚙️', category: '3d' },
  
  // VIDÉO - 15 logiciels
  { id: '53', name: 'After Effects', icon: '✨', category: 'video' },
  { id: '54', name: 'Premiere Pro', icon: '🎥', category: 'video' },
  { id: '55', name: 'Final Cut', icon: '🎞️', category: 'video' },
  { id: '56', name: 'DaVinci', icon: '🌈', category: 'video' },
  { id: '57', name: 'Avid', icon: '📹', category: 'video' },
  { id: '58', name: 'Vegas Pro', icon: '🎰', category: 'video' },
  { id: '59', name: 'Camtasia', icon: '📺', category: 'video' },
  { id: '60', name: 'Filmora', icon: '🎬', category: 'video' },
  { id: '61', name: 'HitFilm', icon: '🎯', category: 'video' },
  { id: '62', name: 'Lightworks', icon: '💡', category: 'video' },
  { id: '63', name: 'Nuke', icon: '💣', category: 'video' },
  { id: '64', name: 'Flame', icon: '🔥', category: 'video' },
  { id: '65', name: 'Motion', icon: '🌀', category: 'video' },
  { id: '66', name: 'Mocha', icon: '☕', category: 'video' },
  { id: '67', name: 'Resolve', icon: '🎨', category: 'video' },
  
  // AUDIO - 15 logiciels
  { id: '68', name: 'Audition', icon: '🎵', category: 'audio' },
  { id: '69', name: 'Logic Pro', icon: '🎹', category: 'audio' },
  { id: '70', name: 'Ableton', icon: '🎧', category: 'audio' },
  { id: '71', name: 'FL Studio', icon: '🎼', category: 'audio' },
  { id: '72', name: 'Pro Tools', icon: '🎚️', category: 'audio' },
  { id: '73', name: 'Cubase', icon: '🎛️', category: 'audio' },
  { id: '74', name: 'Reaper', icon: '⚔️', category: 'audio' },
  { id: '75', name: 'Studio One', icon: '1️⃣', category: 'audio' },
  { id: '76', name: 'GarageBand', icon: '🎸', category: 'audio' },
  { id: '77', name: 'Reason', icon: '🧠', category: 'audio' },
  { id: '78', name: 'Bitwig', icon: '🎶', category: 'audio' },
  { id: '79', name: 'Audacity', icon: '🔊', category: 'audio' },
  { id: '80', name: 'WaveLab', icon: '🌊', category: 'audio' },
  { id: '81', name: 'Sound Forge', icon: '🔨', category: 'audio' },
  { id: '82', name: 'Melodyne', icon: '🎤', category: 'audio' },
  
  // ART - 18 logiciels
  { id: '83', name: 'Clip Studio', icon: '✍️', category: 'art' },
  { id: '84', name: 'Paint Tool SAI', icon: '🖌️', category: 'art' },
  { id: '85', name: 'ArtRage', icon: '🎨', category: 'art' },
  { id: '86', name: 'Rebelle', icon: '💧', category: 'art' },
  { id: '87', name: 'Corel Painter', icon: '🖼️', category: 'art' },
  { id: '88', name: 'Artweaver', icon: '🪡', category: 'art' },
  { id: '89', name: 'FireAlpaca', icon: '🦙', category: 'art' },
  { id: '90', name: 'MediBang', icon: '📱', category: 'art' },
  { id: '91', name: 'PixelArt', icon: '🟦', category: 'art' },
  { id: '92', name: 'Aseprite', icon: '👾', category: 'art' },
  { id: '93', name: 'Spine', icon: '🦴', category: 'art' },
  { id: '94', name: 'Toon Boom', icon: '🎭', category: 'art' },
  { id: '95', name: 'OpenToonz', icon: '🎬', category: 'art' },
  { id: '96', name: 'TVPaint', icon: '📺', category: 'art' },
  { id: '97', name: 'Animate', icon: '🎞️', category: 'art' },
  { id: '98', name: 'Moho', icon: '🎪', category: 'art' },
  { id: '99', name: 'Synfig', icon: '🔄', category: 'art' },
  { id: '100', name: 'Pencil2D', icon: '✏️', category: 'art' },
];

const SoftwareList: React.FC<SoftwareListProps> = ({ 
  projectId, 
  isAdmin, 
  compact = false,
  selectedSoftware = [],
  onClose = () => {},
  onSave = () => {}
}) => {
  const [selected, setSelected] = useState<Software[]>(selectedSoftware || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setSelected(selectedSoftware || []);
  }, [selectedSoftware]);

  // Filtrer par catégorie
  const filteredSoftware = selectedCategory === 'all' 
    ? allSoftware 
    : allSoftware.filter(s => s.category === selectedCategory);

  // Toggle sélection
  const toggleSoftware = (soft: Software) => {
    if (selected.find(s => s.id === soft.id)) {
      setSelected(selected.filter(s => s.id !== soft.id));
    } else {
      setSelected([...selected, soft]);
    }
  };

  // Sauvegarder
  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  // Vue compacte pour les cartes - JUSTE LES ICÔNES
  if (compact) {
    return null; // Les icônes sont affichées directement dans ProjectCard
  }

  // Vue modal plein écran
  return (
    <motion.div 
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className={styles.modalContent}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2>
              <Wrench size={24} />
              <span>Logiciels utilisés</span>
            </h2>
            <p>Sélectionnez les logiciels utilisés dans ce projet ({selected.length} sélectionné{selected.length > 1 ? 's' : ''})</p>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Filtres de catégorie */}
        <div className={styles.categoryFilters}>
          {[
            { key: 'all', label: 'Tous' },
            { key: 'design', label: 'Design' },
            { key: 'dev', label: 'Développement' },
            { key: '3d', label: '3D' },
            { key: 'video', label: 'Vidéo' },
            { key: 'audio', label: 'Audio' },
            { key: 'art', label: 'Art' }
          ].map(cat => (
            <button
              key={cat.key}
              className={`${styles.categoryBtn} ${selectedCategory === cat.key ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Corps - SCROLLABLE */}
        <div className={styles.modalBody}>
          {filteredSoftware.length > 0 ? (
            <div className={styles.softwareGrid}>
              {filteredSoftware.map(soft => {
                const isSelected = selected.find(s => s.id === soft.id);
                
                return (
                  <div 
                    key={soft.id} 
                    className={`${styles.softwareCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggleSoftware(soft)}
                  >
                    {isSelected && (
                      <div className={styles.selectedBadge}>
                        <Check size={14} />
                      </div>
                    )}
                    <div className={styles.softwareIcon}>{soft.icon}</div>
                    <div className={styles.softwareName}>{soft.name}</div>
                    <div className={styles.softwareCategory}>{soft.category}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Wrench size={48} />
              <h3>Aucun logiciel trouvé</h3>
              <p>Essayez une autre catégorie</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerActions}>
            <button onClick={onClose} className={styles.cancelBtn}>
              Annuler
            </button>
            <button onClick={handleSave} className={styles.saveBtn}>
              <Check size={16} />
              Enregistrer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SoftwareList;