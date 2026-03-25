// utils/booking-api.ts — Logique centralisée de réservation
//
// ──────────────────────────────────────────────────────────────────────────────
// STRUCTURE FIRESTORE (inspirée de la structure projets) :
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
  where,
  Timestamp,
  DocumentReference,
  CollectionReference,
  writeBatch,
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
// Chemins Firestore centralisés (comme dans projet-api)
// ─────────────────────────────────────────────

const CALENDAR_ROOT = () => doc(db, 'security', 'admin');
const CALENDAR_COL = () => collection(db, 'security', 'admin', 'calendar');

/**
 * Retourne la collection d'un mois spécifique
 * Ex: getMonthCollectionRef(2026, 3) → security/admin/calendar/Avril-2026
 */
export const getMonthCollectionRef = (year: number, month: number): CollectionReference => {
  const monthName = `${MONTHS_FR[month]}-${year}`;
  return collection(db, 'security', 'admin', 'calendar', monthName);
};

/**
 * Retourne la référence d'un document de réservation
 * Chemin : security/admin/calendar/{Mois-Année}/{docId}
 */
export const getBookingRef = (name: string, date: string, time: string): DocumentReference => {
  const { year, month } = parseDateStr(date);
  const monthName = `${MONTHS_FR[month - 1]}-${year}`;
  const docId = buildDocId(name, date, time);
  return doc(db, 'security', 'admin', 'calendar', monthName, docId);
};

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
 */
export function getDayOfWeekInMadagascar(dateStr: string): number {
  const { year, month, day } = parseDateStr(dateStr);
  // Midi à Madagascar (12h EAT = 9h UTC) — reste toujours dans le bon jour UTC
  const dateUTC = new Date(Date.UTC(year, month - 1, day, 9, 0, 0));
  return dateUTC.getUTCDay();
}

/**
 * Formate une date "YYYY-MM-DD" en string lisible français.
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
 * Retourne "YYYY-MM-DD" pour une date locale donnée.
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
  return dow === 6 || dow === 0;
}

/**
 * Vérifie si une date est passée (avant aujourd'hui).
 */
export function isPast(dateStr: string): boolean {
  return dateStr < todayStr();
}

// ─────────────────────────────────────────────
// Helpers Firestore — IDs lisibles
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
 * Format : {nom-normalisé}_{YYYY-MM-DD}_{HH-mm}
 * Ex : "Jean Dupont" + "2026-04-14" + "14:00" → "Jean-Dupont_2026-04-14_14-00"
 */
export function buildDocId(name: string, date: string, time: string): string {
  const safeName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  const safeTime = time.replace(':', '-');

  return `${safeName}_${date}_${safeTime}`;
}

// ─────────────────────────────────────────────
// Opérations CRUD (comme dans projet-api)
// ─────────────────────────────────────────────

/**
 * Sauvegarde un booking dans Firestore.
 * Chemin : security/admin/calendar/{Mois-Année}/{docId}
 */
export async function saveBooking(booking: Booking): Promise<string> {
  const { year, month } = parseDateStr(booking.date);
  const monthName = `${MONTHS_FR[month - 1]}-${year}`;
  const docId = buildDocId(booking.name, booking.date, booking.time);
  const bookingRef = doc(db, 'security', 'admin', 'calendar', monthName, docId);

  await setDoc(bookingRef, {
    ...booking,
    id: docId,
    date: booking.date.slice(0, 10),
    time: booking.time.slice(0, 5),
    createdAt: Timestamp.now(),
  });

  return docId;
}

/**
 * Récupère un booking précis.
 */
export async function getBooking(
  name: string,
  date: string,
  time: string
): Promise<Booking | null> {
  const bookingRef = getBookingRef(name, date, time);
  const snap = await getDoc(bookingRef);
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
  const bookingRef = getBookingRef(name, date, time);
  await deleteDoc(bookingRef);
}

/**
 * Récupère tous les bookings d'un mois spécifique.
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
    return [];
  }
}

/**
 * Récupère tous les bookings sur une fenêtre de -2 à +12 mois.
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
 * Récupère les bookings pour une date spécifique.
 */
export async function getBookingsByDate(dateStr: string): Promise<Booking[]> {
  const { year, month } = parseDateStr(dateStr);
  const allMonthBookings = await getBookingsByMonth(year, month - 1);
  return allMonthBookings.filter((b) => b.date === dateStr);
}

/**
 * Retourne les créneaux déjà réservés pour une date.
 */
export async function getBookedSlots(date: string): Promise<string[]> {
  const bookings = await getBookingsByDate(date);
  return bookings.map((b) => b.time);
}

/**
 * Vérifie si un slot est disponible.
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