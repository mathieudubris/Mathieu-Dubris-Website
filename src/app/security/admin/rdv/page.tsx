"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Users,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  CalendarX,
  Trash2,
  XCircle,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  getAllBookings,
  getBookingStats,
  cancelBooking,
  deleteBooking,
  type Booking,
} from '@/utils/booking-api';
import styles from './rdv.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateFR(d: Date) {
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeFR(d: Date) {
  if (!d) return '—';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getStatus(booking: Booking): 'upcoming' | 'past' | 'cancelled' {
  if (booking.status === 'cancelled') return 'cancelled';
  return booking.startTime > new Date() ? 'upcoming' : 'past';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RdvPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0, cancelled: 0 });
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal
  const [modal, setModal] = useState<{ type: 'cancel' | 'delete'; id: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, s] = await Promise.all([getAllBookings(), getBookingStats()]);
      setBookings(all);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = bookings.filter((b) => {
    if (filter === 'all') return true;
    return getStatus(b) === filter;
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCancel = async () => {
    if (!modal) return;
    setActionLoading(true);
    try {
      await cancelBooking(modal.id);
      setModal(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modal) return;
    setActionLoading(true);
    try {
      await deleteBooking(modal.id);
      setModal(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loadingSpinner}>
          <Loader2 size={28} className={styles.spin} />
          <span style={{ color: 'var(--line)', fontSize: '0.85rem' }}>Chargement des rendez-vous…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTag}>Admin</div>
          <h1 className={styles.headerTitle}>Rendez-vous</h1>
          <p className={styles.headerSub}>
            Agenda complet de toutes les réservations effectuées via le système de booking.
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={load}>
          <RefreshCw size={14} />
          Actualiser
        </button>
      </header>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <StatCard icon={<TrendingUp size={18} />} value={stats.total} label="Total" />
        <StatCard icon={<CheckCircle2 size={18} />} value={stats.upcoming} label="À venir" accent />
        <StatCard icon={<Clock size={18} />} value={stats.past} label="Passés" />
        <StatCard icon={<XCircle size={18} />} value={stats.cancelled} label="Annulés" warn={stats.cancelled > 0} />
      </div>

      {/* ── Filters ── */}
      <div className={styles.filterBar}>
        {(['all', 'upcoming', 'past', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
          >
            {f === 'all' ? 'Tous' : f === 'upcoming' ? 'À venir' : f === 'past' ? 'Passés' : 'Annulés'}
            <span className={styles.filterCount}>
              {f === 'all' ? bookings.length
                : f === 'upcoming' ? stats.upcoming
                : f === 'past' ? stats.past
                : stats.cancelled}
            </span>
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <CalendarX size={36} />
          <h3>Aucun rendez-vous</h3>
          <p>Il n&rsquo;y a pas encore de rendez-vous dans cette catégorie.</p>
        </div>
      ) : (
        <div className={styles.bookingsList}>
          {filtered.map((booking) => {
            const status = getStatus(booking);
            const expanded = expandedId === booking.id;

            return (
              <div
                key={booking.id}
                className={`${styles.bookingCard} ${status === 'cancelled' ? styles.cancelled : ''}`}
              >
                {/* Card header */}
                <div
                  className={styles.bookingHeader}
                  onClick={() => setExpandedId(expanded ? null : booking.id)}
                >
                  <div className={styles.bookingInfo}>
                    <div className={styles.bookingDate}>
                      <Calendar size={13} />
                      {formatDateFR(booking.startTime)}
                    </div>
                    <div className={styles.bookingTime}>
                      <Clock size={13} />
                      {formatTimeFR(booking.startTime)}
                    </div>
                    <div className={styles.bookingUser}>
                      <User size={13} />
                      {booking.userName}
                    </div>
                  </div>
                  <div className={styles.bookingStatus}>
                    <span className={`${styles.statusBadge} ${
                      status === 'upcoming' ? styles.statusUpcoming
                        : status === 'past' ? styles.statusPast
                        : styles.statusCancelled
                    }`}>
                      {status === 'upcoming' ? 'À venir' : status === 'past' ? 'Passé' : 'Annulé'}
                    </span>
                    {expanded ? <ChevronUp size={14} color="var(--line)" /> : <ChevronDown size={14} color="var(--line)" />}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className={styles.bookingDetails}>
                    <DetailRow icon={<Mail size={13} />} label="Email" value={booking.userEmail} />
                    {booking.note && (
                      <DetailRow icon={<FileText size={13} />} label="Note" value={booking.note} />
                    )}
                    {booking.invitedEmails && booking.invitedEmails.length > 0 && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailIcon}><Users size={13} /></span>
                        <span className={styles.detailLabel}>Invités</span>
                        <div className={styles.invitedList}>
                          {booking.invitedEmails.map((e) => (
                            <span key={e} className={styles.invitedEmail}>{e}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {booking.meetLink && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailIcon}><Video size={13} /></span>
                        <span className={styles.detailLabel}>Meet</span>
                        <a
                          href={booking.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.meetLink}
                        >
                          {booking.meetLink}
                        </a>
                      </div>
                    )}
                    <DetailRow
                      icon={<Clock size={13} />}
                      label="Réservé le"
                      value={booking.createdAt ? formatDateFR(booking.createdAt) + ' à ' + formatTimeFR(booking.createdAt) : '—'}
                    />

                    {/* Actions */}
                    {status !== 'cancelled' && (
                      <div className={styles.actionButtons}>
                        {status === 'upcoming' && (
                          <button
                            className={styles.cancelBtn}
                            onClick={() => setModal({ type: 'cancel', id: booking.id })}
                          >
                            <XCircle size={13} /> Annuler
                          </button>
                        )}
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setModal({ type: 'delete', id: booking.id })}
                        >
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    )}
                    {status === 'cancelled' && (
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setModal({ type: 'delete', id: booking.id })}
                        >
                          <Trash2 size={13} /> Supprimer définitivement
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {modal.type === 'cancel' ? 'Annuler le rendez-vous' : 'Supprimer le rendez-vous'}
              </h3>
              <button onClick={() => setModal(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {modal.type === 'cancel' ? (
                <>
                  <p>Êtes-vous sûr de vouloir annuler ce rendez-vous ?</p>
                  <p className={styles.modalWarning}>
                    Le créneau sera libéré et redeviendra disponible pour d&rsquo;autres utilisateurs.
                  </p>
                </>
              ) : (
                <>
                  <p>Êtes-vous sûr de vouloir supprimer définitivement ce rendez-vous ?</p>
                  <p className={styles.modalWarning}>Cette action est irréversible.</p>
                </>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancelBtn} onClick={() => setModal(null)} disabled={actionLoading}>
                Annuler
              </button>
              {modal.type === 'cancel' ? (
                <button className={styles.modalConfirmCancelBtn} onClick={handleCancel} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={13} className={styles.spin} /> : 'Confirmer l\'annulation'}
                </button>
              ) : (
                <button className={styles.modalConfirmDeleteBtn} onClick={handleDelete} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={13} className={styles.spin} /> : 'Supprimer'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  accent,
  warn,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statIcon} ${accent ? styles.statIconAccent : warn ? styles.statIconWarn : ''}`}>
        {icon}
      </div>
      <div className={styles.statInfo}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon}>{icon}</span>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}