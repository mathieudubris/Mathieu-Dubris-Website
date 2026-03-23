"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Key,
  ShieldCheck,
  Database,
  Activity,
  CreditCard,
  Bell,
  Lock,
  PhoneCall,
  Globe,
  FileText,
  Cloud,
  Kanban,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  BarChart2,
  CalendarDays,
} from 'lucide-react';
import { auth, db } from '@/utils/firebase-api';
import { collection, getDocs } from 'firebase/firestore';
import styles from './page.module.css';

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  status?: 'ok' | 'warn' | 'crit';
}

function StatCard({ label, value, icon, trend, status }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statInfo}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      {trend && (
        <span
          className={`${styles.statTrend} ${
            status === 'warn'
              ? styles.statTrendWarn
              : status === 'crit'
              ? styles.statTrendCrit
              : styles.statTrendOk
          }`}
        >
          {trend}
        </span>
      )}
    </div>
  );
}

// ─── Nav Card ─────────────────────────────────────────────────────────────────

interface NavCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
  accent?: string;
}

function NavCard({ href, icon, title, desc, badge, badgeColor, accent }: NavCardProps) {
  return (
    <Link href={href} className={styles.navCard}>
      {accent && <div className={styles.navCardAccent} style={{ background: accent }} />}
      <div className={styles.navCardHeader}>
        <div className={styles.iconWrapper}>{icon}</div>
        <ArrowUpRight size={16} className={styles.navCardArrow} />
      </div>
      <span className={styles.cardTitle}>{title}</span>
      <p className={styles.cardDesc}>{desc}</p>
      {badge && (
        <span
          className={styles.badge}
          style={badgeColor ? { background: badgeColor } : undefined}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setUserCount(usersSnap.size);
        const projectsSnap = await getDocs(collection(db, 'projects'));
        setProjectCount(projectsSnap.size);
        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        setBookingCount(bookingsSnap.size);
      } catch {}
    };
    fetchStats();
  }, []);

  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTag}>Admin</div>
          <h1 className={styles.headerTitle}>Tableau de Bord</h1>
          <p className={styles.headerSub}>
            Gérez les paramètres globaux et les accès de votre infrastructure.
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statusPill}>
            <CheckCircle2 size={13} />
            Tous les systèmes opérationnels
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard
          label="Utilisateurs"
          value={userCount ?? '—'}
          icon={<Users size={18} />}
          trend="+12% ce mois"
          status="ok"
        />
        <StatCard
          label="Projets actifs"
          value={projectCount ?? '—'}
          icon={<Activity size={18} />}
          trend="En cours"
          status="ok"
        />
        <StatCard
          label="Rendez-vous"
          value={bookingCount ?? '—'}
          icon={<CalendarDays size={18} />}
          trend="Total"
          status="ok"
        />
        <StatCard
          label="Uptime"
          value="99.9%"
          icon={<TrendingUp size={18} />}
          trend="30 derniers jours"
          status="ok"
        />
      </div>

      {/* Section : Agenda */}
      <h2 className={styles.sectionTitle}>
        <CalendarDays size={20} />
        Agenda &amp; Rendez-vous
      </h2>
      <div className={styles.grid}>
        <NavCard
          href="/security/admin/booking-calendar"
          icon={<CalendarDays size={22} />}
          title="Calendrier des RDV"
          desc="Visualisez tous vos rendez-vous clients : nom, email, raison, heure et lien Meet."
          badge="Nouveau"
          badgeColor="var(--primary)"
          accent="var(--primary)"
        />
      </div>

      {/* Section : Finances */}
      <h2 className={styles.sectionTitle}>
        <BarChart2 size={20} />
        Finances
      </h2>
      <div className={styles.grid}>
        <NavCard
          href="/security/admin/finance"
          icon={<BarChart2 size={22} />}
          title="Dashboard Finances"
          desc="Suivez vos revenus, dépenses et épargne. Ajoutez des transactions et visualisez vos flux."
          badge="Personnel"
          badgeColor="var(--primary)"
          accent="var(--primary)"
        />
      </div>

      {/* Section : Gestion de projets */}
      <h2 className={styles.sectionTitle}>
        <Kanban size={20} />
        Gestion de projets
      </h2>
      <div className={styles.grid}>
        <NavCard
          href="/security/admin/kanban"
          icon={<Kanban size={22} />}
          title="Kanban Board"
          desc="Gérez vos tâches en colonnes drag-and-drop, avec priorités, checklist et commentaires."
          badge="Nouveau"
          accent="var(--primary)"
        />
      </div>

      {/* Section : Contrôles généraux */}
      <h2 className={styles.sectionTitle}>
        <Settings size={20} />
        Contrôles Généraux
      </h2>
      <div className={styles.grid}>
        <NavCard
          href="/admin/security"
          icon={<ShieldCheck size={22} />}
          title="Sécurité"
          desc="Logs de connexion et protocoles 2FA."
        />
        <NavCard
          href="/security/admin/nutrition"
          icon={<Database size={22} />}
          title="Base de données"
          desc="Maintenance et sauvegardes système."
        />
        <NavCard
          href="/admin/monitoring"
          icon={<Activity size={22} />}
          title="Monitoring"
          desc="État des services en temps réel."
        />
        <NavCard
          href="/admin/notifications"
          icon={<Bell size={22} />}
          title="Communications"
          desc="Configuration des emails et SMS."
        />
        <NavCard
          href="/admin/api"
          icon={<Lock size={22} />}
          title="Clés API"
          desc="Gestion des accès tiers."
        />
      </div>

      {/* Section : Licences */}
      <h2 className={styles.sectionTitle}>
        <Key size={20} />
        Gestion des Licences
      </h2>
      <div className={styles.grid}>
        <NavCard
          href="/admin/licences"
          icon={<FileText size={22} />}
          title="Vue d'ensemble"
          desc="Statut global de toutes les licences actives."
        />
        <NavCard
          href="/admin/licences/ringover"
          icon={<PhoneCall size={22} />}
          title="Ringover"
          desc="Gestion des lignes et licences VoIP Ringover."
          badge="Prioritaire"
          badgeColor="#c7ff44"
          accent="#c7ff44"
        />
        <NavCard
          href="/admin/licences/microsoft"
          icon={<Cloud size={22} />}
          title="Microsoft 365"
          desc="Assignation des sièges Business et Enterprise."
        />
        <NavCard
          href="/admin/licences/adobe"
          icon={<Globe size={22} />}
          title="Adobe Creative Cloud"
          desc="Gestion des abonnements créatifs."
        />
        <NavCard
          href="/admin/licences/billing"
          icon={<CreditCard size={22} />}
          title="Facturation"
          desc="Historique des paiements et renouvellements."
        />
      </div>
    </div>
  );
}