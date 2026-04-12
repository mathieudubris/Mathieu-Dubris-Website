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

// ─── Codes ANSI texte uniquement (pas de background) ────────────────────────
// [2;37m = blanc   → À faire
// [2;34m = bleu    → En cours
// [2;33m = jaune   → En révision
// [2;31m = rouge   → Blocage
// [2;32m = vert    → Terminé
// [0m   = reset

const ANSI_RESET = '\u001b[0m';

const ANSI_COLOR: Record<string, string> = {
  white:  '\u001b[2;37m',
  blue:   '\u001b[2;34m',
  yellow: '\u001b[2;33m',
  red:    '\u001b[2;31m',
  green:  '\u001b[2;32m',
};

// ─── Résolution du statut ────────────────────────────────────────────────────

interface StatusInfo {
  label: string;
  color: number;      // couleur de la barre latérale Discord (embed color)
  ansiColor: string;  // code ANSI couleur texte
}

const STATUS_BY_KEY: Record<string, StatusInfo> = {
  todo:       { label: 'À faire',     color: 0xaaaaaa, ansiColor: ANSI_COLOR.white  },
  inprogress: { label: 'En cours',    color: 0x3b82f6, ansiColor: ANSI_COLOR.blue   },
  review:     { label: 'En révision', color: 0xf59e0b, ansiColor: ANSI_COLOR.yellow },
  blocked:    { label: 'Blocage',     color: 0xef4444, ansiColor: ANSI_COLOR.red    },
  done:       { label: 'Terminé',     color: 0x22c55e, ansiColor: ANSI_COLOR.green  },
};

const STATUS_BY_TITLE: Array<{ match: RegExp; key: string }> = [
  { match: /faire|todo/i,       key: 'todo'       },
  { match: /cours|progress/i,   key: 'inprogress' },
  { match: /révis|review/i,     key: 'review'     },
  { match: /bloc|block/i,       key: 'blocked'    },
  { match: /termin|done|fini/i, key: 'done'       },
];

function resolveStatus(columnId: string, columnTitle?: string): StatusInfo {
  // 1. Exact key match (todo, inprogress, review, blocked, done)
  if (STATUS_BY_KEY[columnId]) return STATUS_BY_KEY[columnId];
  // 2. Regex on columnTitle
  if (columnTitle) {
    for (const { match, key } of STATUS_BY_TITLE) {
      if (match.test(columnTitle)) return STATUS_BY_KEY[key];
    }
  }
  // 3. Regex on columnId as fallback (handles Firestore IDs that might contain keywords)
  for (const { match, key } of STATUS_BY_TITLE) {
    if (match.test(columnId)) return STATUS_BY_KEY[key];
  }
  // 4. Use columnTitle as label with neutral color
  return { label: columnTitle || columnId, color: 0xaaaaaa, ansiColor: ANSI_COLOR.white };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncate(text: string, maxChars = 40): string {
  if (!text) return '';
  const flat = text.replace(/\n+/g, ' ').trim();
  return flat.length > maxChars ? flat.slice(0, maxChars) + '…' : flat;
}

/**
 * Entoure chaque ligne non-vide avec le code ANSI couleur + reset.
 * Les lignes vides restent vides (séparateurs visuels propres).
 */
function colorizeLines(lines: string[], ansiColor: string): string {
  return lines
    .map(line => line === '' ? '' : `${ansiColor}${line}${ANSI_RESET}`)
    .join('\n');
}

// ─── Construction du payload Discord ─────────────────────────────────────────

interface EmbedOptions {
  title: string;
  description: string;
  columnId: string;
  columnTitle?: string;
  discordIds: string[];          // IDs Discord pour le ping réel (<@id>)
  discordUsernames?: string[];   // Usernames affichés en dehors du bloc
  startDate?: string;
  dueDate?: string;
  taskLink?: string;
}

function buildDiscordPayload(opts: EmbedOptions) {
  const { title, description, columnId, columnTitle, discordIds, discordUsernames = [], startDate, dueDate, taskLink } = opts;

  const status = resolveStatus(columnId, columnTitle);

  // ── Bloc ansi coloré : tout le contenu de la tâche ──
  const lines: string[] = [];
  lines.push(truncate(title, 40));

  const taskDesc = truncate(description || '', 40);
  if (taskDesc) lines.push(taskDesc);

  lines.push('');
  lines.push(`Statut : ${status.label}`);

  const dateParts: string[] = [];
  if (startDate) dateParts.push(`Début : ${startDate}`);
  if (dueDate)   dateParts.push(`Échéance : ${dueDate}`);
  if (dateParts.length > 0) lines.push(dateParts.join('  |  '));

  const coloredBlock = `\`\`\`ansi\n${colorizeLines(lines, status.ansiColor)}\n\`\`\``;

  // ── Mentions hors bloc ──
  // On affiche les @username en texte lisible ET on ping via <@id> dans allowed_mentions.
  // Les deux sont dans le `content` du message (au-dessus de l'embed) :
  //   - si on a les usernames : "@mathieu @sarah" (texte lisible)
  //   - sinon : "<@123456> <@789012>" (ping brut)
  let mentionContent: string | undefined;
  if (discordIds.length > 0) {
    if (discordUsernames.length > 0) {
      // Affiche @username et ping via <@id> simultanément :
      // le `content` contient les <@id> pour le ping, mais on les masque derrière les usernames
      // Discord ne permet pas de faire ça nativement — on choisit donc :
      // • content = "@username1 @username2 ..." (lisible, pas de ping)
      // • allowed_mentions.users = [...ids]  (ping effectif silencieux si Discord le supporte)
      mentionContent = discordUsernames.map(u => `@${u}`).join(' ');
    } else {
      // Fallback : ping brut <@id>
      mentionContent = discordIds.map(id => `<@${id}>`).join(' ');
    }
  }

  const embed: Record<string, any> = {
    description: coloredBlock,
    color: status.color,
  };

  if (taskLink) embed.url = taskLink;

  return {
    username: 'Kanban Task Manager',
    avatar_url: 'https://mathieu-dubris.fr/logo.png',
    content: mentionContent,
    embeds: [embed],
    // Ping effectif sur les IDs même si le content affiche les usernames
    allowed_mentions: { parse: [], users: discordIds },
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
  discordUsernames?: string[],
): Promise<{ success: boolean; messageId?: string; failedMentions: string[] }> {
  try {
    const payload = buildDiscordPayload({
      title, description, columnId, columnTitle,
      discordIds, discordUsernames,
      startDate, dueDate, taskLink,
    });
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
  discordUsernames?: string[],
): Promise<boolean> {
  try {
    const payload = buildDiscordPayload({
      title, description, columnId, columnTitle,
      discordIds, discordUsernames,
      startDate, dueDate, taskLink,
    });
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