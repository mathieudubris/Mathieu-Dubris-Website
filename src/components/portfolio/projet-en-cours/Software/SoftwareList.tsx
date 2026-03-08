// SoftwareList.tsx - LISTE COMPLÈTE DE LOGICIELS AVEC LOGOS SVG PERSONNALISÉS
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Wrench, Search, Grid } from 'lucide-react';
import styles from './SoftwareList.module.css';

// Types
interface Software {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: Category;
}

type Category = 
  | 'office' | 'collab' | 'cms' | 'marketing' | 'analytics' 
  | 'design' | 'dev' | 'database' | 'cloud' | 'devops' 
  | 'bi' | 'erp' | 'crm' | '3d' | 'video' | 'audio' 
  | 'art' | 'game' | 'ai';

interface CategoryConfig {
  key: Category | 'all';
  label: string;
}

interface SoftwareListProps {
  projectId: string;
  isAdmin: boolean;
  compact?: boolean;
  selectedSoftware?: Software[];
  onClose?: () => void;
  onSave?: (software: Software[]) => void;
}

// Configuration des catégories
const CATEGORIES: CategoryConfig[] = [
  { key: 'all', label: 'Tous' },
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
];

// COMPOSANTS SVG PERSONNALISÉS POUR CHAQUE LOGICIEL
const AdobePhotoshop = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#001E36" />
    <text x="7" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#31A8FF">Ps</text>
  </svg>
);

const AdobeIllustrator = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#330000" />
    <text x="7" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#FF9A00">Ai</text>
  </svg>
);

const AdobeAfterEffects = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#000B1A" />
    <text x="7" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#9999FF">Ae</text>
  </svg>
);

const AdobePremierePro = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#2C001F" />
    <text x="7" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#9999FF">Pr</text>
  </svg>
);

const AdobeXD = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#2C001F" />
    <text x="7" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#FF61F6">Xd</text>
  </svg>
);

const AdobeInDesign = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#2C001F" />
    <text x="7" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#F36D6D">Id</text>
  </svg>
);

const Figma = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <circle cx="12" cy="12" r="8" fill="#0ACF83" />
    <path d="M8 8h8v8H8z" fill="#1ABCFE" />
    <circle cx="16" cy="12" r="4" fill="#A259FF" />
    <circle cx="12" cy="16" r="4" fill="#F24E1E" />
    <circle cx="8" cy="12" r="4" fill="#FF7262" />
  </svg>
);

const Sketch = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <polygon points="12,4 20,8 20,16 12,20 4,16 4,8" fill="#FDB300" />
    <polygon points="12,4 16,8 12,12 8,8" fill="#FFE600" />
  </svg>
);

const Blender = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <circle cx="12" cy="12" r="8" fill="#F57900" />
    <text x="8" y="17" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white">B</text>
  </svg>
);

const Cinema4D = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="4" fill="#011A24" />
    <text x="6" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#FF8A00">C4D</text>
  </svg>
);

const Maya = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#00162B" />
    <text x="7" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#00D8FF">M</text>
  </svg>
);

const ZBrush = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#4E2E2E" />
    <text x="6" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#DE5935">Z</text>
  </svg>
);

const VSCode = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M4 4 L20 4 L20 20 L4 20" fill="#0065A9" />
    <path d="M8 8 L16 8 L16 16 L8 16" fill="#007ACC" />
    <text x="10" y="18" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white">VS</text>
  </svg>
);

const IntelliJ = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#FC0FC0" />
    <text x="7" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">IJ</text>
  </svg>
);

const Eclipse = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <circle cx="12" cy="12" r="8" fill="#2C2255" />
    <text x="9" y="17" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white">E</text>
  </svg>
);

const Git = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <circle cx="12" cy="12" r="8" fill="#F1502F" />
    <text x="8" y="17" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white">Git</text>
  </svg>
);

const GitHub = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <circle cx="12" cy="12" r="8" fill="#24292E" />
    <path d="M12 4C7.58 4 4 7.58 4 12c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0020 12c0-4.42-3.58-8-8-8z" fill="white" />
  </svg>
);

const Docker = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#2496ED" />
    <text x="6" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">D</text>
  </svg>
);

const Kubernetes = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <circle cx="12" cy="12" r="8" fill="#326CE5" />
    <text x="7" y="17" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white">K8s</text>
  </svg>
);

const AWS = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#FF9900" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">AWS</text>
  </svg>
);

const Azure = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#0078D4" />
    <text x="6" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">Az</text>
  </svg>
);

const GCP = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#4285F4" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">GCP</text>
  </svg>
);

const MySQL = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#00758F" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">SQL</text>
  </svg>
);

const PostgreSQL = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#336791" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">Pg</text>
  </svg>
);

const MongoDB = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#4DB33D" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">MDB</text>
  </svg>
);

const ReactIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <circle cx="12" cy="12" r="3" fill="#61DAFB" />
    <path d="M12 6c3.5 0 6.5 1 9 2.5-2.5 1.5-5.5 2.5-9 2.5s-6.5-1-9-2.5C5.5 7 8.5 6 12 6z" stroke="#61DAFB" fill="none" />
    <path d="M12 18c-3.5 0-6.5-1-9-2.5 2.5-1.5 5.5-2.5 9-2.5s6.5 1 9 2.5c-2.5 1.5-5.5 2.5-9 2.5z" stroke="#61DAFB" fill="none" />
    <path d="M6 9c1.75 3 1.75 6 0 9M18 9c-1.75 3-1.75 6 0 9" stroke="#61DAFB" fill="none" />
  </svg>
);

const NodeJS = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 4 L20 8 L20 16 L12 20 L4 16 L4 8" fill="#539E43" />
    <text x="8" y="16" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="white">Node</text>
  </svg>
);

const Python = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#FFD845" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#3776AB">Py</text>
  </svg>
);

const WordPress = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <circle cx="12" cy="12" r="8" fill="#21759B" />
    <text x="6" y="17" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white">WP</text>
  </svg>
);

const Salesforce = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#00A1E0" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">SF</text>
  </svg>
);

const Slack = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#4A154B" />
    <text x="6" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">Slack</text>
  </svg>
);

const Teams = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#6264A7" />
    <text x="4" y="18" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">Teams</text>
  </svg>
);

const Zoom = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#2D8CFF" />
    <text x="6" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">ZM</text>
  </svg>
);

const Unity = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#222C37" />
    <text x="6" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">U</text>
  </svg>
);

const Unreal = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#313131" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">UE</text>
  </svg>
);

const TensorFlow = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#FF6F00" />
    <text x="4" y="18" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">TF</text>
  </svg>
);

const PyTorch = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#EE4C2C" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">PT</text>
  </svg>
);

const PowerBI = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#F2C811" />
    <text x="4" y="18" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="black">PBI</text>
  </svg>
);

const Tableau = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#E97627" />
    <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">Tab</text>
  </svg>
);

// Fonction utilitaire pour les icônes génériques par catégorie
const GenericIcon = ({ text, bgColor, textColor }: { text: string; bgColor: string; textColor: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" fill={bgColor} />
    <text x="6" y="18" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill={textColor}>{text}</text>
  </svg>
);

// LISTE COMPLÈTE DES LOGICIELS AVEC VRAIES ICÔNES
const allSoftware: Software[] = [
  // DESIGN
  { id: '1', name: 'Adobe Photoshop', icon: <AdobePhotoshop />, category: 'design' },
  { id: '2', name: 'Adobe Illustrator', icon: <AdobeIllustrator />, category: 'design' },
  { id: '3', name: 'Adobe After Effects', icon: <AdobeAfterEffects />, category: 'video' },
  { id: '4', name: 'Adobe Premiere Pro', icon: <AdobePremierePro />, category: 'video' },
  { id: '5', name: 'Adobe XD', icon: <AdobeXD />, category: 'design' },
  { id: '6', name: 'Adobe InDesign', icon: <AdobeInDesign />, category: 'design' },
  { id: '7', name: 'Figma', icon: <Figma />, category: 'design' },
  { id: '8', name: 'Sketch', icon: <Sketch />, category: 'design' },
  { id: '9', name: 'Blender', icon: <Blender />, category: '3d' },
  { id: '10', name: 'Cinema 4D', icon: <Cinema4D />, category: '3d' },
  { id: '11', name: 'Maya', icon: <Maya />, category: '3d' },
  { id: '12', name: 'ZBrush', icon: <ZBrush />, category: '3d' },
  
  // DÉVELOPPEMENT
  { id: '13', name: 'VS Code', icon: <VSCode />, category: 'dev' },
  { id: '14', name: 'IntelliJ IDEA', icon: <IntelliJ />, category: 'dev' },
  { id: '15', name: 'Eclipse', icon: <Eclipse />, category: 'dev' },
  { id: '16', name: 'Git', icon: <Git />, category: 'dev' },
  { id: '17', name: 'GitHub', icon: <GitHub />, category: 'dev' },
  { id: '18', name: 'React', icon: <ReactIcon />, category: 'dev' },
  { id: '19', name: 'Node.js', icon: <NodeJS />, category: 'dev' },
  { id: '20', name: 'Python', icon: <Python />, category: 'dev' },
  
  // CLOUD & DEVOPS
  { id: '21', name: 'Docker', icon: <Docker />, category: 'devops' },
  { id: '22', name: 'Kubernetes', icon: <Kubernetes />, category: 'devops' },
  { id: '23', name: 'AWS', icon: <AWS />, category: 'cloud' },
  { id: '24', name: 'Microsoft Azure', icon: <Azure />, category: 'cloud' },
  { id: '25', name: 'Google Cloud', icon: <GCP />, category: 'cloud' },
  
  // BASES DE DONNÉES
  { id: '26', name: 'MySQL', icon: <MySQL />, category: 'database' },
  { id: '27', name: 'PostgreSQL', icon: <PostgreSQL />, category: 'database' },
  { id: '28', name: 'MongoDB', icon: <MongoDB />, category: 'database' },
  
  // CMS
  { id: '29', name: 'WordPress', icon: <WordPress />, category: 'cms' },
  
  // CRM
  { id: '30', name: 'Salesforce', icon: <Salesforce />, category: 'crm' },
  
  // COLLABORATION
  { id: '31', name: 'Slack', icon: <Slack />, category: 'collab' },
  { id: '32', name: 'Microsoft Teams', icon: <Teams />, category: 'collab' },
  { id: '33', name: 'Zoom', icon: <Zoom />, category: 'collab' },
  
  // JEUX
  { id: '34', name: 'Unity', icon: <Unity />, category: 'game' },
  { id: '35', name: 'Unreal Engine', icon: <Unreal />, category: 'game' },
  
  // IA/ML
  { id: '36', name: 'TensorFlow', icon: <TensorFlow />, category: 'ai' },
  { id: '37', name: 'PyTorch', icon: <PyTorch />, category: 'ai' },
  
  // BI
  { id: '38', name: 'Power BI', icon: <PowerBI />, category: 'bi' },
  { id: '39', name: 'Tableau', icon: <Tableau />, category: 'bi' },
  
  // OFFICE (génériques avec couleurs officielles)
  { id: '40', name: 'Microsoft Word', icon: <GenericIcon text="W" bgColor="#2B5797" textColor="white" />, category: 'office' },
  { id: '41', name: 'Microsoft Excel', icon: <GenericIcon text="X" bgColor="#217346" textColor="white" />, category: 'office' },
  { id: '42', name: 'Microsoft PowerPoint', icon: <GenericIcon text="P" bgColor="#B7472A" textColor="white" />, category: 'office' },
  { id: '43', name: 'Microsoft Outlook', icon: <GenericIcon text="O" bgColor="#0078D4" textColor="white" />, category: 'office' },
  { id: '44', name: 'Google Docs', icon: <GenericIcon text="G" bgColor="#4285F4" textColor="white" />, category: 'office' },
  { id: '45', name: 'Google Sheets', icon: <GenericIcon text="G" bgColor="#0F9D58" textColor="white" />, category: 'office' },
  { id: '46', name: 'Google Slides', icon: <GenericIcon text="G" bgColor="#F4B400" textColor="white" />, category: 'office' },
  { id: '47', name: 'Notion', icon: <GenericIcon text="N" bgColor="#000000" textColor="white" />, category: 'office' },
  
  // AUDIO
  { id: '48', name: 'Ableton Live', icon: <GenericIcon text="A" bgColor="#000000" textColor="#FF8800" />, category: 'audio' },
  { id: '49', name: 'FL Studio', icon: <GenericIcon text="FL" bgColor="#000000" textColor="#FF3366" />, category: 'audio' },
  { id: '50', name: 'Logic Pro', icon: <GenericIcon text="L" bgColor="#000000" textColor="#999999" />, category: 'audio' },
  { id: '51', name: 'Pro Tools', icon: <GenericIcon text="PT" bgColor="#000000" textColor="#00FF00" />, category: 'audio' },
  { id: '52', name: 'Audacity', icon: <GenericIcon text="A" bgColor="#0000FF" textColor="#FFFF00" />, category: 'audio' },
  
  // ART
  { id: '53', name: 'Procreate', icon: <GenericIcon text="P" bgColor="#000000" textColor="#FFD700" />, category: 'art' },
  { id: '54', name: 'Clip Studio Paint', icon: <GenericIcon text="CSP" bgColor="#00A0E9" textColor="white" />, category: 'art' },
  { id: '55', name: 'Krita', icon: <GenericIcon text="K" bgColor="#3BB4FF" textColor="white" />, category: 'art' },
  { id: '56', name: 'GIMP', icon: <GenericIcon text="GIMP" bgColor="#5C5543" textColor="#FFD700" />, category: 'art' },
  
  // ANALYTICS
  { id: '57', name: 'Google Analytics', icon: <GenericIcon text="GA" bgColor="#F9AB00" textColor="white" />, category: 'analytics' },
  { id: '58', name: 'Google Tag Manager', icon: <GenericIcon text="GTM" bgColor="#2469DB" textColor="white" />, category: 'analytics' },
  
  // MARKETING
  { id: '59', name: 'HubSpot', icon: <GenericIcon text="HS" bgColor="#FF7A59" textColor="white" />, category: 'marketing' },
  { id: '60', name: 'Mailchimp', icon: <GenericIcon text="MC" bgColor="#FFE01B" textColor="black" />, category: 'marketing' },
  { id: '61', name: 'SEMrush', icon: <GenericIcon text="SEM" bgColor="#FF642D" textColor="white" />, category: 'marketing' },
  { id: '62', name: 'Ahrefs', icon: <GenericIcon text="AH" bgColor="#2B78E4" textColor="white" />, category: 'marketing' },
  
  // ERP
  { id: '63', name: 'SAP', icon: <GenericIcon text="SAP" bgColor="#0FAAFF" textColor="white" />, category: 'erp' },
  { id: '64', name: 'Oracle', icon: <GenericIcon text="OR" bgColor="#F80000" textColor="white" />, category: 'erp' },
  { id: '65', name: 'Odoo', icon: <GenericIcon text="O" bgColor="#7A1F7A" textColor="white" />, category: 'erp' },
  
  // LANGAGES DE PROGRAMMATION (catégorie dev)
  { id: '66', name: 'JavaScript', icon: <GenericIcon text="JS" bgColor="#F7DF1E" textColor="black" />, category: 'dev' },
  { id: '67', name: 'TypeScript', icon: <GenericIcon text="TS" bgColor="#3178C6" textColor="white" />, category: 'dev' },
  { id: '68', name: 'Java', icon: <GenericIcon text="J" bgColor="#007396" textColor="white" />, category: 'dev' },
  { id: '69', name: 'C#', icon: <GenericIcon text="C#" bgColor="#9B4F96" textColor="white" />, category: 'dev' },
  { id: '70', name: 'C++', icon: <GenericIcon text="C++" bgColor="#00599C" textColor="white" />, category: 'dev' },
  { id: '71', name: 'PHP', icon: <GenericIcon text="PHP" bgColor="#777BB3" textColor="white" />, category: 'dev' },
  { id: '72', name: 'Ruby', icon: <GenericIcon text="R" bgColor="#CC342D" textColor="white" />, category: 'dev' },
  { id: '73', name: 'Swift', icon: <GenericIcon text="S" bgColor="#F05138" textColor="white" />, category: 'dev' },
  { id: '74', name: 'Kotlin', icon: <GenericIcon text="K" bgColor="#7F52FF" textColor="white" />, category: 'dev' },
  { id: '75', name: 'Go', icon: <GenericIcon text="GO" bgColor="#00ADD8" textColor="white" />, category: 'dev' },
  { id: '76', name: 'Rust', icon: <GenericIcon text="R" bgColor="#000000" textColor="#CE422B" />, category: 'dev' },
  { id: '77', name: 'HTML', icon: <GenericIcon text="HTML" bgColor="#E34F26" textColor="white" />, category: 'dev' },
  { id: '78', name: 'CSS', icon: <GenericIcon text="CSS" bgColor="#1572B6" textColor="white" />, category: 'dev' },
  { id: '79', name: 'SQL', icon: <GenericIcon text="SQL" bgColor="#003B57" textColor="white" />, category: 'dev' },
  { id: '80', name: 'Bash', icon: <GenericIcon text="Bash" bgColor="#4EAA25" textColor="white" />, category: 'dev' }
];

// ÉLIMINATION DES DOUBLONS
const uniqueSoftware = Array.from(
  new Map(allSoftware.map(item => [`${item.name}-${item.category}`, item])).values()
);

// COMPOSANT PRINCIPAL
const SoftwareList: React.FC<SoftwareListProps> = ({ 
  projectId, 
  isAdmin, 
  compact = false,
  selectedSoftware = [],
  onClose = () => {},
  onSave = () => {}
}) => {
  const [selected, setSelected] = useState<Software[]>(selectedSoftware);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(50);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mise à jour quand selectedSoftware change
  useEffect(() => {
    setSelected(selectedSoftware);
  }, [selectedSoftware]);

  // Filtrage optimisé
  const filteredSoftware = useMemo(() => {
    let filtered = uniqueSoftware;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery]);

  // Affichage limité
  const displayedSoftware = useMemo(() => {
    return filteredSoftware.slice(0, displayCount);
  }, [filteredSoftware, displayCount]);

  // Gestion du scroll infini
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 200;
    
    if (bottom && displayCount < filteredSoftware.length && !isLoading) {
      setIsLoading(true);
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + 50, filteredSoftware.length));
        setIsLoading(false);
      }, 100);
    }
  }, [displayCount, filteredSoftware.length, isLoading]);

  // Réinitialisation du compteur
  useEffect(() => {
    setDisplayCount(50);
  }, [selectedCategory, searchQuery]);

  // Toggle sélection
  const toggleSoftware = useCallback((soft: Software) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === soft.id);
      return exists 
        ? prev.filter(s => s.id !== soft.id)
        : [...prev, soft];
    });
  }, []);

  // Sauvegarde
  const handleSave = useCallback(() => {
    onSave(selected);
    onClose();
  }, [selected, onSave, onClose]);

  // Réinitialisation des filtres
  const handleClearFilters = useCallback(() => {
    setSelectedCategory('all');
    setSearchQuery('');
  }, []);

  // Vue compacte
  if (compact) {
    return (
      <div className={styles.softwareCompact}>
        {selected.slice(0, 5).map(soft => (
          <div key={soft.id} className={styles.softwareIconBox}>
            {soft.icon}
          </div>
        ))}
        {selected.length > 5 && (
          <div className={styles.moreSoftware}>
            +{selected.length - 5}
          </div>
        )}
      </div>
    );
  }

  // Vue modale (le reste du code reste identique)
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
            <p>
              {selected.length} logiciel{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Recherche */}
        <div className={styles.searchBar}>
          <div className={styles.searchInputContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un logiciel..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filtres */}
        <div className={styles.categoryFilters}>
          {CATEGORIES.map(cat => {
            const count = cat.key === 'all' 
              ? uniqueSoftware.length 
              : uniqueSoftware.filter(s => s.category === cat.key).length;
            
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

        {/* Liste */}
        <div 
          className={styles.modalBody} 
          onScroll={handleScroll}
          ref={scrollRef}
        >
          {filteredSoftware.length > 0 ? (
            <>
              {searchQuery && (
                <div style={{ marginBottom: '16px', color: 'var(--light)', opacity: 0.7 }}>
                  {filteredSoftware.length} résultat{filteredSoftware.length > 1 ? 's' : ''} pour "{searchQuery}"
                </div>
              )}
              
              <div className={styles.softwareGrid}>
                {displayedSoftware.map(soft => {
                  const isSelected = selected.some(s => s.id === soft.id);
                  
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
                      <div className={styles.softwareCategory}>
                        {CATEGORIES.find(c => c.key === soft.category)?.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {isLoading && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--primary)' }}>
                  Chargement...
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <Wrench size={48} />
              <h3>Aucun logiciel trouvé</h3>
              <p>Essayez une autre catégorie ou modifiez votre recherche</p>
              <button onClick={handleClearFilters} className={styles.categoryBtn}>
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

export default React.memo(SoftwareList);