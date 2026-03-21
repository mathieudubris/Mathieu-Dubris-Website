// utils/booking-api.ts
import { db } from './firebase-api';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit as limitQuery,
  Timestamp,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhotoURL?: string;
  date: string; // ISO string format YYYY-MM-DD
  time: string; // HH:MM
  startTime: Date;
  endTime: Date;
  invitedEmails?: string[];
  createdAt: Date;
  status: 'confirmed' | 'cancelled';
  meetLink?: string;
  eventId?: string;
  note?: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const RDV_COLLECTION = 'rdv';

// ─────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────

const getTimeSlotKey = (date: string, time: string): string => {
  return `${date}_${time}`;
};

const convertFirestoreBooking = (doc: any): Booking => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    userEmail: data.userEmail,
    userName: data.userName,
    userPhotoURL: data.userPhotoURL,
    date: data.date,
    time: data.time,
    startTime: data.startTime?.toDate(),
    endTime: data.endTime?.toDate(),
    invitedEmails: data.invitedEmails || [],
    createdAt: data.createdAt?.toDate(),
    status: data.status,
    meetLink: data.meetLink,
    eventId: data.eventId,
    note: data.note
  };
};

// ─────────────────────────────────────────────
// CRUD Operations
// ─────────────────────────────────────────────

// Créer un nouveau rendez-vous
export async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<string> {
  const timeSlotKey = getTimeSlotKey(bookingData.date, bookingData.time);
  const bookingRef = doc(db, RDV_COLLECTION, timeSlotKey);
  
  const booking = {
    ...bookingData,
    createdAt: new Date(),
    status: 'confirmed' as const
  };
  
  await setDoc(bookingRef, booking);
  return timeSlotKey;
}

// Récupérer tous les rendez-vous
export async function getAllBookings(): Promise<Booking[]> {
  const q = query(
    collection(db, RDV_COLLECTION),
    orderBy('startTime', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertFirestoreBooking);
}

// Récupérer les rendez-vous d'un utilisateur
export async function getUserBookings(userId: string): Promise<Booking[]> {
  const q = query(
    collection(db, RDV_COLLECTION),
    where('userId', '==', userId),
    orderBy('startTime', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertFirestoreBooking);
}

// Récupérer un rendez-vous spécifique
export async function getBooking(timeSlotKey: string): Promise<Booking | null> {
  const bookingRef = doc(db, RDV_COLLECTION, timeSlotKey);
  const docSnap = await getDoc(bookingRef);
  
  if (docSnap.exists()) {
    return convertFirestoreBooking(docSnap);
  }
  return null;
}

// Annuler un rendez-vous
export async function cancelBooking(timeSlotKey: string): Promise<void> {
  const bookingRef = doc(db, RDV_COLLECTION, timeSlotKey);
  await updateDoc(bookingRef, {
    status: 'cancelled'
  });
}

// Supprimer un rendez-vous (admin)
export async function deleteBooking(timeSlotKey: string): Promise<void> {
  const bookingRef = doc(db, RDV_COLLECTION, timeSlotKey);
  await deleteDoc(bookingRef);
}

// ─────────────────────────────────────────────
// Availability Functions
// ─────────────────────────────────────────────

// Vérifier si un créneau est disponible
export async function isTimeSlotAvailable(date: string, time: string): Promise<boolean> {
  const timeSlotKey = getTimeSlotKey(date, time);
  const docRef = doc(db, RDV_COLLECTION, timeSlotKey);
  const docSnap = await getDoc(docRef);
  return !docSnap.exists();
}

// Récupérer les créneaux disponibles pour une date donnée
export async function getAvailableTimeSlots(date: string, timeSlots: string[]): Promise<string[]> {
  const available: string[] = [];
  
  for (const time of timeSlots) {
    const isAvailable = await isTimeSlotAvailable(date, time);
    if (isAvailable) {
      available.push(time);
    }
  }
  
  return available;
}

// Vérifier la disponibilité de plusieurs créneaux en parallèle (optimisé)
export async function getAvailableTimeSlotsBatch(date: string, timeSlots: string[]): Promise<Set<string>> {
  const promises = timeSlots.map(async (time) => {
    const isAvailable = await isTimeSlotAvailable(date, time);
    return { time, isAvailable };
  });
  
  const results = await Promise.all(promises);
  const availableSet = new Set<string>();
  
  results.forEach(({ time, isAvailable }) => {
    if (isAvailable) {
      availableSet.add(time);
    }
  });
  
  return availableSet;
}

// ─────────────────────────────────────────────
// Stats Functions
// ─────────────────────────────────────────────

// Récupérer les statistiques des rendez-vous
export async function getBookingStats(): Promise<{
  total: number;
  upcoming: number;
  past: number;
  cancelled: number;
}> {
  const allBookings = await getAllBookings();
  const now = new Date();
  
  return {
    total: allBookings.length,
    upcoming: allBookings.filter(b => b.startTime > now && b.status === 'confirmed').length,
    past: allBookings.filter(b => b.startTime <= now && b.status === 'confirmed').length,
    cancelled: allBookings.filter(b => b.status === 'cancelled').length
  };
}

// Récupérer les rendez-vous à venir
export async function getUpcomingBookings(limit?: number): Promise<Booking[]> {
  const now = new Date();
  const q = query(
    collection(db, RDV_COLLECTION),
    where('startTime', '>', now),
    where('status', '==', 'confirmed'),
    orderBy('startTime', 'asc'),
    ...(limit ? [limitQuery(limit)] : [])
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertFirestoreBooking);
}