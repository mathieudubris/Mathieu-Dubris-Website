// utils/discord-notify-api.ts
// API pour les notifications Discord depuis le Kanban

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  Timestamp,
  collection,
} from 'firebase/firestore';
import { db } from './firebase-api';

export interface DiscordNotification {
  taskId: string;
  projectId: string;
  boardId: string;
  cardId: string;
  title: string;
  description: string;
  assigneeIds: string[];
  sentAt: any;
  sentBy: string;
}

export interface TaskNotificationStats {
  totalSent: number;
  lastSentAt: any;
  lastSentBy: string;
}

/**
 * Envoie une notification Discord via webhook
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  title: string,
  description: string,
  discordIds: string[],
  taskLink?: string
): Promise<{ success: boolean; mentionsSent: number; failedMentions: string[] }> {
  try {
    const mentions = discordIds.map(id => `<@${id}>`).join(' ');
    
    const embed = {
      title: `📋 Tâche Kanban : ${title}`,
      description: description.length > 2000 ? description.slice(0, 1997) + '...' : description,
      color: 0xc7ff44,
      fields: [
        {
          name: 'Assignés',
          value: mentions || 'Aucun assigné',
          inline: true,
        },
        {
          name: 'Nb personnes',
          value: discordIds.length.toString(),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    if (taskLink) {
      embed.fields.push({
        name: 'Lien',
        value: taskLink,
        inline: false,
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: discordIds.length > 0 ? `🔔 Nouvelle notification de tâche ${mentions}` : '🔔 Nouvelle notification de tâche',
        username: 'Kanban Task Manager',
        avatar_url: 'https://mathieu-dubris.fr/logo.png',
        embeds: [embed],
        allowed_mentions: {
          users: discordIds,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return { success: true, mentionsSent: discordIds.length, failedMentions: [] };
  } catch (error) {
    console.error('sendDiscordNotification error:', error);
    return { success: false, mentionsSent: 0, failedMentions: discordIds };
  }
}

/**
 * Récupère les statistiques de notifications pour une tâche
 */
export async function getTaskNotificationStats(
  projectId: string,
  boardId: string,
  cardId: string
): Promise<TaskNotificationStats | null> {
  try {
    const statsRef = doc(
      db,
      'portfolio',
      'projet-en-cours',
      'projects',
      projectId,
      'progression',
      boardId,
      'kanban_cards',
      cardId,
      'notificationStats',
      'stats'
    );
    const snap = await getDoc(statsRef);
    if (!snap.exists()) return null;
    return snap.data() as TaskNotificationStats;
  } catch (error) {
    console.error('getTaskNotificationStats error:', error);
    return null;
  }
}

/**
 * Incrémente le compteur de notifications pour une tâche
 */
export async function incrementTaskNotificationStats(
  projectId: string,
  boardId: string,
  cardId: string,
  sentBy: string
): Promise<void> {
  try {
    const statsRef = doc(
      db,
      'portfolio',
      'projet-en-cours',
      'projects',
      projectId,
      'progression',
      boardId,
      'kanban_cards',
      cardId,
      'notificationStats',
      'stats'
    );
    
    const snap = await getDoc(statsRef);
    
    if (snap.exists()) {
      await updateDoc(statsRef, {
        totalSent: increment(1),
        lastSentAt: Timestamp.now(),
        lastSentBy: sentBy,
      });
    } else {
      await setDoc(statsRef, {
        totalSent: 1,
        lastSentAt: Timestamp.now(),
        lastSentBy: sentBy,
      });
    }
  } catch (error) {
    console.error('incrementTaskNotificationStats error:', error);
  }
}

/**
 * Sauvegarde une notification dans l'historique
 */
export async function saveNotificationHistory(
  projectId: string,
  boardId: string,
  cardId: string,
  notification: Omit<DiscordNotification, 'sentAt'>
): Promise<void> {
  try {
    const historyRef = doc(
      collection(
        db,
        'portfolio',
        'projet-en-cours',
        'projects',
        projectId,
        'progression',
        boardId,
        'kanban_cards',
        cardId,
        'notificationHistory'
      )
    );
    
    await setDoc(historyRef, {
      ...notification,
      sentAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('saveNotificationHistory error:', error);
  }
}