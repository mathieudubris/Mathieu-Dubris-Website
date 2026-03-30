"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar, RefreshCw, X, Video, Mail, FileText, Clock, Check, AlertCircle, ChevronRight, Trash2,
} from 'lucide-react';
import styles from './VueCalendar.module.css';
import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────
// Types (inline)
// ─────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'postponed' | 'absent';
type ViewMode = 'month' | 'day' | 'list';

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

const STATUS_CONFIG: Record<BookingStatus, {
  label: string; color: string; bg: string; border: string; dot: string;
}> = {
  pending:   { label: 'En Attente', color: '#888',    bg: 'rgba(136,136,136,0.08)',  border: 'rgba(136,136,136,0.25)', dot: '#888' },
  confirmed: { label: 'Confirmé',   color: '#10ce55', bg: 'rgba(16,206,85,0.08)',    border: 'rgba(16,206,85,0.28)',   dot: '#10ce55' },
  cancelled: { label: 'Annulé',     color: '#d30000', bg: 'rgba(211,0,0,0.08)',      border: 'rgba(211,0,0,0.28)',     dot: '#d30000' },
  postponed: { label: 'Reporté',    color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.28)',  dot: '#3b82f6' },
  absent:    { label: 'Absent',     color: '#d60aff', bg: 'rgba(214,10,255,0.08)',   border: 'rgba(214,10,255,0.28)',  dot: '#d60aff' },
};

const DAYS_FR_LOWER  = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MONTHS_FR_LOWER = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

const NOTIFY_URL  = 'https://meet-api-lemon.vercel.app/api/notify-status';
const BOOKING_URL = 'https://mathieu-dubris.web.app/services/booking';

// ─────────────────────────────────────────────
// Helpers (locaux)
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

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function getEmails(booking: BookingWithStatus): string[] {
  if (booking.emails && booking.emails.length > 0) return booking.emails.filter(Boolean);
  return [booking.email, ...(booking.extraEmails ?? [])].filter(Boolean);
}

// ─────────────────────────────────────────────
// Firestore / API actions (importés depuis page.tsx via props)
// ─────────────────────────────────────────────

async function sendStatusEmail(booking: BookingWithStatus, newStatus: BookingStatus): Promise<void> {
  if (newStatus === 'pending') return;
  const allEmails = getEmails(booking);
  if (!booking.name || !allEmails.length || !booking.date || !booking.time) return;

  const payload = {
    name: booking.name,
    emails: allEmails,
    date: booking.date,
    time: booking.time,
    meetLink: booking.meetLink,
    status: newStatus,
    bookingLink: BOOKING_URL,
  };

  try {
    const response = await fetch(NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (err) {
    console.error('❌ sendStatusEmail échoué:', err);
  }
}

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={styles.statusBadge}
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      <span className={styles.statusDot} style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────
// StatusDropdown
// ─────────────────────────────────────────────

function StatusDropdown({ current, onChange, loading }: {
  current: BookingStatus; onChange: (s: BookingStatus) => void; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[current];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className={styles.dropdownWrap}>
      <button className={styles.statusDropBtn}
        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        onClick={() => setOpen(o => !o)} disabled={loading}>
        <span className={styles.statusDot} style={{ background: cfg.dot }} />
        {cfg.label}
        <ChevronRight size={10} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div className={styles.dropdownMenu}>
          {(Object.entries(STATUS_CONFIG) as [BookingStatus, typeof STATUS_CONFIG[BookingStatus]][]).map(([key, c]) => (
            <button key={key} className={styles.dropdownItem} style={{ color: c.color }}
              onClick={() => { onChange(key); setOpen(false); }}>
              <span className={styles.statusDot} style={{ background: c.dot }} />
              {c.label}
              {current === key && <Check size={10} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// DetailPanel
// ─────────────────────────────────────────────

function DetailPanel({ booking, onClose, onStatusChange, onDelete }: {
  booking: BookingWithStatus;
  onClose: () => void;
  onStatusChange: (b: BookingWithStatus, s: BookingStatus) => void;
  onDelete: (b: BookingWithStatus) => void;
}) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const cfg       = STATUS_CONFIG[booking.status ?? 'pending'];
  const allEmails = getEmails(booking);

  const handleStatus = async (newStatus: BookingStatus) => {
    setStatusLoading(true);
    try {
      // persistStatus appelé dans page.tsx via onStatusChange
      sendStatusEmail(booking, newStatus);
      onStatusChange(booking, newStatus);
    } catch (err) {
      console.error('Status update failed', err);
    } finally { setStatusLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      onDelete(booking);
      onClose();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleteLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailPanel} onClick={e => e.stopPropagation()}>
        <div className={styles.detailStrip}
          style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}>
          <StatusDropdown current={booking.status ?? 'pending'} onChange={handleStatus} loading={statusLoading} />
          <div className={styles.detailStripRight}>
            <button className={styles.detailDeleteBtn} onClick={() => setShowConfirm(true)} disabled={deleteLoading}>
              <Trash2 size={13} />
            </button>
            <button className={styles.detailClose} onClick={onClose}><X size={13} /></button>
          </div>
        </div>
        <div className={styles.detailBody}>
          <div className={styles.detailHeader}>
            <div className={styles.detailAvatar}
              style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}>
              {getInitials(booking.name)}
            </div>
            <div>
              <p className={styles.detailName}>{booking.name}</p>
              <div className={styles.detailTime}>
                <Clock size={11} />
                {formatDateFR(booking.date, { capitalize: true })} · {booking.time}
              </div>
            </div>
          </div>
          <div className={styles.detailFields}>
            <div className={styles.detailRow}>
              <Mail size={13} />
              <div className={styles.detailEmail}>
                {allEmails.length > 0
                  ? allEmails.map((e, i) => <div key={i}>{e}</div>)
                  : <div style={{ color: '#666', fontStyle: 'italic' }}>Aucun email disponible</div>
                }
              </div>
            </div>
            {booking.note && (
              <div className={styles.detailRow}>
                <FileText size={13} />
                <p className={styles.detailNote}>{booking.note}</p>
              </div>
            )}
            {booking.meetLink && (
              <a href={booking.meetLink} target="_blank" rel="noopener noreferrer" className={styles.meetBtn}>
                <Video size={13} />Rejoindre Google Meet
              </a>
            )}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className={styles.confirmOverlay} onClick={e => e.stopPropagation()}>
          <div className={styles.confirmDialog}>
            <div className={styles.confirmIcon}><Trash2 size={24} /></div>
            <h3 className={styles.confirmTitle}>Supprimer le rendez-vous</h3>
            <p className={styles.confirmMessage}>
              Êtes-vous sûr de vouloir supprimer le rendez-vous de <strong>{booking.name}</strong> du {formatDateFR(booking.date)} à {booking.time} ?<br/>
              Cette action est irréversible.
            </p>
            <div className={styles.confirmButtons}>
              <button className={styles.confirmCancelBtn} onClick={() => setShowConfirm(false)}>Annuler</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? <RefreshCw size={14} className={styles.spinning} /> : <Trash2 size={14} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────

function Toast({ message, type, onDone }: { message: string; type: 'success'|'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`${styles.toast} ${type === 'success' ? styles.toastSuccess : styles.toastError}`}>
      {type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────
// ListRow
// ─────────────────────────────────────────────

function ListRow({ booking, onClick }: { booking: BookingWithStatus; onClick: () => void }) {
  const status = booking.status ?? 'pending';
  const cfg    = STATUS_CONFIG[status];
  const displayEmail = getEmails(booking)[0] ?? '';
  return (
    <button className={styles.listRow} onClick={onClick}>
      <span className={styles.listTime} style={{ color: cfg.color }}>{booking.time}</span>
      <div className={styles.listAvatar} style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}>
        {getInitials(booking.name)}
      </div>
      <div className={styles.listInfo}>
        <span className={styles.listName}>{booking.name}</span>
        <span className={styles.listEmail}>{displayEmail}</span>
        {booking.note && <span className={styles.listNote}>{booking.note}</span>}
      </div>
      <div className={styles.listRight}>
        <StatusBadge status={status} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// DayView
// ─────────────────────────────────────────────

function DayView({ selectedDate, bookingsByDate, activeFilters, onSelectBooking }: {
  selectedDate: string | null;
  bookingsByDate: Record<string, BookingWithStatus[]>;
  activeFilters: Set<BookingStatus>;
  onSelectBooking: (b: BookingWithStatus) => void;
}) {
  const hours      = Array.from({ length: 15 }, (_, i) => i + 8);
  const dayBookings = selectedDate ? (bookingsByDate[selectedDate] ?? []) : [];

  const getBookingAtHour = (hour: number): BookingWithStatus | null => {
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    return dayBookings.find(b =>
      b.time === timeStr && activeFilters.has((b.status ?? 'pending') as BookingStatus)
    ) ?? null;
  };

  if (!selectedDate) {
    return (
      <div className={styles.emptyState}>
        <Calendar size={22} className={styles.emptyIcon} />
        <p>Sélectionnez une date</p>
      </div>
    );
  }

  const hasBookings = dayBookings.some(b => activeFilters.has((b.status ?? 'pending') as BookingStatus));

  return (
    <div className={styles.dayView}>
      <div className={styles.dayHeader}>{formatDateFR(selectedDate, { capitalize: true })}</div>
      {!hasBookings && (
        <div className={styles.emptyState}>
          <Calendar size={22} className={styles.emptyIcon} />
          <p>Aucun rendez-vous ce jour</p>
        </div>
      )}
      <div className={styles.dayGrid}>
        {hours.map(hour => {
          const booking = getBookingAtHour(hour);
          const cfg     = booking ? STATUS_CONFIG[(booking.status ?? 'pending') as BookingStatus] : null;
          return (
            <div key={hour} className={styles.dayRow}>
              <div className={styles.dayHour}>{String(hour).padStart(2, '0')}:00</div>
              <div className={styles.dayCell}>
                {booking && (
                  <button className={styles.dayEvent}
                    style={{ borderColor: cfg!.border, background: cfg!.bg, color: cfg!.color }}
                    onClick={() => onSelectBooking(booking)}>
                    <span className={styles.dayEventName}>{booking.name}</span>
                    {booking.note && <span className={styles.dayEventNote}>{booking.note}</span>}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VueCalendar (main export)
// ─────────────────────────────────────────────

interface VueCalendarProps {
  viewMode: ViewMode;
  viewYear: number;
  viewMonth: number;
  selectedDate: string | null;
  bookingsByDate: Record<string, BookingWithStatus[]>;
  activeFilters: Set<BookingStatus>;
  loading: boolean;
  selectedBooking: BookingWithStatus | null;
  toast: { message: string; type: 'success' | 'error' } | null;
  onSelectDate: (d: string) => void;
  onSelectBooking: (b: BookingWithStatus) => void;
  onCloseBooking: () => void;
  onStatusChange: (b: BookingWithStatus, s: BookingStatus) => void;
  onDelete: (b: BookingWithStatus) => void;
  onToastDone: () => void;
}

export default function VueCalendar({
  viewMode,
  viewYear,
  viewMonth,
  selectedDate,
  bookingsByDate,
  activeFilters,
  loading,
  selectedBooking,
  toast,
  onSelectDate,
  onSelectBooking,
  onCloseBooking,
  onStatusChange,
  onDelete,
  onToastDone,
}: VueCalendarProps) {
  const calDays = getCalendarDays(viewYear, viewMonth);

  const listBookings = selectedDate
    ? (bookingsByDate[selectedDate] ?? []).filter(b => activeFilters.has((b.status ?? 'pending') as BookingStatus))
    : [];

  return (
    <>
      <main className={styles.main}>
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={18} className={styles.spinning} />
            <span>Chargement des rendez-vous…</span>
          </div>
        ) : (
          <>
            {/* MONTH VIEW */}
            {viewMode === 'month' && (
              <div className={styles.monthView}>
                <div className={styles.monthHeader}>
                  {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
                    <div key={d} className={styles.monthDayName}>{d}</div>
                  ))}
                </div>
                <div className={styles.monthGrid}>
                  {calDays.map((d, i) => {
                    if (!d) return <div key={i} className={styles.monthEmpty} />;
                    const key = toDateKey(d);
                    const dayBookings = (bookingsByDate[key] ?? []).filter(b =>
                      activeFilters.has((b.status ?? 'pending') as BookingStatus));
                    const isToday    = key === todayKey();
                    const isSelected = key === selectedDate;
                    return (
                      <div key={i}
                        className={`${styles.monthCell} ${isToday ? styles.monthCellToday : ''} ${isSelected ? styles.monthCellSelected : ''}`}
                        onClick={() => { onSelectDate(key); }}>
                        <span className={styles.monthCellNum}>{d.getDate()}</span>
                        <div className={styles.monthDots}>
                          {dayBookings.slice(0, 4).map((b, bi) => {
                            const cfg = STATUS_CONFIG[(b.status ?? 'pending') as BookingStatus];
                            return <span key={bi} className={styles.monthEventDot} style={{ background: cfg.dot }} />;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DAY VIEW */}
            {viewMode === 'day' && (
              <DayView
                selectedDate={selectedDate}
                bookingsByDate={bookingsByDate}
                activeFilters={activeFilters}
                onSelectBooking={onSelectBooking}
              />
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className={styles.listView}>
                {selectedDate ? (
                  <>
                    <div className={`${styles.listDateHeader} ${selectedDate === todayKey() ? styles.listDateToday : ''}`}>
                      {formatDateFR(selectedDate, { capitalize: true })}
                    </div>
                    {listBookings.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Calendar size={22} className={styles.emptyIcon} />
                        <p>Aucun rendez-vous ce jour</p>
                      </div>
                    ) : (
                      listBookings.map(b => <ListRow key={b.id} booking={b} onClick={() => onSelectBooking(b)} />)
                    )}
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <Calendar size={22} className={styles.emptyIcon} />
                    <p>Sélectionnez une date dans le calendrier</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {selectedBooking && (
        <DetailPanel
          booking={selectedBooking}
          onClose={onCloseBooking}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={onToastDone} />}
    </>
  );
}
