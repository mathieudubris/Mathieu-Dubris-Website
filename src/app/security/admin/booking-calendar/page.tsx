"use client";

// ──────────────────────────────────────────────────────────────────────────────
// AdminBookingCalendar — page.tsx
//
// ✅ MIGRÉ vers la nouvelle structure Firestore :
//   security/admin/calendar/{Mois-Année}/{NOM_YYYY-MM-DD_HH-mm}
//
// Avant : lisait collection("bookings") avec getDocs + orderBy
// Après : utilise getAllBookings() de booking-api.ts
//         qui parcourt automatiquement les collections mensuelles
//
// SUPPRIMÉ :
//   - import { db } from "@/utils/firebase-api"
//   - import { collection, getDocs, query, orderBy } from "firebase/firestore"
// AJOUTÉ :
//   - import { getAllBookings, Booking, formatDateFR } from "@/utils/booking-api"
// ──────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Mail,
  Video,
  MessageSquare,
  RefreshCw,
  X,
  ExternalLink,
  Users,
} from "lucide-react";
import {
  getAllBookings,
  Booking,
  formatDateFR,
} from "@/utils/booking-api";
import styles from "./bookingCalendar.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_FULL = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7;
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Booking Detail Panel ─────────────────────────────────────────────────────

function BookingDetail({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const allEmails = [booking.email, ...(booking.extraEmails || [])];
  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailPanel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.detailClose} onClick={onClose}>
          <X size={15} />
        </button>

        <div className={styles.detailHeader}>
          <div className={styles.detailAvatar}>
            {booking.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className={styles.detailName}>{booking.name}</h3>
            <span className={styles.detailTime}>
              <Clock size={11} /> {booking.time} — {booking.date && formatDateFR(booking.date, { short: true })}
            </span>
          </div>
        </div>

        <div className={styles.detailBody}>
          <div className={styles.detailRow}>
            <Mail size={13} />
            <div>
              {allEmails.map((e, idx) => (
                <div key={`email-${idx}-${e}`} className={styles.detailEmail}>{e}</div>
              ))}
            </div>
          </div>

          {booking.note && (
            <div className={styles.detailRow}>
              <MessageSquare size={13} />
              <p className={styles.detailNote}>{booking.note}</p>
            </div>
          )}

          {booking.meetLink && (
            <a
              href={booking.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.meetBtn}
            >
              <Video size={13} />
              Rejoindre Google Meet
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminBookingCalendar() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ── Fetch : utilise getAllBookings() de booking-api.ts ──────────────────────
  // Parcourt automatiquement les collections mensuelles :
  //   security/admin/calendar/Avril-2026/...
  //   security/admin/calendar/Mai-2026/...
  //   etc. (fenêtre -2 → +12 mois)
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error("fetchBookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Dérivés ─────────────────────────────────────────────────────────────────

  const byDate = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    if (!acc[b.date]) acc[b.date] = [];
    acc[b.date].push(b);
    return acc;
  }, {});

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const upcomingBookings = bookings
    .filter((b) => b.date >= todayStr)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const selectedDateBookings = selectedDate ? (byDate[selectedDate] || []) : [];
  const listToShow = selectedDate ? selectedDateBookings : upcomingBookings;

  // ── Navigation mois ─────────────────────────────────────────────────────────

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDate(null);
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.pageTag}>
            <CalendarDays size={11} />
            Agenda Admin
          </div>
          <h1 className={styles.pageTitle}>Rendez-vous</h1>
        </div>
        <div className={styles.topRight}>
          <div className={styles.chip}>
            <Users size={12} />
            <span>{bookings.length} total</span>
          </div>
          <div className={styles.chip}>
            <Clock size={12} />
            <span>{upcomingBookings.length} à venir</span>
          </div>
          <button className={styles.refreshBtn} onClick={fetchBookings} title="Rafraîchir">
            <RefreshCw size={13} className={loading ? styles.spinning : ""} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* Calendar */}
        <div className={styles.calCard}>
          <div className={styles.calNav}>
            <button className={styles.calNavBtn} onClick={prevMonth}>
              <ChevronLeft size={14} />
            </button>
            <span className={styles.calNavTitle}>
              {MONTHS_FR[currentMonth]} {currentYear}
            </span>
            <button className={styles.calNavBtn} onClick={nextMonth}>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className={styles.calGrid}>
            {DAYS_FULL.map((d, i) => (
              <div key={`lbl-${i}`} className={styles.calLabel}>{d}</div>
            ))}

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`emp-${i}`} className={styles.calEmpty} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = toDateStr(currentYear, currentMonth, day);
              const dayBookings = byDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isPast = dateStr < todayStr;
              const isSelected = selectedDate === dateStr;
              const hasBookings = dayBookings.length > 0;

              return (
                <div
                  key={`day-${day}`}
                  className={[
                    styles.calCell,
                    isToday ? styles.cellToday : "",
                    isPast ? styles.cellPast : "",
                    hasBookings ? styles.cellHas : "",
                    isSelected ? styles.cellSelected : "",
                    hasBookings ? styles.cellClickable : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => setSelectedDate(
                    hasBookings ? (selectedDate === dateStr ? null : dateStr) : null
                  )}
                >
                  <span className={styles.dayNum}>{day}</span>
                  {hasBookings && (
                    <div className={styles.dotRow}>
                      {dayBookings.slice(0, 3).map((b) => (
                        <span key={b.id} className={styles.dot} />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className={styles.dotPlus}>+{dayBookings.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <span className={styles.sidebarTitle}>
              {selectedDate
                ? formatDateFR(selectedDate, { capitalize: true, short: true })
                : "Prochains RDV"}
            </span>
            {selectedDate && (
              <button className={styles.sidebarClear} onClick={() => setSelectedDate(null)}>
                <X size={12} /> Tous
              </button>
            )}
          </div>

          <div className={styles.sidebarList}>
            {loading && (
              <div className={styles.empty}>
                <RefreshCw size={15} className={styles.spinning} /> Chargement…
              </div>
            )}
            {!loading && listToShow.length === 0 && (
              <div className={styles.empty}>
                <CalendarDays size={17} />
                {selectedDate ? "Aucun RDV ce jour." : "Aucun RDV à venir."}
              </div>
            )}
            {!loading && listToShow.map((b) => (
              <button key={b.id} className={styles.sidebarRow} onClick={() => setSelected(b)}>
                <div className={styles.rowAvatar}>{b.name.charAt(0).toUpperCase()}</div>
                <div className={styles.rowInfo}>
                  <span className={styles.rowName}>{b.name}</span>
                  <span className={styles.rowEmail}>{b.email}</span>
                  {b.note && <span className={styles.rowNote}>{b.note}</span>}
                </div>
                <div className={styles.rowMeta}>
                  {!selectedDate && (
                    <span className={styles.rowDate}>
                      {b.date.split("-")[2]}/{b.date.split("-")[1]}
                    </span>
                  )}
                  <span className={styles.rowTime}>{b.time}</span>
                  {b.meetLink && <span className={styles.rowMeetDot}><Video size={10} /></span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected && <BookingDetail booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}