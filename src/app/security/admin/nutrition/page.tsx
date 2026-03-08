"use client";
// app/security/admin/nutrition/page.tsx — Main Dashboard Page
import React, { useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  getDailyLog,
  saveDailyLog,
  updateTask,
  getAlerts,
  checkAndGenerateAlerts,
  getWeeklyStats,
  getCurrentStreak,
  DailyLog,
  Alert,
  WeeklyStats,
  DEFAULT_TASKS,
  Task,
} from '@/utils/nutrition-api';
import { DailyChecklist } from './DailyChecklist';
import { AlertsPanel } from './AlertsPanel';
import { CalendarView } from './CalendarView';
import { StatsPanel } from './StatsPanel';
import styles from './dashboard.module.css';

// Mock user for development (remove when auth is implemented)
const MOCK_USER: User = {
  uid: 'mock-user-123',
  email: 'mathieudubris@example.com',
  displayName: 'Mathieu Dubris',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({ token: '' } as any),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  photoURL: null,
  providerId: '',
};

interface DashboardProps {
  user?: User;
}

const DashboardComponent: React.FC<DashboardProps> = ({ user = MOCK_USER }) => {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let dailyLog = await getDailyLog(user.uid, today);
      if (!dailyLog) {
        await saveDailyLog(user.uid, {}, today);
        dailyLog = await getDailyLog(user.uid, today);
      }

      const [alertsData, stats, currentStreak] = await Promise.all([
        getAlerts(user.uid),
        getWeeklyStats(user.uid),
        getCurrentStreak(user.uid),
        checkAndGenerateAlerts(user.uid),
      ]);

      setLog(dailyLog);
      setAlerts(alertsData);
      setWeeklyStats(stats);
      setStreak(currentStreak);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user.uid, today]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(user.uid, taskId, completed, undefined, today);
      const updated = await getDailyLog(user.uid, today);
      setLog(updated);
    } catch (err) {
      console.error('handleTaskToggle:', err);
    }
  };

  const score = log?.score?.completionRate ?? 0;
  const tasks = log?.tasks ?? DEFAULT_TASKS.map((t) => ({ ...t, completed: false }));

  const tasksByCategory = {
    nutrition: tasks.filter((t: Task) => t.category === 'nutrition'),
    fitness: tasks.filter((t: Task) => t.category === 'fitness'),
    lifestyle: tasks.filter((t: Task) => t.category === 'lifestyle'),
  };

  const formatDate = () =>
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const scoreColor =
    score >= 80 ? '#00ff87' : score >= 60 ? '#ffb347' : '#ff4d6d';

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardRoot}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.dateLabel}>{formatDate()}</span>
          <h1 className={styles.greeting}>
            Bonjour, <span>{user.displayName?.split(' ')[0] ?? 'Champion'}</span>
          </h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.streakBadge}>
            <span className={styles.streakFlame}>🔥</span>
            <span className={styles.streakCount}>{streak}</span>
            <span className={styles.streakLabel}>day streak</span>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {alerts.length > 0 && (
        <AlertsPanel
          alerts={alerts}
          userId={user.uid}
          onDismiss={() => load()}
        />
      )}

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Score Card */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreRing} style={{ '--score-color': scoreColor } as React.CSSProperties}>
            <svg viewBox="0 0 120 120" className={styles.ringsvg}>
              <circle cx="60" cy="60" r="52" className={styles.ringBg} />
              <circle
                cx="60"
                cy="60"
                r="52"
                className={styles.ringFill}
                style={{
                  stroke: scoreColor,
                  strokeDasharray: `${(score / 100) * 327} 327`,
                }}
              />
            </svg>
            <div className={styles.scoreCenter}>
              <span className={styles.scoreValue}>{score}%</span>
              <span className={styles.scoreLabel}>today</span>
            </div>
          </div>
          <div className={styles.scoreStats}>
            <div className={styles.scoreStat}>
              <span className={styles.scoreStatVal}>{log?.score?.completedCount ?? 0}</span>
              <span className={styles.scoreStatLabel}>done</span>
            </div>
            <div className={styles.scoreDivider} />
            <div className={styles.scoreStat}>
              <span className={styles.scoreStatVal}>{(log?.score?.totalCount ?? 0) - (log?.score?.completedCount ?? 0)}</span>
              <span className={styles.scoreStatLabel}>left</span>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className={styles.checklistSection}>
          <DailyChecklist
            tasksByCategory={tasksByCategory}
            onToggle={handleTaskToggle}
          />
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Quick Stats */}
          <StatsPanel
            weeklyStats={weeklyStats}
            log={log}
          />
          {/* Mini Calendar */}
          <CalendarView userId={user.uid} />
        </div>
      </div>
    </div>
  );
};

// Default export for Next.js page
export default DashboardComponent;