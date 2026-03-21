"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, Calendar, Video,
  Check, ArrowRight, User, Mail, X, Download, Copy, ExternalLink
} from 'lucide-react';
import styles from './booking.module.css';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const TIME_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
];

// Slots aléatoirement "occupés" (simulation) — en prod, fetch depuis Firestore/Calendar API
const FAKE_BOOKED: Record<string, string[]> = {};

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const isPast = (d: Date) => {
  const today = new Date(); today.setHours(0,0,0,0);
  return d < today;
};

// ─────────────────────────────────────────────
// Generate .ics + Meet link
// ─────────────────────────────────────────────

const generateMeetLink = () => {
  // En production : appeler votre API route /api/create-meet
  // qui utilise Google Calendar API pour créer un event avec conferenceData
  // Ici on génère un identifiant unique pour simuler
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (n: number) => Array.from({length: n}, () => chars[Math.floor(Math.random()*26)]).join('');
  return `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`;
};

const generateICS = (
  date: Date,
  time: string,
  name: string,
  email: string,
  meetLink: string
): string => {
  const [h, m] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(h, m, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const uid = `${Date.now()}-booking@mathieu-dubris.com`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mathieu Dubris//Booking//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Rendez-vous avec Mathieu Dubris`,
    `DESCRIPTION:Rejoignez la réunion Google Meet :\\n${meetLink}`,
    `LOCATION:${meetLink}`,
    `ORGANIZER;CN=Mathieu Dubris:mailto:mathieudubris@gmail.com`,
    `ATTENDEE;CN=${name};RSVP=TRUE:mailto:${email}`,
    `URL:${meetLink}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Rappel rendez-vous dans 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

const downloadICS = (ics: string, filename: string) => {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────
// Calendar grid
// ─────────────────────────────────────────────

const getCalendarDays = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Start on Monday (0=Mon … 6=Sun)
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const days: (Date | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
};

// ─────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────

type Step = 'calendar' | 'time' | 'form' | 'confirm';

interface BookingState {
  date: Date | null;
  time: string | null;
  name: string;
  email: string;
  note: string;
  meetLink: string;
  ics: string;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function BookingPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [step, setStep] = useState<Step>('calendar');
  const [copied, setCopied] = useState(false);

  const [booking, setBooking] = useState<BookingState>({
    date: null, time: null, name: '', email: '', note: '', meetLink: '', ics: ''
  });

  const calDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const selectDate = (d: Date) => {
    if (isWeekend(d) || isPast(d)) return;
    setBooking(b => ({ ...b, date: d, time: null }));
    setStep('time');
  };

  const selectTime = (t: string) => {
    setBooking(b => ({ ...b, time: t }));
    setStep('form');
  };

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const handleConfirm = async () => {
    if (!booking.date || !booking.time || !booking.name || !booking.email) return;
    setConfirming(true);
    setConfirmError('');
    try {
      // APRÈS — remplace par ton URL Vercel exacte
const res = await fetch('https://meet-api-lemon.vercel.app/api/create-meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: booking.date.toISOString(),
          time: booking.time,
          name: booking.name,
          email: booking.email,
          note: booking.note,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur serveur');
      const meetLink = data.meetLink;
      const ics = generateICS(booking.date, booking.time, booking.name, booking.email, meetLink);
      setBooking(b => ({ ...b, meetLink, ics }));
      setStep('confirm');
    } catch (err: any) {
      setConfirmError('Une erreur est survenue. Veuillez réessayer.');
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };


  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(booking.meetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDateLong = (d: Date) =>
    d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const ease = [0.23, 1, 0.32, 1] as [number,number,number,number];

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bg}>
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.layout}>

        {/* ── LEFT PANEL ── */}
        <div className={styles.leftPanel}>
          <div className={styles.hostCard}>
            <div className={styles.hostAvatar}>MD</div>
            <div>
              <p className={styles.hostLabel}>Réserver un créneau avec</p>
              <h1 className={styles.hostName}>Mathieu Dubris</h1>
            </div>
          </div>

          <div className={styles.infos}>
            <div className={styles.infoItem}>
              <Clock size={14} className={styles.infoIcon} />
              <span>30 minutes</span>
            </div>
            <div className={styles.infoItem}>
              <Video size={14} className={styles.infoIcon} />
              <span>Google Meet (lien auto-généré)</span>
            </div>
            <div className={styles.infoItem}>
              <Calendar size={14} className={styles.infoIcon} />
              <span>Lundi → Vendredi, 09h – 18h</span>
            </div>
          </div>

          <p className={styles.leftDesc}>
            Choisissez un créneau disponible. Vous recevrez un lien Google Meet unique
            ainsi qu'un fichier <strong>.ics</strong> pour l'ajouter directement à votre agenda.
          </p>

          {/* Step indicator */}
          <div className={styles.stepIndicator}>
            {(['calendar','time','form','confirm'] as Step[]).map((s, i) => {
              const labels = ['Date','Horaire','Infos','Confirmé'];
              const idx = ['calendar','time','form','confirm'].indexOf(step);
              const done = i < idx;
              const active = s === step;
              return (
                <div key={s} className={styles.stepItem}>
                  <div className={`${styles.stepDot} ${active ? styles.stepDotActive : ''} ${done ? styles.stepDotDone : ''}`}>
                    {done ? <Check size={10} /> : i + 1}
                  </div>
                  <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}>{labels[i]}</span>
                  {i < 3 && <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={styles.rightPanel}>
          <AnimatePresence mode="wait">

            {/* ── STEP 1: CALENDAR ── */}
            {step === 'calendar' && (
              <motion.div key="calendar"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.32, ease }}
                className={styles.stepPanel}
              >
                <h2 className={styles.stepTitle}>Choisissez une date</h2>
                <p className={styles.stepSub}>Disponible du lundi au vendredi</p>

                <div className={styles.calHeader}>
                  <button className={styles.calNavBtn} onClick={prevMonth}><ChevronLeft size={16} /></button>
                  <span className={styles.calMonthLabel}>
                    {MONTHS_FR[viewMonth]} {viewYear}
                  </span>
                  <button className={styles.calNavBtn} onClick={nextMonth}><ChevronRight size={16} /></button>
                </div>

                <div className={styles.calGrid}>
                  {DAYS_FR.map(d => (
                    <div key={d} className={styles.calDayName}>{d}</div>
                  ))}
                  {calDays.map((d, i) => {
                    if (!d) return <div key={i} className={styles.calEmpty} />;
                    const weekend = isWeekend(d);
                    const past = isPast(d);
                    const isToday = d.toDateString() === today.toDateString();
                    const selected = booking.date?.toDateString() === d.toDateString();
                    const disabled = weekend || past;
                    return (
                      <button
                        key={i}
                        className={`${styles.calDay}
                          ${disabled ? styles.calDayDisabled : styles.calDayAvailable}
                          ${isToday ? styles.calDayToday : ''}
                          ${selected ? styles.calDaySelected : ''}
                        `}
                        onClick={() => !disabled && selectDate(d)}
                        disabled={disabled}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: TIME ── */}
            {step === 'time' && booking.date && (
              <motion.div key="time"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.32, ease }}
                className={styles.stepPanel}
              >
                <button className={styles.backBtn} onClick={() => setStep('calendar')}>
                  <ChevronLeft size={14} /> Retour
                </button>
                <h2 className={styles.stepTitle}>Choisissez un horaire</h2>
                <p className={styles.stepSub}>{formatDateLong(booking.date)}</p>

                <div className={styles.timeGrid}>
                  {TIME_SLOTS.map(t => {
                    const dateKey = booking.date!.toDateString();
                    const booked = FAKE_BOOKED[dateKey]?.includes(t);
                    return (
                      <button
                        key={t}
                        className={`${styles.timeSlot} ${booked ? styles.timeSlotBooked : styles.timeSlotAvail}`}
                        onClick={() => !booked && selectTime(t)}
                        disabled={booked}
                      >
                        <Clock size={11} />
                        {t}
                      </button>
                    );
                  })}
                </div>

                <p className={styles.timeNote}>Tous les créneaux sont en heure locale (Paris) · durée 30 min</p>
              </motion.div>
            )}

            {/* ── STEP 3: FORM ── */}
            {step === 'form' && booking.date && booking.time && (
              <motion.div key="form"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.32, ease }}
                className={styles.stepPanel}
              >
                <button className={styles.backBtn} onClick={() => setStep('time')}>
                  <ChevronLeft size={14} /> Retour
                </button>
                <h2 className={styles.stepTitle}>Vos informations</h2>

                <div className={styles.selectedSlot}>
                  <Calendar size={13} />
                  <span>{formatDateLong(booking.date)}</span>
                  <span className={styles.slotDot}>·</span>
                  <Clock size={13} />
                  <span>{booking.time}</span>
                </div>

                <div className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      <User size={12} /> Nom complet *
                    </label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="Jean Dupont"
                      value={booking.name}
                      onChange={e => setBooking(b => ({ ...b, name: e.target.value }))}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      <Mail size={12} /> Email *
                    </label>
                    <input
                      type="email"
                      className={styles.fieldInput}
                      placeholder="jean@exemple.com"
                      value={booking.email}
                      onChange={e => setBooking(b => ({ ...b, email: e.target.value }))}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Note (optionnel)</label>
                    <textarea
                      className={styles.fieldTextarea}
                      placeholder="Sujet de la réunion, questions..."
                      value={booking.note}
                      onChange={e => setBooking(b => ({ ...b, note: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {confirmError && (
                    <p style={{ color: '#f87171', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>
                      {confirmError}
                    </p>
                  )}

                  <button
                    className={styles.confirmBtn}
                    onClick={handleConfirm}
                    disabled={!booking.name || !booking.email || confirming}
                  >
                    {confirming ? 'Création du lien Meet…' : <>Confirmer le rendez-vous <ArrowRight size={15} /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: CONFIRMED ── */}
            {step === 'confirm' && booking.date && booking.time && (
              <motion.div key="confirm"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease }}
                className={styles.stepPanel}
              >
                <motion.div
                  className={styles.confirmCheck}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
                >
                  <Check size={28} strokeWidth={3} />
                </motion.div>

                <h2 className={styles.confirmTitle}>Rendez-vous confirmé !</h2>
                <p className={styles.confirmSub}>
                  {formatDateLong(booking.date)} à <strong>{booking.time}</strong>
                </p>

                {/* Meet link card */}
                <div className={styles.meetCard}>
                  <div className={styles.meetCardHeader}>
                    <Video size={16} />
                    <span>Votre lien Google Meet</span>
                  </div>
                  <div className={styles.meetLinkRow}>
                    <span className={styles.meetLinkText}>{booking.meetLink}</span>
                    <button className={styles.meetCopyBtn} onClick={handleCopyLink}>
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <a
                    href={booking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.meetJoinBtn}
                  >
                    <ExternalLink size={14} />
                    Rejoindre la réunion
                  </a>
                </div>

                {/* ICS download */}
                <div className={styles.icsCard}>
                  <div className={styles.icsCardLeft}>
                    <Calendar size={16} className={styles.icsIcon} />
                    <div>
                      <p className={styles.icsTitle}>Ajouter à votre agenda</p>
                      <p className={styles.icsSub}>Compatible Google Calendar, Apple Calendar, Outlook…</p>
                    </div>
                  </div>
                  <button
                    className={styles.icsBtn}
                    onClick={() => downloadICS(
                      booking.ics,
                      `rdv-mathieu-${booking.date!.toISOString().split('T')[0]}.ics`
                    )}
                  >
                    <Download size={14} />
                    .ics
                  </button>
                </div>

                {/* Direct Google Calendar link */}
                <a
                  href={buildGoogleCalendarLink(booking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.googleCalBtn}
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_32dp.png" alt="Google Calendar" width={16} height={16} />
                  Ouvrir dans Google Calendar
                </a>

                <button
                  className={styles.restartBtn}
                  onClick={() => {
                    setBooking({ date: null, time: null, name: '', email: '', note: '', meetLink: '', ics: '' });
                    setStep('calendar');
                  }}
                >
                  Réserver un autre créneau
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Build Google Calendar deeplink
// ─────────────────────────────────────────────
function buildGoogleCalendarLink(booking: BookingState): string {
  if (!booking.date || !booking.time) return '#';
  const [h, m] = booking.time.split(':').map(Number);
  const start = new Date(booking.date);
  start.setHours(h, m, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Rendez-vous avec Mathieu Dubris',
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Rejoignez la réunion : ${booking.meetLink}`,
    location: booking.meetLink,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}