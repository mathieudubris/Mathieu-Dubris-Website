"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  auth, 
  setupAuthListener, 
  getProjects, 
  getUserProjects, 
  deleteProject,
  isAdmin,
  getTeamMembers
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
  ExternalLink,
  FolderKanban,
  X
} from 'lucide-react';
import Header from '@/components/app/Header/Header';
import Login from '@/components/app/Header/Login/Login';
import ProjetEditor from '@/components/app/projet-en-cours/ProjetEditor';
import UserList from '@/components/app/UserList/UserList';
import styles from './projet-en-cours.module.css';

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  teamMembers: string[];
}

interface TeamMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  image: string;
  roles: string[];
}

export default function ProjetEnCoursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTeamMembers, setProjectTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'joined'>('all');
  
  const isViewingProject = !!selectedProject;
  const adminEmail = 'mathieudubris@gmail.com';

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadProjects();
        
        // Si un projectId est dans l'URL, charger ce projet
        if (projectId) {
          const project = projects.find(p => p.id === projectId);
          if (project) {
            handleProjectClick(project);
          }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (projectId && projects.length > 0 && !selectedProject) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        handleProjectClick(project);
      }
    }
  }, [projectId, projects, selectedProject]);

  const loadProjects = async () => {
    try {
      let allProjects = await getProjects();
      
      // Ajoute l'URL par défaut si pas d'image
      allProjects = allProjects.map(project => ({
        ...project,
        image: project.image || '/default-project.jpg'
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
      switch (activeFilter) {
        case 'my':
          filtered = filtered.filter(project => project.createdBy === currentUser.uid);
          break;
        case 'joined':
          filtered = filtered.filter(project => 
            project.teamMembers?.includes(currentUser.uid) && project.createdBy !== currentUser.uid
          );
          break;
        default:
          // 'all' - tous les projets
          break;
      }
    }
    
    setFilteredProjects(filtered);
  }, [projects, searchQuery, activeFilter, currentUser]);

  const handleCreateProject = () => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    setEditingProject(null);
    setShowEditor(true);
  };

  const handleEditProject = (project: Project) => {
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
      await deleteProject(projectId);
      await loadProjects();
      setDeleteConfirmId(null);
      
      // Si on supprime le projet actuellement sélectionné
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        // Mettre à jour l'URL
        router.push('/projet-en-cours');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleProjectClick = async (project: Project) => {
    setSelectedProject(project);
    await loadProjectTeam(project);
    // Mettre à jour l'URL sans recharger la page
    router.push(`/projet-en-cours?project=${project.id}`, { scroll: false });
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setProjectTeamMembers([]);
    router.push('/projet-en-cours', { scroll: false });
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/team?userId=${userId}`);
  };

  const handleUserAdded = async () => {
    // Recharger les projets et l'équipe
    await loadProjects();
    if (selectedProject) {
      await loadProjectTeam(selectedProject);
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

  // Fonction pour vérifier l'accès au projet
  const hasAccessToProject = (project: Project) => {
    if (!currentUser) return false;
    return project.teamMembers?.includes(currentUser.uid) || 
           project.createdBy === currentUser.uid ||
           isAdmin(currentUser.email);
  };

  return (
    <div className={styles.mainContainer}>
      <Header />
      
      <main className={styles.content}>
        <div className={styles.pageContainer}>
          {/* Vue DÉTAIL d'un projet */}
          {isViewingProject && selectedProject ? (
            <>
              {/* Vérifier l'accès */}
              {!hasAccessToProject(selectedProject) ? (
                <div className={styles.accessDenied}>
                  <h2>Accès restreint</h2>
                  <p>Vous n'avez pas accès à ce projet.</p>
                  <p>Contactez l'administrateur pour être ajouté à l'équipe.</p>
                  <button onClick={handleBackToList} className={styles.backButton}>
                    <ArrowLeft size={16} />
                    Retour aux projets
                  </button>
                </div>
              ) : (
                <>
                  {/* Bouton retour */}
                  <button onClick={handleBackToList} className={styles.backButton}>
                    <ArrowLeft size={16} />
                    <span>Retour aux projets</span>
                  </button>

                  {/* En-tête du projet */}
                  <div className={styles.projectHeader}>
                    <div className={styles.projectImage}>
                      <img 
                        src={selectedProject.image || '/default-project.jpg'} 
                        alt={selectedProject.title}
                        onError={(e) => {
                          e.currentTarget.src = '/default-project.jpg';
                        }}
                      />
                    </div>
                    
                    <div className={styles.projectInfo}>
                      <div className={styles.projectTitleSection}>
                        <h1 className={styles.projectTitle}>{selectedProject.title}</h1>
                        {currentUser && isAdmin(currentUser.email) && (
                          <div className={styles.projectActions}>
                            <button onClick={() => handleEditProject(selectedProject)} className={styles.editButton}>
                              <Edit2 size={16} />
                              <span>Modifier</span>
                            </button>
                            <button onClick={handleManageTeam} className={styles.teamButton}>
                              <Users size={16} />
                              <span>Gérer l'équipe</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(selectedProject.id)}
                              className={styles.deleteButton}
                            >
                              <Trash2 size={16} />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <p className={styles.projectDescription}>{selectedProject.description}</p>
                      
                      <div className={styles.projectMeta}>
                        <div className={styles.metaItem}>
                          <Calendar size={16} />
                          <span>Créé le {formatDate(selectedProject.createdAt)}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <Users size={16} />
                          <span>{selectedProject.teamMembers?.length || 0} membre(s)</span>
                        </div>
                      </div>
                      
                      {currentUser && selectedProject.teamMembers?.includes(currentUser.uid) && (
                        <div className={styles.userStatus}>
                          <span className={styles.statusBadge}>
                            Vous êtes membre de ce projet
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirmation de suppression */}
                  {deleteConfirmId === selectedProject.id && (
                    <div className={styles.confirmOverlayFull}>
                      <div className={styles.confirmModal}>
                        <AlertTriangle size={32} color="#ef4444" />
                        <h3>Supprimer ce projet ?</h3>
                        <p>Cette action est irréversible. Toutes les données du projet seront perdues.</p>
                        <div className={styles.confirmButtons}>
                          <button
                            onClick={() => handleDeleteProject(selectedProject.id)}
                            className={styles.confirmYes}
                          >
                            Oui, supprimer
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className={styles.confirmNo}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section Équipe */}
                  <div className={styles.teamSection}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>
                        <Users size={20} />
                        <span>Équipe du projet</span>
                      </h2>
                      {currentUser && isAdmin(currentUser.email) && (
                        <button onClick={handleManageTeam} className={styles.addMemberButton}>
                          <Users size={16} />
                          <span>Gérer l'équipe</span>
                        </button>
                      )}
                    </div>

                    {projectTeamMembers.length > 0 ? (
                      <div className={styles.teamGrid}>
                        {projectTeamMembers.map((member) => (
                          <div key={member.id} className={styles.memberCard}>
                            <div 
                              className={styles.memberAvatar}
                              onClick={() => handleViewProfile(member.userId)}
                            >
                              {member.image ? (
                                <img src={member.image} alt={`${member.firstName} ${member.lastName}`} />
                              ) : (
                                <div className={styles.avatarPlaceholder}>
                                  {member.firstName?.[0] || '?'}
                                </div>
                              )}
                            </div>
                            
                            <div className={styles.memberInfo}>
                              <h3 className={styles.memberName}>
                                {member.firstName} {member.lastName}
                              </h3>
                              
                              {member.roles && member.roles.length > 0 && (
                                <div className={styles.memberRoles}>
                                  {member.roles.slice(0, 2).map((role, index) => (
                                    <span key={index} className={styles.roleTag}>
                                      {role}
                                    </span>
                                  ))}
                                  {member.roles.length > 2 && (
                                    <span className={styles.moreRoles}>
                                      +{member.roles.length - 2} autres
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleViewProfile(member.userId)}
                              className={styles.viewProfileButton}
                            >
                              <ExternalLink size={14} />
                              <span>Voir profil</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyTeam}>
                        <Users size={48} className={styles.emptyIcon} />
                        <h3>Aucun membre dans l'équipe</h3>
                        <p>
                          {currentUser && isAdmin(currentUser.email)
                            ? 'Ajoutez des membres pour constituer l\'équipe du projet.'
                            : 'L\'administrateur n\'a pas encore ajouté de membres à ce projet.'}
                        </p>
                        {currentUser && isAdmin(currentUser.email) && (
                          <button onClick={handleManageTeam} className={styles.addFirstMemberButton}>
                            <Users size={16} />
                            Ajouter le premier membre
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Appel à l'action pour les membres */}
                  {currentUser && 
                   selectedProject.teamMembers?.includes(currentUser.uid) && 
                   !projectTeamMembers.find(m => m.userId === currentUser.uid) && (
                    <div className={styles.callToAction}>
                      <h3>Complétez votre profil d'équipe</h3>
                      <p>
                        Vous êtes membre de ce projet mais n'avez pas encore complété votre profil d'équipe.
                        Complétez-le pour apparaître dans la liste des membres.
                      </p>
                      <button
                        onClick={() => router.push('/team')}
                        className={styles.ctaButton}
                      >
                        Compléter mon profil
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* Vue LISTE des projets */
            <>
              {/* En-tête de page */}
              <header className={styles.pageHeader}>
                <div>
                  <h1 className={styles.pageTitle}>Projets en cours</h1>
                  <p className={styles.pageSubtitle}>
                    {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className={styles.headerActions}>
                  <button
                    onClick={() => router.push('/team')}
                    className={styles.teamButton}
                  >
                    <FolderKanban size={16} />
                    <span>Mon équipe</span>
                  </button>
                  
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
              </header>

              {/* Barre de filtres et recherche */}
              <div className={styles.filterBar}>
                <div className={styles.searchContainer}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Rechercher un projet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchQuery && (
                    <button 
                      className={styles.clearSearch}
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                {currentUser && (
                  <div className={styles.filterButtons}>
                    <button
                      className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
                      onClick={() => setActiveFilter('all')}
                    >
                      Tous les projets
                    </button>
                    <button
                      className={`${styles.filterBtn} ${activeFilter === 'my' ? styles.active : ''}`}
                      onClick={() => setActiveFilter('my')}
                    >
                      Mes créations
                    </button>
                    <button
                      className={`${styles.filterBtn} ${activeFilter === 'joined' ? styles.active : ''}`}
                      onClick={() => setActiveFilter('joined')}
                    >
                      Projets rejoints
                    </button>
                  </div>
                )}
              </div>

              {/* Grille de projets */}
              {filteredProjects.length > 0 ? (
                <div className={styles.projectsGrid}>
                  <AnimatePresence mode="popLayout">
                    {filteredProjects.map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className={styles.projectCard}
                        onClick={() => handleProjectClick(project)}
                      >
                        {deleteConfirmId === project.id ? (
                          <div className={styles.confirmOverlay}>
                            <AlertTriangle size={32} />
                            <p>Supprimer ce projet ?</p>
                            <div className={styles.confirmButtons}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project.id);
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
                            <div className={styles.cardHeader}>
                              <div className={styles.projectImageSmall}>
                                <img 
                                  src={project.image} 
                                  alt={project.title}
                                  onError={(e) => {
                                    e.currentTarget.src = '/default-project.jpg';
                                  }}
                                />
                              </div>
                              
                              <div className={styles.projectActions}>
                                {currentUser && isAdmin(currentUser.email) && (
                                  <>
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
                                        // Gérer l'équipe depuis la liste
                                        setSelectedProject(project);
                                        setShowUserList(true);
                                      }}
                                      className={styles.actionBtn}
                                      title="Gérer l'équipe"
                                    >
                                      <Users size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmId(project.id);
                                      }}
                                      className={styles.actionBtn}
                                      title="Supprimer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className={styles.cardBody}>
                              <h3 className={styles.projectTitle}>{project.title}</h3>
                              <p className={styles.projectDescription}>
                                {project.description.length > 100
                                  ? `${project.description.substring(0, 100)}...`
                                  : project.description}
                              </p>
                              
                              <div className={styles.projectMeta}>
                                <div className={styles.metaItem}>
                                  <Calendar size={12} />
                                  <span>{formatDate(project.createdAt)}</span>
                                </div>
                                <div className={styles.metaItem}>
                                  <Users size={12} />
                                  <span>{project.teamMembers?.length || 0} membre(s)</span>
                                </div>
                              </div>
                              
                              {currentUser && project.teamMembers?.includes(currentUser.uid) && (
                                <div className={styles.projectStatus}>
                                  <span className={styles.statusBadge}>
                                    Vous êtes dans ce projet
                                  </span>
                                </div>
                              )}
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
            projectId={selectedProject.id}
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