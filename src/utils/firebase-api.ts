// firebase-api.ts - Auth, Users, Blogs, Preferences
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

// ─────────────────────────────────────────────
// Init Firebase
// ─────────────────────────────────────────────

const firebaseConfig = {
  apiKey: 'AIzaSyBrHGF359udLSaLuuCCarl4ovzCMYD-HDg',
  authDomain: 'mathieu-dubris.firebaseapp.com',
  projectId: 'mathieu-dubris',
  storageBucket: 'mathieu-dubris.firebasestorage.app',
  messagingSenderId: '1008303076758',
  appId: '1:1008303076758:web:aa441dbb7b086def0319b7',
  measurementId: 'G-B3ZL2MHVVN',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: 'select_account' });

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLogin: string;
}

export interface BlogPost {
  id?: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  category: string;
  tags: string[];
  featuredImage: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: any;
  likesCount: number;
  viewsCount: number;
}

export interface UserPreferences {
  uid: string;
  theme: 'dark' | 'light';
  createdAt: any;
  updatedAt: any;
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export const storeUserData = async (user: User): Promise<void> => {
  try {
    if (!user.uid || !user.email) return;
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const now = new Date().toISOString();

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        createdAt: now,
        lastLogin: now,
        providerData: user.providerData,
      });
    } else {
      await setDoc(
        userRef,
        {
          displayName: user.displayName || userDoc.data()?.displayName || '',
          photoURL: user.photoURL || userDoc.data()?.photoURL || '',
          lastLogin: now,
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error('storeUserData:', error);
  }
};

export const setupAuthListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) await storeUserData(user);
    callback(user);
  });
};

export const isAdmin = (userEmail: string | null): boolean =>
  userEmail === 'mathieudubris@gmail.com';

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────

export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map((d) => d.data() as UserData);
  } catch (error) {
    console.error('getAllUsers:', error);
    return [];
  }
};

// ─────────────────────────────────────────────
// Blogs
// ─────────────────────────────────────────────

const normalizeBlog = (id: string, data: any): BlogPost => ({
  id,
  ...data,
  likesCount: data.likesCount || 0,
  viewsCount: data.viewsCount || 0,
});

export const getBlogs = async (): Promise<BlogPost[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'blogs'));
    return snapshot.docs.map((d) => normalizeBlog(d.id, d.data()));
  } catch (error) {
    console.error('getBlogs:', error);
    return [];
  }
};

export const getBlog = async (blogId: string): Promise<BlogPost | null> => {
  try {
    const snap = await getDoc(doc(db, 'blogs', blogId));
    if (!snap.exists()) return null;
    return normalizeBlog(snap.id, snap.data());
  } catch (error) {
    console.error('getBlog:', error);
    return null;
  }
};

export const deleteBlog = async (blogId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'blogs', blogId));

    const q = query(
      collection(db, 'nouveautes'),
      where('sourceId', '==', blogId),
      where('type', '==', 'blog')
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();
  } catch (error) {
    console.error('deleteBlog:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// User Preferences
// ─────────────────────────────────────────────

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'preferences', 'prefs'));
    if (!snap.exists()) return null;
    return snap.data() as UserPreferences;
  } catch (error) {
    console.error('getUserPreferences:', error);
    return null;
  }
};

export const saveUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> => {
  try {
    const prefRef = doc(db, 'users', userId, 'preferences', 'prefs');
    const prefDoc = await getDoc(prefRef);
    const prefData = { uid: userId, theme: 'dark', ...preferences, updatedAt: Timestamp.now() };

    if (!prefDoc.exists()) {
      await setDoc(prefRef, { ...prefData, createdAt: Timestamp.now() });
    } else {
      await updateDoc(prefRef, prefData);
    }
  } catch (error) {
    console.error('saveUserPreferences:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Re-exports Auth
// ─────────────────────────────────────────────

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };