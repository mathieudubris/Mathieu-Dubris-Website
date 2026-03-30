"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './SidebarCalendar.module.css';

// ─────────────────────────────────────────────
// Types (inline — pas de fichier utils/types séparé)
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
}

const STATUS_CONFIG: Record<BookingStatus, {
  label: string; color: string; bg: string; border: string; dot: string;
}> = {
  pending:   { label: 'En Attente', color: '#888',    bg: 'rgba(136,136,136,0.08)',  border: 'rgba(136,136,136,0.25)', dot: '#888' },
  confirmed: { label: 'Confirmé',   color: '#10ce55', bg: 'rgba(16,206,85,0.08)',    border: 'rgba(16,206,85,0.28)',   dot: '#10ce55' },
  cancelled: { label: 'Annulé',     color: '#d30000', bg: 'rgba(211,0,0,0.08)',      border: 'rgba(211,0,0,0.28)',     dot: '#d30000' },
  postponed: { label: 'Reporté',    color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.28)',  dot: '#3b82f6' },
  absent:    { label: 'Absent',     color: '#d60aff', bg: 'rgba(214,10,255,0.08)',   border: 'rgba(214,10,255,0.28)',  dot: '#d60aff' },
};

const MONTHS_FR_DISPLAY = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const DAYS_MINI = ['L','M','M','J','V','S','D'];

// ─────────────────────────────────────────────
// Helpers (locaux)
// ─────────────────────────────────────────────

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function todayKey() { return toDateKey(new Date()); }

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const days: (Date | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

// ─────────────────────────────────────────────
// MiniCalendar
// ─────────────────────────────────────────────

function MiniCalendar({ year, month, bookingsByDate, selectedDate, onSelectDate, onPrev, onNext }: {
  year: number; month: number;
  bookingsByDate: Record<string, BookingWithStatus[]>;
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
  onPrev: () => void; onNext: () => void;
}) {
  const days  = getCalendarDays(year, month);
  const today = todayKey();
  return (
    <div className={styles.miniCal}>
      <div className={styles.miniCalHeader}>
        <button className={styles.miniNavBtn} onClick={onPrev}><ChevronLeft size={12} /></button>
        <span className={styles.miniMonthLabel}>{MONTHS_FR_DISPLAY[month]} {year}</span>
        <button className={styles.miniNavBtn} onClick={onNext}><ChevronRight size={12} /></button>
      </div>
      <div className={styles.miniGrid}>
        {DAYS_MINI.map((d, i) => <div key={i} className={styles.miniDayName}>{d}</div>)}
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = toDateKey(d);
          const hasBookings = (bookingsByDate[key]?.length ?? 0) > 0;
          const isToday    = key === today;
          const isSelected = key === selectedDate;
          return (
            <button key={i}
              className={`${styles.miniDay} ${isToday ? styles.miniDayToday : ''} ${isSelected ? styles.miniDaySelected : ''}`}
              onClick={() => onSelectDate(key)}>
              {d.getDate()}
              {hasBookings && <span className={styles.miniDot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SidebarCalendar
// ─────────────────────────────────────────────

interface SidebarCalendarProps {
  year: number;
  month: number;
  bookingsByDate: Record<string, BookingWithStatus[]>;
  selectedDate: string | null;
  activeFilters: Set<BookingStatus>;
  statusCounts: Record<BookingStatus, number>;
  onSelectDate: (d: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFilter: (s: BookingStatus) => void;
}

export default function SidebarCalendar({
  year,
  month,
  bookingsByDate,
  selectedDate,
  activeFilters,
  statusCounts,
  onSelectDate,
  onPrev,
  onNext,
  onToggleFilter,
}: SidebarCalendarProps) {
  return (
    <div className={styles.sidebarInner}>
      <MiniCalendar
        year={year}
        month={month}
        bookingsByDate={bookingsByDate}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        onPrev={onPrev}
        onNext={onNext}
      />

      <div className={styles.filterSection}>
        {(Object.entries(STATUS_CONFIG) as [BookingStatus, typeof STATUS_CONFIG[BookingStatus]][]).map(([key, cfg]) => (
          <button key={key}
            className={`${styles.filterItem} ${!activeFilters.has(key) ? styles.filterItemInactive : ''}`}
            onClick={() => onToggleFilter(key)}>
            <span className={styles.filterDot} style={{ background: cfg.dot }} />
            <span className={styles.filterBadge}
              style={activeFilters.has(key)
                ? { color: cfg.color, background: cfg.bg, borderColor: cfg.border }
                : { color: '#444', background: 'transparent', borderColor: '#222' }
              }>{cfg.label}</span>
            <span className={styles.filterCount}>{statusCounts[key]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
