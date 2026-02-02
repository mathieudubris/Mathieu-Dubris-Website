"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { createProject, updateProject, isAdmin } from '@/utils/firebase-api';
import { Timestamp } from 'firebase/firestore';
import styles from './ProjetEditor.module.css';

interface Project {
  id?: string;
  title: string;
  description: string;
  image: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  teamMembers: string[];
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      setImage(project.image);
    } else {
      setTitle('');
      setDescription('');
      setImage('');
    }
  }, [project]);

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
        createdBy: currentUser.uid,
        createdAt: project ? project.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
        teamMembers: project?.teamMembers || [currentUser.uid] // L'admin est automatiquement membre
      };

      if (project?.id) {
        await updateProject(project.id, projectData);
      } else {
        await createProject(projectData);
      }

      onSave();
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
        <div className={styles.editorHeader}>
          <h2 className={styles.title}>
            {project ? 'Modifier le projet' : 'Nouveau projet'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Titre du projet *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              placeholder="Nom du projet"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="Description détaillée du projet..."
              rows={4}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Image du projet
            </label>
            <div className={styles.imageSection}>
              <div 
                className={styles.imageUpload}
                onClick={handleImageUpload}
              >
                {image ? (
                  <img src={image} alt="Aperçu" className={styles.imagePreview} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <ImageIcon size={32} />
                    <span>Cliquer pour uploader une image</span>
                  </div>
                )}
              </div>
              <p className={styles.imageHint}>
                Format recommandé: JPG, PNG • Taille max: 5MB
              </p>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Enregistrement...'
              ) : (
                <>
                  <Save size={16} />
                  {project ? 'Mettre à jour' : 'Créer le projet'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProjetEditor;