// components/CalendarView/CalendarView.tsx
import React, { useEffect, useState } from 'react';
import { getLast30Days, DailyLog } from '@/utils/nutrition-api';
import styles from './CalendarView.module.css';

interface Props {
  userId: string;
}

export const CalendarView: React.FC<Props> = ({ userId }) => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selected, setSelected] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLast30Days(userId).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [userId]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Monday-first

  const logByDate = Object.fromEntries(logs.map((l) => [l.date, l]));

  const getStatus = (dateStr: string) => {
    const log = logByDate[dateStr];
    if (!log) return 'empty';
    const rate = log.score?.completionRate ?? 0;
    if (rate >= 80) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  };

  const monthLabel = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>Calendrier</span>
        <span className={styles.month}>{monthLabel}</span>
      </div>

      <div className={styles.weekdays}>
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
          <span key={d} className={styles.weekday}>{d}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {Array.from({ length: startOffset }).map((_, i) => (
          <span key={`empty-${i}`} className={styles.emptyCell} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = getStatus(dateStr);
          const isToday = day === today.getDate();
          const log = logByDate[dateStr];

          return (
            <button
              key={dateStr}
              className={`${styles.day} ${styles[status]} ${isToday ? styles.today : ''}`}
              onClick={() => log && setSelected(selected?.date === dateStr ? null : log)}
              title={log ? `${log.score?.completionRate ?? 0}%` : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className={styles.detail}>
          <div className={styles.detailDate}>
            {new Date(selected.date + 'T12:00:00').toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </div>
          <div className={styles.detailStats}>
            <div className={styles.detailStat}>
              <span className={styles.detailVal}>{selected.score?.completionRate ?? 0}%</span>
              <span className={styles.detailKey}>Score</span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailVal}>{selected.nutrition?.calories ?? 0}</span>
              <span className={styles.detailKey}>kcal</span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailVal}>{selected.nutrition?.protein ?? 0}g</span>
              <span className={styles.detailKey}>Protéines</span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailVal}>{selected.workout ? '✓' : '✗'}</span>
              <span className={styles.detailKey}>Workout</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.legend}>
        <span className={`${styles.dot} ${styles.green}`} /> ≥80%
        <span className={`${styles.dot} ${styles.orange}`} /> 50–79%
        <span className={`${styles.dot} ${styles.red}`} /> &lt;50%
      </div>
    </div>
  );
};
