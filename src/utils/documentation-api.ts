// documentation-api.ts
// Toutes les fonctions Firestore pour la documentation d'un projet.

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/utils/firebase-api';
import type { ProjectDocLink } from '@/utils/projet-api';

// ─────────────────────────────────────────────
// Référence — construite à l'appel, jamais au niveau module
// ─────────────────────────────────────────────

/**
 * Construit la référence Firestore.
 * Lance une erreur explicite si projectId ou db sont invalides,
 * évitant le crash "Cannot read properties of undefined (reading 'indexOf')".
 */
const DOC_LINKS_REF = (projectId: string) => {
  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    throw new Error(`DOC_LINKS_REF: projectId invalide → "${projectId}"`);
  }
  if (!db) {
    throw new Error('DOC_LINKS_REF: Firestore (db) non initialisé. Vérifiez firebase-api.ts.');
  }
  return doc(
    db,
    'portfolio',
    'projet-en-cours',
    'projects',
    projectId.trim(),
    'documentation',
    'links'
  );
};

// ─────────────────────────────────────────────
// Lecture
// ─────────────────────────────────────────────

/**
 * Charge les liens de documentation d'un projet.
 * Retourne [] si le document n'existe pas ou si projectId est vide.
 */
export const getDocLinks = async (projectId: string): Promise<ProjectDocLink[]> => {
  if (!projectId || projectId.trim() === '') {
    console.warn('getDocLinks: projectId vide ou undefined, fetch ignoré.');
    return [];
  }
  try {
    const ref  = DOC_LINKS_REF(projectId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    return (snap.data()?.links as ProjectDocLink[]) ?? [];
  } catch (error) {
    console.error('getDocLinks:', error);
    return [];
  }
};

// ─────────────────────────────────────────────
// Écriture complète (remplace toute la liste)
// ─────────────────────────────────────────────

/**
 * Sauvegarde la liste complète des docLinks.
 * Utilise setDoc (upsert) — crée le document s'il n'existe pas encore.
 */
export const saveDocLinks = async (
  projectId: string,
  links: ProjectDocLink[]
): Promise<void> => {
  if (!projectId || projectId.trim() === '') {
    throw new Error('saveDocLinks: projectId est requis et ne peut pas être vide.');
  }
  try {
    const ref = DOC_LINKS_REF(projectId);
    await setDoc(ref, {
      links,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('saveDocLinks:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Helpers CRUD individuels
// ─────────────────────────────────────────────

/** Ajoute un lien à la liste existante. */
export const addDocLink = async (
  projectId: string,
  link: ProjectDocLink
): Promise<void> => {
  const current = await getDocLinks(projectId);
  await saveDocLinks(projectId, [...current, link]);
};

/** Met à jour un lien existant par son id. */
export const updateDocLink = async (
  projectId: string,
  linkId: string,
  updates: Partial<ProjectDocLink>
): Promise<void> => {
  const current = await getDocLinks(projectId);
  const updated = current.map((l) =>
    l.id === linkId ? ({ ...l, ...updates } as ProjectDocLink) : l
  );
  await saveDocLinks(projectId, updated);
};

/** Supprime un lien par son id. */
export const deleteDocLink = async (
  projectId: string,
  linkId: string
): Promise<void> => {
  const current = await getDocLinks(projectId);
  await saveDocLinks(projectId, current.filter((l) => l.id !== linkId));
};