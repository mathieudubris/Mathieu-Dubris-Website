// ProjetEditor.tsx - AVEC CAROUSEL, SOFTWARE ET MEMBERS EN MODAL
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, Send, Plus, Wrench, Users as UsersIcon } from 'lucide-react';
import { createProject, updateProject, isAdmin, Project as FirebaseProject } from '@/utils/firebase-api';
import { Timestamp } from 'firebase/firestore';
import SoftwareList from '@/components/projet-en-cours/SoftwareList';
import styles from './ProjetEditor.module.css';

// Utiliser l'interface importée de Firebase
type Project = FirebaseProject;

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
      setTeamMembers(currentUser?.uid ? [currentUser.uid] : []);
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
        // Assurer que views est toujours un nombre
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

      {/* Modal Members - MODAL PLEIN ÉCRAN */}
      <AnimatePresence>
        {showMembersModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: '#0d0d0d',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              width: '90vw',
              maxWidth: '900px',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.3)'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    margin: '0 0 6px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <UsersIcon size={24} />
                    <span>Gérer les membres</span>
                  </h2>
                  <p style={{
                    color: 'var(--text-main)',
                    opacity: 0.7,
                    fontSize: '0.85rem',
                    margin: 0
                  }}>
                    Sélectionnez les membres de l'équipe ({teamMembers.length} sélectionné{teamMembers.length > 1 ? 's' : ''})
                  </p>
                </div>
                <button 
                  onClick={() => setShowMembersModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px'
              }}>
                <p style={{
                  color: 'var(--text-main)',
                  opacity: 0.7,
                  fontSize: '0.9rem',
                  marginBottom: '20px'
                }}>
                  La gestion complète des membres se fait via le bouton "Gérer l'équipe" dans la vue détail du projet.
                  Ici, vous pouvez seulement voir les membres actuels.
                </p>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {teamMembers.length > 0 ? (
                    teamMembers.map((memberId, index) => (
                      <div key={index} style={{
                        background: 'rgba(30, 30, 30, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary) 0%, rgba(199, 255, 68, 0.8) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--dark)',
                          fontWeight: 700,
                          fontSize: '1rem'
                        }}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            margin: '0 0 4px 0'
                          }}>
                            Membre {index + 1}
                          </h3>
                          <p style={{
                            color: 'var(--text-main)',
                            opacity: 0.6,
                            fontSize: '0.85rem',
                            margin: 0
                          }}>
                            ID: {memberId.substring(0, 8)}...
                          </p>
                        </div>
                        <div style={{
                          background: 'rgba(199, 255, 68, 0.1)',
                          color: 'var(--primary)',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          Membre
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: 'var(--text-main)',
                      opacity: 0.6
                    }}>
                      <UsersIcon size={48} style={{ opacity: 0.4, marginBottom: '16px' }} />
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        margin: '0 0 8px 0'
                      }}>
                        Aucun membre
                      </h3>
                      <p style={{ fontSize: '0.9rem', margin: 0 }}>
                        Ajoutez des membres via "Gérer l'équipe"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowMembersModal(false)}
                  style={{
                    background: 'rgba(30, 30, 30, 0.7)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProjetEditor;