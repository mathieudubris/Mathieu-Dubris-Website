"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Image as ImageIcon, Send } from 'lucide-react';
import { createProject, updateProject, isAdmin, getAllUsers, addMemberToProject, removeMemberFromProject } from '@/utils/firebase-api';
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

interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
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
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      setImage(project.image);
      setTeamMembers(project.teamMembers || []);
    } else {
      setTitle('');
      setDescription('');
      setImage('');
      setTeamMembers([currentUser?.uid]);
    }
    
    loadUsers();
  }, [project, currentUser]);

  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

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

  const toggleTeamMember = (userId: string) => {
    if (teamMembers.includes(userId)) {
      setTeamMembers(teamMembers.filter(id => id !== userId));
    } else {
      setTeamMembers([...teamMembers, userId]);
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        teamMembers: teamMembers
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
              <div className={styles.sidebarSection}>
                <label>Image du projet</label>
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

              <div className={styles.sidebarSection}>
                <label>Membres de l'équipe</label>
                <div className={styles.searchTeam}>
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.teamSearch}
                  />
                </div>
                
                <div className={styles.teamList}>
                  {filteredUsers.map(user => (
                    <div 
                      key={user.uid}
                      className={`${styles.teamMember} ${teamMembers.includes(user.uid) ? styles.selected : ''}`}
                      onClick={() => toggleTeamMember(user.uid)}
                    >
                      <div className={styles.memberAvatar}>
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || ''} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {user.displayName?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{user.displayName || 'Utilisateur'}</span>
                        <span className={styles.memberEmail}>{user.email}</span>
                      </div>
                      {teamMembers.includes(user.uid) && (
                        <div className={styles.selectedIndicator}>✓</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className={styles.selectedCount}>
                  {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} sélectionné{teamMembers.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProjetEditor;