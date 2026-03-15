"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Users, Map, Menu, Images, Package, Clock, FileText, Eye } from 'lucide-react';
import {
  isUserInProject,
  FullProject,
  incrementProjectViews,
} from '@/utils/projet-api';
import { loadRoadmapPhases, loadRoadmapCanvas, mergeCanvasIntoPhases } from '@/utils/roadmap-api';
import type { RoadmapArrow, RichPhase } from '@/components/portfolio/projet-en-cours/Editor/navigation/RoadmapEditor';

import Overview from './navigation/Overview';
import Galerie from './navigation/Galerie';
import Ressources from './navigation/Ressources';
import Equipe from './navigation/Equipe';
import Roadmap from './navigation/Roadmap';
import Progression from './navigation/Progression';
import Documentation from './navigation/Documentation';
import styles from './ProjetDetail.module.css';

type Project = FullProject;

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
  { id: 'overview',      label: 'Overview',      Icon: Eye      },
  { id: 'galerie',       label: 'Galerie',        Icon: Images   },
  { id: 'ressources',    label: 'Ressources',     Icon: Package  },
  { id: 'roadmap',       label: 'Roadmap',        Icon: Map      },
  { id: 'progression',   label: 'Progression',    Icon: Clock    },
  { id: 'equipe',        label: 'Équipe',         Icon: Users    },
  { id: 'documentation', label: 'Documentation',  Icon: FileText },
];

const ProjetDetail: React.FC<ProjetDetailProps> = ({
  project,
  teamMembers,
  currentUser,
  userTeamProfile,
  onBack,
  onEditProfile,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isInTeam, setIsInTeam] = useState(false);
  const [views, setViews] = useState(0);
  const [hasIncremented, setHasIncremented] = useState(false);
  const [richPhases, setRichPhases] = useState<RichPhase[]>([]);
  const [roadmapArrows, setRoadmapArrows] = useState<RoadmapArrow[]>([]);
  // PERF: plus besoin de fullProjectData — le projet complet arrive directement via props
  // depuis page.tsx (qui a déjà appelé getFullProject et mis en cache).
  // isLoading ne bloque plus sur getFullProject, seulement sur la roadmap.
  const [roadmapLoaded, setRoadmapLoaded] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project?.id) return;

    // Incrémenter les vues (fire-and-forget, ne bloque pas l'affichage)
    if (currentUser && !hasIncremented) {
      incrementViews(project.id);
      setHasIncremented(true);
    }

    // Statut équipe (synchrone, pas de réseau)
    if (currentUser) {
      setIsInTeam(isUserInProject(project, currentUser.uid));
    }

    // Vues : disponibles directement depuis les props (déjà chargées par getAllProjects)
    setViews(project.views ?? 0);

    // PERF: roadmap chargée en parallèle, sans bloquer l'affichage du modal.
    // Le modal s'ouvre immédiatement, la roadmap apparaît dès qu'elle est prête.
    loadRoadmapData(project.id);
  }, [project?.id]);

  const loadRoadmapData = async (projectId: string) => {
    try {
      // phases + canvas en parallèle
      const [phases, canvas] = await Promise.all([
        loadRoadmapPhases(projectId).catch(() => []),
        loadRoadmapCanvas(projectId).catch(() => null),
      ]);
      setRichPhases(mergeCanvasIntoPhases(phases || [], canvas));
      setRoadmapArrows(canvas?.arrows || []);
    } catch (error) {
      console.error('Erreur chargement roadmap:', error);
    } finally {
      setRoadmapLoaded(true);
    }
  };

  const incrementViews = async (projectId: string) => {
    try {
      await incrementProjectViews(projectId);
      setViews((prev) => prev + 1);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors de l'incrémentation des vues:", error);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const formatDate = (date: any) => {
    if (!date) return '—';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };

  const handleViewAllMembers = () => {
    const key = project.slug || project.id;
    if (key) router.push(`/portfolio/projet-en-cours/team/view?project=${key}`);
  };

  const handleEditProfileClick = () => {
    const key = project.slug || project.id;
    if (key && currentUser) router.push(`/portfolio/projet-en-cours/team/edit?project=${key}`);
  };

  const selectTab = (tab: TabType) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  // PERF: plus de spinner bloquant — le modal s'affiche immédiatement avec les données
  // déjà disponibles dans les props. La roadmap se charge en arrière-plan.
  const carouselImages: string[] = project.carouselImages || [];

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
            <Ressources software={project.software || []} />
          </div>

          <div className={`${styles.tabContent} ${activeTab === 'roadmap' ? styles.visible : ''}`}>
            {/* Afficher la roadmap dès qu'elle est chargée, sinon un loader léger */}
            {roadmapLoaded
              ? <Roadmap phases={richPhases} arrows={roadmapArrows} />
              : (
                <div className={styles.tabLoadingHint}>
                  <div className={styles.loadingSpinner} />
                </div>
              )
            }
          </div>

          <div className={`${styles.tabContent} ${activeTab === 'progression' ? styles.visible : ''}`}>
            <Progression
              projectId={project.id!}
              projectTitle={project.title}
              currentUser={currentUser}
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
            <Documentation docLinks={project.docLinks || []} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjetDetail;