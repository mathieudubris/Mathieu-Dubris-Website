// accompagnement-api.ts - Toutes les fonctions liées aux accompagnements

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
} from 'firebase/firestore';
import { db } from '@/utils/firebase-api';

// ─────────────────────────────────────────────
// Chemins Firestore : services > accompagnement > {accompagnementId}
// ─────────────────────────────────────────────

const SERVICES_DOC        = () => doc(db, 'services', 'accompagnement');
const ACCOMPAGNEMENTS_COL = () => collection(db, 'services', 'accompagnement', 'accompagnements');
const ACCOMPAGNEMENT_DOC  = (id: string) => doc(db, 'services', 'accompagnement', 'accompagnements', id);
const OVERVIEW_DOC        = (id: string) => doc(db, 'services', 'accompagnement', 'accompagnements', id, 'overview', 'main');
const MEDIA_DOC           = (id: string) => doc(db, 'services', 'accompagnement', 'accompagnements', id, 'media', 'main');
const CONTENT_DOC         = (id: string) => doc(db, 'services', 'accompagnement', 'accompagnements', id, 'content', 'main');
const STATS_DOC           = (id: string) => doc(db, 'services', 'accompagnement', 'accompagnements', id, 'stats', 'main');

// ─────────────────────────────────────────────
// Interfaces - Mêmes structures que Formation
// ─────────────────────────────────────────────

export type LessonType =
  | 'introduction'
  | 'developpement'
  | 'lecon'
  | 'pratique'
  | 'conclusion'
  | 'autre';

export interface QuizOption {
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctIndex: number;
  explanation?: string;
}

export interface LessonResource {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'link' | 'zip' | 'doc' | 'video' | 'autre';
}

export interface AccompagnementLesson {
  id: string;
  title: string;
  type: LessonType;
  duration?: string;
  videoUrl?: string;
  notes?: string;
  resources?: LessonResource[];
  quiz?: QuizQuestion[];
  order: number;
}

export interface AccompagnementModule {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  order: number;
  lessons?: AccompagnementLesson[];
}

export interface Accompagnement {
  id?: string;
  title: string;
  slug: string;
  category: string;
  level: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  language: string;
  duration?: string;
  price?: number;
  currency?: string;
  visibility: 'public' | 'members_only';
  teamMembers: string[];
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface FullAccompagnement extends Accompagnement {
  description?: string;
  objective?: string;
  targetAudience?: string;
  prerequisites?: string;
  image?: string;
  carouselImages?: Array<string | { url: string; type: string; caption?: string }>;
  modules?: AccompagnementModule[];
  views?: number;
  totalParticipants?: number;
  activeParticipants?: number;
  members?: Array<{
    userId?: string;
    uid?: string;
    displayName?: string;
    photoURL?: string;
    email?: string;
  }>;
  favoritedBy?: string[];
}

// ─────────────────────────────────────────────
// Slug
// ─────────────────────────────────────────────

export const generateAccompagnementSlug = (title: string): string =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const accompagnementSlugExists = async (slug: string, excludeSlug?: string): Promise<boolean> => {
  try {
    if (excludeSlug && slug === excludeSlug) return false;
    const snap = await getDoc(ACCOMPAGNEMENT_DOC(slug));
    return snap.exists();
  } catch {
    return false;
  }
};

export const generateUniqueAccompagnementSlug = async (title: string, excludeSlug?: string): Promise<string> => {
  let slug = generateAccompagnementSlug(title);
  let counter = 1;
  while (await accompagnementSlugExists(slug, excludeSlug)) {
    slug = `${generateAccompagnementSlug(title)}-${counter}`;
    counter++;
  }
  return slug;
};

// ─────────────────────────────────────────────
// Lecture
// ─────────────────────────────────────────────

export const getAllAccompagnements = async (userId?: string | null): Promise<FullAccompagnement[]> => {
  try {
    const col = ACCOMPAGNEMENTS_COL();

    const publicQuery = query(col, where('visibility', '==', 'public'));

    const memberQueries = userId
      ? [
          query(col, where('visibility', '==', 'members_only'), where('teamMembers', 'array-contains', userId)),
          query(col, where('visibility', '==', 'members_only'), where('createdBy', '==', userId)),
        ]
      : [];

    const [publicSnap, ...memberSnaps] = await Promise.all([
      getDocs(publicQuery),
      ...memberQueries.map((q) => getDocs(q)),
    ]);

    const docsById = new Map<string, FullAccompagnement>();

    for (const snap of [publicSnap, ...memberSnaps]) {
      for (const d of snap.docs) {
        if (!docsById.has(d.id)) {
          docsById.set(d.id, { id: d.id, ...d.data() } as FullAccompagnement);
        }
      }
    }

    const accompagnements = Array.from(docsById.values());

    const enriched = await Promise.all(
      accompagnements.map(async (f) => {
        try {
          const [overviewSnap, mediaSnap, statsSnap] = await Promise.all([
            getDoc(OVERVIEW_DOC(f.id!)).catch(() => null),
            getDoc(MEDIA_DOC(f.id!)).catch(() => null),
            getDoc(STATS_DOC(f.id!)).catch(() => null),
          ]);
          return {
            ...f,
            ...(overviewSnap?.exists() ? overviewSnap.data() : {}),
            ...(mediaSnap?.exists() ? mediaSnap.data() : {}),
            views: statsSnap?.exists() ? (statsSnap.data()?.views ?? 0) : 0,
            totalParticipants: statsSnap?.exists() ? (statsSnap.data()?.totalParticipants ?? 0) : 0,
            activeParticipants: statsSnap?.exists() ? (statsSnap.data()?.activeParticipants ?? 0) : 0,
          } as FullAccompagnement;
        } catch {
          return f;
        }
      })
    );

    return enriched;
  } catch (error) {
    console.error('getAllAccompagnements:', error);
    return [];
  }
};

export const getFullAccompagnement = async (accompagnementId: string): Promise<FullAccompagnement | null> => {
  try {
    const mainSnap = await getDoc(ACCOMPAGNEMENT_DOC(accompagnementId));
    if (!mainSnap.exists()) return null;
    const main = { id: mainSnap.id, ...mainSnap.data() } as Accompagnement;

    const [overviewSnap, mediaSnap, contentSnap, statsSnap] = await Promise.all([
      getDoc(OVERVIEW_DOC(accompagnementId)).catch(() => null),
      getDoc(MEDIA_DOC(accompagnementId)).catch(() => null),
      getDoc(CONTENT_DOC(accompagnementId)).catch(() => null),
      getDoc(STATS_DOC(accompagnementId)).catch(() => null),
    ]);

    return {
      ...main,
      ...(overviewSnap?.exists() ? overviewSnap.data() : {}),
      ...(mediaSnap?.exists() ? mediaSnap.data() : {}),
      modules: contentSnap?.exists() ? (contentSnap.data()?.modules ?? []) : [],
      views: statsSnap?.exists() ? (statsSnap.data()?.views ?? 0) : 0,
      totalParticipants: statsSnap?.exists() ? (statsSnap.data()?.totalParticipants ?? 0) : 0,
      activeParticipants: statsSnap?.exists() ? (statsSnap.data()?.activeParticipants ?? 0) : 0,
    } as FullAccompagnement;
  } catch (error) {
    console.error('getFullAccompagnement:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// Écriture
// ─────────────────────────────────────────────

export interface SaveAccompagnementPayload {
  title: string;
  slug: string;
  category: string;
  level: Accompagnement['level'];
  language: string;
  duration?: string;
  price?: number;
  currency?: string;
  visibility: Accompagnement['visibility'];
  teamMembers: string[];
  createdBy: string;
  description?: string;
  objective?: string;
  targetAudience?: string;
  prerequisites?: string;
  image?: string;
  carouselImages?: any[];
  modules?: AccompagnementModule[];
  views?: number;
  totalParticipants?: number;
  activeParticipants?: number;
}

export const saveAccompagnement = async (
  payload: SaveAccompagnementPayload,
  existingId?: string
): Promise<string> => {
  try {
    const isNew = !existingId;
    const id = existingId || payload.slug;
    const now = Timestamp.now();

    const batch = writeBatch(db);

    batch.set(SERVICES_DOC(), { updatedAt: now }, { merge: true });

    const mainData: any = {
      title: payload.title,
      slug: payload.slug,
      category: payload.category,
      level: payload.level,
      language: payload.language,
      duration: payload.duration || '',
      price: payload.price ?? null,
      currency: payload.currency || 'EUR',
      visibility: payload.visibility,
      teamMembers: payload.teamMembers,
      createdBy: payload.createdBy,
      updatedAt: now,
    };
    if (isNew) mainData.createdAt = now;

    if (isNew) {
      batch.set(ACCOMPAGNEMENT_DOC(id), mainData);
    } else {
      batch.update(ACCOMPAGNEMENT_DOC(id), mainData);
    }

    batch.set(OVERVIEW_DOC(id), {
      description: payload.description || '',
      objective: payload.objective || '',
      targetAudience: payload.targetAudience || '',
      prerequisites: payload.prerequisites || '',
      updatedAt: now,
    }, { merge: true });

    batch.set(MEDIA_DOC(id), {
      image: payload.image || '',
      carouselImages: payload.carouselImages || [],
      updatedAt: now,
    }, { merge: true });

    batch.set(CONTENT_DOC(id), {
      modules: payload.modules || [],
      updatedAt: now,
    }, { merge: true });

    if (isNew) {
      batch.set(STATS_DOC(id), {
        views: payload.views ?? 0,
        totalParticipants: payload.totalParticipants ?? 0,
        activeParticipants: payload.activeParticipants ?? 0,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const statsUpdate: any = { updatedAt: now };
      if (payload.views !== undefined) statsUpdate.views = payload.views;
      if (payload.totalParticipants !== undefined) statsUpdate.totalParticipants = payload.totalParticipants;
      if (payload.activeParticipants !== undefined) statsUpdate.activeParticipants = payload.activeParticipants;
      batch.update(STATS_DOC(id), statsUpdate);
    }

    await batch.commit();
    return id;
  } catch (error) {
    console.error('saveAccompagnement:', error);
    throw error;
  }
};

export const deleteAccompagnement = async (accompagnementId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    for (const subDoc of [
      OVERVIEW_DOC(accompagnementId),
      MEDIA_DOC(accompagnementId),
      CONTENT_DOC(accompagnementId),
      STATS_DOC(accompagnementId),
    ]) {
      batch.delete(subDoc);
    }
    batch.delete(ACCOMPAGNEMENT_DOC(accompagnementId));
    await batch.commit();
  } catch (error) {
    console.error('deleteAccompagnement:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Vues
// ─────────────────────────────────────────────

export const incrementAccompagnementViews = async (accompagnementId: string): Promise<void> => {
  try {
    await updateDoc(STATS_DOC(accompagnementId), { views: increment(1) });
  } catch (error) {
    console.error('incrementAccompagnementViews:', error);
  }
};

// ─────────────────────────────────────────────
// Membres
// ─────────────────────────────────────────────

export const hasAccessToAccompagnement = (accompagnement: any, userId: string | null): boolean => {
  if (!userId) return false;
  if (accompagnement.visibility === 'public') return true;
  return (accompagnement.teamMembers || []).includes(userId) || accompagnement.createdBy === userId;
};

export const isUserInAccompagnement = (accompagnement: any, userId: string | null): boolean => {
  if (!userId) return false;
  return (accompagnement.teamMembers || []).includes(userId) || accompagnement.createdBy === userId;
};

export const addMemberToAccompagnement = async (accompagnementId: string, userId: string): Promise<void> => {
  try {
    const snap = await getDoc(ACCOMPAGNEMENT_DOC(accompagnementId));
    if (!snap.exists()) return;
    const current: string[] = snap.data().teamMembers || [];
    if (!current.includes(userId)) {
      await updateDoc(ACCOMPAGNEMENT_DOC(accompagnementId), {
        teamMembers: [...current, userId],
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('addMemberToAccompagnement:', error);
    throw error;
  }
};

export const removeMemberFromAccompagnement = async (accompagnementId: string, userId: string): Promise<void> => {
  try {
    const snap = await getDoc(ACCOMPAGNEMENT_DOC(accompagnementId));
    if (!snap.exists()) return;
    const current: string[] = snap.data().teamMembers || [];
    await updateDoc(ACCOMPAGNEMENT_DOC(accompagnementId), {
      teamMembers: current.filter((id) => id !== userId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('removeMemberFromAccompagnement:', error);
    throw error;
  }
};

export {
  SERVICES_DOC,
  ACCOMPAGNEMENTS_COL,
  ACCOMPAGNEMENT_DOC,
  OVERVIEW_DOC,
  MEDIA_DOC,
  CONTENT_DOC,
  STATS_DOC,
};

// ─────────────────────────────────────────────
// Favoris
// ─────────────────────────────────────────────

const FAVORITES_COL = (userId: string) => collection(db, 'users', userId, 'favorites');
const FAVORITE_DOC  = (userId: string, accompagnementId: string) =>
  doc(db, 'users', userId, 'favorites', accompagnementId);

export const getUserFavorites = async (userId: string): Promise<string[]> => {
  try {
    const snap = await getDocs(FAVORITES_COL(userId));
    return snap.docs.map((d) => d.id);
  } catch {
    return [];
  }
};

export const toggleFavorite = async (userId: string, accompagnementId: string): Promise<boolean> => {
  try {
    const ref = FAVORITE_DOC(userId, accompagnementId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
      return false;
    } else {
      await setDoc(ref, { addedAt: Timestamp.now() });
      return true;
    }
  } catch (error) {
    console.error('toggleFavorite:', error);
    throw error;
  }
};