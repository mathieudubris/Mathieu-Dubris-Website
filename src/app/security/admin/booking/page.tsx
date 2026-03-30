// page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styles from './booking.module.css';
import { useRouter } from 'next/navigation';

import { db } from '@/utils/firebase-api';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp,
} from 'firebase/firestore';

import HeaderCalendar  from '@/components/security/admin/booking/HeaderCalendar';
import SidebarCalendar from '@/components/security/admin/booking/SidebarCalendar';
import VueCalendar     from '@/components/security/admin/booking/VueCalendar';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'postponed' | 'absent';

interface BookingWithStatus {
  id: string;
  name: string;
  email: string;
  extraEmails?: string[];
  emails?: string[];
  note?: string;
  date: string;
  time: string;
  meetLink?: string;
  eventId?: string;
  status?: BookingStatus;
  createdAt?: Timestamp | string;
}

type ViewMode = 'month' | 'day' | 'list';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const MONTHS_FR_DISPLAY = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const DAYS_FR_LOWER  = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MONTHS_FR_LOWER = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayKey() { return toDateKey(new Date()); }

function parseDateStr(s: string) {
  const [year, month, day] = s.split('-').map(Number);
  return { year, month, day };
}

function getDayOfWeek(dateStr: string): number {
  const { year, month, day } = parseDateStr(dateStr);
  return new Date(Date.UTC(year, month - 1, day, 9, 0, 0)).getUTCDay();
}

function formatDateFR(dateStr: string, opts?: { capitalize?: boolean }): string {
  const { year, month, day } = parseDateStr(dateStr);
  const dow = getDayOfWeek(dateStr);
  const str = `${DAYS_FR_LOWER[dow]} ${day} ${MONTHS_FR_LOWER[month - 1]} ${year}`;
  return opts?.capitalize ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

// ─────────────────────────────────────────────
// Firestore actions
// ─────────────────────────────────────────────

async function loadAllBookings(): Promise<BookingWithStatus[]> {
  const snap = await getDocs(
    query(collection(db, 'bookings'), orderBy('date', 'asc'), orderBy('time', 'asc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BookingWithStatus));
}

async function persistStatus(bookingId: string, newStatus: BookingStatus): Promise<void> {
  await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
}

async function deleteBookingFromDB(bookingId: string): Promise<void> {
  await deleteDoc(doc(db, 'bookings', bookingId));
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function BookingCalendarPage() {
  const router = useRouter();
  const today  = new Date();

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewMode,  setViewMode]  = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey());

  const [bookings,   setBookings]   = useState<BookingWithStatus[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<BookingWithStatus | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success'|'error' } | null>(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState<Set<BookingStatus>>(
    new Set(['pending','confirmed','cancelled','postponed','absent'])
  );

  // ── Data loading ──
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try { setBookings(await loadAllBookings()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  // ── Derived state ──
  const bookingsByDate = React.useMemo(() => {
    const map: Record<string, BookingWithStatus[]> = {};
    for (const b of bookings) {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, [bookings]);

  const statusCounts = React.useMemo(() => {
    const c: Record<BookingStatus, number> = { pending:0, confirmed:0, cancelled:0, postponed:0, absent:0 };
    for (const b of bookings) c[(b.status ?? 'pending') as BookingStatus]++;
    return c;
  }, [bookings]);

  const totalBookingsCount = bookings.length;

  const periodLabel = React.useMemo(() => {
    if (viewMode === 'month') return `${MONTHS_FR_DISPLAY[viewMonth]} ${viewYear}`;
    if (viewMode === 'day' && selectedDate) return formatDateFR(selectedDate, { capitalize: true });
    if (selectedDate) return formatDateFR(selectedDate, { capitalize: true });
    return `${MONTHS_FR_DISPLAY[viewMonth]} ${viewYear}`;
  }, [viewMode, viewMonth, viewYear, selectedDate]);

  // ── Handlers ──
  const handleStatusChange = async (b: BookingWithStatus, newStatus: BookingStatus) => {
    await persistStatus(b.id, newStatus);
    setBookings(prev => prev.map(bk => bk.id === b.id ? { ...bk, status: newStatus } : bk));
    setSelectedBooking(prev => prev?.id === b.id ? { ...prev, status: newStatus } : prev);
    const labels: Record<BookingStatus, string> = {
      confirmed: 'Confirmé — email envoyé ✓',
      cancelled:  'Annulé — email envoyé ✓',
      postponed:  'Reporté — email envoyé ✓',
      absent:     'Absent — email de report envoyé ✓',
      pending:    'Remis en attente',
    };
    setToast({ message: labels[newStatus], type: 'success' });
  };

  const handleDeleteBooking = async (b: BookingWithStatus) => {
    await deleteBookingFromDB(b.id);
    setBookings(prev => prev.filter(bk => bk.id !== b.id));
    setSelectedBooking(null);
    setToast({ message: `Rendez-vous de ${b.name} supprimé ✓`, type: 'success' });
  };

  const toggleFilter = (s: BookingStatus) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(s)) { if (next.size > 1) next.delete(s); }
      else next.add(s);
      return next;
    });
  };

  // ── Month navigation ──
  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // ── Day navigation ──
  const prevDay = () => {
    if (!selectedDate) return;
    const { year, month, day } = parseDateStr(selectedDate);
    const newDate = new Date(year, month - 1, day - 1);
    setSelectedDate(toDateKey(newDate));
    setViewYear(newDate.getFullYear());
    setViewMonth(newDate.getMonth());
  };
  const nextDay = () => {
    if (!selectedDate) return;
    const { year, month, day } = parseDateStr(selectedDate);
    const newDate = new Date(year, month - 1, day + 1);
    setSelectedDate(toDateKey(newDate));
    setViewYear(newDate.getFullYear());
    setViewMonth(newDate.getMonth());
  };

  const goToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear()); setViewMonth(t.getMonth());
    setSelectedDate(todayKey());
  };

  const handlePrevPeriod = (viewMode === 'day' || viewMode === 'list') ? prevDay : handlePrevMonth;
  const handleNextPeriod = (viewMode === 'day' || viewMode === 'list') ? nextDay : handleNextMonth;

  // ── Sidebar date selection ──
  const handleSidebarSelectDate = (d: string) => {
    setSelectedDate(d);
    if (viewMode !== 'list' && viewMode !== 'day') setViewMode('list');
    setMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <SidebarCalendar
      year={viewYear}
      month={viewMonth}
      bookingsByDate={bookingsByDate}
      selectedDate={selectedDate}
      activeFilters={activeFilters}
      statusCounts={statusCounts}
      onSelectDate={handleSidebarSelectDate}
      onPrev={handlePrevMonth}
      onNext={handleNextMonth}
      onToggleFilter={toggleFilter}
    />
  );

  return (
    <div className={styles.page}>

      <HeaderCalendar
        viewMode={viewMode}
        setViewMode={(mode) => {
          setViewMode(mode);
          if (mode === 'month' && !selectedDate) setSelectedDate(todayKey());
        }}
        viewMonth={viewMonth}
        viewYear={viewYear}
        selectedDate={selectedDate}
        periodLabel={periodLabel}
        totalBookingsCount={totalBookingsCount}
        refreshing={refreshing}
        mobileSidebarOpen={mobileSidebarOpen}
        onBack={() => router.back()}
        onRefresh={handleRefresh}
        onToday={goToday}
        onPrevPeriod={handlePrevPeriod}
        onNextPeriod={handleNextPeriod}
        onOpenMobileSidebar={() => setMobileSidebarOpen(o => !o)}
      />

      <div className={styles.body}>

        {/* Desktop sidebar */}
        <aside className={styles.sidebar}>
          {sidebarContent}
        </aside>

        {/* Mobile drawer */}
        {mobileSidebarOpen && (
          <>
            <div className={styles.mobileOverlay} onClick={() => setMobileSidebarOpen(false)} />
            <aside className={styles.mobileSidebar}>
              {sidebarContent}
            </aside>
          </>
        )}

        <VueCalendar
          viewMode={viewMode}
          viewYear={viewYear}
          viewMonth={viewMonth}
          selectedDate={selectedDate}
          bookingsByDate={bookingsByDate}
          activeFilters={activeFilters}
          loading={loading}
          selectedBooking={selectedBooking}
          toast={toast}
          onSelectDate={(d) => { setSelectedDate(d); setViewMode('list'); }}
          onSelectBooking={setSelectedBooking}
          onCloseBooking={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteBooking}
          onToastDone={() => setToast(null)}
        />
      </div>
    </div>
  );
}