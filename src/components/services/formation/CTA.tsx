"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import styles from './CTA.module.css';

const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* Vraie icône ✕ — pas de rotation de MessageSquare */
const CloseIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="2.5" y1="2.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="13.5" y1="2.5" x2="2.5" y2="13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ChatBubbleIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8.5" cy="10.5" r="1" fill="currentColor" />
    <circle cx="12" cy="10.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="10.5" r="1" fill="currentColor" />
  </svg>
);

export interface CTAConfig {
  calendarUrl?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

interface CTAProps extends CTAConfig {
  fabLabel?: string;
}

const isInternalUrl = (url: string) => url.startsWith('/');

const CTA: React.FC<CTAProps> = ({
  calendarUrl = '/services/booking',
  whatsappNumber = '',
  whatsappMessage = "Bonjour, je souhaite avoir plus d'informations sur vos formations.",
  fabLabel = 'Nous contacter',
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
    : '#';

  const handleCalendarClick = () => {
    setOpen(false);
    if (isInternalUrl(calendarUrl)) {
      router.push(calendarUrl);
    } else {
      window.open(calendarUrl, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const spring = { type: 'spring', stiffness: 480, damping: 36 } as const;

  const rowVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.94 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { ...spring, delay: i * 0.055 },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: 6,
      scale: 0.9,
      transition: { duration: 0.14, delay: i * 0.03 },
    }),
  };

  return (
    <div className={styles.ctaWrapper} ref={wrapperRef}>

      {/* ── Actions ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* WhatsApp */}
            <motion.a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionCard} ${styles.cardWhatsapp}`}
              custom={1}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setOpen(false)}
              aria-label="Discuter sur WhatsApp"
            >
              <div className={styles.cardIcon}>
                <WhatsAppIcon size={18} />
              </div>
              <div className={styles.cardText}>
                <span className={styles.cardTitle}>WhatsApp</span>
                <span className={styles.cardSub}>Réponse rapide</span>
              </div>
            </motion.a>

            {/* Calendar */}
            <motion.button
              className={`${styles.actionCard} ${styles.cardCalendar}`}
              custom={0}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={handleCalendarClick}
              aria-label="Prendre rendez-vous"
            >
              <div className={styles.cardIcon}>
                <Calendar size={17} />
              </div>
              <div className={styles.cardText}>
                <span className={styles.cardTitle}>Rendez-vous</span>
                <span className={styles.cardSub}>Choisir un créneau</span>
              </div>
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
      <motion.button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fermer' : fabLabel}
        aria-expanded={open}
        whileHover={!open ? { scale: 1.08 } : {}}
        whileTap={{ scale: 0.93 }}
        transition={spring}
      >
        {/* Icon swap — AnimatePresence évite tout artefact visuel */}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              className={styles.fabIconWrap}
              initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
              transition={{ duration: 0.16 }}
            >
              <CloseIcon size={16} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              className={styles.fabIconWrap}
              initial={{ opacity: 0, scale: 0.6, rotate: 30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: -30 }}
              transition={{ duration: 0.16 }}
            >
              <ChatBubbleIcon size={21} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse — uniquement fermé */}
        {!open && <span className={styles.fabPulse} aria-hidden="true" />}

        {/* Tooltip */}
        {!open && (
          <span className={styles.fabTooltip} role="tooltip">
            {fabLabel}
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default CTA;