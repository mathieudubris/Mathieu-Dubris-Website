"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Image as ImageIcon, Map, Star, Users, Package, Clock, FileText, Eye, AlertCircle } from 'lucide-react';
import { isAdmin, getAllUsers } from '@/utils/firebase-api';
import { 
  createProject, 
  updateProject, 
  generateSlug, 
  getFullProject,
  Project as FirebaseProject 
} from '@/utils/projet-api';
import { saveRoadmapPhases, saveRoadmapCanvas, loadRoadmapPhases, loadRoadmapCanvas, mergeCanvasIntoPhases, stripCanvasData } from '@/utils/roadmap-api';
import { Timestamp } from 'firebase/firestore';

import OverviewEditor from './navigation/OverviewEditor';
import GalerieEditor from './navigation/GalerieEditor';
import type { MediaItem } from './navigation/GalerieEditor';
import RessourcesEditor from './navigation/RessourcesEditor';
import EquipeEditor from './navigation/EquipeEditor';
import RoadmapEditor from './navigation/RoadmapEditor';
import type { RoadmapArrow, RichPhase } from './navigation/RoadmapEditor';
import ProgressionEditor from './navigation/ProgressionEditor';
import DocumentationEditor from './navigation/DocumentationEditor';
import NouveauteModal from '@/components/NouveauteModal/NouveauteModal';

import styles from './ProjetEditor.module.css';

type Project = FirebaseProject;
type TabType = 'overview' | 'galerie' | 'ressources' | 'roadmap' | 'progression' | 'equipe' | 'documentation';

const TABS: { id: TabType; label: string; Icon: React.FC<any> }[] = [
  { id: 'overview',       label: 'Overview',       Icon: Eye       },
  { id: 'galerie',        label: 'Galerie',         Icon: ImageIcon },
  { id: 'ressources',     label: 'Ressources',      Icon: Package   },
  { id: 'roadmap',        label: 'Roadmap',         Icon: Map       },
  { id: 'progression',    label: 'Progression',     Icon: Clock     },
  { id: 'equipe',         label: 'Équipe',          Icon: Users     },
  { id: 'documentation',  label: 'Documentation',   Icon: FileText  },
];

interface ProjetEditorProps {
  project: Project | null;
  onClose: () => void;
  onSave: () => void;
  currentUser: any;
}

const ProjetEditor: React.FC<ProjetEditorProps> = ({ project, onClose, onSave, currentUser }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  // PERF: isLoading ne bloque plus l'affichage du panel — l'UI s'ouvre immédiatement
  // et les champs se remplissent dès que les données arrivent (~300-600ms après)
  const [isLoading, setIsLoading] = useState(!!project?.id);

  // Champs principaux (document projet)
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'early_access'>('public');

  // Overview
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [objective, setObjective] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [status, setStatus] = useState('in_progress');

  // Media
  const [image, setImage] = useState('');
  const [carouselImages, setCarouselImages] = useState<MediaItem[]>([]);

  // Software
  const [software, setSoftware] = useState<any[]>([]);

  // Roadmap
  const [roadmapPhases, setRoadmapPhases] = useState<any[]>([]);
  const [roadmapArrows, setRoadmapArrows] = useState<RoadmapArrow[]>([]);

  // Stats
  const [views, setViews] = useState(0);
  const [progress, setProgress] = useState(0);
  const [kanbanBoardId, setKanbanBoardId] = useState<string | null>(null);

  // Documentation
  const [docLinks, setDocLinks] = useState<any[]>([]);

  // Dates
  const [createdAtEditable, setCreatedAtEditable] = useState<any>(null);
  const [updatedAtEditable, setUpdatedAtEditable] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showNouveauteModal, setShowNouveauteModal] = useState(false);

  // Pour nouveau projet (pas d'id), initialiser immédiatement sans loader
  useEffect(() => {
    if (!project?.id) {
      setTitle('');
      setSlug('');
      setTeamMembers(currentUser?.uid ? [currentUser.uid] : []);
      setVisibility('public');
      setDescription('');
      setProjectType('');
      setObjective('');
      setTargetAudience('');
      setStatus('in_progress');
      setImage('');
      setCarouselImages([]);
      setSoftware([]);
      setRoadmapPhases([]);
      setRoadmapArrows([]);
      setViews(0);
      setProgress(0);
      setKanbanBoardId(null);
      setDocLinks([]);
      setCreatedAtEditable(null);
      setUpdatedAtEditable(null);
      setIsLoading(false);
      // Charger les users en arrière-plan
      getAllUsers().then(setAllUsers).catch(console.error);
      return;
    }

    // PERF: Pour un projet existant — charger tout en parallèle en une seule vague
    // L'UI s'ouvre immédiatement, les champs se peuplent dès que les données arrivent
    setIsLoading(true);

    Promise.all([
      getAllUsers().catch(() => []),
      getFullProject(project.id).catch(() => null),
      loadRoadmapPhases(project.id).catch(() => null),
      loadRoadmapCanvas(project.id).catch(() => null),
    ]).then(([users, fullProject, phases, canvas]) => {
      setAllUsers(users);

      if (fullProject) {
        setTitle(fullProject.title || '');
        setSlug(fullProject.slug || generateSlug(fullProject.title || ''));
        setTeamMembers(fullProject.teamMembers || []);
        setVisibility(fullProject.visibility || 'public');
        setDescription(fullProject.description || '');
        setProjectType(fullProject.projectType || '');
        setObjective(fullProject.objective || '');
        setTargetAudience(fullProject.targetAudience || '');
        setStatus(fullProject.status || 'in_progress');
        setImage(fullProject.image || '');
        setCarouselImages(
          (fullProject.carouselImages || []).map((item: string | MediaItem) =>
            typeof item === 'string' ? { url: item, type: 'image' as const } : item
          )
        );
        setSoftware(fullProject.software || []);
        setViews(fullProject.views || 0);
        setProgress(fullProject.progress || 0);
        setKanbanBoardId(fullProject.kanbanBoardId || null);
        setDocLinks(fullProject.docLinks || []);
        setCreatedAtEditable(fullProject.createdAt || null);
        setUpdatedAtEditable(fullProject.updatedAt || null);
      }

      // Roadmap — fusionner phases + canvas
      const richPhases = mergeCanvasIntoPhases(phases || [], canvas);
      setRoadmapPhases(richPhases);
      setRoadmapArrows(canvas?.arrows || []);
    }).finally(() => {
      setIsLoading(false);
    });
  }, [project, currentUser]);

  if (!isAdmin(currentUser?.email)) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <motion.div
          className={styles.errorPanel}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <AlertCircle size={48} className={styles.errorIcon} />
          <h3>Accès non autorisé</h3>
          <p>Seul l'administrateur peut créer ou modifier des projets.</p>
          <button onClick={onClose} className={styles.closeErrorBtn}>Fermer</button>
        </motion.div>
      </div>
    );
  }

  const enrichMembers = (userIds: string[]) => {
    return userIds.map(userId => {
      const user = allUsers.find(u => u.uid === userId);
      return user ? {
        userId: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      } : null;
    }).filter(Boolean);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const enrichedMembers = enrichMembers(teamMembers);
      const finalSlug = slug.trim() || generateSlug(title.trim());

      const phasesForProject = Array.isArray(roadmapPhases) && roadmapPhases.length > 0
        ? stripCanvasData(roadmapPhases as RichPhase[])
        : [];

      const projectData = {
        title: title.trim(),
        slug: finalSlug,
        teamMembers,
        visibility,
        createdBy: project?.createdBy || currentUser.uid,
        createdAt: createdAtEditable || (project?.createdAt || Timestamp.now()),
        updatedAt: updatedAtEditable || Timestamp.now(),
      };

      const overviewData = {
        description: description.trim(),
        projectType,
        objective,
        targetAudience,
        status,
        features: (project as any)?.features || [],
      };

      const mediaData = {
        image: image || '/default-project.jpg',
        carouselImages: carouselImages.map(item => item.url),
      };

      const softwareData = {
        items: software,
      };

      const statsData = {
        views,
        progress,
        kanbanBoardId,
      };

      const docLinksData = {
        links: docLinks,
      };

      let savedProjectId: string | undefined = project?.id;

      if (project?.id) {
        await updateProject(project.id, {
          ...projectData,
          ...overviewData,
          ...mediaData,
          software: softwareData.items,
          ...statsData,
          docLinks: docLinksData.links,
        });
      } else {
        savedProjectId = await createProject({
          ...projectData,
          ...overviewData,
          ...mediaData,
          software: softwareData.items,
          ...statsData,
          docLinks: docLinksData.links,
          roadmapPhases: phasesForProject,
        });
      }

      if (savedProjectId) {
        if (phasesForProject) {
          await saveRoadmapPhases(savedProjectId, phasesForProject);
        }
        if (roadmapPhases && roadmapArrows) {
          await saveRoadmapCanvas(savedProjectId, {
            phases: roadmapPhases as RichPhase[],
            arrows: roadmapArrows,
          });
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectLink = '/portfolio/projet-en-cours';
  const enrichedMembersForModal = enrichMembers(teamMembers);

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.editorPanel}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.editorHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>
              {project ? 'Modifier le projet' : 'Nouveau projet'}
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
              className={styles.publishBtnTop}
            >
              <Send size={16} />
              {isSubmitting ? "Enregistrement..." : (project ? "Mettre à jour" : "Créer")}
            </button>

            {project?.id && (
              <button
                type="button"
                className={styles.nouveauteBtn}
                onClick={() => setShowNouveauteModal(true)}
                title="Ajouter / gérer dans la section Nouveautés"
              >
                <Star size={15} />
                Nouveauté
              </button>
            )}
          </div>

          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {/* Onglets */}
        <div className={styles.tabsContainer}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`${styles.tabButton} ${activeTab === id ? styles.active : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <div className={styles.editorForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* PERF: Skeleton léger inline — le panel est déjà visible, seul le contenu
              des champs est masqué le temps du chargement (~300ms max) */}
          {isLoading ? (
            <div className={styles.inlineLoadingWrapper}>
              <div className={styles.loadingSpinner} />
              <span className={styles.inlineLoadingText}>Chargement des données...</span>
            </div>
          ) : (
            <div className={styles.tabContent}>
              {activeTab === 'overview' && (
                <OverviewEditor
                  title={title}
                  slug={slug}
                  description={description}
                  projectType={projectType}
                  objective={objective}
                  targetAudience={targetAudience}
                  status={status}
                  createdAt={createdAtEditable}
                  updatedAt={updatedAtEditable}
                  onTitleChange={setTitle}
                  onSlugChange={setSlug}
                  onDescriptionChange={setDescription}
                  onProjectTypeChange={setProjectType}
                  onObjectiveChange={setObjective}
                  onTargetAudienceChange={setTargetAudience}
                  onStatusChange={setStatus}
                  onCreatedAtChange={setCreatedAtEditable}
                  onUpdatedAtChange={setUpdatedAtEditable}
                  views={views}
                  onViewsChange={setViews}
                  isNewProject={!project}
                />
              )}

              {activeTab === 'galerie' && (
                <GalerieEditor
                  mainImage={image}
                  carouselImages={carouselImages}
                  onMainImageChange={setImage}
                  onCarouselImagesChange={setCarouselImages}
                />
              )}

              {activeTab === 'ressources' && (
                <RessourcesEditor
                  software={software}
                  onSoftwareChange={setSoftware}
                />
              )}

              {activeTab === 'roadmap' && (
                <RoadmapEditor
                  phases={roadmapPhases}
                  onPhasesChange={setRoadmapPhases}
                  arrows={roadmapArrows}
                  onArrowsChange={setRoadmapArrows}
                />
              )}

              {activeTab === 'progression' && (
                <ProgressionEditor
                  projectId={project?.id || ''}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'equipe' && (
                <EquipeEditor
                  teamMembers={teamMembers}
                  allUsers={allUsers}
                  onTeamMembersChange={setTeamMembers}
                />
              )}

              {activeTab === 'documentation' && (
                <DocumentationEditor
                  docLinks={docLinks}
                  onDocLinksChange={setDocLinks}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>

      {showNouveauteModal && project?.id && (
        <NouveauteModal
          sourceId={project.id}
          type="project"
          title={title}
          description={description.slice(0, 160)}
          image={image || '/default-project.jpg'}
          link={projectLink}
          members={enrichedMembersForModal}
          software={software}
          progress={progress}
          onClose={() => setShowNouveauteModal(false)}
        />
      )}
    </motion.div>
  );
};

export default ProjetEditor;