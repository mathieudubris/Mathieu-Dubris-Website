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
  getTeamMembers,
  hasAccessToProject,
  isUserInProject,
  getUserTeamProfile,
  Project as FirebaseProject,
  TeamMember as FirebaseTeamMember
} from '@/utils/firebase-api';
import { 
  Plus, 
  Users, 
  Calendar, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Search,
  Filter,
  ArrowLeft,
  X,
  User,
  Eye
} from 'lucide-react';
import Header from '@/components/app/Header/Header';
import Login from '@/components/app/Header/Login/Login';
import ProjetEditor from '@/components/projet-en-cours/ProjetEditor';
import ProjetDetail from '@/components/projet-en-cours/ProjetDetail';
import UserList from '@/components/UserList/UserList';
import styles from './projet-en-cours.module.css';

// Utiliser les interfaces importées de firebase-api
type Project = FirebaseProject;
type TeamMember = FirebaseTeamMember;

export default function ProjetEnCoursPage() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTeamMembers, setProjectTeamMembers] = useState<TeamMember[]>([]);
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
        
        // Vérifier si un project est dans l'URL
        const params = new URLSearchParams(window.location.search);
        const projectId = params.get('project');
        if (projectId && projects.length > 0) {
          const project = projects.find(p => p.id === projectId);
          if (project && hasAccessToProject(project, user.uid)) {
            handleProjectClick(project);
          }
        }
      } else {
        setCurrentUser(null);
        setSelectedProject(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadProjects = async () => {
    try {
      let allProjects = await getProjects();
      
      // Filtrer les projets auxquels l'utilisateur a accès
      if (currentUser) {
        allProjects = allProjects.filter(project => 
          hasAccessToProject(project, currentUser.uid)
        );
      }
      
      // Ajoute l'URL par défaut si pas d'image et initialise teamMembers
      allProjects = allProjects.map(project => ({
        ...project,
        image: project.image || '/default-project.jpg',
        teamMembers: project.teamMembers || []
      }));
      
      setProjects(allProjects);
      setFilteredProjects(allProjects);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    }
  };

  const loadProjectTeam = async (project: Project) => {
    try {
      if (project.teamMembers?.length > 0) {
        const allTeamMembers = await getTeamMembers();
        const team = allTeamMembers.filter(member =>
          project.teamMembers.includes(member.userId)
        );
        setProjectTeamMembers(team);
      } else {
        setProjectTeamMembers([]);
      }
      
      // Charger le profil d'équipe de l'utilisateur courant
      if (currentUser && project.teamMembers?.includes(currentUser.uid)) {
        const profile = await getUserTeamProfile(currentUser.uid);
        setUserTeamProfile(profile);
      } else {
        setUserTeamProfile(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'équipe:', error);
      setProjectTeamMembers([]);
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
        filtered = filtered.filter(project => 
          project.teamMembers?.includes(currentUser.uid) && project.createdBy !== currentUser.uid
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
    // Recharger les projets et l'équipe
    await loadProjects();
    if (selectedProject) {
      await loadProjectTeam(selectedProject);
    }
  };

  const handleEditProfile = () => {
    if (selectedProject && currentUser) {
      router.push(`/team?project=${selectedProject.id}`);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return '';
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
              onEditProject={() => handleEditProject(selectedProject)}
              onManageTeam={handleManageTeam}
              onDeleteProject={() => setDeleteConfirmId(selectedProject.id || '')}
              onEditProfile={handleEditProfile}
            />
          ) : (
            /* Vue LISTE des projets */
            <>
              {/* En-tête de page COMPACT */}
              <div className={styles.pageHeader}>
                <div className={styles.headerTop}>
                  <h1 className={styles.pageTitle}>Projets en cours</h1>
                  
                  <div className={styles.headerControls}>
                    {/* Barre de recherche */}
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
                    
                    {/* Bouton créer (admin seulement) */}
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
                
                {/* Filtres */}
                <div className={styles.filterBar}>
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
              </div>

              {/* Grille de projets en carrés */}
              {filteredProjects.length > 0 ? (
                <div className={styles.projectsGrid}>
                  <AnimatePresence mode="popLayout">
                    {filteredProjects.map((project, index) => (
                      <motion.div
                        key={project.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className={styles.projectCard}
                        onClick={() => handleProjectClick(project)}
                      >
                        {deleteConfirmId === (project.id || '') ? (
                          <div className={styles.confirmOverlay}>
                            <AlertTriangle size={32} />
                            <p>Supprimer ce projet ?</p>
                            <div className={styles.confirmButtons}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (project.id) {
                                    handleDeleteProject(project.id);
                                  }
                                }}
                                className={styles.confirmYes}
                              >
                                OUI
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className={styles.confirmNo}
                              >
                                NON
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={styles.projectImageContainer}>
                              <img 
                                src={project.image} 
                                alt={project.title}
                                className={styles.projectImage}
                                onError={(e) => {
                                  e.currentTarget.src = '/default-project.jpg';
                                }}
                              />
                            </div>
                            
                            <div className={styles.projectContent}>
                              <div className={styles.projectHeader}>
                                <h3 className={styles.projectTitle}>{project.title}</h3>
                                {currentUser && isAdmin(currentUser.email) && (
                                  <div className={styles.projectActions}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditProject(project);
                                      }}
                                      className={styles.actionBtn}
                                      title="Modifier"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmId(project.id || '');
                                      }}
                                      className={styles.actionBtn}
                                      title="Supprimer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              <p className={styles.projectDescription}>
                                {project.description.length > 100
                                  ? `${project.description.substring(0, 100)}...`
                                  : project.description}
                              </p>
                              
                              <div className={styles.projectFooter}>
                                <div className={styles.projectMeta}>
                                  <div className={styles.metaItem}>
                                    <Calendar size={12} />
                                    <span>{formatDate(project.createdAt)}</span>
                                  </div>
                                  <div className={styles.metaItem}>
                                    <Users size={12} />
                                    <span>{(project.teamMembers || []).length} membre(s)</span>
                                  </div>
                                </div>
                                
                                {currentUser && project.teamMembers?.includes(currentUser.uid) && (
                                  <span className={styles.memberBadge}>
                                    Membre
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
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