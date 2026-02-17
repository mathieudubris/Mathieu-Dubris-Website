// firebase-api.ts - MIS À JOUR AVEC PROFILS PAR PROJET ET SLUGS
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  Timestamp,
  increment,
  runTransaction
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBrHGF359udLSaLuuCCarl4ovzCMYD-HDg",
  authDomain: "mathieu-dubris.firebaseapp.com",
  projectId: "mathieu-dubris",
  storageBucket: "mathieu-dubris.firebasestorage.app",
  messagingSenderId: "1008303076758",
  appId: "1:1008303076758:web:aa441dbb7b086def0319b7",
  measurementId: "G-B3ZL2MHVVN"
};

// Initialiser Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Exporter les services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// Configurer le provider Google
provider.setCustomParameters({
  prompt: 'select_account'
});

// Interface pour un utilisateur
export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLogin: string;
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
  visibility?: 'public' | 'early_access'; // Nouvelle propriété
}

// Interface pour un membre d'équipe PAR PROJET - AVEC SLUG
export interface ProjectTeamMember {
  id?: string;
  userId: string;
  projectId: string;
  slug?: string; // NOUVEAU
  image: string;
  firstName: string;
  lastName: string;
  age: number;
  agePublic: boolean;
  email: string;
  phone: string;
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
    };
    computer: {
      os: 'windows' | 'mac' | 'linux';
      ram: string;
      storage: string;
      gpu?: string;
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

// Interface pour les préférences utilisateur
export interface UserPreferences {
  uid: string;
  theme: 'dark' | 'light';
  createdAt: any;
  updatedAt: any;
}

// NOUVEAU: Fonction pour générer un slug à partir du titre
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD') // Normaliser les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
    .trim()
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-'); // Supprimer tirets multiples
};

// NOUVEAU: Fonction pour vérifier si un slug existe déjà
export const slugExists = async (slug: string, excludeProjectId?: string): Promise<boolean> => {
  try {
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    
    // Si on met à jour un projet, on exclut son propre ID
    if (excludeProjectId) {
      return snapshot.docs.some(doc => doc.id !== excludeProjectId);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification du slug:', error);
    return false;
  }
};

// NOUVEAU: Générer un slug unique
export const generateUniqueSlug = async (title: string, excludeProjectId?: string): Promise<string> => {
  let slug = generateSlug(title);
  let counter = 1;
  
  while (await slugExists(slug, excludeProjectId)) {
    slug = `${generateSlug(title)}-${counter}`;
    counter++;
  }
  
  return slug;
};

// NOUVEAU: Fonction pour générer un slug d'équipe unique
export const generateTeamSlug = (projectSlug: string, userFirstName: string, userLastName: string): string => {
  const firstName = userFirstName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  const lastName = userLastName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  return `${projectSlug}-${firstName}-${lastName}`;
};

// NOUVEAU: Récupérer un membre d'équipe par slug
export const getProjectTeamMemberBySlug = async (slug: string): Promise<ProjectTeamMember | null> => {
  try {
    const teamCollection = collection(db, 'project_team_members');
    const q = query(teamCollection, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ProjectTeamMember;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement du membre par slug:', error);
    return null;
  }
};

// NOUVEAU: Récupérer tous les membres d'une équipe par slug du projet
export const getProjectTeamMembersByProjectSlug = async (projectSlug: string): Promise<ProjectTeamMember[]> => {
  try {
    // D'abord, récupérer le projet par son slug
    const project = await getProjectBySlug(projectSlug);
    if (!project || !project.id) return [];
    
    // Ensuite, récupérer les membres avec l'ID du projet
    return await getProjectTeamMembers(project.id);
  } catch (error) {
    console.error('Erreur lors du chargement des membres par slug projet:', error);
    return [];
  }
};

// Fonction pour stocker/mettre à jour les infos utilisateur
export const storeUserData = async (user: User): Promise<void> => {
  try {
    if (!user.uid || !user.email) {
      console.error("Données utilisateur incomplètes");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const now = new Date().toISOString();
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        createdAt: now,
        lastLogin: now,
        providerData: user.providerData
      });
    } else {
      await setDoc(userRef, {
        displayName: user.displayName || userDoc.data()?.displayName || "",
        photoURL: user.photoURL || userDoc.data()?.photoURL || "",
        lastLogin: now
      }, { merge: true });
    }
  } catch (error) {
    console.error("Erreur lors du stockage des données utilisateur:", error);
  }
};

// Fonction pour observer l'état d'authentification
export const setupAuthListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await storeUserData(user);
    }
    callback(user);
  });
};

// Fonction pour vérifier si un utilisateur peut modifier une fiche team pour un projet spécifique
export const canEditTeamMember = async (userId: string, projectId: string, currentUser: User | null): Promise<boolean> => {
  if (!currentUser) return false;
  return currentUser.uid === userId;
};

// Fonction pour récupérer les membres de l'équipe POUR UN PROJET SPÉCIFIQUE
// Accessible à tous les utilisateurs connectés (projets publics)
// La règle Firestore autorise la lecture publique pour project_team_members
export const getProjectTeamMembers = async (projectId: string): Promise<ProjectTeamMember[]> => {
  try {
    const db = getFirestore();
    const teamCollection = collection(db, 'project_team_members');
    const q = query(teamCollection, where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    
    const members: ProjectTeamMember[] = [];
    snapshot.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() } as ProjectTeamMember);
    });
    
    return members;
  } catch (error) {
    console.error('Erreur lors du chargement des membres:', error);
    return [];
  }
};

// Fonction pour récupérer tous les projets
export const getProjects = async (): Promise<Project[]> => {
  try {
    const projectsCollection = collection(db, 'projects');
    const snapshot = await getDocs(projectsCollection);
    
    const projects: Project[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      projects.push({ 
        id: doc.id,
        slug: data.slug || generateSlug(data.title), // NOUVEAU: fallback si pas de slug
        ...data,
        carouselImages: data.carouselImages || [],
        progress: data.progress || 0,
        software: data.software || [],
        members: data.members || [],
        views: data.views || 0,
        teamMembers: data.teamMembers || []
      } as Project);
    });
    
    return projects;
  } catch (error) {
    console.error('Erreur lors du chargement des projets:', error);
    return [];
  }
};

// NOUVEAU: Fonction pour récupérer un projet par son slug
export const getProjectBySlug = async (slug: string): Promise<Project | null> => {
  try {
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return { 
        id: doc.id,
        slug: data.slug || slug,
        ...data,
        carouselImages: data.carouselImages || [],
        progress: data.progress || 0,
        software: data.software || [],
        members: data.members || [],
        views: data.views || 0,
        teamMembers: data.teamMembers || []
      } as Project;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement du projet par slug:', error);
    return null;
  }
};

// Fonction pour récupérer un projet spécifique
export const getProject = async (projectId: string): Promise<Project | null> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (projectDoc.exists()) {
      const data = projectDoc.data();
      return { 
        id: projectDoc.id,
        slug: data.slug || generateSlug(data.title), // NOUVEAU: fallback
        ...data,
        carouselImages: data.carouselImages || [],
        progress: data.progress || 0,
        software: data.software || [],
        members: data.members || [],
        views: data.views || 0,
        teamMembers: data.teamMembers || []
      } as Project;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement du projet:', error);
    return null;
  }
};

// Fonction pour créer un projet - MISE À JOUR AVEC SLUG
export const createProject = async (project: Omit<Project, 'id'>): Promise<string> => {
  try {
    // Générer un slug unique si pas fourni
    const slug = project.slug || await generateUniqueSlug(project.title);
    
    const docRef = await addDoc(collection(db, 'projects'), {
      ...project,
      slug, // NOUVEAU: ajouter le slug
      teamMembers: project.teamMembers || [],
      carouselImages: project.carouselImages || [],
      progress: project.progress || 0,
      software: project.software || [],
      members: project.members || [],
      views: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    throw error;
  }
};

// Fonction pour mettre à jour un projet - MISE À JOUR AVEC SLUG
export const updateProject = async (projectId: string, projectData: Partial<Project>): Promise<void> => {
  try {
    // Si le titre change, régénérer le slug
    if (projectData.title) {
      const newSlug = await generateUniqueSlug(projectData.title, projectId);
      projectData.slug = newSlug;
    }
    
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    throw error;
  }
};

// ✅ FONCTION CORRIGÉE POUR INCRÉMENTER LES VUES
export const incrementProjectViews = async (projectId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    
    // Utiliser une transaction pour garantir l'atomicité
    await runTransaction(db, async (transaction) => {
      const projectDoc = await transaction.get(projectRef);
      if (!projectDoc.exists()) {
        throw new Error("Le projet n'existe pas");
      }
      
      const currentViews = projectDoc.data().views || 0;
      transaction.update(projectRef, {
        views: currentViews + 1,
        updatedAt: Timestamp.now()
      });
    });
    
    console.log(`Vues incrémentées pour le projet ${projectId}`);
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation des vues:', error);
    // Ne pas bloquer l'expérience utilisateur si l'incrémentation échoue
  }
};

// Fonction pour supprimer un projet
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    throw error;
  }
};

// Fonction pour récupérer les projets d'un utilisateur
export const getUserProjects = async (userId: string): Promise<Project[]> => {
  try {
    const projectsCollection = collection(db, 'projects');
    const q = query(
      projectsCollection,
      where('teamMembers', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(q);
    const projects: Project[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      projects.push({ 
        id: doc.id,
        slug: data.slug || generateSlug(data.title), // NOUVEAU: fallback
        ...data,
        carouselImages: data.carouselImages || [],
        progress: data.progress || 0,
        software: data.software || [],
        members: data.members || [],
        views: data.views || 0,
        teamMembers: data.teamMembers || []
      } as Project);
    });
    
    return projects;
  } catch (error) {
    console.error('Erreur lors du chargement des projets utilisateur:', error);
    return [];
  }
};

// Fonction pour ajouter un membre à un projet
export const addMemberToProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      const project = projectSnap.data() as Project;
      const currentMembers = project.teamMembers || [];
      if (!currentMembers.includes(userId)) {
        const updatedMembers = [...currentMembers, userId];
        await updateDoc(projectRef, { 
          teamMembers: updatedMembers,
          updatedAt: Timestamp.now()
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du membre:', error);
    throw error;
  }
};

// Fonction pour supprimer un membre d'un projet
export const removeMemberFromProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      const project = projectSnap.data() as Project;
      const currentMembers = project.teamMembers || [];
      const updatedMembers = currentMembers.filter(id => id !== userId);
      await updateDoc(projectRef, { 
        teamMembers: updatedMembers,
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du membre:', error);
    throw error;
  }
};

// Fonction pour vérifier si l'utilisateur est admin
export const isAdmin = (userEmail: string | null): boolean => {
  return userEmail === 'mathieudubris@gmail.com';
};

// Fonction pour vérifier si un utilisateur a accès à un projet
// Les projets publics sont visibles par tous les utilisateurs connectés
// Les projets early_access sont réservés aux membres uniquement
export const hasAccessToProject = (project: Project, userId: string | null): boolean => {
  if (!userId) return false;
  // Si le projet est public (ou n'a pas de visibilité définie = public par défaut), tout le monde y a accès
  if (!project.visibility || project.visibility === 'public') return true;
  // Pour les projets early_access, seuls les membres ont accès
  const members = project.teamMembers || [];
  return members.includes(userId) || project.createdBy === userId;
};

// Fonction pour récupérer tous les utilisateurs
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    const users: UserData[] = [];
    snapshot.forEach(doc => {
      users.push(doc.data() as UserData);
    });
    
    return users;
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
    return [];
  }
};

// Fonction pour vérifier si un utilisateur est dans un projet
export const isUserInProject = (project: Project, userId: string | null): boolean => {
  if (!userId) return false;
  const members = project.teamMembers || [];
  return members.includes(userId) || project.createdBy === userId;
};

// Fonction pour récupérer le profil d'équipe d'un utilisateur POUR UN PROJET SPÉCIFIQUE
export const getUserProjectTeamProfile = async (userId: string, projectId: string): Promise<ProjectTeamMember | null> => {
  try {
    const teamCollection = collection(db, 'project_team_members');
    const q = query(
      teamCollection, 
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ProjectTeamMember;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement du profil team:', error);
    return null;
  }
};

// Fonction pour sauvegarder un membre d'équipe - AVEC SLUG
export const saveProjectTeamMember = async (userId: string, projectId: string, data: Partial<ProjectTeamMember>): Promise<void> => {
  try {
    // Récupérer le projet pour obtenir son slug
    const project = await getProject(projectId);
    if (!project) throw new Error('Projet non trouvé');
    
    // Chercher si l'utilisateur a déjà un profil pour ce projet
    const teamCollection = collection(db, 'project_team_members');
    const q = query(
      teamCollection, 
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);
    
    // Générer le slug si c'est un nouveau profil
    if (snapshot.empty) {
      const slug = generateTeamSlug(project.slug, data.firstName || '', data.lastName || '');
      
      await addDoc(teamCollection, {
        ...data,
        userId,
        projectId,
        slug, // NOUVEAU: ajout du slug
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } else {
      // Mise à jour - garder le slug existant
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    throw error;
  }
};

// Fonction pour récupérer les préférences utilisateur
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const prefRef = doc(db, 'userPreferences', userId);
    const prefDoc = await getDoc(prefRef);
    
    if (prefDoc.exists()) {
      return prefDoc.data() as UserPreferences;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    return null;
  }
};

// Fonction pour sauvegarder les préférences utilisateur
export const saveUserPreferences = async (userId: string, preferences: Partial<UserPreferences>): Promise<void> => {
  try {
    const prefRef = doc(db, 'userPreferences', userId);
    const prefDoc = await getDoc(prefRef);
    
    const prefData = {
      uid: userId,
      theme: preferences.theme || 'dark',
      ...preferences,
      updatedAt: Timestamp.now()
    };
    
    if (!prefDoc.exists()) {
      await setDoc(prefRef, {
        ...prefData,
        createdAt: Timestamp.now()
      });
    } else {
      await updateDoc(prefRef, prefData);
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences:', error);
    throw error;
  }
};

// Exporter les fonctions d'authentification
export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };