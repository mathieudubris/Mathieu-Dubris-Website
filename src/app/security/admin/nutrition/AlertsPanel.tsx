// components/AlertsPanel/AlertsPanel.tsx
import React from 'react';
import { Alert, markAlertRead } from '@/utils/nutrition-api';
import styles from './AlertsPanel.module.css';

interface Props {
  alerts: Alert[];
  userId: string;
  onDismiss: () => void;
}

const ICONS: Record<Alert['severity'], string> = {
  danger: '🚨',
  warning: '⚠️',
  info: 'ℹ️',
};

export const AlertsPanel: React.FC<Props> = ({ alerts, userId, onDismiss }) => {
  const dismiss = async (alertId: string) => {
    await markAlertRead(userId, alertId);
    onDismiss();
  };

  return (
    <div className={styles.root}>
      {alerts.map((alert) => (
        <div key={alert.id} className={`${styles.alert} ${styles[alert.severity]}`}>
          <span className={styles.icon}>{ICONS[alert.severity]}</span>
          <span className={styles.message}>{alert.message}</span>
          <button
            className={styles.dismiss}
            onClick={() => dismiss(alert.id!)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
