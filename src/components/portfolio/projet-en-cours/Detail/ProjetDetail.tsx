"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Users, Map, Menu, Images, Package, Clock, FileText, Eye } from 'lucide-react';
import {
  isUserInProject,
  Project as FirebaseProject,
  incrementProjectViews
} from '@/utils/projet-api';
import { loadRoadmapCanvas, mergeCanvasIntoPhases } from '@/utils/roadmap-api';
import type { RoadmapArrow, RichPhase } from '@/components/portfolio/projet-en-cours/Editor/navigation/RoadmapEditor';
import { useTheme } from '@/utils/ThemeProvider'; // Import si nécessaire

import Overview from './navigation/Overview';
import Galerie from './navigation/Galerie';
import Ressources from './navigation/Ressources';
import Equipe from './navigation/Equipe';
import Roadmap from './navigation/Roadmap';
import Progression from './navigation/Progression';
import Documentation from './navigation/Documentation';
import styles from './ProjetDetail.module.css';

type Project = FirebaseProject;

type ProjectTeamMember = {
  id?: string;
  userId: string;
  projectId: string;
  image: string;
  firstName: string;
  lastName: string;
  age: number;
  agePublic: boolean;
  email: string;
  phone: string;
  contacts: any[];
  roles: string[];
  equipment: any;
  location: {
    country: string;
    city: string;
    district: string;
    districtPublic: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
};

interface ProjetDetailProps {
  project: Project;
  teamMembers: ProjectTeamMember[];
  currentUser: any;
  userTeamProfile: any;
  onBack: () => void;
  onEditProfile: () => void;
}

type TabType = 'overview' | 'galerie' | 'ressources' | 'roadmap' | 'progression' | 'equipe' | 'documentation';

const TABS: { id: TabType; label: string; Icon: React.FC<any> }[] = [
  { id: 'overview',       label: 'Overview',       Icon: Eye       },
  { id: 'galerie',        label: 'Galerie',         Icon: Images    },
  { id: 'ressources',     label: 'Ressources',      Icon: Package   },
  { id: 'roadmap',        label: 'Roadmap',         Icon: Map       },
  { id: 'progression',    label: 'Progression',     Icon: Clock     },
  { id: 'equipe',         label: 'Équipe',          Icon: Users     },
  { id: 'documentation',  label: 'Documentation',   Icon: FileText  },
];

const ProjetDetail: React.FC<ProjetDetailProps> = ({
  project,
  teamMembers,
  currentUser,
  userTeamProfile,
  onBack,
  onEditProfile
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isInTeam, setIsInTeam] = useState(false);
  const [views, setViews] = useState(project.views || 0);
  const [hasIncremented, setHasIncremented] = useState(false);
  // Phases avec positions canvas + flèches (chargés depuis la sous-collection)
  const [richPhases, setRichPhases]   = useState<RichPhase[]>([]);
  const [roadmapArrows, setRoadmapArrows] = useState<RoadmapArrow[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const carouselImages: string[] = project.carouselImages || [];

  useEffect(() => {
    if (currentUser && project) {
      setIsInTeam(isUserInProject(project, currentUser.uid));
      
      if (!hasIncremented) {
        incrementViews();
        setHasIncremented(true);
      }
    }
  }, [currentUser, project, hasIncremented]);

  // Charger les données canvas (positions phases + flèches) depuis la sous-collection
  useEffect(() => {
    if (!project?.id) {
      // Pas d'id → init positions simples sans canvas
      const rawPhases = (project as any).roadmapPhases || [];
      setRichPhases(mergeCanvasIntoPhases(rawPhases, null));
      setRoadmapArrows([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const rawPhases = (project as any).roadmapPhases || [];
      try {
        const canvas = await loadRoadmapCanvas(project.id!);
        if (!cancelled) {
          setRichPhases(mergeCanvasIntoPhases(rawPhases, canvas));
          setRoadmapArrows(canvas?.arrows || []);
        }
      } catch {
        if (!cancelled) {
          setRichPhases(mergeCanvasIntoPhases(rawPhases, null));
          setRoadmapArrows([]);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [project]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const incrementViews = async () => {
    if (!project.id) return;
    try {
      await incrementProjectViews(project.id);
      setViews((prev) => prev + 1);
    } catch (error) {
      // Ne pas afficher l'erreur dans la console en production
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors de l'incrémentation des vues:", error);
      }
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '—';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };

  const handleViewAllMembers = () => {
    const key = project.slug || project.id;
    if (key) router.push(`/portfolio/team/view?project=${key}`);
  };

  const handleEditProfileClick = () => {
    const key = project.slug || project.id;
    if (key && currentUser) router.push(`/portfolio/team?project=${key}`);
  };

  const selectTab = (tab: TabType) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onBack}>
      <motion.div
        className={styles.modalContent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOPBAR */}
        <div className={styles.modalHeader}>
          <img
            src={project.image || '/default-project.jpg'}
            alt={project.title}
            className={styles.projectThumb}
          />
          <h1 className={styles.projectTitle}>{project.title}</h1>

          <div className={styles.separator} />

          {/* Onglets DESKTOP */}
          <div className={styles.tabsContainer}>
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`${styles.tabButton} ${activeTab === id ? styles.active : ''}`}
                onClick={() => selectTab(id)}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Hamburger MOBILE */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              className={`${styles.hamburgerBtn} ${menuOpen ? styles.open : ''}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Navigation"
            >
              <Menu size={20} />
            </button>

            <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}>
              <button className={styles.mobileMenuClose} onClick={() => setMenuOpen(false)}>
                <X size={18} />
              </button>
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={`${styles.mobileTabBtn} ${activeTab === id ? styles.active : ''}`}
                  onClick={() => selectTab(id)}
                >
                  <Icon size={22} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button className={styles.closeBtn} onClick={onBack}>
            <X size={17} />
          </button>
        </div>

        {/* ZONE CONTENU */}
        <div className={styles.contentArea}>
          <div className={`${styles.tabContent} ${activeTab === 'overview' ? styles.visible : ''}`}>
            <Overview project={project} views={views} formatDate={formatDate} />
          </div>

          <div className={`${styles.tabContent} ${activeTab === 'galerie' ? styles.visible : ''}`}>
            <Galerie images={carouselImages} projectTitle={project.title} />
          </div>

          <div className={`${styles.tabContent} ${activeTab === 'ressources' ? styles.visible : ''}`}>
            <Ressources software={(project as any).software || []} />
          </div>

          <div className={`${styles.tabContent} ${activeTab === 'roadmap' ? styles.visible : ''}`}>
            <Roadmap phases={richPhases} arrows={roadmapArrows} />
          </div>

          <div className={`${styles.tabContent} ${activeTab === 'progression' ? styles.visible : ''}`}>
            <Progression
              kanbanBoardId={(project as any).kanbanBoardId}
              projectTitle={project.title}
            />
          </div>

          <div className={`${styles.tabContent} ${activeTab === 'equipe' ? styles.visible : ''}`}>
            <Equipe
              project={project}
              teamMembers={teamMembers}
              currentUser={currentUser}
              userTeamProfile={userTeamProfile}
              isInTeam={isInTeam}
              onViewAllMembers={handleViewAllMembers}
              onCreateProfile={handleEditProfileClick}
              onEditProfile={handleEditProfileClick}
            />
          </div>

          <div className={`${styles.tabContent} ${activeTab === 'documentation' ? styles.visible : ''}`}>
            <Documentation docLinks={(project as any).docLinks || []} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjetDetail;