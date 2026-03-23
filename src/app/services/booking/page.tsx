"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, Calendar, Video,
  Check, ArrowRight, User, Mail, X, Copy, ExternalLink, Plus
} from 'lucide-react';
import styles from './booking.module.css';

// Firestore
import { db } from '@/utils/firebase-api';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import Image from 'next/image';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

/**
 * Slots horaires : heures entières de 08h à 21h.
 * Le dernier meeting (21h) se termine à 22h → fin de journée.
 */
const ALL_TIME_SLOTS = [
  '08:00','09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00',
];

// Fin de journée (heure à partir de laquelle plus aucun meeting ne peut commencer)
const DAY_END_HOUR = 22; // un meeting à 21h finit à 22h → OK

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/**
 * Un jour est "passé" si sa date calendaire est strictement avant aujourd'hui.
 * On ne bloque PAS le jour même ici — la logique "même jour" est gérée
 * dans le filtrage des slots.
 */
const isPast = (d: Date) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const day   = new Date(d); day.setHours(0,0,0,0);
  return day < today;
};

/**
 * Retourne les slots disponibles pour un jour donné, en tenant compte :
 * 1. Des slots déjà réservés dans Firestore (bookedSlots).
 * 2. Si c'est aujourd'hui :
 *    - slot disponible seulement si slotHour >= currentHour + 1
 *    - ET slotHour + 1 <= DAY_END_HOUR  (le meeting doit finir avant/à 22h)
 */
const getAvailableSlots = (
  date: Date,
  bookedSlots: string[],
): { slot: string; disabled: boolean; reason: 'booked' | 'past' | 'too-late' | null }[] => {
  const now     = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return ALL_TIME_SLOTS.map((slot) => {
    const [slotHour] = slot.split(':').map(Number);

    // Slot déjà pris
    if (bookedSlots.includes(slot)) {
      return { slot, disabled: true, reason: 'booked' };
    }

    // Logique same-day
    if (isToday) {
      const currentHour = now.getHours(); // ex: 19 si 19h30

      // Il faut au moins 1h d'avance : slot >= currentHour + 1
      if (slotHour < currentHour + 1) {
        return { slot, disabled: true, reason: 'past' };
      }

      // Le meeting doit se terminer au plus tard à 22h : slotHour + 1 <= 22
      if (slotHour + 1 > DAY_END_HOUR) {
        return { slot, disabled: true, reason: 'too-late' };
      }
    }

    return { slot, disabled: false, reason: null };
  });
};

/**
 * Un jour est entièrement indisponible si tous ses slots sont désactivés
 * (utilisé pour griser les jours dans le calendrier — optionnel).
 */
const isDayFullyBooked = (date: Date, bookedByDay: Record<string, string[]>): boolean => {
  const key = toDateKey(date);
  const booked = bookedByDay[key] ?? [];
  return getAvailableSlots(date, booked).every(s => s.disabled);
};

// Clé unique par jour : "YYYY-MM-DD"
const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// ─────────────────────────────────────────────
// Generate .ics
// ─────────────────────────────────────────────

const generateICS = (
  date: Date,
  time: string,
  name: string,
  emails: string[],
  meetLink: string
): string => {
  const [h, m] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(h, m, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 60); // durée 1h

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const uid = `${Date.now()}-booking@mathieu-dubris.com`;
  const now = fmt(new Date());

  const attendees = emails.map(e =>
    `ATTENDEE;CN=${name};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:${e.trim()}`
  ).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mathieu Dubris//Booking//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}Z`,
    `DTSTART;TZID=Indian/Antananarivo:${fmt(start)}`,
    `DTEND;TZID=Indian/Antananarivo:${fmt(end)}`,
    `SUMMARY:Rendez-vous avec Mathieu Dubris`,
    `DESCRIPTION:Rejoignez la réunion Google Meet :\\n${meetLink}`,
    `LOCATION:${meetLink}`,
    `ORGANIZER;CN=Mathieu Dubris:mailto:mathieudubris@gmail.com`,
    attendees,
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
// Firestore helpers
// ─────────────────────────────────────────────

/**
 * Charge tous les slots réservés pour un mois donné depuis Firestore.
 * Collection : bookings / { date: "YYYY-MM-DD", time: "HH:00", ... }
 * Retourne un dict { "YYYY-MM-DD": ["08:00", "10:00", ...] }
 */
const fetchBookedSlotsForMonth = async (
  year: number,
  month: number // 0-indexed
): Promise<Record<string, string[]>> => {
  try {
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay  = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate().toString().padStart(2, '0')}`;

    const q = query(
      collection(db, 'bookings'),
      where('date', '>=', firstDay),
      where('date', '<=', lastDay),
    );
    const snap = await getDocs(q);

    const result: Record<string, string[]> = {};
    snap.docs.forEach(d => {
      const { date, time } = d.data() as { date: string; time: string };
      if (!result[date]) result[date] = [];
      if (!result[date].includes(time)) result[date].push(time);
    });
    return result;
  } catch (err) {
    console.error('fetchBookedSlotsForMonth:', err);
    return {};
  }
};

/**
 * Enregistre un booking dans Firestore après confirmation Google Meet.
 */
const saveBooking = async (params: {
  date: string;       // "YYYY-MM-DD"
  time: string;       // "HH:00"
  name: string;
  emails: string[];
  meetLink: string;
  eventId: string;
  note?: string;
}): Promise<void> => {
  await addDoc(collection(db, 'bookings'), {
    ...params,
    createdAt: Timestamp.now(),
  });
};

// ─────────────────────────────────────────────
// Calendar grid
// ─────────────────────────────────────────────

const getCalendarDays = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
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
  emails: string[];
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

  // Slots réservés chargés depuis Firestore { "YYYY-MM-DD": ["08:00", ...] }
  const [bookedByDay, setBookedByDay] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Multi-email state
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');

  const [booking, setBooking] = useState<BookingState>({
    date: null, time: null, name: '', emails: [], note: '', meetLink: '', ics: ''
  });

  const calDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // Charger les slots réservés à chaque changement de mois (et au montage)
  useEffect(() => {
    setLoadingSlots(true);
    fetchBookedSlotsForMonth(viewYear, viewMonth).then(data => {
      setBookedByDay(data);
      setLoadingSlots(false);
    });
  }, [viewYear, viewMonth]);

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

  // Slots disponibles pour la date sélectionnée
  const availableSlots = useMemo(() => {
    if (!booking.date) return [];
    const key = toDateKey(booking.date);
    return getAvailableSlots(booking.date, bookedByDay[key] ?? []);
  }, [booking.date, bookedByDay]);

  // ── Multi-email handlers ──
  const addEmail = () => {
    const val = emailInput.trim();
    if (!val) return;
    if (!isValidEmail(val)) {
      setEmailError('Adresse e-mail invalide.');
      return;
    }
    const normalized = val.toLowerCase();
    if (booking.emails.map(e => e.toLowerCase()).includes(normalized)) {
      setEmailError('Cette adresse est déjà ajoutée.');
      return;
    }
    setBooking(b => ({ ...b, emails: [...b.emails, val] }));
    setEmailInput('');
    setEmailError('');
  };

  const removeEmail = (idx: number) => {
    setBooking(b => ({ ...b, emails: b.emails.filter((_, i) => i !== idx) }));
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
  };

  // ── Confirm ──
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const handleConfirm = async () => {
    if (!booking.date || !booking.time || !booking.name || booking.emails.length === 0) return;
    setConfirming(true);
    setConfirmError('');
    try {
      const res = await fetch('https://meet-api-lemon.vercel.app/api/create-meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: booking.date.toISOString(),
          time: booking.time,
          name: booking.name,
          email: booking.emails[0],
          extraEmails: booking.emails.slice(1),
          note: booking.note,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur serveur');

      const meetLink = data.meetLink;
      const ics = generateICS(booking.date, booking.time, booking.name, booking.emails, meetLink);

      // Sauvegarder dans Firestore pour bloquer ce créneau
      const dateKey = toDateKey(booking.date);
      await saveBooking({
        date: dateKey,
        time: booking.time,
        name: booking.name,
        emails: booking.emails,
        meetLink,
        eventId: data.eventId ?? '',
        note: booking.note,
      });

      // Mettre à jour le cache local des slots réservés
      setBookedByDay(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] ?? []), booking.time!],
      }));

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

  const canConfirm = booking.name && booking.emails.length > 0 && !confirming;

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
            {/* Image de profil modifiée */}
            <div className={styles.hostAvatar}>
              <Image 
                src="/assets/mathieu/images/png/profil.png" 
                alt="Mathieu Dubris"
                width={92}
                height={92}
                quality={100}
                style={{ objectFit: 'cover', borderRadius: '50%', width: '46px', height: '46px' }}
              />
            </div>
            <div>
              <p className={styles.hostLabel}>Réserver un créneau avec</p>
              <h1 className={styles.hostName}>Mathieu Dubris</h1>
            </div>
          </div>

          <div className={styles.infos}>
            <div className={styles.infoItem}>
              <Clock size={14} className={styles.infoIcon} />
              <span>60 minutes</span>
            </div>
            <div className={styles.infoItem}>
              <Video size={14} className={styles.infoIcon} />
              <span>Google Meet</span>
            </div>
            <div className={styles.infoItem}>
              <Calendar size={14} className={styles.infoIcon} />
              <span>Lundi → Vendredi, 08h – 22h</span>
            </div>
          </div>

        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={styles.rightPanel}>

          {/* Step indicator — barre horizontale en haut du panel droit */}
          <div className={styles.stepIndicator}>
            {(['calendar','time','form','confirm'] as Step[]).map((s, i) => {
              const labels = ['Date','Horaire','Infos','Confirmé'];
              const idx = ['calendar','time','form','confirm'].indexOf(step);
              const done = i < idx;
              const active = s === step;
              return (
                <React.Fragment key={s}>
                  <div className={styles.stepItem}>
                    <div className={`${styles.stepDot} ${active ? styles.stepDotActive : ''} ${done ? styles.stepDotDone : ''}`}>
                      {done ? <Check size={10} /> : i + 1}
                    </div>
                    <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}>{labels[i]}</span>
                  </div>
                  {i < 3 && <div className={`${styles.stepConnector} ${done ? styles.stepConnectorDone : ''}`} />}
                </React.Fragment>
              );
            })}
          </div>

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

                {loadingSlots ? (
                  <div className={styles.calSkeleton}>
                    <div className={styles.calSkeletonGrid}>
                      {Array.from({ length: 42 }).map((_, i) => (
                        <div key={i} className={styles.calSkeletonCell} />
                      ))}
                    </div>
                  </div>
                ) : (
                <div className={styles.calGrid}>
                  {DAYS_FR.map(d => (
                    <div key={d} className={styles.calDayName}>{d}</div>
                  ))}
                  {calDays.map((d, i) => {
                    if (!d) return <div key={i} className={styles.calEmpty} />;
                    const weekend  = isWeekend(d);
                    const past     = isPast(d);
                    const isToday  = d.toDateString() === today.toDateString();
                    const selected = booking.date?.toDateString() === d.toDateString();
                    const key = toDateKey(d);
                    const booked = bookedByDay[key] ?? [];
                    const isCompletelyUnavailable = weekend || past || getAvailableSlots(d, booked).every(s => s.disabled);
                    
                    return (
                      <button
                        key={i}
                        className={`${styles.calDay}
                          ${(weekend || past) ? styles.calDayDisabled : styles.calDayAvailable}
                          ${isToday ? styles.calDayToday : ''}
                          ${selected ? styles.calDaySelected : ''}
                          ${isCompletelyUnavailable && !weekend && !past ? styles.calDayStrikethrough : ''}
                        `}
                        onClick={() => !weekend && !past && selectDate(d)}
                        disabled={weekend || past || isCompletelyUnavailable}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
                )}
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

                {availableSlots.every(s => s.disabled) ? (
                  <p style={{ color: '#f87171', fontSize: '0.82rem', textAlign: 'center', marginTop: '24px' }}>
                    Aucun créneau disponible pour ce jour. Veuillez choisir une autre date.
                  </p>
                ) : (
                  <div className={styles.timeGrid}>
                    {availableSlots.map(({ slot, disabled, reason }) => (
                      <button
                        key={slot}
                        className={`${styles.timeSlot} ${disabled ? styles.timeSlotBooked : styles.timeSlotAvail}`}
                        onClick={() => !disabled && selectTime(slot)}
                        disabled={disabled}
                        title={
                          reason === 'booked'   ? 'Créneau déjà réservé' :
                          reason === 'past'     ? 'Créneau dépassé' :
                          reason === 'too-late' ? 'Trop tard dans la journée' :
                          undefined
                        }
                      >
                        <Clock size={11} />
                        {slot}
                      </button>
                    ))}
                  </div>
                )}

                <p className={styles.timeNote}>Tous les créneaux sont en heure locale · durée 1h</p>
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

                  {/* ── MULTI-EMAIL FIELD ── */}
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      <Mail size={12} /> Adresses e-mail * <span className={styles.fieldLabelHint}>(invitation agenda envoyée à chacune)</span>
                    </label>

                    {/* Tags */}
                    {booking.emails.length > 0 && (
                      <div className={styles.emailTags}>
                        {booking.emails.map((e, i) => (
                          <span key={i} className={styles.emailTag}>
                            {e}
                            <button
                              className={styles.emailTagRemove}
                              onClick={() => removeEmail(i)}
                              type="button"
                              aria-label="Supprimer"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles.emailInputRow}>
                      <input
                        type="email"
                        className={`${styles.fieldInput} ${styles.emailInputFlex}`}
                        placeholder="jean@exemple.com"
                        value={emailInput}
                        onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
                        onKeyDown={handleEmailKeyDown}
                      />
                      <button
                        type="button"
                        className={styles.emailAddBtn}
                        onClick={addEmail}
                        disabled={!emailInput.trim()}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {emailError && (
                      <p className={styles.emailErrorMsg}>{emailError}</p>
                    )}
                    <p className={styles.emailHint}>Appuyez sur Entrée ou cliquez + pour ajouter plusieurs adresses</p>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Note (optionnel)</label>
                    <textarea
                      className={styles.fieldTextarea}
                      placeholder="Sujet de la réunion, questions..."
                      value={booking.note}
                      onChange={e => setBooking(b => ({ ...b, note: e.target.value }))}
                      rows={2}
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
                    disabled={!canConfirm}
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
                <p className={styles.confirmEmailsSent}>
                  Invitation envoyée à : {booking.emails.join(', ')}
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

                {/* Google Calendar deeplink */}
                <a
                  href={buildGoogleCalendarLink(booking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.googleCalBtn}
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_32dp.png" alt="Google Calendar" width={16} height={16} />
                  Ajouter à Google Calendar
                </a>

                <button
                  className={styles.restartBtn}
                  onClick={() => {
                    setBooking({ date: null, time: null, name: '', emails: [], note: '', meetLink: '', ics: '' });
                    setEmailInput('');
                    setEmailError('');
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
  end.setMinutes(end.getMinutes() + 60); // 1h

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