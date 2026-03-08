// projet-api.ts - Toutes les fonctions liées aux projets et à l'équipe projet
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  Timestamp,
  runTransaction,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/utils/firebase-api';

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface RoadmapPhase {
  id: string;
  title: string;
  description?: string;
  status: 'planned' | 'in-progress' | 'completed';
  startDate?: string;
  endDate?: string;
  tasks: RoadmapTask[];
  order: number;
}

export interface RoadmapTask {
  id: string;
  title: string;
  done: boolean;
}

export interface ProjectDocLink {
  id: string;
  label: string;
  fullLabel?: string;
  url: string;
  icon: 'file-text' | 'repeat' | 'kanban' | 'link' | 'book' | 'code';
  stat?: string;
}

export interface Project {
  id?: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  carouselImages?: string[];
  progress: number;
  software: any[];
  members: any[];
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  teamMembers: string[];
  views: number;
  visibility?: 'public' | 'early_access';
  // Champs overview
  projectType?: string;
  objective?: string;
  targetAudience?: string;
  status?: string;
  features?: ProjectFeature[];
  // Roadmap
  roadmapPhases?: RoadmapPhase[];
  // Kanban lié
  kanbanBoardId?: string;
  // Documentation
  docLinks?: ProjectDocLink[];
}

export interface ProjectFeature {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category: 'main' | 'secondary' | 'system';
}

export interface ProjectTeamMember {
  id?: string;
  userId: string;
  projectId: string;
  slug?: string;
  image: string;
  firstName: string;
  lastName: string;
  age: number;
  agePublic: boolean;
  email: string;
  phone: string;
  skills?: string;
  skillsPublic?: boolean;
  contacts: {
    type: 'instagram' | 'whatsapp' | 'discord' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
    value: string;
    label?: string;
    isPublic: boolean;
  }[];
  roles: string[];
  equipment: {
    phone: {
      model: string;
      internet: 'wifi' | 'mobile' | 'both';
      isPublic: boolean;
    };
    computer: {
      os: 'windows' | 'mac' | 'linux';
      ram: string;
      storage: string;
      gpu?: string;
      isPublic: boolean;
    };
  };
  location: {
    country: string;
    city: string;
    district: string;
    districtPublic: boolean;
  };
  createdAt: any;
  updatedAt: any;
}

// ─────────────────────────────────────────────
// Helpers slug
// ─────────────────────────────────────────────

export const generateSlug = (title: string): string =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const slugExists = async (slug: string, excludeProjectId?: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'projects'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    if (excludeProjectId) return snapshot.docs.some((d) => d.id !== excludeProjectId);
    return true;
  } catch {
    return false;
  }
};

export const generateUniqueSlug = async (title: string, excludeProjectId?: string): Promise<string> => {
  let slug = generateSlug(title);
  let counter = 1;
  while (await slugExists(slug, excludeProjectId)) {
    slug = `${generateSlug(title)}-${counter}`;
    counter++;
  }
  return slug;
};

export const generateTeamSlug = (projectSlug: string, firstName: string, lastName: string): string => {
  const clean = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return `${projectSlug}-${clean(firstName)}-${clean(lastName)}`;
};

// ─────────────────────────────────────────────
// Projets — CRUD
// ─────────────────────────────────────────────

const normalizeProject = (id: string, data: any): Project => ({
  id,
  slug: data.slug || generateSlug(data.title),
  ...data,
  carouselImages: data.carouselImages || [],
  progress: data.progress || 0,
  software: data.software || [],
  members: data.members || [],
  views: data.views || 0,
  teamMembers: data.teamMembers || [],
  features: data.features || [],
  roadmapPhases: data.roadmapPhases || [],
  docLinks: data.docLinks || [],
  kanbanBoardId: data.kanbanBoardId || null,
});

export const getProjects = async (): Promise<Project[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'projects'));
    return snapshot.docs.map((d) => normalizeProject(d.id, d.data()));
  } catch (error) {
    console.error('getProjects:', error);
    return [];
  }
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  try {
    const snap = await getDoc(doc(db, 'projects', projectId));
    if (!snap.exists()) return null;
    return normalizeProject(snap.id, snap.data());
  } catch (error) {
    console.error('getProject:', error);
    return null;
  }
};

export const getProjectBySlug = async (slug: string): Promise<Project | null> => {
  try {
    const q = query(collection(db, 'projects'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return normalizeProject(d.id, d.data());
  } catch (error) {
    console.error('getProjectBySlug:', error);
    return null;
  }
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(collection(db, 'projects'), where('teamMembers', 'array-contains', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeProject(d.id, d.data()));
  } catch (error) {
    console.error('getUserProjects:', error);
    return [];
  }
};

export const createProject = async (project: Omit<Project, 'id'>): Promise<string> => {
  try {
    const slug = project.slug || (await generateUniqueSlug(project.title));
    const docRef = await addDoc(collection(db, 'projects'), {
      ...project,
      slug,
      teamMembers: project.teamMembers || [],
      carouselImages: project.carouselImages || [],
      progress: project.progress || 0,
      software: project.software || [],
      members: project.members || [],
      features: project.features || [],
      roadmapPhases: project.roadmapPhases || [],
      docLinks: project.docLinks || [],
      kanbanBoardId: project.kanbanBoardId || null,
      views: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('createProject:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, projectData: Partial<Project>): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('updateProject:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'projects', projectId));

    const q = query(
      collection(db, 'nouveautes'),
      where('sourceId', '==', projectId),
      where('type', '==', 'project')
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();
  } catch (error) {
    console.error('deleteProject:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Vues - CORRIGÉ : Utilisation de increment() au lieu de transaction
// ─────────────────────────────────────────────

export const incrementProjectViews = async (projectId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    // Utilisation de increment() qui est autorisé par les règles Firestore
    // car il ne modifie que le champ views
    await updateDoc(projectRef, { 
      views: increment(1),
      updatedAt: Timestamp.now() 
    });
  } catch (error) {
    console.error('incrementProjectViews:', error);
    // Ne pas throw l'erreur pour ne pas bloquer l'UI
  }
};

// ─────────────────────────────────────────────
// Roadmap
// ─────────────────────────────────────────────

export const updateProjectRoadmap = async (projectId: string, phases: RoadmapPhase[]): Promise<void> => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      roadmapPhases: phases,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('updateProjectRoadmap:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Documentation
// ─────────────────────────────────────────────

export const updateProjectDocLinks = async (projectId: string, docLinks: ProjectDocLink[]): Promise<void> => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      docLinks,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('updateProjectDocLinks:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Kanban lié au projet
// ─────────────────────────────────────────────

export const linkKanbanToProject = async (projectId: string, kanbanBoardId: string | null): Promise<void> => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      kanbanBoardId,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('linkKanbanToProject:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Membres du projet (teamMembers UIDs)
// ─────────────────────────────────────────────

export const addMemberToProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projectRef);
    if (!snap.exists()) return;
    const current: string[] = snap.data().teamMembers || [];
    if (!current.includes(userId)) {
      await updateDoc(projectRef, { teamMembers: [...current, userId], updatedAt: Timestamp.now() });
    }
  } catch (error) {
    console.error('addMemberToProject:', error);
    throw error;
  }
};

export const removeMemberFromProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projectRef);
    if (!snap.exists()) return;
    const current: string[] = snap.data().teamMembers || [];
    await updateDoc(projectRef, {
      teamMembers: current.filter((id) => id !== userId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('removeMemberFromProject:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Accès / rôles
// ─────────────────────────────────────────────

export const hasAccessToProject = (project: Project, userId: string | null): boolean => {
  if (!userId) return false;
  if (!project.visibility || project.visibility === 'public') return true;
  return (project.teamMembers || []).includes(userId) || project.createdBy === userId;
};

export const isUserInProject = (project: Project, userId: string | null): boolean => {
  if (!userId) return false;
  return (project.teamMembers || []).includes(userId) || project.createdBy === userId;
};

export const isUserMemberOfProject = isUserInProject;

// ─────────────────────────────────────────────
// Profils équipe par projet (project_team_members)
// ─────────────────────────────────────────────

export const getProjectTeamMembers = async (projectId: string): Promise<ProjectTeamMember[]> => {
  try {
    const q = query(collection(db, 'project_team_members'), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectTeamMember));
  } catch (error) {
    console.error('getProjectTeamMembers:', error);
    return [];
  }
};

export const getProjectTeamMemberBySlug = async (slug: string): Promise<ProjectTeamMember | null> => {
  try {
    const q = query(collection(db, 'project_team_members'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as ProjectTeamMember;
  } catch (error) {
    console.error('getProjectTeamMemberBySlug:', error);
    return null;
  }
};

export const getProjectTeamMembersByProjectSlug = async (projectSlug: string): Promise<ProjectTeamMember[]> => {
  try {
    const project = await getProjectBySlug(projectSlug);
    if (!project?.id) return [];
    return getProjectTeamMembers(project.id);
  } catch (error) {
    console.error('getProjectTeamMembersByProjectSlug:', error);
    return [];
  }
};

export const getUserProjectTeamProfile = async (userId: string, projectId: string): Promise<ProjectTeamMember | null> => {
  try {
    const q = query(
      collection(db, 'project_team_members'),
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as ProjectTeamMember;
  } catch (error) {
    console.error('getUserProjectTeamProfile:', error);
    return null;
  }
};

export const saveProjectTeamMember = async (
  userId: string,
  projectId: string,
  data: Partial<ProjectTeamMember>
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Projet non trouvé');

    const teamCollection = collection(db, 'project_team_members');
    const q = query(teamCollection, where('userId', '==', userId), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const slug = generateTeamSlug(project.slug, data.firstName || '', data.lastName || '');
      await addDoc(teamCollection, {
        ...data,
        userId,
        projectId,
        slug,
        skills: data.skills || '',
        skillsPublic: data.skillsPublic !== undefined ? data.skillsPublic : true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      await updateDoc(snapshot.docs[0].ref, { ...data, updatedAt: Timestamp.now() });
    }
  } catch (error) {
    console.error('saveProjectTeamMember:', error);
    throw error;
  }
};

export const canEditTeamMember = async (
  userId: string,
  _projectId: string,
  currentUser: any
): Promise<boolean> => {
  if (!currentUser) return false;
  return currentUser.uid === userId;
};