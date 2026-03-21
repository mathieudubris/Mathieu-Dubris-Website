"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Ban,
  AlertCircle
} from 'lucide-react';
import { auth } from '@/utils/firebase-api';
import {
  getAllBookings,
  cancelBooking,
  deleteBooking,
  getBookingStats,
  Booking
} from '@/utils/booking-api';
import styles from './rdv.module.css';

export default function AdminRdvPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0, cancelled: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ id: string; action: 'cancel' | 'delete' } | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const [allBookings, bookingStats] = await Promise.all([
        getAllBookings(),
        getBookingStats()
      ]);
      setBookings(allBookings);
      setStats(bookingStats);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await cancelBooking(bookingId);
      await loadBookings();
      setShowConfirmModal(null);
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      alert('Erreur lors de l\'annulation du rendez-vous');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await deleteBooking(bookingId);
      await loadBookings();
      setShowConfirmModal(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du rendez-vous');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (booking: Booking) => {
    return booking.startTime > new Date() && booking.status === 'confirmed';
  };

  const isPast = (booking: Booking) => {
    return booking.startTime <= new Date() && booking.status === 'confirmed';
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'upcoming') return isUpcoming(booking);
    if (filter === 'past') return isPast(booking);
    if (filter === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loadingSpinner}>
          <RefreshCw size={32} className={styles.spin} />
          <p>Chargement des rendez-vous...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTag}>Admin</div>
          <h1 className={styles.headerTitle}>Gestion des rendez-vous</h1>
          <p className={styles.headerSub}>
            Consultez, annulez ou supprimez les rendez-vous pris par les clients.
          </p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} onClick={loadBookings}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Calendar size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CheckCircle size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.upcoming}</span>
            <span className={styles.statLabel}>À venir</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <XCircle size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.past}</span>
            <span className={styles.statLabel}>Passés</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Ban size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.cancelled}</span>
            <span className={styles.statLabel}>Annulés</span>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <button
          className={`${styles.filterBtn} ${filter === 'upcoming' ? styles.active : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          À venir
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'past' ? styles.active : ''}`}
          onClick={() => setFilter('past')}
        >
          Passés
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'cancelled' ? styles.active : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Annulés
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          Tous
        </button>
      </div>

      <div className={styles.bookingsList}>
        {filteredBookings.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={48} />
            <h3>Aucun rendez-vous</h3>
            <p>
              Aucun rendez-vous {filter === 'upcoming' ? 'à venir' : 
                filter === 'past' ? 'passé' : 
                filter === 'cancelled' ? 'annulé' : ''} pour le moment.
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <motion.div
              key={booking.id}
              className={`${styles.bookingCard} ${booking.status === 'cancelled' ? styles.cancelled : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className={styles.bookingHeader}
                onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
              >
                <div className={styles.bookingInfo}>
                  <div className={styles.bookingDate}>
                    <Calendar size={14} />
                    <span>{formatDate(booking.startTime)}</span>
                  </div>
                  <div className={styles.bookingTime}>
                    <Clock size={14} />
                    <span>{formatTime(booking.startTime)}</span>
                  </div>
                  <div className={styles.bookingUser}>
                    <User size={14} />
                    <span>{booking.userName}</span>
                  </div>
                </div>
                <div className={styles.bookingStatus}>
                  <span className={`${styles.statusBadge} 
                    ${booking.status === 'cancelled' ? styles.statusCancelled : 
                      isUpcoming(booking) ? styles.statusUpcoming : styles.statusPast}`}>
                    {booking.status === 'cancelled' ? 'Annulé' : 
                      isUpcoming(booking) ? 'À venir' : 'Passé'}
                  </span>
                  {expandedId === booking.id ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === booking.id && (
                  <motion.div
                    className={styles.bookingDetails}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={styles.detailRow}>
                      <Mail size={14} className={styles.detailIcon} />
                      <span className={styles.detailLabel}>Email :</span>
                      <a href={`mailto:${booking.userEmail}`} className={styles.detailValue}>
                        {booking.userEmail}
                      </a>
                    </div>

                    {booking.note && (
                      <div className={styles.detailRow}>
                        <AlertCircle size={14} className={styles.detailIcon} />
                        <span className={styles.detailLabel}>Note :</span>
                        <span className={styles.detailValue}>{booking.note}</span>
                      </div>
                    )}

                    {booking.invitedEmails && booking.invitedEmails.length > 0 && (
                      <div className={styles.detailRow}>
                        <Users size={14} className={styles.detailIcon} />
                        <span className={styles.detailLabel}>Invités :</span>
                        <div className={styles.invitedList}>
                          {booking.invitedEmails.map(email => (
                            <span key={email} className={styles.invitedEmail}>
                              {email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {booking.meetLink && (
                      <div className={styles.detailRow}>
                        <Eye size={14} className={styles.detailIcon} />
                        <span className={styles.detailLabel}>Lien Meet :</span>
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

                    <div className={styles.detailRow}>
                      <Clock size={14} className={styles.detailIcon} />
                      <span className={styles.detailLabel}>Réservé le :</span>
                      <span className={styles.detailValue}>
                        {formatDate(booking.createdAt)} à {formatTime(booking.createdAt)}
                      </span>
                    </div>

                    {booking.status !== 'cancelled' && isUpcoming(booking) && (
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.cancelBtn}
                          onClick={() => setShowConfirmModal({ id: booking.id, action: 'cancel' })}
                          disabled={actionLoading === booking.id}
                        >
                          {actionLoading === booking.id ? (
                            <RefreshCw size={14} className={styles.spin} />
                          ) : (
                            <Ban size={14} />
                          )}
                          Annuler le rendez-vous
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setShowConfirmModal({ id: booking.id, action: 'delete' })}
                          disabled={actionLoading === booking.id}
                        >
                          {actionLoading === booking.id ? (
                            <RefreshCw size={14} className={styles.spin} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Supprimer
                        </button>
                      </div>
                    )}
                    
                    {booking.status !== 'cancelled' && !isUpcoming(booking) && (
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setShowConfirmModal({ id: booking.id, action: 'delete' })}
                          disabled={actionLoading === booking.id}
                        >
                          {actionLoading === booking.id ? (
                            <RefreshCw size={14} className={styles.spin} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Supprimer
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Confirmation</h3>
              <button onClick={() => setShowConfirmModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <p>
                {showConfirmModal.action === 'cancel'
                  ? 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?'
                  : 'Êtes-vous sûr de vouloir supprimer définitivement ce rendez-vous ?'}
              </p>
              <p className={styles.modalWarning}>
                {showConfirmModal.action === 'delete'
                  ? 'Cette action est irréversible.'
                  : 'Le client sera notifié par email.'}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancelBtn} onClick={() => setShowConfirmModal(null)}>
                Annuler
              </button>
              <button
                className={showConfirmModal.action === 'cancel' ? styles.modalConfirmCancelBtn : styles.modalConfirmDeleteBtn}
                onClick={() => {
                  if (showConfirmModal.action === 'cancel') {
                    handleCancelBooking(showConfirmModal.id);
                  } else {
                    handleDeleteBooking(showConfirmModal.id);
                  }
                }}
              >
                {showConfirmModal.action === 'cancel' ? 'Annuler le rendez-vous' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}