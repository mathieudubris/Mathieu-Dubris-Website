"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  X,
  Info,
  Users,
  Wrench,
  Map,
  Menu,
  Images
} from 'lucide-react';
import {
  isUserInProject,
  Project as FirebaseProject,
  incrementProjectViews
} from '@/utils/firebase-api';

import APropos from './APropos';
import Membres from './Membres';
import Logiciels from './Logiciels';
import Roadmap from './Roadmap';
import Galerie from './Galerie';
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

type TabType = 'apropos' | 'roadmap' | 'membres' | 'logiciels' | 'galerie';

const TABS: { id: TabType; label: string; Icon: React.FC<any> }[] = [
  { id: 'apropos',   label: 'A propos', Icon: Info   },
  { id: 'roadmap',  label: 'Roadmaps', Icon: Map    },
  { id: 'membres',  label: 'Membres',  Icon: Users  },
  { id: 'logiciels',label: 'Logiciel', Icon: Wrench },
  { id: 'galerie',  label: 'Galerie',  Icon: Images },
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
  const [activeTab, setActiveTab] = useState<TabType>('apropos');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isInTeam, setIsInTeam] = useState(false);
  const [views, setViews] = useState(project.views || 0);
  const menuRef = useRef<HTMLDivElement>(null);

  const carouselImages: string[] = project.carouselImages || [];

  useEffect(() => {
    if (currentUser && project) {
      setIsInTeam(isUserInProject(project, currentUser.uid));
      incrementViews();
    }
  }, [currentUser, project]);

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
      console.error("Erreur lors de l'incrémentation des vues:", error);
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
        {/* ── TOPBAR ── */}
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

        {/* ── ZONE CONTENU ── */}
        <div className={styles.contentArea}>
          <div className={`${styles.tabContent} ${activeTab === 'apropos' ? styles.visible : ''}`}>
            <APropos project={project} views={views} formatDate={formatDate} />
          </div>
          <div className={`${styles.tabContent} ${activeTab === 'roadmap' ? styles.visible : ''}`}>
            <Roadmap />
          </div>
          <div className={`${styles.tabContent} ${activeTab === 'membres' ? styles.visible : ''}`}>
            <Membres
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
          <div className={`${styles.tabContent} ${activeTab === 'logiciels' ? styles.visible : ''}`}>
            <Logiciels software={project.software || []} />
          </div>
          <div className={`${styles.tabContent} ${activeTab === 'galerie' ? styles.visible : ''}`}>
            <Galerie images={carouselImages} projectTitle={project.title} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjetDetail;