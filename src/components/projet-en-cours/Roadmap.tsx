"use client";

import React from "react";
import { FileText, Repeat, Kanban, ArrowUpRight } from "lucide-react";
import styles from "./Roadmap.module.css";

const buttons = [
  {
    id: "gdd",
    label: "GDD",
    fullLabel: "Game Design Document",
    url: "https://docs.google.com/document/d/1exemple_gdd",
    icon: FileText,
    stat: "12 pages",
  },
  {
    id: "sprint",
    label: "Sprint",
    fullLabel: "Sprint Planning",
    url: "https://docs.google.com/document/d/1exemple_sprint",
    icon: Repeat,
    stat: "Semaine 4",
  },
  {
    id: "kanban",
    label: "Kanban",
    fullLabel: "Tableau Kanban",
    url: "https://docs.google.com/document/d/1exemple_kanban",
    icon: Kanban,
    stat: "8 tâches",
  },
];

const Roadmap: React.FC = () => {
  const open = (url: string) =>
    window.open(url, "_blank", "noopener,noreferrer");

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Ressources</span>
        <span className={styles.headerBadge}>Projet</span>
      </div>

      <div className={styles.grid}>
        {buttons.map(({ id, label, fullLabel, url, icon: Icon, stat }) => (
          <button
            key={id}
            className={styles.card}
            onClick={() => open(url)}
            title={fullLabel}
          >
            <div className={styles.cardTop}>
              <div className={styles.iconWrap}>
                <Icon size={16} />
              </div>
              <ArrowUpRight size={14} className={styles.arrow} />
            </div>
            <div className={styles.cardLabel}>{label}</div>
            <div className={styles.cardStat}>{stat}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;