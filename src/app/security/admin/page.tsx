"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Users, 
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
  Cloud
} from 'lucide-react';
import styles from './page.module.css';

const AdminPage = () => {
  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <h1>Tableau de Bord Administrateur</h1>
        <p>Gérez les paramètres globaux et les accès de votre infrastructure.</p>
      </header>

      {/* Section Contrôles Généraux */}
      <h2 className={styles.sectionTitle}>
        <Settings size={24} /> Contrôles Généraux
      </h2>
      <div className={styles.grid}>
        <Link href="/admin/users" className={styles.card}>
          <div className={styles.iconWrapper}><Users size={24} /></div>
          <span className={styles.cardTitle}>Utilisateurs</span>
          <p className={styles.cardDesc}>Gérer les comptes et les permissions.</p>
        </Link>

        <Link href="/admin/security" className={styles.card}>
          <div className={styles.iconWrapper}><ShieldCheck size={24} /></div>
          <span className={styles.cardTitle}>Sécurité</span>
          <p className={styles.cardDesc}>Logs de connexion et protocoles 2FA.</p>
        </Link>

        <Link href="/admin/database" className={styles.card}>
          <div className={styles.iconWrapper}><Database size={24} /></div>
          <span className={styles.cardTitle}>Base de données</span>
          <p className={styles.cardDesc}>Maintenance et sauvegardes système.</p>
        </Link>

        <Link href="/admin/monitoring" className={styles.card}>
          <div className={styles.iconWrapper}><Activity size={24} /></div>
          <span className={styles.cardTitle}>Monitoring</span>
          <p className={styles.cardDesc}>État des services en temps réel.</p>
        </Link>

        <Link href="/admin/notifications" className={styles.card}>
          <div className={styles.iconWrapper}><Bell size={24} /></div>
          <span className={styles.cardTitle}>Communications</span>
          <p className={styles.cardDesc}>Configuration des emails et SMS.</p>
        </Link>

        <Link href="/admin/api" className={styles.card}>
          <div className={styles.iconWrapper}><Lock size={24} /></div>
          <span className={styles.cardTitle}>Clés API</span>
          <p className={styles.cardDesc}>Gestion des accès tiers.</p>
        </Link>
      </div>

      {/* Section Gestion des Licences */}
      <h2 className={styles.sectionTitle}>
        <Key size={24} /> Gestion des Licences
      </h2>
      <div className={styles.grid}>
        <Link href="/admin/licences" className={styles.card}>
          <div className={styles.iconWrapper}><FileText size={24} /></div>
          <span className={styles.cardTitle}>Vue d'ensemble</span>
          <p className={styles.cardDesc}>Statut global de toutes les licences actives.</p>
        </Link>

        <Link href="/admin/licences/ringover" className={styles.card}>
          <div className={styles.iconWrapper}><PhoneCall size={24} /></div>
          <span className={styles.cardTitle}>Ringover</span>
          <p className={styles.cardDesc}>Gestion des lignes et licences VoIP Ringover.</p>
          <span className={styles.badge}>Prioritaire</span>
        </Link>

        <Link href="/admin/licences/microsoft" className={styles.card}>
          <div className={styles.iconWrapper}><Cloud size={24} /></div>
          <span className={styles.cardTitle}>Microsoft 365</span>
          <p className={styles.cardDesc}>Assignation des sièges Business et Enterprise.</p>
        </Link>

        <Link href="/admin/licences/adobe" className={styles.card}>
          <div className={styles.iconWrapper}><Globe size={24} /></div>
          <span className={styles.cardTitle}>Adobe Creative Cloud</span>
          <p className={styles.cardDesc}>Gestion des abonnements créatifs.</p>
        </Link>

        <Link href="/admin/licences/billing" className={styles.card}>
          <div className={styles.iconWrapper}><CreditCard size={24} /></div>
          <span className={styles.cardTitle}>Facturation</span>
          <p className={styles.cardDesc}>Historique des paiements et renouvellements.</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminPage;