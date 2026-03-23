// formation-api.ts - Toutes les fonctions liées aux formations

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
// Chemins Firestore : services > formation > {formationId}
// ─────────────────────────────────────────────

const SERVICES_DOC   = () => doc(db, 'services', 'formation');
const FORMATIONS_COL = () => collection(db, 'services', 'formation', 'formations');
const FORMATION_DOC  = (id: string) => doc(db, 'services', 'formation', 'formations', id);
const OVERVIEW_DOC   = (id: string) => doc(db, 'services', 'formation', 'formations', id, 'overview', 'main');
const MEDIA_DOC      = (id: string) => doc(db, 'services', 'formation', 'formations', id, 'media', 'main');
const CONTENT_DOC    = (id: string) => doc(db, 'services', 'formation', 'formations', id, 'content', 'main');
const STATS_DOC      = (id: string) => doc(db, 'services', 'formation', 'formations', id, 'stats', 'main');

// ─────────────────────────────────────────────
// Interfaces
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

export interface FormationLesson {
  id: string;
  title: string;
  type: LessonType;
  duration?: string;
  videoUrl?: string;   // URL Cloudinary
  notes?: string;      // Notes admin visibles par les membres
  resources?: LessonResource[];
  quiz?: QuizQuestion[];
  order: number;
}

export interface FormationModule {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  order: number;
  lessons?: FormationLesson[];
}

export interface Formation {
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

export interface FullFormation extends Formation {
  description?: string;
  objective?: string;
  targetAudience?: string;
  prerequisites?: string;
  image?: string;
  carouselImages?: Array<string | { url: string; type: string; caption?: string }>;
  modules?: FormationModule[];
  views?: number;
  members?: Array<{
    userId?: string;
    uid?: string;
    displayName?: string;
    photoURL?: string;
    email?: string;
  }>;
}

// ─────────────────────────────────────────────
// Slug
// ─────────────────────────────────────────────

export const generateFormationSlug = (title: string): string =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const formationSlugExists = async (slug: string, excludeSlug?: string): Promise<boolean> => {
  try {
    if (excludeSlug && slug === excludeSlug) return false;
    const snap = await getDoc(FORMATION_DOC(slug));
    return snap.exists();
  } catch {
    return false;
  }
};

export const generateUniqueFormationSlug = async (title: string, excludeSlug?: string): Promise<string> => {
  let slug = generateFormationSlug(title);
  let counter = 1;
  while (await formationSlugExists(slug, excludeSlug)) {
    slug = `${generateFormationSlug(title)}-${counter}`;
    counter++;
  }
  return slug;
};

// ─────────────────────────────────────────────
// Lecture
// ─────────────────────────────────────────────

export const getAllFormations = async (userId?: string | null): Promise<FullFormation[]> => {
  try {
    const col = FORMATIONS_COL();

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

    const docsById = new Map<string, FullFormation>();

    for (const snap of [publicSnap, ...memberSnaps]) {
      for (const d of snap.docs) {
        if (!docsById.has(d.id)) {
          docsById.set(d.id, { id: d.id, ...d.data() } as FullFormation);
        }
      }
    }

    const formations = Array.from(docsById.values());

    const enriched = await Promise.all(
      formations.map(async (f) => {
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
          } as FullFormation;
        } catch {
          return f;
        }
      })
    );

    return enriched;
  } catch (error) {
    console.error('getAllFormations:', error);
    return [];
  }
};

export const getFullFormation = async (formationId: string): Promise<FullFormation | null> => {
  try {
    const mainSnap = await getDoc(FORMATION_DOC(formationId));
    if (!mainSnap.exists()) return null;
    const main = { id: mainSnap.id, ...mainSnap.data() } as Formation;

    const [overviewSnap, mediaSnap, contentSnap, statsSnap] = await Promise.all([
      getDoc(OVERVIEW_DOC(formationId)).catch(() => null),
      getDoc(MEDIA_DOC(formationId)).catch(() => null),
      getDoc(CONTENT_DOC(formationId)).catch(() => null),
      getDoc(STATS_DOC(formationId)).catch(() => null),
    ]);

    return {
      ...main,
      ...(overviewSnap?.exists() ? overviewSnap.data() : {}),
      ...(mediaSnap?.exists() ? mediaSnap.data() : {}),
      modules: contentSnap?.exists() ? (contentSnap.data()?.modules ?? []) : [],
      views: statsSnap?.exists() ? (statsSnap.data()?.views ?? 0) : 0,
    } as FullFormation;
  } catch (error) {
    console.error('getFullFormation:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// Écriture
// ─────────────────────────────────────────────

export interface SaveFormationPayload {
  title: string;
  slug: string;
  category: string;
  level: Formation['level'];
  language: string;
  duration?: string;
  price?: number;
  currency?: string;
  visibility: Formation['visibility'];
  teamMembers: string[];
  createdBy: string;
  description?: string;
  objective?: string;
  targetAudience?: string;
  prerequisites?: string;
  image?: string;
  carouselImages?: any[];
  modules?: FormationModule[];
  views?: number;
}

export const saveFormation = async (
  payload: SaveFormationPayload,
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
      batch.set(FORMATION_DOC(id), mainData);
    } else {
      batch.update(FORMATION_DOC(id), mainData);
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
        createdAt: now,
        updatedAt: now,
      });
    } else if (payload.views !== undefined) {
      batch.update(STATS_DOC(id), { views: payload.views, updatedAt: now });
    }

    await batch.commit();
    return id;
  } catch (error) {
    console.error('saveFormation:', error);
    throw error;
  }
};

export const deleteFormation = async (formationId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    for (const subDoc of [
      OVERVIEW_DOC(formationId),
      MEDIA_DOC(formationId),
      CONTENT_DOC(formationId),
      STATS_DOC(formationId),
    ]) {
      batch.delete(subDoc);
    }
    batch.delete(FORMATION_DOC(formationId));
    await batch.commit();
  } catch (error) {
    console.error('deleteFormation:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Vues
// ─────────────────────────────────────────────

export const incrementFormationViews = async (formationId: string): Promise<void> => {
  try {
    await updateDoc(STATS_DOC(formationId), { views: increment(1) });
  } catch (error) {
    console.error('incrementFormationViews:', error);
  }
};

// ─────────────────────────────────────────────
// Membres
// ─────────────────────────────────────────────

export const hasAccessToFormation = (formation: any, userId: string | null): boolean => {
  if (!userId) return false;
  if (formation.visibility === 'public') return true;
  return (formation.teamMembers || []).includes(userId) || formation.createdBy === userId;
};

export const isUserInFormation = (formation: any, userId: string | null): boolean => {
  if (!userId) return false;
  return (formation.teamMembers || []).includes(userId) || formation.createdBy === userId;
};

export const addMemberToFormation = async (formationId: string, userId: string): Promise<void> => {
  try {
    const snap = await getDoc(FORMATION_DOC(formationId));
    if (!snap.exists()) return;
    const current: string[] = snap.data().teamMembers || [];
    if (!current.includes(userId)) {
      await updateDoc(FORMATION_DOC(formationId), {
        teamMembers: [...current, userId],
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('addMemberToFormation:', error);
    throw error;
  }
};

export const removeMemberFromFormation = async (formationId: string, userId: string): Promise<void> => {
  try {
    const snap = await getDoc(FORMATION_DOC(formationId));
    if (!snap.exists()) return;
    const current: string[] = snap.data().teamMembers || [];
    await updateDoc(FORMATION_DOC(formationId), {
      teamMembers: current.filter((id) => id !== userId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('removeMemberFromFormation:', error);
    throw error;
  }
};

export {
  SERVICES_DOC,
  FORMATIONS_COL,
  FORMATION_DOC,
  OVERVIEW_DOC,
  MEDIA_DOC,
  CONTENT_DOC,
  STATS_DOC,
};
