// components/StatsPanel/StatsPanel.tsx
import React from 'react';
import { WeeklyStats, DailyLog } from '@/utils/nutrition-api';
import styles from './StatsPanel.module.css';

interface Props {
  weeklyStats: WeeklyStats | null;
  log: DailyLog | null;
}

export const StatsPanel: React.FC<Props> = ({ weeklyStats, log }) => {
  const stats = [
    {
      label: 'Avg Weekly',
      value: weeklyStats ? `${weeklyStats.avgCompletionRate}%` : '—',
      sub: 'completion',
      color: '#7c3aed',
    },
    {
      label: 'Workouts',
      value: weeklyStats ? `${weeklyStats.workoutDays}/7` : '—',
      sub: 'this week',
      color: '#00d4aa',
    },
    {
      label: 'Calories',
      value: log?.nutrition?.calories ? `${log.nutrition.calories}` : '—',
      sub: 'today kcal',
      color: '#f59e0b',
    },
    {
      label: 'Protein',
      value: log?.nutrition?.protein ? `${log.nutrition.protein}g` : '—',
      sub: 'today',
      color: '#ff4d6d',
    },
  ];

  return (
    <div className={styles.root}>
      <span className={styles.title}>Quick Stats</span>
      <div className={styles.grid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat} style={{ '--color': s.color } as React.CSSProperties}>
            <span className={styles.statVal}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statSub}>{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
