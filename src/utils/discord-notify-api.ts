// utils/discord-notify-api.ts

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
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
  discordMessageId?: string;
  webhookUrl?: string;
}

// ─── Résolution du statut ────────────────────────────────────────────────────
// Gère à la fois les IDs courts (todo, inprogress…) et les titres de colonnes
// en français, pour couvrir le cas où columnId est un ID Firestore aléatoire
// et où on passe le titre à la place.

interface StatusInfo {
  label: string;
  color: number;   // couleur de la barre latérale Discord (embed color)
  emoji: string;
}

const STATUS_BY_KEY: Record<string, StatusInfo> = {
  // IDs courts
  todo:       { label: 'À faire',     color: 0xffffff, emoji: '⬜' },
  inprogress: { label: 'En cours',    color: 0x3b82f6, emoji: '🔵' },
  review:     { label: 'En révision', color: 0x8b5cf6, emoji: '🟣' },
  blocked:    { label: 'Blocage',     color: 0xef4444, emoji: '🔴' },
  done:       { label: 'Terminé',     color: 0x22c55e, emoji: '🟢' },
};

// Correspondances par titre de colonne (français, insensible à la casse)
const STATUS_BY_TITLE: Array<{ match: RegExp; key: string }> = [
  { match: /faire|todo/i,         key: 'todo'       },
  { match: /cours|progress/i,     key: 'inprogress' },
  { match: /révis|review/i,       key: 'review'     },
  { match: /bloc|block/i,         key: 'blocked'    },
  { match: /termin|done|fini/i,   key: 'done'       },
];

function resolveStatus(columnId: string, columnTitle?: string): StatusInfo {
  // 1. Essai par ID court exact
  if (STATUS_BY_KEY[columnId]) return STATUS_BY_KEY[columnId];

  // 2. Essai par titre de colonne passé en paramètre
  if (columnTitle) {
    for (const { match, key } of STATUS_BY_TITLE) {
      if (match.test(columnTitle)) return STATUS_BY_KEY[key];
    }
    // 3. Si le titre ne matche rien, utiliser le titre tel quel avec couleur neutre
    return { label: columnTitle, color: 0xaaaaaa, emoji: '⬜' };
  }

  // 4. Fallback neutre (ne jamais retourner le bleu Discord par défaut)
  return { label: columnId, color: 0xaaaaaa, emoji: '⬜' };
}

// ─── Helpers de formatage ────────────────────────────────────────────────────

/** Titre : max ~10 caractères affichables + ellipse */
function truncateTitle(text: string, maxChars = 10): string {
  if (!text) return '(Sans titre)';
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text;
}

/** Description : max ~40 caractères + ellipse */
function truncateDescription(text: string, maxChars = 40): string {
  if (!text) return '';
  // Aplatir les sauts de ligne en espaces pour rester sur 1 "bloc"
  const flat = text.replace(/\n+/g, ' ').trim();
  return flat.length > maxChars ? flat.slice(0, maxChars) + '…' : flat;
}

/** Mentions : max 4 lignes de 5 mentions, ellipse si dépassement */
function truncateMentions(mentions: string[], maxLines = 4, perLine = 5): string {
  if (mentions.length === 0) return '_Aucun assigné_';
  const lines: string[] = [];
  for (let i = 0; i < mentions.length; i += perLine) {
    lines.push(mentions.slice(i, i + perLine).join(' '));
  }
  if (lines.length <= maxLines) return lines.join('\n');
  return lines.slice(0, maxLines).join('\n') + ' …';
}

// ─── Construction du payload Discord ────────────────────────────────────────

interface EmbedOptions {
  title: string;
  description: string;
  columnId: string;
  columnTitle?: string;   // titre lisible de la colonne (optionnel mais recommandé)
  discordIds: string[];
  startDate?: string;
  dueDate?: string;
  taskLink?: string;
}

function buildDiscordPayload(opts: EmbedOptions) {
  const { title, description, columnId, columnTitle, discordIds, startDate, dueDate, taskLink } = opts;

  const status = resolveStatus(columnId, columnTitle);
  const mentions = discordIds.map(id => `<@${id}>`);

  // Footer : uniquement début et fin, sans heure d'envoi
  const footerParts: string[] = [];
  if (startDate) footerParts.push(`Début : ${startDate}`);
  if (dueDate)   footerParts.push(`Échéance : ${dueDate}`);
  const footerText = footerParts.length > 0 ? footerParts.join('   |   ') : 'Aucune date définie';

  const embed: Record<string, any> = {
    // Titre tronqué à ~10 caractères
    title: truncateTitle(title, 10),
    // Description tronquée à ~40 caractères
    description: truncateDescription(description || '', 40),
    // Couleur selon statut — garantit que la barre latérale reflète le bon statut
    color: status.color,
    fields: [
      {
        name: 'Assignés',
        value: truncateMentions(mentions, 4),
        inline: false,
      },
      {
        // Statut lisible avec emoji coloré pour renforcer visuellement
        name: 'Statut',
        value: `${status.emoji} ${status.label}`,
        inline: true,
      },
    ],
    footer: {
      text: footerText,
    },
    // Pas de `timestamp` : on ne veut pas afficher l'heure d'envoi Discord
  };

  if (taskLink) embed.url = taskLink;

  return {
    username: 'Kanban Task Manager',
    avatar_url: 'https://mathieu-dubris.fr/logo.png',
    embeds: [embed],
    // Aucune mention dans le `content` — uniquement dans le champ "Assignés"
    allowed_mentions: { parse: [] },
  };
}

// ─── ENVOYER (POST) ──────────────────────────────────────────────────────────

export async function sendDiscordNotification(
  webhookUrl: string,
  title: string,
  description: string,
  discordIds: string[],
  columnId: string,
  startDate?: string,
  dueDate?: string,
  taskLink?: string,
  columnTitle?: string,
): Promise<{ success: boolean; messageId?: string; failedMentions: string[] }> {
  try {
    const payload = buildDiscordPayload({ title, description, columnId, columnTitle, discordIds, startDate, dueDate, taskLink });
    const response = await fetch(webhookUrl + '?wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error('sendDiscordNotification HTTP error:', response.status, await response.text());
      return { success: false, failedMentions: discordIds };
    }
    const data = await response.json();
    return { success: true, messageId: data.id as string, failedMentions: [] };
  } catch (error) {
    console.error('sendDiscordNotification error:', error);
    return { success: false, failedMentions: discordIds };
  }
}

// ─── MODIFIER (PATCH) ────────────────────────────────────────────────────────

export async function editDiscordNotification(
  webhookUrl: string,
  messageId: string,
  title: string,
  description: string,
  discordIds: string[],
  columnId: string,
  startDate?: string,
  dueDate?: string,
  taskLink?: string,
  columnTitle?: string,
): Promise<boolean> {
  try {
    const payload = buildDiscordPayload({ title, description, columnId, columnTitle, discordIds, startDate, dueDate, taskLink });
    const response = await fetch(`${webhookUrl}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error('editDiscordNotification HTTP error:', response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('editDiscordNotification error:', error);
    return false;
  }
}

// ─── SUPPRIMER (DELETE) ──────────────────────────────────────────────────────

export async function deleteDiscordNotification(
  webhookUrl: string,
  messageId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${webhookUrl}/messages/${messageId}`, { method: 'DELETE' });
    return response.ok || response.status === 204;
  } catch (error) {
    console.error('deleteDiscordNotification error:', error);
    return false;
  }
}

// ─── FIRESTORE : stats & message id ─────────────────────────────────────────

function getStatsRef(projectId: string, boardId: string, cardId: string) {
  return doc(
    db,
    'portfolio', 'projet-en-cours',
    'projects', projectId,
    'progression', boardId,
    'kanban_cards', cardId,
    'notificationStats', 'stats'
  );
}

export async function getTaskNotificationStats(
  projectId: string,
  boardId: string,
  cardId: string
): Promise<TaskNotificationStats | null> {
  try {
    const snap = await getDoc(getStatsRef(projectId, boardId, cardId));
    if (!snap.exists()) return null;
    return snap.data() as TaskNotificationStats;
  } catch (error) {
    console.error('getTaskNotificationStats error:', error);
    return null;
  }
}

export async function saveNotificationStats(
  projectId: string,
  boardId: string,
  cardId: string,
  sentBy: string,
  messageId: string,
  webhookUrl: string
): Promise<void> {
  try {
    const ref = getStatsRef(projectId, boardId, cardId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { lastSentAt: Timestamp.now(), lastSentBy: sentBy, discordMessageId: messageId, webhookUrl });
    } else {
      await setDoc(ref, { totalSent: 1, lastSentAt: Timestamp.now(), lastSentBy: sentBy, discordMessageId: messageId, webhookUrl });
    }
  } catch (error) {
    console.error('saveNotificationStats error:', error);
  }
}

export async function deleteNotificationStats(
  projectId: string,
  boardId: string,
  cardId: string
): Promise<void> {
  try {
    await deleteDoc(getStatsRef(projectId, boardId, cardId));
  } catch (error) {
    console.error('deleteNotificationStats error:', error);
  }
}

export async function saveNotificationHistory(
  projectId: string,
  boardId: string,
  cardId: string,
  notification: Omit<DiscordNotification, 'sentAt'>
): Promise<void> {
  try {
    const historyRef = doc(
      collection(db, 'portfolio', 'projet-en-cours', 'projects', projectId, 'progression', boardId, 'kanban_cards', cardId, 'notificationHistory')
    );
    await setDoc(historyRef, { ...notification, sentAt: Timestamp.now() });
  } catch (error) {
    console.error('saveNotificationHistory error:', error);
  }
}