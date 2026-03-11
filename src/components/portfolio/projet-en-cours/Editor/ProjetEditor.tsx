"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Image as ImageIcon, Map, Star, Users, Package, Clock, FileText, Eye, AlertCircle } from 'lucide-react';
import { isAdmin, getAllUsers } from '@/utils/firebase-api';
import { createProject, updateProject, generateSlug, deleteProject, Project as FirebaseProject } from '@/utils/projet-api';
import { saveRoadmapCanvas, loadRoadmapCanvas, mergeCanvasIntoPhases, stripCanvasData } from '@/utils/roadmap-api';
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

  // Champs principaux
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [carouselImages, setCarouselImages] = useState<MediaItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [software, setSoftware] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'early_access'>('public');
  const [views, setViews] = useState(0);
  const [projectType, setProjectType] = useState('');
  const [objective, setObjective] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [status, setStatus] = useState('in_progress');
  const [createdAtEditable, setCreatedAtEditable] = useState<any>(null);
  const [updatedAtEditable, setUpdatedAtEditable] = useState<any>(null);

  // Champs projet avancés
  const [roadmapPhases, setRoadmapPhases] = useState<any[]>([]);
  const [roadmapArrows, setRoadmapArrows] = useState<RoadmapArrow[]>([]);
  const [kanbanBoardId, setKanbanBoardId] = useState<string | null>(null);
  const [docLinks, setDocLinks] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showNouveauteModal, setShowNouveauteModal] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      // 1. Charger les utilisateurs
      try {
        const users = await getAllUsers();
        setAllUsers(users);
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
      }

      if (project) {
        // 2. Champs principaux
        setTitle(project.title);
        setSlug(project.slug || generateSlug(project.title));
        setDescription(project.description);
        setImage(project.image || '');
        setCarouselImages(
          (project.carouselImages || []).map((item: string | MediaItem) =>
            typeof item === 'string' ? { url: item, type: 'image' as const } : item
          )
        );
        setProgress(project.progress || 0);
        setSoftware(project.software || []);
        setTeamMembers(project.teamMembers || []);
        setVisibility(project.visibility || 'public');
        setViews(project.views || 0);
        setProjectType((project as any).projectType || '');
        setObjective((project as any).objective || '');
        setTargetAudience((project as any).targetAudience || '');
        setStatus((project as any).status || 'in_progress');
        setCreatedAtEditable(project.createdAt || null);
        setUpdatedAtEditable(project.updatedAt || null);
        setKanbanBoardId((project as any).kanbanBoardId || null);
        setDocLinks((project as any).docLinks || []);

        // 3. Charger les données canvas (positions + flèches) depuis la sous-collection
        const rawPhases = (project as any).roadmapPhases || [];
        if (project.id) {
          try {
            const canvas = await loadRoadmapCanvas(project.id);
            const richPhases = mergeCanvasIntoPhases(rawPhases, canvas);
            setRoadmapPhases(richPhases);
            setRoadmapArrows(canvas?.arrows || []);
          } catch {
            setRoadmapPhases(rawPhases);
            setRoadmapArrows([]);
          }
        } else {
          setRoadmapPhases(rawPhases);
          setRoadmapArrows([]);
        }
      } else {
        // Nouveau projet
        setTitle('');
        setSlug('');
        setDescription('');
        setImage('');
        setCarouselImages([]);
        setProgress(0);
        setSoftware([]);
        setTeamMembers(currentUser?.uid ? [currentUser.uid] : []);
        setVisibility('public');
        setViews(0);
        setProjectType('');
        setObjective('');
        setTargetAudience('');
        setStatus('in_progress');
        setCreatedAtEditable(null);
        setUpdatedAtEditable(null);
        setRoadmapPhases([]);
        setRoadmapArrows([]);
        setKanbanBoardId(null);
        setDocLinks([]);
      }
    };

    loadAll();
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

      // Séparer les données canvas des données "pures"
      const phasesForProject = stripCanvasData(roadmapPhases as RichPhase[]);

      const projectData: Omit<Project, 'id'> = {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim(),
        image: image || '/default-project.jpg',
        carouselImages: carouselImages.map(item => item.url),
        progress,
        software,
        features: [],
        members: enrichedMembers,
        createdBy: currentUser.uid,
        createdAt: createdAtEditable || (project ? project.createdAt : Timestamp.now()),
        updatedAt: updatedAtEditable || Timestamp.now(),
        teamMembers,
        views: project?.views || 0,
        visibility,
        projectType,
        objective,
        targetAudience,
        status,
        roadmapPhases: phasesForProject,
        kanbanBoardId,
        docLinks,
      } as any;

      let savedProjectId: string | undefined = project?.id;

      if (project?.id) {
        await updateProject(project.id, projectData);
      } else {
        savedProjectId = await createProject(projectData);
      }

      // Sauvegarder les données canvas
      if (savedProjectId) {
        await saveRoadmapCanvas(savedProjectId, {
          phases: roadmapPhases as RichPhase[],
          arrows: roadmapArrows,
        });
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
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
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
              disabled={isSubmitting}
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

        {/* Formulaire - Le formulaire n'englobe plus tout le contenu pour éviter les soumissions involontaires */}
        <div className={styles.editorForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

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
                progress={progress}
                onProgressChange={setProgress}
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