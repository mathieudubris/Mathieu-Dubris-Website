// nutrition-api.ts — Nutrition & Fitness Firestore Service
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase-api'; // Import the existing db instance

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface Task {
  id: string;
  label: string;
  category: 'nutrition' | 'fitness' | 'lifestyle';
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyLog {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  tasks: Task[];
  water: number; // glasses
  meals: number;
  snacks: number;
  protein: number; // g
  workout: boolean;
  running: boolean;
  sleep: number; // hours
  nutrition: DailyNutrition;
  score: {
    completionRate: number; // 0–100
    completedCount: number;
    totalCount: number;
  };
  createdAt: any;
  updatedAt: any;
}

export interface BodyMetric {
  id?: string;
  userId: string;
  date: string;
  weight: number; // kg
  notes?: string;
  createdAt: any;
}

export interface Alert {
  id?: string;
  userId: string;
  type: 'workout_missed' | 'calories_low' | 'low_completion' | 'streak_broken' | 'info';
  message: string;
  severity: 'warning' | 'danger' | 'info';
  read: boolean;
  createdAt: any;
}

export interface WeeklyStats {
  week: string; // YYYY-WW
  avgCompletionRate: number;
  totalCompletedDays: number;
  avgCalories: number;
  avgProtein: number;
  workoutDays: number;
  runningDays: number;
  streak: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  disciplineScore: number;
  avgCompletionRate: number;
  totalDaysTracked: number;
  avgCalories: number;
  avgProtein: number;
  habitStability: number; // 0–100
}

// ─────────────────────────────────────────────
// Default tasks template
// ─────────────────────────────────────────────

export const DEFAULT_TASKS: Omit<Task, 'completed' | 'completedAt'>[] = [
  { id: 'water', label: 'Drank 2L of water', category: 'nutrition' },
  { id: 'meals', label: 'Ate 3 main meals', category: 'nutrition' },
  { id: 'snacks', label: 'Ate 3 healthy snacks', category: 'nutrition' },
  { id: 'protein', label: 'Hit protein target (150g+)', category: 'nutrition' },
  { id: 'calories', label: 'Calories in target range', category: 'nutrition' },
  { id: 'workout', label: 'Workout completed', category: 'fitness' },
  { id: 'running', label: 'Running / cardio session', category: 'fitness' },
  { id: 'pushups', label: '100 pushups done', category: 'fitness' },
  { id: 'squats', label: '100 squats done', category: 'fitness' },
  { id: 'dips', label: '50 dips done', category: 'fitness' },
  { id: 'sleep', label: 'Slept 7–9 hours', category: 'lifestyle' },
  { id: 'discipline', label: 'Discipline task completed', category: 'lifestyle' },
  { id: 'noJunk', label: 'No junk food today', category: 'lifestyle' },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const todayString = (): string => new Date().toISOString().split('T')[0];

const userLogsRef = (userId: string) =>
  collection(db, 'users', userId, 'dailyLogs');

const userAlertsRef = (userId: string) =>
  collection(db, 'users', userId, 'alerts');

const userMetricsRef = (userId: string) =>
  collection(db, 'users', userId, 'bodyMetrics');

const calcScore = (tasks: Task[]) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  return {
    completedCount: completed,
    totalCount: total,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

// ─────────────────────────────────────────────
// Daily Log — Read / Write
// ─────────────────────────────────────────────

export const getDailyLog = async (
  userId: string,
  date: string = todayString()
): Promise<DailyLog | null> => {
  try {
    const ref = doc(db, 'users', userId, 'dailyLogs', date);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as DailyLog;
  } catch (error) {
    console.error('getDailyLog:', error);
    return null;
  }
};

export const saveDailyLog = async (
  userId: string,
  data: Partial<DailyLog>,
  date: string = todayString()
): Promise<void> => {
  try {
    const ref = doc(db, 'users', userId, 'dailyLogs', date);
    const existing = await getDoc(ref);
    const now = Timestamp.now();

    if (!existing.exists()) {
      const defaultTasks: Task[] = DEFAULT_TASKS.map((t) => ({
        ...t,
        completed: false,
      }));
      await setDoc(ref, {
        userId,
        date,
        tasks: defaultTasks,
        water: 0,
        meals: 0,
        snacks: 0,
        protein: 0,
        workout: false,
        running: false,
        sleep: 0,
        nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        score: calcScore(defaultTasks),
        ...data,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await updateDoc(ref, { ...data, updatedAt: now });
    }
  } catch (error) {
    console.error('saveDailyLog:', error);
    throw error;
  }
};

export const updateTask = async (
  userId: string,
  taskId: string,
  completed: boolean,
  notes?: string,
  date: string = todayString()
): Promise<void> => {
  try {
    const log = await getDailyLog(userId, date);
    if (!log) {
      await saveDailyLog(userId, {}, date);
    }

    const ref = doc(db, 'users', userId, 'dailyLogs', date);
    const snap = await getDoc(ref);
    const currentTasks: Task[] = snap.data()?.tasks ?? [];

    const updatedTasks = currentTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
            ...(notes !== undefined && { notes }),
          }
        : t
    );

    const score = calcScore(updatedTasks);
    await updateDoc(ref, {
      tasks: updatedTasks,
      score,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('updateTask:', error);
    throw error;
  }
};

export const updateNutrition = async (
  userId: string,
  nutrition: Partial<DailyNutrition>,
  date: string = todayString()
): Promise<void> => {
  try {
    const ref = doc(db, 'users', userId, 'dailyLogs', date);
    await updateDoc(ref, {
      nutrition,
      protein: nutrition.protein,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('updateNutrition:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Statistics
// ─────────────────────────────────────────────

export const getWeeklyStats = async (
  userId: string,
  weeksBack: number = 0
): Promise<WeeklyStats | null> => {
  try {
    const now = new Date();
    now.setDate(now.getDate() - weeksBack * 7);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];

    const q = query(
      userLogsRef(userId),
      where('date', '>=', startStr),
      where('date', '<=', endStr)
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((d) => d.data() as DailyLog);

    if (logs.length === 0) return null;

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const rates = logs.map((l) => l.score?.completionRate ?? 0);
    const calories = logs.map((l) => l.nutrition?.calories ?? 0);
    const proteins = logs.map((l) => l.nutrition?.protein ?? 0);

    // Streak: count consecutive days from today backward
    let streak = 0;
    const sortedDates = logs
      .map((l) => l.date)
      .sort()
      .reverse();
    for (const dateStr of sortedDates) {
      const log = logs.find((l) => l.date === dateStr);
      if (log && (log.score?.completionRate ?? 0) >= 60) streak++;
      else break;
    }

    const year = startOfWeek.getFullYear();
    const weekNum = Math.ceil(
      ((startOfWeek.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
    );

    return {
      week: `${year}-W${String(weekNum).padStart(2, '0')}`,
      avgCompletionRate: avg(rates),
      totalCompletedDays: logs.filter((l) => (l.score?.completionRate ?? 0) >= 60).length,
      avgCalories: avg(calories),
      avgProtein: avg(proteins),
      workoutDays: logs.filter((l) => l.workout).length,
      runningDays: logs.filter((l) => l.running).length,
      streak,
    };
  } catch (error) {
    console.error('getWeeklyStats:', error);
    return null;
  }
};

export const getMonthlyStats = async (
  userId: string,
  monthsBack: number = 0
): Promise<MonthlyStats | null> => {
  try {
    const now = new Date();
    now.setMonth(now.getMonth() - monthsBack);

    const year = now.getFullYear();
    const month = now.getMonth();
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

    const q = query(
      userLogsRef(userId),
      where('date', '>=', startStr),
      where('date', '<=', endStr)
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((d) => d.data() as DailyLog);

    if (logs.length === 0) return null;

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const rates = logs.map((l) => l.score?.completionRate ?? 0);
    const avgRate = avg(rates);

    // Habit stability: stdev-based (lower variance = higher stability)
    const mean = avgRate;
    const variance =
      rates.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    const stability = Math.max(0, Math.round(100 - stdDev));

    return {
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      disciplineScore: avgRate,
      avgCompletionRate: avgRate,
      totalDaysTracked: logs.length,
      avgCalories: avg(logs.map((l) => l.nutrition?.calories ?? 0)),
      avgProtein: avg(logs.map((l) => l.nutrition?.protein ?? 0)),
      habitStability: stability,
    };
  } catch (error) {
    console.error('getMonthlyStats:', error);
    return null;
  }
};

export const getLast30Days = async (
  userId: string
): Promise<DailyLog[]> => {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);

    const q = query(
      userLogsRef(userId),
      where('date', '>=', start.toISOString().split('T')[0]),
      where('date', '<=', end.toISOString().split('T')[0]),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as DailyLog);
  } catch (error) {
    console.error('getLast30Days:', error);
    return [];
  }
};

// ─────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────

export const createAlert = async (
  userId: string,
  alert: Omit<Alert, 'id' | 'userId' | 'createdAt' | 'read'>
): Promise<void> => {
  try {
    await addDoc(userAlertsRef(userId), {
      userId,
      ...alert,
      read: false,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('createAlert:', error);
    throw error;
  }
};

export const getAlerts = async (userId: string): Promise<Alert[]> => {
  try {
    const q = query(
      userAlertsRef(userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Alert);
  } catch (error) {
    console.error('getAlerts:', error);
    return [];
  }
};

export const markAlertRead = async (
  userId: string,
  alertId: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId, 'alerts', alertId), { read: true });
  } catch (error) {
    console.error('markAlertRead:', error);
  }
};

export const checkAndGenerateAlerts = async (userId: string): Promise<void> => {
  try {
    const logs = await getLast30Days(userId);
    if (logs.length < 3) return;

    const last7 = logs.slice(-7);
    const last3 = logs.slice(-3);

    // Alert: workout skipped 3 days in a row
    const workoutMissed3 = last3.every((l) => !l.workout);
    if (workoutMissed3) {
      await createAlert(userId, {
        type: 'workout_missed',
        message: 'No workout logged in the last 3 days. Time to get back on track!',
        severity: 'warning',
      });
    }

    // Alert: calories too low for 3 days
    const caloriesTooLow = last3.every((l) => (l.nutrition?.calories ?? 0) < 1200);
    if (caloriesTooLow) {
      await createAlert(userId, {
        type: 'calories_low',
        message: 'Caloric intake has been very low for 3 consecutive days.',
        severity: 'danger',
      });
    }

    // Alert: completion < 60% for 7 days
    const lowCompletion7 = last7.every((l) => (l.score?.completionRate ?? 0) < 60);
    if (lowCompletion7) {
      await createAlert(userId, {
        type: 'low_completion',
        message: 'Discipline score has been below 60% for 7 days. Refocus!',
        severity: 'danger',
      });
    }
  } catch (error) {
    console.error('checkAndGenerateAlerts:', error);
  }
};

// ─────────────────────────────────────────────
// Body Metrics
// ─────────────────────────────────────────────

export const saveBodyMetric = async (
  userId: string,
  weight: number,
  notes?: string
): Promise<void> => {
  try {
    const date = todayString();
    await addDoc(userMetricsRef(userId), {
      userId,
      date,
      weight,
      notes: notes ?? '',
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('saveBodyMetric:', error);
    throw error;
  }
};

export const getBodyMetrics = async (
  userId: string,
  daysBack: number = 90
): Promise<BodyMetric[]> => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - daysBack);
    const q = query(
      userMetricsRef(userId),
      where('date', '>=', start.toISOString().split('T')[0]),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as BodyMetric);
  } catch (error) {
    console.error('getBodyMetrics:', error);
    return [];
  }
};

// ─────────────────────────────────────────────
// Streak Calculator
// ─────────────────────────────────────────────

export const getCurrentStreak = async (userId: string): Promise<number> => {
  try {
    const logs = await getLast30Days(userId);
    if (!logs.length) return 0;

    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    let expectedDate = new Date();

    for (const log of sorted) {
      const logDate = log.date;
      const expected = expectedDate.toISOString().split('T')[0];

      if (logDate === expected && (log.score?.completionRate ?? 0) >= 60) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('getCurrentStreak:', error);
    return 0;
  }
};