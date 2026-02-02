// firebase-api.ts
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
  getDocs
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

// Fonction pour récupérer les membres de l'équipe (avec sécurité)
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

// Exporter les fonctions d'authentification
export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
// Ajoute ces fonctions à la fin du fichier firebase-api.ts (après getTeamMembers)

// Interface pour un projet
export interface Project {
  id?: string;
  title: string;
  description: string;
  image: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  teamMembers: string[]; // Liste des IDs des utilisateurs ajoutés au projet
}

// Fonction pour récupérer tous les projets
export const getProjects = async (): Promise<Project[]> => {
  try {
    const db = getFirestore();
    const projectsCollection = collection(db, 'projects');
    const snapshot = await getDocs(projectsCollection);
    
    const projects: Project[] = [];
    snapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });
    
    return projects;
  } catch (error) {
    console.error('Erreur lors du chargement des projets:', error);
    return [];
  }
};

// Fonction pour créer un projet
export const createProject = async (project: Omit<Project, 'id'>): Promise<string> => {
  try {
    const db = getFirestore();
    const docRef = await addDoc(collection(db, 'projects'), project);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    throw error;
  }
};

// Fonction pour mettre à jour un projet
export const updateProject = async (projectId: string, projectData: Partial<Project>): Promise<void> => {
  try {
    const db = getFirestore();
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, projectData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    throw error;
  }
};

// Fonction pour supprimer un projet
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const db = getFirestore();
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
    const allProjects = await getProjects();
    return allProjects.filter(project => 
      project.teamMembers?.includes(userId) || project.createdBy === userId
    );
  } catch (error) {
    console.error('Erreur lors du chargement des projets utilisateur:', error);
    return [];
  }
};

// Fonction pour ajouter un membre à un projet
export const addMemberToProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    const db = getFirestore();
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      const project = projectSnap.data() as Project;
      const updatedMembers = [...(project.teamMembers || []), userId];
      await updateDoc(projectRef, { teamMembers: updatedMembers });
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du membre:', error);
    throw error;
  }
};

// Fonction pour supprimer un membre d'un projet
export const removeMemberFromProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    const db = getFirestore();
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      const project = projectSnap.data() as Project;
      const updatedMembers = (project.teamMembers || []).filter(id => id !== userId);
      await updateDoc(projectRef, { teamMembers: updatedMembers });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du membre:', error);
    throw error;
  }
};

// Fonction pour vérifier si l'utilisateur est admin (toi)
export const isAdmin = (userEmail: string | null): boolean => {
  return userEmail === 'mathieudubris@gmail.com';
};

// N'oublie pas d'importer les fonctions Firestore nécessaires
import {
  // ... autres imports existants
  addDoc,
  updateDoc
} from "firebase/firestore";