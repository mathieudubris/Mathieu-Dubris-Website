"use client";

import React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, RefreshCw, ArrowLeft, Menu, X, Calendar, Grid, List, Filter, Check } from 'lucide-react';
import styles from './HeaderCalendar.module.css';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'postponed' | 'absent';
type ViewMode = 'month' | 'day' | 'list';

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function ViewButtons({ viewMode, setViewMode }: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}) {
  return (
    <div className={styles.viewButtons}>
      <button
        className={`${styles.viewBtn} ${viewMode === 'day' ? styles.viewBtnActive : ''}`}
        onClick={() => setViewMode('day')}>
        <Calendar size={11} />
        <span>Jour</span>
      </button>
      <button
        className={`${styles.viewBtn} ${viewMode === 'month' ? styles.viewBtnActive : ''}`}
        onClick={() => setViewMode('month')}>
        <Grid size={11} />
        <span>Mois</span>
      </button>
      <button
        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
        onClick={() => setViewMode('list')}>
        <List size={11} />
        <span>Liste</span>
      </button>
    </div>
  );
}

function ViewDropdown({ viewMode, setViewMode }: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const getViewLabel = () => {
    switch (viewMode) {
      case 'month': return 'Mois';
      case 'day': return 'Jour';
      case 'list': return 'Liste';
      default: return 'Vue';
    }
  };

  const getViewIcon = () => {
    switch (viewMode) {
      case 'month': return <Grid size={11} />;
      case 'day': return <Calendar size={11} />;
      case 'list': return <List size={11} />;
      default: return <Filter size={11} />;
    }
  };

  return (
    <div ref={ref} className={styles.viewDropdownWrap}>
      <button className={styles.viewDropdownBtn} onClick={() => setOpen(o => !o)}>
        {getViewIcon()}
        <span>{getViewLabel()}</span>
        <ChevronRight size={10} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div className={styles.viewDropdownMenu}>
          <button
            className={`${styles.viewDropdownItem} ${viewMode === 'day' ? styles.viewDropdownItemActive : ''}`}
            onClick={() => { setViewMode('day'); setOpen(false); }}>
            <Calendar size={11} /><span>Jour</span>
            {viewMode === 'day' && <Check size={10} style={{ marginLeft: 'auto' }} />}
          </button>
          <button
            className={`${styles.viewDropdownItem} ${viewMode === 'month' ? styles.viewDropdownItemActive : ''}`}
            onClick={() => { setViewMode('month'); setOpen(false); }}>
            <Grid size={11} /><span>Mois</span>
            {viewMode === 'month' && <Check size={10} style={{ marginLeft: 'auto' }} />}
          </button>
          <button
            className={`${styles.viewDropdownItem} ${viewMode === 'list' ? styles.viewDropdownItemActive : ''}`}
            onClick={() => { setViewMode('list'); setOpen(false); }}>
            <List size={11} /><span>Liste</span>
            {viewMode === 'list' && <Check size={10} style={{ marginLeft: 'auto' }} />}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// HeaderCalendar
// ─────────────────────────────────────────────

interface HeaderCalendarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  viewMonth: number;
  viewYear: number;
  selectedDate: string | null;
  periodLabel: string;
  totalBookingsCount: number;
  refreshing: boolean;
  mobileSidebarOpen: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onToday: () => void;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onOpenMobileSidebar: () => void;
}

export default function HeaderCalendar({
  viewMode,
  setViewMode,
  periodLabel,
  totalBookingsCount,
  refreshing,
  mobileSidebarOpen,
  onBack,
  onRefresh,
  onToday,
  onPrevPeriod,
  onNextPeriod,
  onOpenMobileSidebar,
}: HeaderCalendarProps) {
  return (
    <div className={styles.topBar}>
      <div className={styles.topLeft}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={14} /><span>Retour</span>
        </button>

        {/* Hamburger — mobile only. Shows badge when sidebar is open */}
        <button
          className={`${styles.hamburger} ${mobileSidebarOpen ? styles.hamburgerActive : ''}`}
          onClick={onOpenMobileSidebar}
          aria-label="Menu">
          {mobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          {mobileSidebarOpen && (
            <span className={styles.hamburgerBadge}>{totalBookingsCount}</span>
          )}
        </button>

        <div className={styles.hostBadge}>
          <Image
            src="/assets/mathieu/images/png/profil.png"
            alt="Mathieu Dubris"
            width={22}
            height={22}
            className={styles.hostAvatar}
          />
          <span className={styles.hostNameBar}>Mathieu Dubris</span>
          <span className={styles.totalBadge}>{totalBookingsCount} Rdv Total</span>
        </div>
      </div>

      <div className={styles.topCenter}>
        <button className={styles.todayBtn} onClick={onToday}>Aujourd'hui</button>
        <div className={styles.navBtns}>
          <button className={styles.calNavBtn} onClick={onPrevPeriod}>
            <ChevronLeft size={13} />
          </button>
          <span className={styles.periodLabel}>{periodLabel}</span>
          <button className={styles.calNavBtn} onClick={onNextPeriod}>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className={styles.topRight}>
        <div className={styles.desktopViewControls}>
          <ViewButtons viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <div className={styles.mobileViewControls}>
          <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <button className={styles.refreshBtn} onClick={onRefresh}>
          <RefreshCw size={13} className={refreshing ? styles.spinning : ''} />
        </button>
      </div>
    </div>
  );
}