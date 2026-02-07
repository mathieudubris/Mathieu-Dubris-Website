// ProjetEditor.tsx - AVEC CAROUSEL, SOFTWARE ET MEMBERS EN MODAL
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, Send, Plus, Wrench, Users as UsersIcon } from 'lucide-react';
import { createProject, updateProject, isAdmin } from '@/utils/firebase-api';
import { Timestamp } from 'firebase/firestore';
import SoftwareList from '@/components/projet-en-cours/SoftwareList';
import UserList from '@/components/UserList/UserList';
import styles from './ProjetEditor.module.css';

interface Project {
  id?: string;
  title: string;
  description: string;
  image: string;
  carouselImages: string[];
  progress: number;
  software: any[];
  members: any[];
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  teamMembers: string[];
  views?: number;
}

interface ProjetEditorProps {
  project: Project | null;
  onClose: () => void;
  onSave: () => void;
  currentUser: any;
}

const ProjetEditor: React.FC<ProjetEditorProps> = ({ 
  project, 
  onClose, 
  onSave,
  currentUser 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [software, setSoftware] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSoftwareModal, setShowSoftwareModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      setImage(project.image);
      setCarouselImages(project.carouselImages || []);
      setProgress(project.progress || 0);
      setSoftware(project.software || []);
      setMembers(project.members || []);
      setTeamMembers(project.teamMembers || []);
    } else {
      setTitle('');
      setDescription('');
      setImage('');
      setCarouselImages([]);
      setProgress(0);
      setSoftware([]);
      setMembers([]);
      setTeamMembers([currentUser?.uid]);
    }
  }, [project, currentUser]);

  const handleImageUpload = () => {
    if (typeof window !== "undefined" && (window as any).cloudinary) {
      const widget = (window as any).cloudinary.createUploadWidget({
        cloudName: 'dhqqx2m3y',
        uploadPreset: 'blog_preset',
        sources: ['local', 'url'],
        multiple: false,
        resourceType: 'image',
        theme: "minimal",
      }, (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setImage(result.info.secure_url);
        }
      });
      widget.open();
    }
  };

  const handleCarouselUpload = () => {
    if (typeof window !== "undefined" && (window as any).cloudinary) {
      const widget = (window as any).cloudinary.createUploadWidget({
        cloudName: 'dhqqx2m3y',
        uploadPreset: 'blog_preset',
        sources: ['local', 'url'],
        multiple: true,
        resourceType: 'image',
        theme: "minimal",
      }, (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setCarouselImages(prev => [...prev, result.info.secure_url]);
        }
      });
      widget.open();
    }
  };

  const removeCarouselImage = (index: number) => {
    setCarouselImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!isAdmin(currentUser?.email)) {
      setError('Seul l\'administrateur peut créer ou modifier des projets');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const projectData: Omit<Project, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        image: image || '/default-project.jpg',
        carouselImages: carouselImages,
        progress: progress,
        software: software,
        members: members,
        createdBy: currentUser.uid,
        createdAt: project ? project.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
        teamMembers: teamMembers,
        views: project?.views || 0
      };

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

  const handleSoftwareSave = (selectedSoftware: any[]) => {
    setSoftware(selectedSoftware);
    setShowSoftwareModal(false);
  };

  const handleMembersSave = (selectedMembers: string[]) => {
    setTeamMembers(selectedMembers);
    setShowMembersModal(false);
  };

  return (
    <>
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
          <div className={styles.editorHeader}>
            <div className={styles.headerLeft}>
              <span className={styles.headerTitle}>
                {project ? 'Modifier le projet' : 'Nouveau projet'}
              </span>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={styles.publishBtnTop}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Enregistrement..." : <><Send size={16} /> {project ? "Mettre à jour" : "Créer"}</>}
              </button>
            </div>
            
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.publishForm}>
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <div className={styles.formGrid}>
              <div className={styles.mainFields}>
                <input 
                  type="text" 
                  placeholder="Titre du projet..." 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.titleInput}
                  required
                />
                
                <textarea 
                  placeholder="Description du projet..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.contentInput}
                  required
                  rows={8}
                />
              </div>

              <div className={styles.mediaSidebar}>
                {/* Image principale */}
                <div className={styles.sidebarSection}>
                  <label>Image principale</label>
                  <div className={styles.featuredUpload} onClick={handleImageUpload}>
                    {image ? (
                      <img src={image} alt="Projet" />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <ImageIcon size={24} />
                        <span>Cliquer pour uploader</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Carousel d'images */}
                <div className={styles.sidebarSection}>
                  <label>Carousel d'images</label>
                  <div className={styles.carouselContainer}>
                    <div className={styles.carouselImages}>
                      {carouselImages.map((img, index) => (
                        <div key={index} className={styles.carouselItem}>
                          <div className={styles.carouselNumber}>{index + 1}</div>
                          <img src={img} alt={`Carousel ${index + 1}`} />
                          <button
                            type="button"
                            onClick={() => removeCarouselImage(index)}
                            className={styles.removeCarouselBtn}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <div 
                        className={styles.addCarouselBtn}
                        onClick={handleCarouselUpload}
                      >
                        <Plus size={24} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progression */}
                <div className={styles.sidebarSection}>
                  <div className={styles.progressSection}>
                    <div className={styles.progressLabel}>
                      <label>Progression</label>
                      <span className={styles.progressValue}>{progress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className={styles.progressSlider}
                    />
                  </div>
                </div>

                {/* Logiciels */}
                <div className={styles.sidebarSection}>
                  <label>Logiciels</label>
                  <button
                    type="button"
                    onClick={() => setShowSoftwareModal(true)}
                    className={styles.sectionButton}
                  >
                    <span><Wrench size={16} style={{ display: 'inline', marginRight: '8px' }} />Software</span>
                    <span className={styles.selectedCount}>{software.length} sélectionné{software.length > 1 ? 's' : ''}</span>
                  </button>
                </div>

                {/* Membres */}
                <div className={styles.sidebarSection}>
                  <label>Membres de l'équipe</label>
                  <button
                    type="button"
                    onClick={() => setShowMembersModal(true)}
                    className={styles.sectionButton}
                  >
                    <span><UsersIcon size={16} style={{ display: 'inline', marginRight: '8px' }} />Membres</span>
                    <span className={styles.selectedCount}>{teamMembers.length} sélectionné{teamMembers.length > 1 ? 's' : ''}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Modal Software */}
      <AnimatePresence>
        {showSoftwareModal && (
          <SoftwareList
            projectId={project?.id || ''}
            isAdmin={true}
            compact={false}
            selectedSoftware={software}
            onClose={() => setShowSoftwareModal(false)}
            onSave={handleSoftwareSave}
          />
        )}
      </AnimatePresence>

      {/* Modal Members */}
      <AnimatePresence>
        {showMembersModal && project?.id && (
          <UserList
            projectId={project.id}
            onClose={() => setShowMembersModal(false)}
            onUserAdded={() => {}}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ProjetEditor;
