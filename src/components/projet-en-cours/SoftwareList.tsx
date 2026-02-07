
// SoftwareList.tsx - LISTE COMPLÈTE DE LOGICIELS AVEC RECHERCHE
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Wrench, Search } from 'lucide-react';
import styles from './SoftwareList.module.css';

interface Software {
  id: string;
  name: string;
  icon: string;
  category: 'design' | 'dev' | 'video' | 'audio' | '3d' | 'art' | 'office' | 'collab' | 'cms' | 'analytics' | 'marketing' | 'database' | 'cloud' | 'devops' | 'bi' | 'erp' | 'crm' | 'game' | 'ai';
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
  // OFFICE - 11 logiciels
  { id: '101', name: 'Microsoft Word', icon: '📝', category: 'office' },
  { id: '102', name: 'Microsoft Excel', icon: '📊', category: 'office' },
  { id: '103', name: 'Microsoft PowerPoint', icon: '📽️', category: 'office' },
  { id: '104', name: 'Microsoft Outlook', icon: '📧', category: 'office' },
  { id: '105', name: 'Google Docs', icon: '📄', category: 'office' },
  { id: '106', name: 'Google Sheets', icon: '📈', category: 'office' },
  { id: '107', name: 'Google Slides', icon: '🎞️', category: 'office' },
  { id: '108', name: 'LibreOffice', icon: '📚', category: 'office' },
  { id: '109', name: 'Notion', icon: '🗂️', category: 'office' },
  { id: '110', name: 'Zoho Office', icon: '📋', category: 'office' },
  
  // COLLABORATION - 5 logiciels
  { id: '111', name: 'Microsoft Teams', icon: '👥', category: 'collab' },
  { id: '112', name: 'Slack', icon: '💬', category: 'collab' },
  { id: '113', name: 'Discord', icon: '🎮', category: 'collab' },
  { id: '114', name: 'Zoom', icon: '📹', category: 'collab' },
  { id: '115', name: 'Google Meet', icon: '🎥', category: 'collab' },
  
  // CMS - 8 logiciels
  { id: '116', name: 'WordPress', icon: '🪴', category: 'cms' },
  { id: '117', name: 'Shopify', icon: '🛒', category: 'cms' },
  { id: '118', name: 'Webflow', icon: '🕸️', category: 'cms' },
  { id: '119', name: 'Wix', icon: '🏗️', category: 'cms' },
  { id: '120', name: 'Drupal', icon: '💧', category: 'cms' },
  { id: '121', name: 'Joomla', icon: '🎯', category: 'cms' },
  { id: '122', name: 'Magento', icon: '🛍️', category: 'cms' },
  
  // ANALYTICS - 2 logiciels
  { id: '123', name: 'Google Analytics', icon: '📈', category: 'analytics' },
  { id: '124', name: 'Google Tag Manager', icon: '🏷️', category: 'analytics' },
  
  // MARKETING - 5 logiciels
  { id: '125', name: 'SEMrush', icon: '🔍', category: 'marketing' },
  { id: '126', name: 'Ahrefs', icon: '🔗', category: 'marketing' },
  { id: '127', name: 'HubSpot', icon: '🔄', category: 'marketing' },
  { id: '128', name: 'Mailchimp', icon: '🐵', category: 'marketing' },
  { id: '129', name: 'Salesforce Marketing Cloud', icon: '☁️', category: 'marketing' },
  
  // DESIGN - 15 logiciels (mise à jour)
  { id: '1', name: 'Figma', icon: '🎨', category: 'design' },
  { id: '2', name: 'Adobe Photoshop', icon: '🖼️', category: 'design' },
  { id: '3', name: 'Adobe Illustrator', icon: '✏️', category: 'design' },
  { id: '4', name: 'Adobe XD', icon: '📐', category: 'design' },
  { id: '5', name: 'Sketch', icon: '💎', category: 'design' },
  { id: '6', name: 'Adobe InDesign', icon: '📄', category: 'design' },
  { id: '7', name: 'Affinity Designer', icon: '🎯', category: 'design' },
  { id: '8', name: 'CorelDRAW', icon: '🌀', category: 'design' },
  { id: '9', name: 'Canva', icon: '🖌️', category: 'design' },
  { id: '10', name: 'Framer', icon: '⚡', category: 'design' },
  { id: '11', name: 'InVision', icon: '👁️', category: 'design' },
  { id: '12', name: 'Procreate', icon: '🎭', category: 'design' },
  { id: '13', name: 'GIMP', icon: '🦊', category: 'design' },
  { id: '14', name: 'Krita', icon: '🖍️', category: 'design' },
  { id: '15', name: 'Inkscape', icon: '🔷', category: 'design' },
  
  // VIDÉO - 15 logiciels (mise à jour)
  { id: '53', name: 'Adobe After Effects', icon: '✨', category: 'video' },
  { id: '54', name: 'Adobe Premiere Pro', icon: '🎥', category: 'video' },
  { id: '55', name: 'Final Cut Pro', icon: '🎞️', category: 'video' },
  { id: '56', name: 'DaVinci Resolve', icon: '🌈', category: 'video' },
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
  
  // 3D - 12 logiciels (mise à jour)
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
  
  // DÉVELOPPEMENT - 44 logiciels (mise à jour)
  { id: '16', name: 'VS Code', icon: '💻', category: 'dev' },
  { id: '17', name: 'Visual Studio Code', icon: '📝', category: 'dev' },
  { id: '130', name: 'IntelliJ IDEA', icon: '💡', category: 'dev' },
  { id: '131', name: 'Eclipse', icon: '🌘', category: 'dev' },
  { id: '132', name: 'Visual Studio', icon: '🟦', category: 'dev' },
  { id: '133', name: 'Android Studio', icon: '🤖', category: 'dev' },
  { id: '134', name: 'Xcode', icon: '🍎', category: 'dev' },
  { id: '135', name: 'Git', icon: '🐙', category: 'dev' },
  { id: '136', name: 'GitHub', icon: '🐱', category: 'dev' },
  { id: '137', name: 'GitLab', icon: '🦊', category: 'dev' },
  { id: '138', name: 'Bitbucket', icon: '🪣', category: 'dev' },
  
  // LANGUAGES DE PROGRAMMATION
  { id: '18', name: 'React', icon: '⚛️', category: 'dev' },
  { id: '19', name: 'Next.js', icon: '▲', category: 'dev' },
  { id: '20', name: 'Vue.js', icon: '💚', category: 'dev' },
  { id: '21', name: 'Angular', icon: '🅰️', category: 'dev' },
  { id: '22', name: 'Node.js', icon: '🟢', category: 'dev' },
  { id: '23', name: 'Python', icon: '🐍', category: 'dev' },
  { id: '24', name: 'Django', icon: '🎸', category: 'dev' },
  { id: '25', name: 'Flask', icon: '🧪', category: 'dev' },
  { id: '26', name: 'PHP', icon: '🐘', category: 'dev' },
  { id: '27', name: 'Laravel', icon: '🔺', category: 'dev' },
  { id: '28', name: 'Ruby', icon: '💎', category: 'dev' },
  { id: '29', name: 'Rails', icon: '🛤️', category: 'dev' },
  { id: '30', name: 'Java', icon: '☕', category: 'dev' },
  { id: '31', name: 'Spring Boot', icon: '🍃', category: 'dev' },
  { id: '32', name: 'C#', icon: '🔷', category: 'dev' },
  { id: '33', name: '.NET', icon: '🟣', category: 'dev' },
  { id: '34', name: 'Go', icon: '🐹', category: 'dev' },
  { id: '35', name: 'Rust', icon: '🦀', category: 'dev' },
  { id: '36', name: 'TypeScript', icon: '🔷', category: 'dev' },
  { id: '37', name: 'JavaScript', icon: '🟨', category: 'dev' },
  { id: '139', name: 'C', icon: '©️', category: 'dev' },
  { id: '140', name: 'C++', icon: '➕', category: 'dev' },
  { id: '141', name: 'SQL', icon: '🗃️', category: 'dev' },
  { id: '142', name: 'HTML', icon: '🌐', category: 'dev' },
  { id: '143', name: 'CSS', icon: '🎨', category: 'dev' },
  { id: '144', name: 'R', icon: '📊', category: 'dev' },
  { id: '145', name: 'Julia', icon: '👩', category: 'dev' },
  { id: '146', name: 'MATLAB', icon: '🔢', category: 'dev' },
  { id: '147', name: 'Bash', icon: '💲', category: 'dev' },
  { id: '148', name: 'PowerShell', icon: '💻', category: 'dev' },
  { id: '149', name: 'YAML', icon: '📄', category: 'dev' },
  { id: '150', name: 'Swift', icon: '🐦', category: 'dev' },
  { id: '151', name: 'Kotlin', icon: '🟣', category: 'dev' },
  { id: '152', name: 'Dart', icon: '🎯', category: 'dev' },
  
  { id: '38', name: 'Unity', icon: '🎮', category: 'dev' },
  { id: '39', name: 'Unreal Engine', icon: '🕹️', category: 'dev' },
  { id: '40', name: 'Docker', icon: '🐳', category: 'dev' },
  { id: '153', name: 'Kubernetes', icon: '☸️', category: 'dev' },
  { id: '154', name: 'Terraform', icon: '🏗️', category: 'dev' },
  { id: '155', name: 'Jenkins', icon: '🤖', category: 'dev' },
  
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
  
  // DATABASE - 7 logiciels
  { id: '156', name: 'MySQL', icon: '🐬', category: 'database' },
  { id: '157', name: 'PostgreSQL', icon: '🐘', category: 'database' },
  { id: '158', name: 'Oracle Database', icon: '🗼', category: 'database' },
  { id: '159', name: 'Microsoft SQL Server', icon: '🗄️', category: 'database' },
  { id: '160', name: 'MongoDB', icon: '🍃', category: 'database' },
  { id: '161', name: 'Redis', icon: '🧱', category: 'database' },
  { id: '162', name: 'Snowflake', icon: '❄️', category: 'database' },
  
  // BIG DATA - 2 logiciels
  { id: '163', name: 'Hadoop', icon: '🐘', category: 'database' },
  { id: '164', name: 'Apache Spark', icon: '⚡', category: 'database' },
  
  // CLOUD - 3 logiciels
  { id: '165', name: 'AWS', icon: '☁️', category: 'cloud' },
  { id: '166', name: 'Microsoft Azure', icon: '🔷', category: 'cloud' },
  { id: '167', name: 'Google Cloud Platform', icon: '☁️', category: 'cloud' },
  
  // DEVOPS - 5 logiciels
  { id: '168', name: 'Docker', icon: '🐳', category: 'devops' },
  { id: '169', name: 'Kubernetes', icon: '☸️', category: 'devops' },
  { id: '170', name: 'Terraform', icon: '🏗️', category: 'devops' },
  { id: '171', name: 'Jenkins', icon: '🤖', category: 'devops' },
  
  // BUSINESS INTELLIGENCE - 4 logiciels
  { id: '172', name: 'Power BI', icon: '📊', category: 'bi' },
  { id: '173', name: 'Tableau', icon: '📈', category: 'bi' },
  { id: '174', name: 'Qlik Sense', icon: '🔍', category: 'bi' },
  { id: '175', name: 'SAS', icon: '📊', category: 'bi' },
  
  // ANALYTICS - 3 logiciels
  { id: '176', name: 'SPSS', icon: '📊', category: 'analytics' },
  { id: '177', name: 'SAP', icon: '📦', category: 'analytics' },
  { id: '178', name: 'Oracle ERP', icon: '🗼', category: 'analytics' },
  
  // ERP - 2 logiciels
  { id: '179', name: 'Microsoft Dynamics', icon: '🔄', category: 'erp' },
  { id: '180', name: 'Odoo', icon: '📊', category: 'erp' },
  
  // CRM - 3 logiciels
  { id: '181', name: 'Salesforce', icon: '☁️', category: 'crm' },
  { id: '182', name: 'HubSpot CRM', icon: '🔄', category: 'crm' },
  { id: '183', name: 'Zoho CRM', icon: '📋', category: 'crm' },
  
  // GAME ENGINES - 3 logiciels
  { id: '184', name: 'Unity', icon: '🎮', category: 'game' },
  { id: '185', name: 'Unreal Engine', icon: '🕹️', category: 'game' },
  { id: '186', name: 'Godot', icon: '👁️', category: 'game' },
  
  // AI/ML - 3 logiciels
  { id: '187', name: 'TensorFlow', icon: '🧠', category: 'ai' },
  { id: '188', name: 'PyTorch', icon: '🔥', category: 'ai' },
  { id: '189', name: 'Scikit-learn', icon: '📊', category: 'ai' },
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
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setSelected(selectedSoftware || []);
  }, [selectedSoftware]);

  // Filtrer les logiciels par catégorie ET recherche
  const filteredSoftware = useMemo(() => {
    let filtered = allSoftware;
    
    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    
    // Filtrer par recherche
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery]);

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

  // Réinitialiser les filtres
  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
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

        {/* Barre de recherche */}
        <div className={styles.searchBar}>
          <div className={styles.searchInputContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un logiciel ou une catégorie..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filtres de catégorie */}
        <div className={styles.categoryFilters}>
          <button
            className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Tous ({allSoftware.length})
          </button>
          {[
            { key: 'office', label: 'Bureautique' },
            { key: 'collab', label: 'Collaboration' },
            { key: 'cms', label: 'CMS' },
            { key: 'marketing', label: 'Marketing' },
            { key: 'analytics', label: 'Analytics' },
            { key: 'design', label: 'Design' },
            { key: 'dev', label: 'Développement' },
            { key: 'database', label: 'Bases de données' },
            { key: 'cloud', label: 'Cloud' },
            { key: 'devops', label: 'DevOps' },
            { key: 'bi', label: 'Business Intelligence' },
            { key: 'erp', label: 'ERP' },
            { key: 'crm', label: 'CRM' },
            { key: '3d', label: '3D' },
            { key: 'video', label: 'Vidéo' },
            { key: 'audio', label: 'Audio' },
            { key: 'art', label: 'Art' },
            { key: 'game', label: 'Moteurs de jeu' },
            { key: 'ai', label: 'IA/ML' }
          ].map(cat => {
            const count = allSoftware.filter(s => s.category === cat.key).length;
            return (
              <button
                key={cat.key}
                className={`${styles.categoryBtn} ${selectedCategory === cat.key ? styles.active : ''}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Corps - SCROLLABLE */}
        <div className={styles.modalBody}>
          {(filteredSoftware.length > 0 || searchQuery.trim() !== '') ? (
            <>
              {searchQuery.trim() !== '' && (
                <div style={{ marginBottom: '16px', color: 'var(--text-main)', opacity: 0.7, fontSize: '0.9rem' }}>
                  Résultats pour "<strong>{searchQuery}</strong>" : {filteredSoftware.length} logiciel{filteredSoftware.length > 1 ? 's' : ''} trouvé{filteredSoftware.length > 1 ? 's' : ''}
                  {(selectedCategory !== 'all') && ` dans ${selectedCategory}`}
                </div>
              )}
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
            </>
          ) : (
            <div className={styles.emptyState}>
              <Wrench size={48} />
              <h3>Aucun logiciel trouvé</h3>
              <p>Essayez une autre catégorie ou utilisez la recherche</p>
              <button 
                onClick={handleClearFilters}
                style={{
                  marginTop: '16px',
                  background: 'rgba(199, 255, 68, 0.1)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.selectedCount}>
            {selected.length} logiciel{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
          </div>
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
