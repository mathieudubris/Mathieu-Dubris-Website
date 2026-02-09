// firebase-api.ts - MIS À JOUR AVEC CAROUSEL, VIEWS, PROGRESS, SOFTWARE
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
  increment
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

// Interface pour un projet - MISE À JOUR
export interface Project {
  id?: string;
  title: string;
  description: string;
  image: string;
  carouselImages: string[]; // NOUVEAU: Images du carousel
  progress: number; // NOUVEAU: Pourcentage de progression
  software: any[]; // NOUVEAU: Logiciels utilisés
  members: any[]; // NOUVEAU: Données enrichies des membres
  views: number; // NOUVEAU: Nombre de vues
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  teamMembers: string[];
}

// Interface pour un membre d'équipe
export interface TeamMember {
  id?: string;
  userId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

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
      // Créer un nouvel utilisateur
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        createdAt: now,
        lastLogin: now,
        providerData: user.providerData
      });
      console.log("Nouvel utilisateur créé dans Firestore");
    } else {
      // Mettre à jour la dernière connexion
      await setDoc(userRef, {
        displayName: user.displayName || userDoc.data()?.displayName || "",
        photoURL: user.photoURL || userDoc.data()?.photoURL || "",
        lastLogin: now
      }, { merge: true });
      console.log("Dernière connexion mise à jour");
    }
  } catch (error) {
    console.error("Erreur lors du stockage des données utilisateur:", error);
  }
};

// Fonction pour récupérer les données utilisateur
export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération des données utilisateur:", error);
    return null;
  }
};

// Fonction pour observer l'état d'authentification
export const setupAuthListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Stocker les données utilisateur quand il se connecte
      await storeUserData(user);
    }
    callback(user);
  });
};

// Fonction pour vérifier si un utilisateur peut modifier une fiche team
export const canEditTeamMember = async (userId: string, currentUser: User | null): Promise<boolean> => {
  if (!currentUser) return false;
  return currentUser.uid === userId;
};

// Fonction pour récupérer les membres de l'équipe
export const getTeamMembers = async (): Promise<any[]> => {
  try {
    const db = getFirestore();
    const teamCollection = collection(db, 'team');
    const snapshot = await getDocs(teamCollection);
    
    const members: any[] = [];
    snapshot.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
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
        ...data,
        carouselImages: data.carouselImages || [],
        progress: data.progress || 0,
        software: data.software || [],
        members: data.members || [],
        views: data.views || 0
      } as Project);
    });
    
    // Assurer que teamMembers est toujours un tableau
    return projects.map(project => ({
      ...project,
      teamMembers: project.teamMembers || []
    }));
  } catch (error) {
    console.error('Erreur lors du chargement des projets:', error);
    return [];
  }
};

// Fonction pour récupérer un projet spécifique
export const getProject = async (projectId: string): Promise<Project | null> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (projectDoc.exists()) {
      const data = projectDoc.data();
      const project = { 
        id: projectDoc.id, 
        ...data,
        carouselImages: data.carouselImages || [],
        progress: data.progress || 0,
        software: data.software || [],
        members: data.members || [],
        views: data.views || 0
      } as Project;
      return {
        ...project,
        teamMembers: project.teamMembers || []
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement du projet:', error);
    return null;
  }
};

// Fonction pour créer un projet
export const createProject = async (project: Omit<Project, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'projects'), {
      ...project,
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

// Fonction pour mettre à jour un projet
export const updateProject = async (projectId: string, projectData: Partial<Project>): Promise<void> => {
  try {
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

// Fonction pour incrémenter les vues d'un projet
export const incrementProjectViews = async (projectId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation des vues:', error);
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
      const project = { 
        id: doc.id, 
        ...data,
        carouselImages: data.carouselImages || [],
        progress: data.progress || 0,
        software: data.software || [],
        members: data.members || [],
        views: data.views || 0
      } as Project;
      projects.push({
        ...project,
        teamMembers: project.teamMembers || []
      });
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
      const updatedMembers = Array.from(new Set([...currentMembers, userId]));
      await updateDoc(projectRef, { 
        teamMembers: updatedMembers,
        updatedAt: Timestamp.now()
      });
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
export const hasAccessToProject = (project: Project, userId: string | null): boolean => {
  if (!userId) return false;
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

// Fonction pour récupérer les membres d'un projet spécifique
export const getProjectTeamMembers = async (projectId: string): Promise<any[]> => {
  try {
    const project = await getProject(projectId);
    if (!project) return [];
    
    const allTeamMembers = await getTeamMembers();
    return allTeamMembers.filter(member => 
      project.teamMembers?.includes(member.userId)
    );
  } catch (error) {
    console.error('Erreur lors du chargement des membres du projet:', error);
    return [];
  }
};

// Fonction pour récupérer le profil d'équipe d'un utilisateur
export const getUserTeamProfile = async (userId: string): Promise<any> => {
  try {
    const userRef = doc(db, 'team', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement du profil team:', error);
    return null;
  }
};

// Exporter les fonctions d'authentification
export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };

// Dans firebase-api.ts, ajoutez cette interface et ces fonctions

// Interface pour les préférences utilisateur
export interface UserPreferences {
  uid: string;
  theme: 'dark' | 'light';
  language?: string;
  createdAt: any;
  updatedAt: any;
}

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

// Fonction pour appliquer le thème immédiatement
export const applyTheme = (theme: string) => {
  if (theme === 'light') {
    document.documentElement.classList.add('light-theme');
    document.body.classList.add('light-theme');
  } else {
    document.documentElement.classList.remove('light-theme');
    document.body.classList.remove('light-theme');
  }
};

// Fonction pour initialiser le thème au chargement
export const initializeTheme = async (user: User | null) => {
  let theme = 'dark';
  
  if (user) {
    // Essayer de récupérer depuis Firestore
    const prefs = await getUserPreferences(user.uid);
    if (prefs?.theme) {
      theme = prefs.theme;
    }
  } else {
    // Sinon utiliser localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      theme = savedTheme;
    }
  }
  
  applyTheme(theme);
  return theme;
};


