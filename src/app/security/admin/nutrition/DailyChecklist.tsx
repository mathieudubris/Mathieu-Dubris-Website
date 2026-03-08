// components/DailyChecklist/DailyChecklist.tsx
import React from 'react';
import { Task } from '@/utils/nutrition-api';
import styles from './DailyChecklist.module.css';

interface Props {
  tasksByCategory: {
    nutrition: Task[];
    fitness: Task[];
    lifestyle: Task[];
  };
  onToggle: (taskId: string, completed: boolean) => void;
}

const CATEGORY_CONFIG = {
  nutrition: { label: 'Nutrition', icon: '🥗', accent: '#00d4aa' },
  fitness:   { label: 'Fitness',   icon: '💪', accent: '#7c3aed' },
  lifestyle: { label: 'Lifestyle', icon: '🧠', accent: '#f59e0b' },
};

export const DailyChecklist: React.FC<Props> = ({ tasksByCategory, onToggle }) => {
  return (
    <div className={styles.root}>
      <h2 className={styles.title}>Today's Checklist</h2>
      <div className={styles.categories}>
        {(Object.keys(tasksByCategory) as Array<keyof typeof tasksByCategory>).map((cat) => {
          const { label, icon, accent } = CATEGORY_CONFIG[cat];
          const tasks = tasksByCategory[cat];
          const done = tasks.filter((t) => t.completed).length;

          return (
            <div key={cat} className={styles.category}>
              <div className={styles.catHeader} style={{ '--accent': accent } as React.CSSProperties}>
                <span className={styles.catIcon}>{icon}</span>
                <span className={styles.catLabel}>{label}</span>
                <span className={styles.catProgress}>{done}/{tasks.length}</span>
              </div>
              <ul className={styles.taskList}>
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className={`${styles.taskItem} ${task.completed ? styles.done : ''}`}
                    onClick={() => onToggle(task.id, !task.completed)}
                    style={{ '--accent': accent } as React.CSSProperties}
                  >
                    <span className={styles.checkbox}>
                      {task.completed ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : null}
                    </span>
                    <span className={styles.taskLabel}>{task.label}</span>
                    {task.completedAt && (
                      <span className={styles.taskTime}>
                        {new Date(task.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
