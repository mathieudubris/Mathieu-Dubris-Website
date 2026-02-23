"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  X, 
  ChevronRight,
  ChevronLeft,
  Info,
  Users,
  Wrench
} from 'lucide-react';
import { 
  isUserInProject, 
  Project as FirebaseProject,
  getProjectTeamMembers,
  getUserProjectTeamProfile,
  incrementProjectViews
} from '@/utils/firebase-api';

import APropos from './APropos';
import Membres from './Membres';
import Logiciels from './Logiciels';
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

type TabType = 'apropos' | 'membres' | 'logiciels';

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
  const [isInTeam, setIsInTeam] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [views, setViews] = useState(project.views || 0);

  // Images du carousel
  const carouselImages = [
    project.image || '/default-project.jpg',
    ...(project.carouselImages || [])
  ];

  useEffect(() => {
    if (currentUser && project) {
      setIsInTeam(isUserInProject(project, currentUser.uid));
      incrementViews();
    }
  }, [currentUser, project]);

  // Carousel automatique
  useEffect(() => {
    if (carouselImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [carouselImages.length]);

  const incrementViews = async () => {
    if (!project.id) return;
    try {
      await incrementProjectViews(project.id);
      setViews((prev) => prev + 1);
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation des vues:', error);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const handleViewAllMembers = () => {
    if (project.slug) {
      router.push(`/portfolio/team/view?project=${project.slug}`);
    } else if (project.id) {
      router.push(`/portfolio/team/view?project=${project.id}`);
    }
  };

  const handleEditProfileClick = () => {
    if (project.slug && currentUser) {
      router.push(`/portfolio/team?project=${project.slug}`);
    } else if (project.id && currentUser) {
      router.push(`/portfolio/team?project=${project.id}`);
    }
  };

  const handleCreateProfile = () => {
    handleEditProfileClick(); // Même action pour créer ou modifier
  };

  return (
    <div className={styles.modalOverlay} onClick={onBack}>
      <motion.div 
        className={styles.modalContent}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton de fermeture */}
        <button className={styles.closeBtn} onClick={onBack}>
          <X size={24} />
        </button>

        {/* Header avec CAROUSEL */}
        <div className={styles.modalHeader}>
          <div className={styles.carouselWrapper}>
            {carouselImages.map((img, index) => (
              <div 
                key={index}
                className={`${styles.carouselSlide} ${index === currentSlide ? styles.active : ''}`}
              >
                <img 
                  src={img} 
                  alt={`${project.title} - Image ${index + 1}`} 
                  className={styles.carouselImage} 
                />
              </div>
            ))}
            
            <div className={styles.imageOverlay}></div>

            {/* Flèches de navigation */}
            {carouselImages.length > 1 && (
              <>
                <button 
                  className={`${styles.carouselArrow} ${styles.prev}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  className={`${styles.carouselArrow} ${styles.next}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Dots de navigation */}
            {carouselImages.length > 1 && (
              <div className={styles.carouselControls}>
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.carouselDot} ${index === currentSlide ? styles.active : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(index);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.headerContent}>
            <div className={styles.container}>
              <h1 className={styles.projectTitle}>{project.title}</h1>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'apropos' ? styles.active : ''}`}
            onClick={() => setActiveTab('apropos')}
          >
            <Info size={16} />
            <span>À propos</span>
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'membres' ? styles.active : ''}`}
            onClick={() => setActiveTab('membres')}
          >
            <Users size={16} />
            <span>Membres ({teamMembers.length})</span>
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'logiciels' ? styles.active : ''}`}
            onClick={() => setActiveTab('logiciels')}
          >
            <Wrench size={16} />
            <span>Logiciels</span>
          </button>
        </div>

        {/* Contenu selon l'onglet actif */}
        <div className={styles.tabContent}>
          {activeTab === 'apropos' && (
            <APropos 
              project={project}
              views={views}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'membres' && (
            <Membres
              project={project}
              teamMembers={teamMembers}
              currentUser={currentUser}
              userTeamProfile={userTeamProfile}
              isInTeam={isInTeam}
              onViewAllMembers={handleViewAllMembers}
              onCreateProfile={handleCreateProfile}
              onEditProfile={handleEditProfileClick}
            />
          )}

          {activeTab === 'logiciels' && (
            <Logiciels software={project.software || []} />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProjetDetail;