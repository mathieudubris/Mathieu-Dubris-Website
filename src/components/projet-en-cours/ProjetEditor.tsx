"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Info, Image as ImageIcon, Settings, AlertCircle, Map } from 'lucide-react';
import { createProject, updateProject, isAdmin, Project as FirebaseProject, getAllUsers, generateSlug } from '@/utils/firebase-api';
import { Timestamp } from 'firebase/firestore';
import AProposEditor from './AProposEditor';
import ImagesEditor from './ImagesEditor';
import AutreEditor from './AutreEditor';
import styles from './ProjetEditor.module.css';

type Project = FirebaseProject;

interface ProjetEditorProps {
  project: Project | null;
  onClose: () => void;
  onSave: () => void;
  currentUser: any;
}

type TabType = 'apropos' | 'images' | 'roadmap' | 'autre';

const ProjetEditor: React.FC<ProjetEditorProps> = ({ 
  project, 
  onClose, 
  onSave,
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('apropos');
  
  // États du formulaire
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [software, setSoftware] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'early_access'>('public');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await getAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    };
    
    loadUsers();
    
    if (project) {
      setTitle(project.title);
      setSlug(project.slug || generateSlug(project.title));
      setDescription(project.description);
      setImage(project.image || '');
      setCarouselImages(project.carouselImages || []);
      setProgress(project.progress || 0);
      setSoftware(project.software || []);
      setTeamMembers(project.teamMembers || []);
      setVisibility(project.visibility || 'public');
    } else {
      setTitle('');
      setSlug('');
      setDescription('');
      setImage('');
      setCarouselImages([]);
      setProgress(0);
      setSoftware([]);
      setTeamMembers(currentUser?.uid ? [currentUser.uid] : []);
      setVisibility('public');
    }
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
          <button onClick={onClose} className={styles.closeErrorBtn}>
            Fermer
          </button>
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
        photoURL: user.photoURL
      } : null;
    }).filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (visibility === 'early_access' && teamMembers.length === 0) {
      setError('Pour l\'accès anticipé, vous devez sélectionner au moins un membre');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const enrichedMembers = enrichMembers(teamMembers);
      const finalSlug = slug.trim() || generateSlug(title.trim());
      
      const projectData: Omit<Project, 'id'> = {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim(),
        image: image || '/default-project.jpg',
        carouselImages: carouselImages,
        progress: progress,
        software: software,
        members: enrichedMembers,
        createdBy: currentUser.uid,
        createdAt: project ? project.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
        teamMembers: teamMembers,
        views: project?.views || 0,
        visibility: visibility,
      } as any;

      if (project?.id) {
        await updateProject(project.id, projectData);
      } else {
        await createProject(projectData);
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          </div>
          
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
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
            className={`${styles.tabButton} ${activeTab === 'images' ? styles.active : ''}`}
            onClick={() => setActiveTab('images')}
          >
            <ImageIcon size={16} />
            <span>Images</span>
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'roadmap' ? styles.active : ''}`}
            onClick={() => setActiveTab('roadmap')}
          >
            <Map size={16} />
            <span>Roadmap</span>
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'autre' ? styles.active : ''}`}
            onClick={() => setActiveTab('autre')}
          >
            <Settings size={16} />
            <span>Autre</span>
          </button>
        </div>

        {/* Contenu du formulaire */}
        <form onSubmit={handleSubmit} className={styles.editorForm}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.tabContent}>
            {activeTab === 'apropos' && (
              <AProposEditor
                title={title}
                slug={slug}
                description={description}
                onTitleChange={setTitle}
                onSlugChange={setSlug}
                onDescriptionChange={setDescription}
                isNewProject={!project}
              />
            )}

            {activeTab === 'images' && (
              <ImagesEditor
                mainImage={image}
                carouselImages={carouselImages}
                onMainImageChange={setImage}
                onCarouselImagesChange={setCarouselImages}
              />
            )}

            {activeTab === 'autre' && (
              <AutreEditor
                progress={progress}
                software={software}
                teamMembers={teamMembers}
                visibility={visibility}
                allUsers={allUsers}
                onProgressChange={setProgress}
                onSoftwareChange={setSoftware}
                onTeamMembersChange={setTeamMembers}
                onVisibilityChange={setVisibility}
                projectId={project?.id || 'new-project'}
              />
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProjetEditor;
