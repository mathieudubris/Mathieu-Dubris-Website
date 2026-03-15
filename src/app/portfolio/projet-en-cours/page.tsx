"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  auth,
  setupAuthListener,
  isAdmin,
  getAllUsers,
} from '@/utils/firebase-api';
import {
  getAllProjects,
  deleteProject,
  getProjectTeamMembers,
  hasAccessToProject,
  isUserInProject,
  getUserProjectTeamProfile,
  getFullProject,
  Project as FirebaseProject,
  ProjectTeamMember,
} from '@/utils/projet-api';
import {
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import Header from '@/components/app/Header/Header';
import Login from '@/components/app/Header/Login/Login';
import ProjetEditor from '@/components/portfolio/projet-en-cours/Editor/ProjetEditor';
import ProjetDetail from '@/components/portfolio/projet-en-cours/Detail/ProjetDetail';
import UserList from '@/components/portfolio/projet-en-cours/UserList/UserList';
import ProjectCard from '@/components/portfolio/projet-en-cours/Card/ProjectCard';
import styles from './projet-en-cours.module.css';

type Project = FirebaseProject;

export default function ProjetEnCoursPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projectTeamMembers, setProjectTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [userTeamProfile, setUserTeamProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'joined'>('all');

  // Profils team indexés par projectId
  const [teamProfilesMap, setTeamProfilesMap] = useState<Record<string, ProjectTeamMember[]>>({});

  // PERF: cache des projets complets pour éviter les refetch au clic
  const fullProjectCacheRef = useRef<Record<string, any>>({});
  // Référence stable pour l'utilisateur courant (évite de re-créer des closures)
  const currentUserRef = useRef<any>(null);

  const isViewingProject = !!selectedProject;

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      currentUserRef.current = user;
      if (user) {
        setCurrentUser(user);
        await loadProjects(user);
      } else {
        setCurrentUser(null);
        setSelectedProject(null);
        setProjects([]);
        setFilteredProjects([]);
        setTeamProfilesMap({});
        fullProjectCacheRef.current = {};
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Vérifier si un projet est dans l'URL au chargement
  useEffect(() => {
    const checkUrlForProject = async () => {
      const params = new URLSearchParams(window.location.search);
      const projectSlug = params.get('project');

      if (projectSlug && currentUser) {
        // Utiliser le cache si disponible
        const cached = fullProjectCacheRef.current[projectSlug];
        if (cached) {
          setSelectedProject(cached);
          loadProjectTeam(cached); // non-bloquant
          return;
        }

        const fullProject = await getFullProject(projectSlug);
        if (fullProject && hasAccessToProject(fullProject, currentUser.uid)) {
          fullProjectCacheRef.current[projectSlug] = fullProject;
          setSelectedProject(fullProject);
          loadProjectTeam(fullProject); // non-bloquant
        }
      }
    };

    if (currentUser) {
      checkUrlForProject();
    }
  }, [currentUser]);

  // Mettre à jour l'URL quand un projet est sélectionné
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

  // ─────────────────────────────────────────────
  // PERF: chargement des projets optimisé
  // ─────────────────────────────────────────────
  const loadProjects = async (user?: any) => {
    const activeUser = user || currentUserRef.current;
    try {
      const [allProjectsRaw, allUsers] = await Promise.all([
        getAllProjects(),
        getAllUsers(),
      ]);

      const accessible = allProjectsRaw.filter((project) =>
        hasAccessToProject(project, activeUser?.uid ?? null)
      );

      const enriched = accessible.map((project) => {
        const members = (project.teamMembers || []).map((userId: string) => {
          const u = allUsers.find((u: any) => u.uid === userId);
          return u
            ? { userId: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL }
            : null;
        }).filter(Boolean);

        return { ...project, members };
      });

      setProjects(enriched);
      setFilteredProjects(enriched);

      // Pré-remplir le cache fullProject avec les données déjà chargées
      // (pas complet, mais suffisant pour un affichage instantané)
      enriched.forEach((p) => {
        const key = p.slug || p.id;
        if (key && !fullProjectCacheRef.current[key]) {
          fullProjectCacheRef.current[key] = p;
        }
      });

      loadTeamProfilesBackground(enriched);

    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    }
  };

  const loadTeamProfilesBackground = async (projectList: any[]) => {
    try {
      const entries = await Promise.all(
        projectList
          .filter((p) => !!p.id)
          .map(async (p) => {
            try {
              const profiles = await getProjectTeamMembers(p.id!);
              return [p.id!, profiles] as [string, ProjectTeamMember[]];
            } catch {
              return [p.id!, []] as [string, ProjectTeamMember[]];
            }
          })
      );
      const map: Record<string, ProjectTeamMember[]> = {};
      entries.forEach(([id, profiles]) => { map[id] = profiles; });
      setTeamProfilesMap(map);
    } catch (error) {
      console.error('Erreur chargement team profiles:', error);
    }
  };

  const loadProjectTeam = async (project: any) => {
    try {
      if (project.id) {
        const team = await getProjectTeamMembers(project.id);
        setProjectTeamMembers(team);
        setTeamProfilesMap((prev) => ({ ...prev, [project.id!]: team }));

        if (currentUserRef.current && project.teamMembers?.includes(currentUserRef.current.uid)) {
          const profile = await getUserProjectTeamProfile(currentUserRef.current.uid, project.id);
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

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((project) =>
        project.title?.toLowerCase().includes(q) ||
        project.description?.toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'joined' && currentUser) {
      filtered = filtered.filter((project) =>
        isUserInProject(project, currentUser.uid)
      );
    }

    setFilteredProjects(filtered);
  }, [searchQuery, activeFilter, projects, currentUser]);

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowEditor(true);
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setShowEditor(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setDeleteConfirmId(null);
      fullProjectCacheRef.current = {};
      await loadProjects();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  // ─────────────────────────────────────────────
  // PERF: Affichage INSTANTANÉ du modal
  //
  // Stratégie :
  // 1. Afficher IMMÉDIATEMENT avec les données partielles du cache (déjà en mémoire)
  // 2. En parallèle, enrichir avec getFullProject() si nécessaire (sous-collections)
  // 3. Mettre à jour le modal silencieusement quand les données complètes arrivent
  // ─────────────────────────────────────────────
  const handleProjectClick = async (project: any) => {
    if (!project.id) return;

    const cacheKey = project.slug || project.id;

    // Étape 1 : afficher IMMÉDIATEMENT avec ce qu'on a (données partielles ou cache complet)
    const immediate = fullProjectCacheRef.current[cacheKey] || project;
    setSelectedProject(immediate);

    // Lancer team en parallèle, non-bloquant
    loadProjectTeam(project);

    // Étape 2 : si le cache est déjà complet (a toutes les sous-collections), stop.
    // On considère "complet" si docLinks ou software est présent (chargés par getFullProject)
    const isFullyCached = fullProjectCacheRef.current[cacheKey]?.docLinks !== undefined
      || fullProjectCacheRef.current[cacheKey]?.software !== undefined;

    if (isFullyCached) return;

    // Étape 3 : enrichir en arrière-plan et mettre à jour silencieusement
    try {
      const fullProject = await getFullProject(project.id);
      if (!fullProject) return;

      fullProjectCacheRef.current[cacheKey] = fullProject;
      if (project.id !== cacheKey) {
        fullProjectCacheRef.current[project.id] = fullProject;
      }

      // Mettre à jour seulement si ce projet est toujours ouvert
      setSelectedProject((current: any) => {
        if (current?.id === fullProject.id || current?.slug === fullProject.slug) {
          return fullProject;
        }
        return current;
      });
    } catch (err) {
      console.error('getFullProject background error:', err);
    }
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setProjectTeamMembers([]);
    setUserTeamProfile(null);
  };

  const handleUserAdded = async () => {
    fullProjectCacheRef.current = {};
    await loadProjects();
    if (selectedProject) {
      await loadProjectTeam(selectedProject);
    }
  };

  const handleEditProfile = () => {
    if (selectedProject && currentUser) {
      router.push(`/portfolio/projet-en-cours/team/edit?project=${selectedProject.id}`);
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
                          teamProfiles={project.id ? (teamProfilesMap[project.id] || []) : []}
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
              fullProjectCacheRef.current = {};
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