// nouveautes-api.ts - API dédiée à la gestion des nouveautés
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
  orderBy,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { getApps, getApp, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBrHGF359udLSaLuuCCarl4ovzCMYD-HDg",
  authDomain: "mathieu-dubris.firebaseapp.com",
  projectId: "mathieu-dubris",
  storageBucket: "mathieu-dubris.firebasestorage.app",
  messagingSenderId: "1008303076758",
  appId: "1:1008303076758:web:aa441dbb7b086def0319b7",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ─── Types ────────────────────────────────────────────────────────────────────

export type NouveauteType = 'project' | 'blog';

export interface Nouveaute {
  id?: string;
  // identifiant du contenu source (projectId ou blogId)
  sourceId: string;
  // type de contenu
  type: NouveauteType;
  // position dans le carousel (1 à 5)
  position: number;
  // données dénormalisées pour affichage rapide
  title: string;
  description: string;
  image: string;
  // lien de destination (simplifié)
  link: string;
  // label du bouton CTA
  ctaLabel: string;
  // métadonnées
  createdAt: any;
  updatedAt: any;
  // optionnel : membres (projets)
  members?: any[];
  software?: any[];
  progress?: number;
  // optionnel : tags (blogs)
  tags?: string[];
  category?: string;
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

/** Récupère toutes les nouveautés triées par position */
export const getNouveautes = async (): Promise<Nouveaute[]> => {
  try {
    const col = collection(db, 'nouveautes');
    const q = query(col, orderBy('position', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Nouveaute));
  } catch (error) {
    console.error('Erreur getNouveautes:', error);
    return [];
  }
};

/** Récupère la nouveauté liée à un contenu source (s'il existe) */
export const getNouveauteBySource = async (sourceId: string): Promise<Nouveaute | null> => {
  try {
    const col = collection(db, 'nouveautes');
    const q = query(col, where('sourceId', '==', sourceId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as Nouveaute;
  } catch (error) {
    console.error('Erreur getNouveauteBySource:', error);
    return null;
  }
};

/** Récupère la nouveauté occupant une position donnée */
export const getNouveauteByPosition = async (position: number): Promise<Nouveaute | null> => {
  try {
    const col = collection(db, 'nouveautes');
    const q = query(col, where('position', '==', position));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as Nouveaute;
  } catch (error) {
    console.error('Erreur getNouveauteByPosition:', error);
    return null;
  }
};

// ─── Écriture ─────────────────────────────────────────────────────────────────

/**
 * Ajoute ou met à jour une nouveauté.
 * Si la position choisie est déjà occupée par un AUTRE contenu, on swipe les deux.
 */
export const upsertNouveaute = async (data: Omit<Nouveaute, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const col = collection(db, 'nouveautes');
    const now = Timestamp.now();

    // Chercher si ce contenu source existe déjà
    const existingQ = query(col, where('sourceId', '==', data.sourceId));
    const existingSnap = await getDocs(existingQ);

    // Chercher si la position cible est déjà occupée
    const posQ = query(col, where('position', '==', data.position));
    const posSnap = await getDocs(posQ);

    const existingDoc = existingSnap.empty ? null : existingSnap.docs[0];
    const posDoc = posSnap.empty ? null : posSnap.docs[0];

    // Si la position est occupée par quelqu'un d'autre → swap
    if (posDoc && posDoc.id !== existingDoc?.id) {
      const oldPosition = existingDoc ? existingDoc.data().position : null;
      // Mettre l'ancien occupant à l'ancienne position (ou le supprimer si nouveau)
      if (oldPosition !== null) {
        batch.update(posDoc.ref, { position: oldPosition, updatedAt: now });
      } else {
        // Le nouveau n'avait pas de position → l'ancien garde la sienne si on ne force pas
        // On l'écrase quand même car l'admin a choisi cette position
        batch.update(posDoc.ref, { position: oldPosition ?? posDoc.data().position, updatedAt: now });
      }
    }

    if (existingDoc) {
      // Mise à jour
      batch.update(existingDoc.ref, { ...data, updatedAt: now });
    } else {
      // Création
      const newRef = doc(col);
      batch.set(newRef, { ...data, createdAt: now, updatedAt: now });
    }

    await batch.commit();
  } catch (error) {
    console.error('Erreur upsertNouveaute:', error);
    throw error;
  }
};

/** Retire un contenu des nouveautés */
export const removeNouveaute = async (sourceId: string): Promise<void> => {
  try {
    const col = collection(db, 'nouveautes');
    const q = query(col, where('sourceId', '==', sourceId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    console.error('Erreur removeNouveaute:', error);
    throw error;
  }
};

/**
 * Vérifie si une source (projet/blog) existe encore
 */
export const checkSourceExists = async (sourceId: string, type: NouveauteType): Promise<boolean> => {
  try {
    if (type === 'project') {
      const projectRef = doc(db, 'projects', sourceId);
      const projectDoc = await getDoc(projectRef);
      return projectDoc.exists();
    } else {
      const blogRef = doc(db, 'blogs', sourceId);
      const blogDoc = await getDoc(blogRef);
      return blogDoc.exists();
    }
  } catch (error) {
    console.error('Erreur checkSourceExists:', error);
    return false;
  }
};

/**
 * Nettoie les nouveautés orphelines (sources supprimées)
 */
export const cleanupOrphanedNouveautes = async (): Promise<number> => {
  try {
    const nouveautes = await getNouveautes();
    const batch = writeBatch(db);
    let count = 0;
    
    for (const n of nouveautes) {
      const exists = await checkSourceExists(n.sourceId, n.type);
      if (!exists) {
        const ref = doc(db, 'nouveautes', n.id!);
        batch.delete(ref);
        count++;
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
    
    return count;
  } catch (error) {
    console.error('Erreur cleanupOrphanedNouveautes:', error);
    return 0;
  }
};