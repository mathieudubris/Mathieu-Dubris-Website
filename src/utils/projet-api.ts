// projet-api.ts - Toutes les fonctions liées aux projets et à l'équipe projet

import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  Timestamp,
  writeBatch,
  increment,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '@/utils/firebase-api';

// ─────────────────────────────────────────────
// Types pour l'équipe
// ─────────────────────────────────────────────

export interface PhoneEntry {
  model: string;
  isPublic: boolean;
}

export interface ComputerEntry {
  os: 'windows' | 'mac' | 'linux';
  ram: string;
  storage: string;
  gpu?: string;
  isPublic: boolean;
}

export interface Contact {
  type: 'instagram' | 'whatsapp' | 'discord' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
  value: string;
  label?: string;
  isPublic: boolean;
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
  contacts: Contact[];
  roles: string[];
  equipment: {
    internet: 'wifi' | 'mobile' | 'both';
    phones: PhoneEntry[];
    computers: ComputerEntry[];
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
// Interfaces existantes
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
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  teamMembers: string[];
  visibility?: 'public' | 'early_access';
}

/**
 * FullProject : type renvoyé par getFullProject() / getAllProjects().
 * Combine le document principal + toutes les sous-collections (overview, media,
 * software, stats, documentation, roadmap).
 * Utilisez ce type dans ProjectCard, ProjetDetail, et tout composant qui
 * consomme le résultat de getFullProject / getAllProjects.
 */
export interface FullProject extends Project {
  // overview
  description?: string;
  projectType?: string;
  objective?: string;
  targetAudience?: string;
  status?: string;
  features?: ProjectFeature[];
  // media
  image?: string;
  carouselImages?: string[];
  // software
  software?: SoftwareItem[];
  // stats
  views?: number;
  progress?: number;
  kanbanBoardId?: string | null;
  // documentation
  docLinks?: ProjectDocLink[];
  // roadmap
  roadmapPhases?: RoadmapPhase[];
  // membres enrichis (utilisé dans ProjectCard)
  members?: Array<{
    userId?: string;
    uid?: string;
    displayName?: string;
    photoURL?: string;
  }>;
}

export interface ProjectOverview {
  description: string;
  projectType?: string;
  objective?: string;
  targetAudience?: string;
  status?: string;
  features?: ProjectFeature[];
}

export interface ProjectMedia {
  image: string;
  carouselImages: string[];
}

export interface ProjectSoftware {
  items: SoftwareItem[];
}

export interface ProjectDocumentation {
  links: ProjectDocLink[];
}

export interface ProjectStats {
  views: number;
  progress: number;
  kanbanBoardId?: string | null;
}

export interface SoftwareItem {
  id: string;
  name: string;
  logoUrl: string;
  category: string;
  color?: string;
  posX?: number;
  posY?: number;
  size?: number;
}

export interface ProjectFeature {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category: 'main' | 'secondary' | 'system';
}

// ─────────────────────────────────────────────
// Chemins Firestore centralisés
// ─────────────────────────────────────────────

const SECTION_REF = () => doc(db, 'portfolio', 'projet-en-cours');
const PROJECTS_COL = () => collection(db, 'portfolio', 'projet-en-cours', 'projects');
const PROJECT_DOC = (projectId: string) => doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId);

const OVERVIEW_DOC = (projectId: string) => doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'overview', 'main');
const MEDIA_DOC = (projectId: string) => doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'media', 'main');
const SOFTWARE_DOC = (projectId: string) => doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'software', 'items');
const TEAM_COL = (projectId: string) => collection(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'team');
const TEAM_MEMBER_DOC = (projectId: string, memberId: string) => doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'team', memberId);
const ROADMAP_PHASES_DOC = (projectId: string) => doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'roadmap', 'phases');
const ROADMAP_CANVAS_DOC = (projectId: string) => doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'roadmap', 'canvas');
const KANBAN_COLUMNS_COL = (projectId: string) => collection(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'kanban_columns');
const KANBAN_CARDS_COL = (projectId: string) => collection(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'kanban_cards');
const DOC_LINKS_DOC = (projectId: string) => doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'documentation', 'links');
const STATS_DOC = (projectId: string) => doc(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'stats', 'main');

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

export const slugExists = async (slug: string, excludeSlug?: string): Promise<boolean> => {
  try {
    if (excludeSlug && slug === excludeSlug) return false;
    const snap = await getDoc(PROJECT_DOC(slug));
    return snap.exists();
  } catch {
    return false;
  }
};

export const generateUniqueSlug = async (title: string, excludeSlug?: string): Promise<string> => {
  let slug = generateSlug(title);
  let counter = 1;
  while (await slugExists(slug, excludeSlug)) {
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
// Construction d'un projet complet
// ─────────────────────────────────────────────

export const getFullProject = async (projectId: string): Promise<any | null> => {
  try {
    const projectSnap = await getDoc(PROJECT_DOC(projectId));
    if (!projectSnap.exists()) return null;

    const projectData = projectSnap.data() as Project;

    // PERF: toutes les sous-collections en parallèle
    const [
      overviewSnap,
      mediaSnap,
      softwareSnap,
      roadmapPhasesSnap,
      docLinksSnap,
      statsSnap,
    ] = await Promise.all([
      getDoc(OVERVIEW_DOC(projectId)).catch(() => null),
      getDoc(MEDIA_DOC(projectId)).catch(() => null),
      getDoc(SOFTWARE_DOC(projectId)).catch(() => null),
      getDoc(ROADMAP_PHASES_DOC(projectId)).catch(() => null),
      getDoc(DOC_LINKS_DOC(projectId)).catch(() => null),
      getDoc(STATS_DOC(projectId)).catch(() => null),
    ]);

    return {
      id: projectId,
      ...projectData,
      ...(overviewSnap?.data() || {}),
      ...(mediaSnap?.data() || { image: '', carouselImages: [] }),
      software: softwareSnap?.data()?.items || [],
      roadmapPhases: roadmapPhasesSnap?.data()?.phases || [],
      docLinks: docLinksSnap?.data()?.links || [],
      ...(statsSnap?.data() || { views: 0, progress: 0, kanbanBoardId: null }),
    };
  } catch (error) {
    console.error('getFullProject:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// PERF: getAllProjects — fetches stats + media + software en parallèle
// FIX: software était absent → les icônes logiciels n'apparaissaient pas dans les cartes
// ─────────────────────────────────────────────

export const getAllProjects = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(PROJECTS_COL());
    if (snapshot.empty) return [];

    const ids = snapshot.docs.map((d) => d.id);

    // Charger stats, media, software ET overview pour tous les projets en parallèle simultanément
    const [statsSnaps, mediaSnaps, softwareSnaps, overviewSnaps] = await Promise.all([
      Promise.all(ids.map((id) => getDoc(STATS_DOC(id)).catch(() => null))),
      Promise.all(ids.map((id) => getDoc(MEDIA_DOC(id)).catch(() => null))),
      Promise.all(ids.map((id) => getDoc(SOFTWARE_DOC(id)).catch(() => null))),
      Promise.all(ids.map((id) => getDoc(OVERVIEW_DOC(id)).catch(() => null))),
    ]);

    return snapshot.docs.map((docSnap, i) => ({
      id: docSnap.id,
      ...docSnap.data(),
      // overview
      description: overviewSnaps[i]?.data()?.description || '',
      projectType: overviewSnaps[i]?.data()?.projectType || '',
      objective: overviewSnaps[i]?.data()?.objective || '',
      targetAudience: overviewSnaps[i]?.data()?.targetAudience || '',
      status: overviewSnaps[i]?.data()?.status || '',
      features: overviewSnaps[i]?.data()?.features || [],
      // media
      image: mediaSnaps[i]?.data()?.image || '/default-project.jpg',
      carouselImages: mediaSnaps[i]?.data()?.carouselImages || [],
      // stats
      progress: statsSnaps[i]?.data()?.progress || 0,
      views: statsSnaps[i]?.data()?.views || 0,
      kanbanBoardId: statsSnaps[i]?.data()?.kanbanBoardId || null,
      // software
      software: softwareSnaps[i]?.data()?.items || [],
    }));
  } catch (error) {
    console.error('getAllProjects:', error);
    return [];
  }
};

export const getProjects = getAllProjects;
export const getProject = getFullProject;
export const getProjectBySlug = getFullProject;

// ─────────────────────────────────────────────
// Création d'un projet
// ─────────────────────────────────────────────

export const createProject = async (projectData: any): Promise<string> => {
  try {
    const slug = projectData.slug || await generateUniqueSlug(projectData.title);

    const sectionRef = SECTION_REF();
    const sectionSnap = await getDoc(sectionRef);
    if (!sectionSnap.exists()) {
      await setDoc(sectionRef, {
        label: 'Projets en cours',
        createdAt: Timestamp.now(),
      });
    }

    const existing = await getDoc(PROJECT_DOC(slug));
    if (existing.exists()) {
      throw new Error(`Un projet avec le slug "${slug}" existe déjà.`);
    }

    const now = Timestamp.now();

    await setDoc(PROJECT_DOC(slug), {
      title: projectData.title,
      slug,
      createdBy: projectData.createdBy,
      createdAt: projectData.createdAt || now,
      updatedAt: now,
      teamMembers: projectData.teamMembers || [],
      visibility: projectData.visibility || 'public',
    });

    await setDoc(OVERVIEW_DOC(slug), {
      description: projectData.description || '',
      projectType: projectData.projectType || '',
      objective: projectData.objective || '',
      targetAudience: projectData.targetAudience || '',
      status: projectData.status || 'in_progress',
      features: projectData.features || [],
    });

    await setDoc(MEDIA_DOC(slug), {
      image: projectData.image || '/default-project.jpg',
      carouselImages: projectData.carouselImages || [],
    });

    await setDoc(SOFTWARE_DOC(slug), {
      items: projectData.software || [],
    });

    await setDoc(ROADMAP_PHASES_DOC(slug), {
      phases: projectData.roadmapPhases || [],
      updatedAt: now,
    });

    await setDoc(DOC_LINKS_DOC(slug), {
      links: projectData.docLinks || [],
    });

    await setDoc(STATS_DOC(slug), {
      views: projectData.views || 0,
      progress: projectData.progress || 0,
      kanbanBoardId: projectData.kanbanBoardId || null,
    });

    return slug;
  } catch (error) {
    console.error('createProject:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Mise à jour d'un projet
// ─────────────────────────────────────────────

export const updateProject = async (projectId: string, projectData: any): Promise<void> => {
  try {
    const now = Timestamp.now();

    await updateDoc(PROJECT_DOC(projectId), {
      title: projectData.title,
      slug: projectData.slug,
      updatedAt: now,
      teamMembers: projectData.teamMembers,
      visibility: projectData.visibility,
    });

    await setDoc(OVERVIEW_DOC(projectId), {
      description: projectData.description || '',
      projectType: projectData.projectType || '',
      objective: projectData.objective || '',
      targetAudience: projectData.targetAudience || '',
      status: projectData.status || 'in_progress',
      features: projectData.features || [],
    });

    await setDoc(MEDIA_DOC(projectId), {
      image: projectData.image || '/default-project.jpg',
      carouselImages: projectData.carouselImages || [],
    });

    await setDoc(SOFTWARE_DOC(projectId), {
      items: projectData.software || [],
    });

    await setDoc(ROADMAP_PHASES_DOC(projectId), {
      phases: projectData.roadmapPhases || [],
      updatedAt: now,
    });

    await setDoc(DOC_LINKS_DOC(projectId), {
      links: projectData.docLinks || [],
    });

    await setDoc(STATS_DOC(projectId), {
      views: projectData.views ?? 0,
      progress: projectData.progress ?? 0,
      kanbanBoardId: projectData.kanbanBoardId ?? null,
    });
  } catch (error) {
    console.error('updateProject:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Suppression d'un projet
// ─────────────────────────────────────────────

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Supprimer les sous-collections connues
    const subDocs = [
      OVERVIEW_DOC(projectId),
      MEDIA_DOC(projectId),
      SOFTWARE_DOC(projectId),
      ROADMAP_PHASES_DOC(projectId),
      ROADMAP_CANVAS_DOC(projectId),
      DOC_LINKS_DOC(projectId),
      STATS_DOC(projectId),
    ];
    subDocs.forEach((ref) => batch.delete(ref));

    // Supprimer les membres de l'équipe
    try {
      const teamSnap = await getDocs(TEAM_COL(projectId));
      teamSnap.docs.forEach((d) => batch.delete(d.ref));
    } catch (error) {
      console.log('Collection team non trouvée');
    }

    // Supprimer les colonnes kanban
    try {
      const colSnap = await getDocs(KANBAN_COLUMNS_COL(projectId));
      colSnap.docs.forEach((d) => batch.delete(d.ref));
    } catch (error) {
      console.log('Collection kanban_columns non trouvée');
    }

    // Supprimer les cartes kanban
    try {
      const cardSnap = await getDocs(KANBAN_CARDS_COL(projectId));
      cardSnap.docs.forEach((d) => batch.delete(d.ref));
    } catch (error) {
      console.log('Collection kanban_cards non trouvée');
    }

    // Supprimer le document principal
    batch.delete(PROJECT_DOC(projectId));

    // Supprimer les nouveautés liées
    try {
      const nouv = query(
        collection(db, 'nouveautes'),
        where('sourceId', '==', projectId),
        where('type', '==', 'project')
      );
      const nouvSnap = await getDocs(nouv);
      nouvSnap.docs.forEach((d) => batch.delete(d.ref));
    } catch (error) {
      console.log('Erreur lors de la suppression des nouveautés');
    }

    await batch.commit();
    console.log(`Projet ${projectId} supprimé avec succès`);
  } catch (error) {
    console.error('deleteProject - Erreur détaillée:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'permission-denied') {
      throw new Error('Permission refusée. Seul l\'administrateur peut supprimer des projets.');
    }
    throw error;
  }
};

// ─────────────────────────────────────────────
// Vues
// ─────────────────────────────────────────────

export const incrementProjectViews = async (projectId: string): Promise<void> => {
  try {
    await updateDoc(STATS_DOC(projectId), {
      views: increment(1),
    });
  } catch (error) {
    console.error('incrementProjectViews:', error);
  }
};

// ─────────────────────────────────────────────
// Roadmap
// ─────────────────────────────────────────────

export const updateProjectRoadmapPhases = async (projectId: string, phases: RoadmapPhase[]): Promise<void> => {
  try {
    await setDoc(ROADMAP_PHASES_DOC(projectId), {
      phases,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('updateProjectRoadmapPhases:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Membres du projet
// ─────────────────────────────────────────────

export const addMemberToProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    const snap = await getDoc(PROJECT_DOC(projectId));
    if (!snap.exists()) return;
    const current: string[] = snap.data().teamMembers || [];
    if (!current.includes(userId)) {
      await updateDoc(PROJECT_DOC(projectId), {
        teamMembers: [...current, userId],
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('addMemberToProject:', error);
    throw error;
  }
};

export const removeMemberFromProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    const snap = await getDoc(PROJECT_DOC(projectId));
    if (!snap.exists()) return;
    const current: string[] = snap.data().teamMembers || [];
    await updateDoc(PROJECT_DOC(projectId), {
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

export const hasAccessToProject = (project: any, userId: string | null): boolean => {
  if (!userId) return false;
  if (!project.visibility || project.visibility === 'public') return true;
  return (project.teamMembers || []).includes(userId) || project.createdBy === userId;
};

export const isUserInProject = (project: any, userId: string | null): boolean => {
  if (!userId) return false;
  return (project.teamMembers || []).includes(userId) || project.createdBy === userId;
};

export const isUserMemberOfProject = isUserInProject;

// ─────────────────────────────────────────────
// Profils équipe par projet
// ─────────────────────────────────────────────

export const getProjectTeamMembers = async (projectId: string): Promise<ProjectTeamMember[]> => {
  try {
    const snapshot = await getDocs(TEAM_COL(projectId));
    return snapshot.docs.map((d) => {
      const data = d.data();
      const equipment = data.equipment || {};

      const internet = equipment.internet || equipment.phone?.internet || 'wifi';

      let phones: PhoneEntry[] = [];
      if (equipment.phones && Array.isArray(equipment.phones) && equipment.phones.length > 0) {
        phones = equipment.phones;
      } else if (equipment.phone?.model) {
        phones = [{
          model: equipment.phone.model,
          isPublic: equipment.phone.isPublic !== undefined ? equipment.phone.isPublic : true,
        }];
      }

      let computers: ComputerEntry[] = [];
      if (equipment.computers && Array.isArray(equipment.computers) && equipment.computers.length > 0) {
        computers = equipment.computers;
      } else if (equipment.computer) {
        computers = [{
          os: equipment.computer.os || 'windows',
          ram: equipment.computer.ram || '',
          storage: equipment.computer.storage || '',
          gpu: equipment.computer.gpu || '',
          isPublic: equipment.computer.isPublic !== undefined ? equipment.computer.isPublic : true,
        }];
      }

      return {
        id: d.id,
        ...data,
        equipment: { internet, phones, computers },
      } as ProjectTeamMember;
    });
  } catch (error) {
    console.error('getProjectTeamMembers:', error);
    return [];
  }
};

export const getProjectTeamMemberBySlug = async (memberSlug: string): Promise<ProjectTeamMember | null> => {
  try {
    const q = query(collectionGroup(db, 'team'), where('slug', '==', memberSlug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as ProjectTeamMember;
  } catch (error) {
    console.error('getProjectTeamMemberBySlug:', error);
    return null;
  }
};

export const getUserProjectTeamProfile = async (
  userId: string,
  projectId: string
): Promise<ProjectTeamMember | null> => {
  try {
    const q = query(TEAM_COL(projectId), where('userId', '==', userId));
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
    const project = await getDoc(PROJECT_DOC(projectId));
    if (!project.exists()) throw new Error('Projet non trouvé');

    const q = query(TEAM_COL(projectId), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const equipment = data.equipment || {
      internet: 'wifi',
      phones: [],
      computers: [],
    };

    if (!equipment.phones || !Array.isArray(equipment.phones)) {
      equipment.phones = [];
    }
    if (!equipment.computers || !Array.isArray(equipment.computers)) {
      equipment.computers = [];
    }

    if (snapshot.empty) {
      const memberSlug = generateTeamSlug(projectId, data.firstName || '', data.lastName || '');
      const memberRef = TEAM_MEMBER_DOC(projectId, memberSlug);
      await setDoc(memberRef, {
        ...data,
        userId,
        projectId,
        slug: memberSlug,
        skills: data.skills || '',
        skillsPublic: data.skillsPublic !== undefined ? data.skillsPublic : true,
        equipment,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      await updateDoc(snapshot.docs[0].ref, {
        ...data,
        equipment,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('saveProjectTeamMember:', error);
    throw error;
  }
};

export const canEditTeamMember = async (
  userId: string,
  _projectSlug: string,
  currentUser: any
): Promise<boolean> => {
  if (!currentUser) return false;
  return currentUser.uid === userId;
};

// ─────────────────────────────────────────────
// Exports des helpers
// ─────────────────────────────────────────────

export {
  SECTION_REF,
  PROJECTS_COL,
  PROJECT_DOC,
  TEAM_COL,
  TEAM_MEMBER_DOC,
  KANBAN_COLUMNS_COL,
  KANBAN_CARDS_COL,
  STATS_DOC,
  MEDIA_DOC,
  SOFTWARE_DOC,
  ROADMAP_PHASES_DOC,
  ROADMAP_CANVAS_DOC,
  DOC_LINKS_DOC,
};