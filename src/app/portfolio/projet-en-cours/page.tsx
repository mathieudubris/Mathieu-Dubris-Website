"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  auth, 
  setupAuthListener, 
  getProjects, 
  deleteProject,
  isAdmin,
  getProjectTeamMembers,
  hasAccessToProject,
  isUserInProject,
  getUserProjectTeamProfile,
  Project as FirebaseProject,
  getAllUsers,
  getProjectBySlug
} from '@/utils/firebase-api';
import { 
  Plus, 
  Search,
  Filter
} from 'lucide-react';
import Header from '@/components/app/Header/Header';
import Login from '@/components/app/Header/Login/Login';
import ProjetEditor from '@/components/projet-en-cours/ProjetEditor';
import ProjetDetail from '@/components/projet-en-cours/ProjetDetail';
import UserList from '@/components/UserList/UserList';
import ProjectCard from '@/components/projet-en-cours/ProjectCard';
import styles from './projet-en-cours.module.css';

type Project = FirebaseProject;
type ProjectTeamMember = any;

export default function ProjetEnCoursPage() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTeamMembers, setProjectTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [userTeamProfile, setUserTeamProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'joined'>('all');
  
  const isViewingProject = !!selectedProject;

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadProjects();
      } else {
        setCurrentUser(null);
        setSelectedProject(null);
        setProjects([]);
        setFilteredProjects([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Vérifier si un projet est dans l'URL au chargement - MODIFIÉ POUR SLUGS
  useEffect(() => {
    const checkUrlForProject = async () => {
      const params = new URLSearchParams(window.location.search);
      const projectSlug = params.get('project');
      
      if (projectSlug && currentUser) {
        // Chercher le projet par slug
        const project = await getProjectBySlug(projectSlug);
        if (project && hasAccessToProject(project, currentUser.uid)) {
          setSelectedProject(project);
          await loadProjectTeam(project);
        }
      }
    };
    
    if (currentUser) {
      checkUrlForProject();
    }
  }, [currentUser]);

  // Mettre à jour l'URL quand un projet est sélectionné - MODIFIÉ POUR SLUGS
  useEffect(() => {
    if (selectedProject?.slug) {
      const url = new URL(window.location.href);
      url.searchParams.set('project', selectedProject.slug);
      window.history.pushState({}, '', url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('project');
      window.history.pushState({}, '', url.toString());
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      let allProjects = await getProjects();
      
      // Filtrer les projets selon la visibilité :
      // - projets "public" (ou sans visibilité) → visibles par tous les utilisateurs connectés
      // - projets "early_access" → visibles uniquement par les membres
      if (currentUser) {
        allProjects = allProjects.filter(project => 
          hasAccessToProject(project, currentUser.uid)
        );
      }
      
      // Enrichir avec les données des membres
      const allUsers = await getAllUsers();
      allProjects = await Promise.all(allProjects.map(async project => {
        const members = project.teamMembers?.map(userId => {
          const user = allUsers.find(u => u.uid === userId);
          return user ? {
            userId: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          } : null;
        }).filter(Boolean) || [];

        return {
          ...project,
          image: project.image || '/default-project.jpg',
          teamMembers: project.teamMembers || [],
          members: members,
          software: project.software || [],
          carouselImages: project.carouselImages || [],
          progress: project.progress || 0,
          views: project.views || 0
        };
      }));
      
      setProjects(allProjects);
      setFilteredProjects(allProjects);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    }
  };

  const loadProjectTeam = async (project: Project) => {
    try {
      if (project.id) {
        // Charger les membres de l'équipe — accessible à tous les utilisateurs connectés pour les projets publics
        const team = await getProjectTeamMembers(project.id);
        setProjectTeamMembers(team);
        
        // Charger le profil d'équipe de l'utilisateur courant uniquement s'il est membre
        if (currentUser && project.teamMembers?.includes(currentUser.uid)) {
          const profile = await getUserProjectTeamProfile(currentUser.uid, project.id);
          setUserTeamProfile(profile);
        } else {
          setUserTeamProfile(null);
        }
      } else {
        setProjectTeamMembers([]);
        setUserTeamProfile(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'équipe:', error);
      setProjectTeamMembers([]);
      setUserTeamProfile(null);
    }
  };

  useEffect(() => {
  let filtered = [...projects];
  
  // Filtre par recherche
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(project =>
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    );
  }
  
  // Filtre par type
  if (currentUser) {
    if (activeFilter === 'joined') {
      // CORRECTION : Inclure TOUS les projets où l'utilisateur est membre
      // (créés par lui OU auxquels il a été ajouté)
      filtered = filtered.filter(project => 
        isUserInProject(project, currentUser.uid)
      );
    }
  }
  
  setFilteredProjects(filtered);
}, [projects, searchQuery, activeFilter, currentUser]);

  const handleCreateProject = () => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    if (!isAdmin(currentUser.email)) {
      alert('Seul l\'administrateur peut créer des projets');
      return;
    }
    setEditingProject(null);
    setShowEditor(true);
  };

  const handleEditProject = (project: Project) => {
    if (!isAdmin(currentUser?.email)) {
      alert('Seul l\'administrateur peut modifier des projets');
      return;
    }
    setEditingProject(project);
    setShowEditor(true);
  };

  const handleManageTeam = () => {
    if (selectedProject && isAdmin(currentUser?.email)) {
      setShowUserList(true);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      if (!isAdmin(currentUser?.email)) {
        alert('Seul l\'administrateur peut supprimer des projets');
        return;
      }
      
      await deleteProject(projectId);
      await loadProjects();
      setDeleteConfirmId(null);
      
      // Si on supprime le projet actuellement sélectionné
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleProjectClick = async (project: Project) => {
    if (!project.id) return;
    setSelectedProject(project);
    await loadProjectTeam(project);
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setProjectTeamMembers([]);
    setUserTeamProfile(null);
  };

  const handleUserAdded = async () => {
    await loadProjects();
    if (selectedProject) {
      await loadProjectTeam(selectedProject);
    }
  };

  const handleEditProfile = () => {
    if (selectedProject && currentUser) {
      router.push(`/portfolio/team?project=${selectedProject.id}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <Header />
      
      <main className={styles.content}>
        <div className={styles.pageContainer}>
          {/* Vue DÉTAIL d'un projet en modal plein écran */}
          {isViewingProject && selectedProject ? (
            <ProjetDetail
              project={selectedProject}
              teamMembers={projectTeamMembers}
              currentUser={currentUser}
              userTeamProfile={userTeamProfile}
              onBack={handleBackToList}
              onEditProfile={handleEditProfile}
            />
          ) : (
            /* Vue LISTE des projets */
            <>
              {/* En-tête de page avec tous les éléments sur la même ligne */}
              <div className={styles.pageHeader}>
                <div className={styles.headerRow}>
                  {/* Filtres à gauche */}
                  <div className={styles.filtersContainer}>
                    <button
                      className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
                      onClick={() => setActiveFilter('all')}
                    >
                      Tous les projets
                    </button>
                    {currentUser && (
                      <button
                        className={`${styles.filterBtn} ${activeFilter === 'joined' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('joined')}
                      >
                        Projets rejoints
                      </button>
                    )}
                  </div>
                  
                  {/* Barre de recherche au centre */}
                  <div className={styles.searchContainer}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Rechercher un projet..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>
                  
                  {/* Bouton créer à droite (admin seulement) */}
                  {currentUser && isAdmin(currentUser.email) && (
                    <button
                      onClick={handleCreateProject}
                      className={styles.createButton}
                    >
                      <Plus size={16} />
                      <span>Nouveau projet</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grille de projets */}
              {filteredProjects.length > 0 ? (
                <div className={styles.projectsGrid}>
                  <AnimatePresence mode="popLayout">
                    {filteredProjects.map((project, index) => {
                      const isMember = currentUser && isUserInProject(project, currentUser.uid);
                      const adminStatus = currentUser && isAdmin(currentUser.email);
                      
                      return (
                        <ProjectCard
                          key={project.id || index}
                          project={project}
                          currentUser={currentUser}
                          isAdmin={adminStatus}
                          isMember={isMember}
                          isDeleteConfirm={deleteConfirmId === (project.id || '')}
                          onEdit={handleEditProject}
                          onDelete={handleDeleteProject}
                          onDeleteConfirm={setDeleteConfirmId}
                          onClick={() => handleProjectClick(project)}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <Filter size={48} />
                  </div>
                  <h3 className={styles.emptyTitle}>
                    {searchQuery || activeFilter !== 'all'
                      ? 'Aucun projet trouvé'
                      : 'Aucun projet disponible'}
                  </h3>
                  <p className={styles.emptyText}>
                    {searchQuery
                      ? 'Essayez avec d\'autres termes de recherche'
                      : currentUser && isAdmin(currentUser.email)
                      ? 'Créez votre premier projet pour commencer'
                      : 'Attendez qu\'un administrateur vous ajoute à un projet'}
                  </p>
                  {currentUser && isAdmin(currentUser.email) && !searchQuery && (
                    <button
                      onClick={handleCreateProject}
                      className={styles.emptyButton}
                    >
                      <Plus size={16} />
                      Créer un projet
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Éditeur de projet */}
      <AnimatePresence>
        {showEditor && (
          <ProjetEditor
            project={editingProject}
            onClose={() => {
              setShowEditor(false);
              setEditingProject(null);
            }}
            onSave={async () => {
              await loadProjects();
              setShowEditor(false);
              setEditingProject(null);
            }}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      {/* Liste des utilisateurs pour ajouter à l'équipe */}
      <AnimatePresence>
        {showUserList && selectedProject && (
          <UserList
            projectId={selectedProject.id || ''}
            onClose={() => {
              setShowUserList(false);
            }}
            onUserAdded={handleUserAdded}
          />
        )}
      </AnimatePresence>

      {/* Login modal */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </div>
  );
}