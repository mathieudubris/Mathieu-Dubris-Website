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

// Exporter les fonctions d'authentification
export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };