// utils/booking-api.ts — Logique centralisée de réservation
//
// ──────────────────────────────────────────────────────────────────────────────
// STRUCTURE FIRESTORE :
//
// security/
//   └── admin/
//       └── calendar/
//           ├── Avril-2026/
//           │   ├── Jean-Dupont_2026-04-14_14-00   (document)
//           │   ├── Marie-Martin_2026-04-15_10-00
//           │   └── ...
//           ├── Mai-2026/
//           │   └── ...
//           └── ...
//
// FORMAT ID : {nom-normalisé}_{YYYY-MM-DD}_{HH-mm}
// Exemple : Jean-Dupont_2026-04-14_14-00
//
// AVANTAGES :
// - IDs lisibles et prédictibles
// - Pas de doublons (même nom, même date, même heure)
// - Tri naturel par date/heure via l'ID
// - Collections mensuelles pour éviter les limites de taille
//
// ──────────────────────────────────────────────────────────────────────────────
// FIX TIMEZONE (décalage d'un jour dans les emails) :
//
// CAUSE RACINE : L'ancienne implémentation utilisait :
//   Date.UTC(year, month-1, day, 0 - 3, 0, 0)  → crée 2026-04-13T21:00:00Z
//   puis getUTCDay() → retournait le jour de la veille (lundi au lieu de mardi)
//
// SOLUTION : Utiliser MIDI heure locale Madagascar (12:00 EAT = 09:00 UTC).
//   Date.UTC(year, month-1, day, 9, 0, 0)  → crée 2026-04-14T09:00:00Z
//   puis getUTCDay() → retourne le bon jour (mardi ✅)
//
// La logique : en utilisant 9h UTC (= midi Madagascar), on reste toujours dans
// la même journée UTC que la journée Madagascar, quelle que soit la date.
// ──────────────────────────────────────────────────────────────────────────────

import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore';
import { db } from '@/utils/firebase-api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Booking {
  id?: string;
  name: string;
  email: string;
  extraEmails?: string[];
  note?: string;
  /** Format YYYY-MM-DD — toujours une string pure */
  date: string;
  /** Format HH:mm — ex: "14:00" */
  time: string;
  meetLink?: string;
  eventId?: string;
  createdAt?: Timestamp | string;
}

// ─────────────────────────────────────────────
// Constantes i18n
// ─────────────────────────────────────────────

export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const MONTHS_FR_LOWER = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export const DAYS_FR_LOWER = [
  'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',
];

// Créneaux horaires disponibles (heures entières)
export const ALL_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

// Heure limite de fin de journée (22h)
export const DAY_END_HOUR = 22;

// ─────────────────────────────────────────────
// Helpers de date — AVEC fuseau Madagascar (UTC+3)
// ─────────────────────────────────────────────

/**
 * Extrait les composants numériques d'une date "YYYY-MM-DD".
 */
export function parseDateStr(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

/**
 * Calcule le jour de la semaine pour une date donnée en fuseau Madagascar (UTC+3).
 *
 * ✅ FIX : On crée une date UTC à 09:00 (= midi Madagascar, UTC+3).
 * Cela garantit que getUTCDay() retourne le bon jour même depuis un serveur UTC.
 *
 * ❌ ANCIENNE méthode (bugguée) :
 *   new Date(Date.UTC(year, month-1, day, 0-3, 0, 0))
 *   → créait la VEILLE à 21:00 UTC → getUTCDay() retournait le jour -1
 *
 * ✅ NOUVELLE méthode :
 *   new Date(Date.UTC(year, month-1, day, 9, 0, 0))
 *   → crée le même jour à 09:00 UTC (= 12:00 Madagascar) → getUTCDay() correct
 */
export function getDayOfWeekInMadagascar(dateStr: string): number {
  const { year, month, day } = parseDateStr(dateStr);
  // Midi à Madagascar (12h EAT = 9h UTC) — reste toujours dans le bon jour UTC
  const dateUTC = new Date(Date.UTC(year, month - 1, day, 9, 0, 0));
  return dateUTC.getUTCDay();
}

/**
 * Formate une date "YYYY-MM-DD" en string lisible français.
 * Ex : "2026-04-14" → "mardi 14 avril 2026"
 *
 * @param options.capitalize  Met la première lettre en majuscule
 * @param options.short       Format court sans le jour de la semaine : "14 avril 2026"
 */
export function formatDateFR(
  dateStr: string,
  options?: { capitalize?: boolean; short?: boolean }
): string {
  const { year, month, day } = parseDateStr(dateStr);
  const dow = getDayOfWeekInMadagascar(dateStr);

  const dayName = DAYS_FR_LOWER[dow];
  const monthName = MONTHS_FR_LOWER[month - 1];

  if (options?.short) {
    return `${day} ${monthName} ${year}`;
  }

  const full = `${dayName} ${day} ${monthName} ${year}`;
  return options?.capitalize
    ? full.charAt(0).toUpperCase() + full.slice(1)
    : full;
}

/**
 * Formate "YYYY-MM-DD" → "14/04" (affichage compact dans le calendrier)
 */
export function formatDateShort(dateStr: string): string {
  const { month, day } = parseDateStr(dateStr);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

/**
 * Retourne "YYYY-MM-DD" pour une date locale donnée.
 * Utilise les méthodes locales (getFullYear/getMonth/getDate).
 */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retourne la date "aujourd'hui" au format "YYYY-MM-DD" en heure locale.
 */
export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/**
 * Vérifie si une date est un week-end (samedi ou dimanche) en fuseau Madagascar.
 */
export function isWeekendInMadagascar(dateStr: string): boolean {
  const dow = getDayOfWeekInMadagascar(dateStr);
  return dow === 6 || dow === 0; // 6 = samedi, 0 = dimanche
}

/**
 * Vérifie si une date est passée (avant aujourd'hui).
 */
export function isPast(dateStr: string): boolean {
  return dateStr < todayStr();
}

// ─────────────────────────────────────────────
// Helpers Firestore
// ─────────────────────────────────────────────

/**
 * Retourne le nom de la collection mensuelle.
 * Ex : "2026-04-14" → "Avril-2026"
 */
export function getMonthCollection(dateStr: string): string {
  const { year, month } = parseDateStr(dateStr);
  return `${MONTHS_FR[month - 1]}-${year}`;
}

/**
 * Génère un ID de document lisible et unique.
 * Ex : "Jean Dupont" + "2026-04-14" + "14:00" → "Jean-Dupont_2026-04-14_14-00"
 *
 * Sanitisation : accents retirés, caractères spéciaux retirés, espaces → tirets.
 */
export function buildDocId(name: string, date: string, time: string): string {
  const safeName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // retire les accents
    .replace(/[^a-zA-Z0-9 ]/g, '')     // retire les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-');             // espaces → tirets

  const safeTime = time.replace(':', '-'); // "14:00" → "14-00"

  return `${safeName}_${date}_${safeTime}`;
}

/**
 * Chemin complet Firestore + référence document.
 * → security/admin/calendar/{Mois-Année}/{docId}
 */
export function buildDocPath(
  name: string,
  date: string,
  time: string
): {
  collectionPath: string;
  docId: string;
  docRef: DocumentReference;
} {
  const collectionPath = `security/admin/calendar/${getMonthCollection(date)}`;
  const docId = buildDocId(name, date, time);
  return {
    collectionPath,
    docId,
    docRef: doc(db, collectionPath, docId),
  };
}

/**
 * Obtient la référence de collection pour un mois donné.
 * month = index 0-based (0 = janvier, 11 = décembre)
 */
export function getMonthCollectionRef(year: number, month: number): CollectionReference {
  const monthName = `${MONTHS_FR[month]}-${year}`;
  return collection(db, `security/admin/calendar/${monthName}`);
}

// ─────────────────────────────────────────────
// Opérations CRUD
// ─────────────────────────────────────────────

/**
 * Sauvegarde un booking dans Firestore.
 * Chemin : security/admin/calendar/{Mois-Année}/{docId}
 * Retourne le docId généré.
 */
export async function saveBooking(booking: Booking): Promise<string> {
  const { docRef, docId } = buildDocPath(booking.name, booking.date, booking.time);

  await setDoc(docRef, {
    ...booking,
    id: docId,
    date: booking.date.slice(0, 10),
    time: booking.time.slice(0, 5),
    createdAt: Timestamp.now(),
  });

  return docId;
}

/**
 * Récupère un booking précis par nom / date / heure.
 */
export async function getBooking(
  name: string,
  date: string,
  time: string
): Promise<Booking | null> {
  const { docRef } = buildDocPath(name, date, time);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Booking;
}

/**
 * Supprime un booking.
 */
export async function deleteBooking(
  name: string,
  date: string,
  time: string
): Promise<void> {
  const { docRef } = buildDocPath(name, date, time);
  await deleteDoc(docRef);
}

/**
 * Récupère tous les bookings d'un mois spécifique.
 * month = index 0-based (0 = janvier)
 */
export async function getBookingsByMonth(
  year: number,
  month: number
): Promise<Booking[]> {
  const colRef = getMonthCollectionRef(year, month);
  try {
    const snapshot = await getDocs(
      query(colRef, orderBy('date', 'asc'), orderBy('time', 'asc'))
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
  } catch {
    // Collection vide ou inexistante
    return [];
  }
}

/**
 * Récupère tous les bookings sur une fenêtre de -2 à +12 mois.
 * Utile pour le calendrier admin.
 */
export async function getAllBookings(): Promise<Booking[]> {
  const now = new Date();
  const months: { year: number; month: number }[] = [];

  for (let offset = -2; offset <= 12; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  const results = await Promise.all(
    months.map(({ year, month }) => getBookingsByMonth(year, month))
  );

  return results
    .flat()
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/**
 * Récupère les bookings pour une date spécifique "YYYY-MM-DD".
 */
export async function getBookingsByDate(dateStr: string): Promise<Booking[]> {
  const { year, month } = parseDateStr(dateStr);
  const allMonthBookings = await getBookingsByMonth(year, month - 1);
  return allMonthBookings.filter((b) => b.date === dateStr);
}

// ─────────────────────────────────────────────
// Gestion des créneaux disponibles
// ─────────────────────────────────────────────

/**
 * Retourne les créneaux déjà réservés pour une date "YYYY-MM-DD".
 */
export async function getBookedSlots(date: string): Promise<string[]> {
  const bookings = await getBookingsByDate(date);
  return bookings.map((b) => b.time);
}

/**
 * Vérifie si un slot est disponible pour une date donnée.
 * Prend en compte :
 * - Les réservations existantes
 * - Si la date est aujourd'hui : slot >= currentHour + 1
 * - Le slot doit se terminer avant DAY_END_HOUR
 */
export function isSlotAvailable(
  date: string,
  time: string,
  bookedSlots: string[],
  currentHour?: number
): boolean {
  if (bookedSlots.includes(time)) return false;

  const [slotHour] = time.split(':').map(Number);
  const now = new Date();
  const isToday = date === todayStr();
  const hourNow = currentHour ?? now.getHours();

  if (isToday) {
    if (slotHour < hourNow + 1) return false;
    if (slotHour + 1 > DAY_END_HOUR) return false;
  }

  return true;
}

/**
 * Retourne les créneaux disponibles pour une date "YYYY-MM-DD" avec leur statut.
 */
export async function getAvailableSlotsWithStatus(date: string): Promise<
  {
    slot: string;
    available: boolean;
    reason: 'booked' | 'past' | 'too-late' | null;
  }[]
> {
  const bookedSlots = await getBookedSlots(date);
  const now = new Date();
  const currentHour = now.getHours();
  const isToday = date === todayStr();

  return ALL_SLOTS.map((slot) => {
    const [slotHour] = slot.split(':').map(Number);

    if (bookedSlots.includes(slot)) {
      return { slot, available: false, reason: 'booked' as const };
    }
    if (isToday && slotHour < currentHour + 1) {
      return { slot, available: false, reason: 'past' as const };
    }
    if (isToday && slotHour + 1 > DAY_END_HOUR) {
      return { slot, available: false, reason: 'too-late' as const };
    }

    return { slot, available: true, reason: null };
  });
}

/**
 * Vérifie si un jour est entièrement indisponible.
 */
export async function isDayFullyBooked(date: string): Promise<boolean> {
  const slots = await getAvailableSlotsWithStatus(date);
  return slots.every((s) => !s.available);
}

// ─────────────────────────────────────────────
// Payload REST Firestore (pour Vercel / create-meet)
// ─────────────────────────────────────────────

/**
 * Construit l'URL et le payload Firestore REST pour sauvegarder depuis Vercel.
 *
 * Usage dans create-meet.ts :
 *   const { url, payload } = buildFirestoreRestPayload({ ...booking, meetLink, eventId, projectId, apiKey });
 *   await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
 */
export function buildFirestoreRestPayload(
  booking: Omit<Booking, 'id'> & {
    meetLink: string;
    eventId: string;
    projectId: string;
    apiKey: string;
  }
): { url: string; payload: object; docPath: string } {
  const { projectId, apiKey, ...data } = booking;

  const date = data.date.slice(0, 10);
  const time = data.time.slice(0, 5);

  const { collectionPath, docId } = buildDocPath(data.name, date, time);

  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents` +
    `/${collectionPath}?documentId=${encodeURIComponent(docId)}&key=${apiKey}`;

  const payload = {
    fields: {
      id:          { stringValue: docId },
      name:        { stringValue: data.name },
      email:       { stringValue: data.email },
      extraEmails: {
        arrayValue: {
          values: (data.extraEmails ?? []).map((e) => ({ stringValue: e })),
        },
      },
      note:      { stringValue: data.note ?? '' },
      date:      { stringValue: date },
      time:      { stringValue: time },
      meetLink:  { stringValue: data.meetLink },
      eventId:   { stringValue: data.eventId },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  };

  return { url, payload, docPath: `${collectionPath}/${docId}` };
}

// ─────────────────────────────────────────────
// Génération de lien Google Calendar
// ─────────────────────────────────────────────

/**
 * Construit le lien "Ajouter au calendrier" pour Google Calendar.
 * Convertit l'heure locale Madagascar (EAT = UTC+3) en UTC pour le format GCal.
 */
export function buildGoogleCalendarLink(
  date: string,
  time: string,
  meetLink: string,
  title: string = 'Rendez-vous avec Mathieu Dubris'
): string {
  const { year, month, day } = parseDateStr(date);
  const [h, m] = time.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');

  // EAT (UTC+3) → UTC : soustraire 3 heures
  const startUTC = new Date(Date.UTC(year, month - 1, day, h - 3, m, 0));
  const endUTC   = new Date(Date.UTC(year, month - 1, day, h - 3, m + 30, 0));

  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     title,
    dates:    `${fmt(startUTC)}/${fmt(endUTC)}`,
    details:  `Rejoignez la réunion : ${meetLink}`,
    location: meetLink,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export function isValidTime(timeStr: string): boolean {
  return /^\d{2}:\d{2}$/.test(timeStr) && ALL_SLOTS.includes(timeStr);
}