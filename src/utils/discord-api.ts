// utils/discord-api.ts
// Logique Discord centralisée — webhook uniquement (compatible plan Spark Firebase)
//
// ⚠️  SÉCURITÉ :
//   - N'utilisez JAMAIS le bot token côté client. Ce fichier n'en a pas besoin.
//   - Le webhook URL est lu depuis NEXT_PUBLIC_DISCORD_WEBHOOK_URL (.env.local)
//   - Le webhook est restreint à un salon précis — risque limité même s'il fuit.
//   - Pour révoquer : Discord → Paramètres du salon → Intégrations → Supprimer le webhook.
//
// Structure attendue dans .env.local :
//   NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/XXXXX/YYYYY
//
// Pour mentionner un membre Discord, ajoutez son discordId dans ses contacts :
//   { type: "discord", value: "NomUtilisateur#0000 ou ID numérique", isPublic: true }
// Si la valeur est un ID numérique (ex: "123456789012345678"), la mention <@ID> est possible.

import type { KanbanCard } from "./kanban-projet-api";
import type { ProjectTeamMember, Contact } from "./projet-api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DiscordNotificationPayload {
  card: KanbanCard;
  projectTitle: string;
  boardTitle: string;
  columnLabel: string;
  assignedMembers: ProjectTeamMember[];
}

export interface DiscordSendResult {
  success: boolean;
  error?: string;
}

// ─── Couleurs par priorité (côté gauche de l'embed Discord) ──────────────────

const PRIORITY_COLORS: Record<string, number> = {
  low:      0x22c55e,  // vert
  medium:   0x3b82f6,  // bleu
  high:     0xf59e0b,  // orange
  critical: 0xef4444,  // rouge
};

const PRIORITY_LABELS: Record<string, string> = {
  low:      "🟢 Basse",
  medium:   "🔵 Moyenne",
  high:     "🟠 Haute",
  critical: "🔴 Critique",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extrait l'identifiant Discord d'un membre depuis ses contacts.
 * Retourne un objet { handle, mention } :
 *   - handle  : nom d'affichage Discord (ex: "Jean#1234" ou "jean_dupont")
 *   - mention : chaîne de mention Discord si l'ID numérique est disponible (ex: "<@123456789>")
 *              ou simplement le handle entre backticks sinon.
 */
export const getDiscordInfo = (
  member: ProjectTeamMember
): { handle: string | null; mention: string } => {
  const discordContact = member.contacts?.find(
    (c: Contact) => c.type === "discord"
  );

  if (!discordContact?.value) {
    const fullName = `${member.firstName} ${member.lastName}`.trim();
    return { handle: null, mention: `**${fullName}**` };
  }

  const value = discordContact.value.trim();
  const fullName = `${member.firstName} ${member.lastName}`.trim();

  // Si la valeur est un ID numérique Discord (snowflake 17-19 chiffres)
  if (/^\d{17,19}$/.test(value)) {
    return { handle: value, mention: `<@${value}>` };
  }

  // Sinon on affiche le handle en bold avec le nom réel entre parenthèses
  return {
    handle: value,
    mention: `**${fullName}** (\`${value}\`)`,
  };
};

/**
 * Formate une date Firestore Timestamp ou Date en chaîne lisible.
 */
const formatDate = (ts: any): string => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ─── Fonction principale d'envoi ─────────────────────────────────────────────

/**
 * Envoie une notification Discord via webhook.
 * Construit un embed riche avec les détails de la tâche et les mentions.
 *
 * @param payload - Données de la tâche, du projet et des membres assignés.
 * @returns { success: boolean; error?: string }
 */
export const sendDiscordTaskNotification = async (
  payload: DiscordNotificationPayload
): Promise<DiscordSendResult> => {
  const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("discord-api: NEXT_PUBLIC_DISCORD_WEBHOOK_URL non défini.");
    return {
      success: false,
      error: "Webhook Discord non configuré. Ajoutez NEXT_PUBLIC_DISCORD_WEBHOOK_URL dans .env.local.",
    };
  }

  const { card, projectTitle, boardTitle, columnLabel, assignedMembers } = payload;

  // ── Construction des mentions et noms ───────────────────────────────────────
  const memberInfos = assignedMembers.map(getDiscordInfo);

  // Texte de mention (peut contenir <@ID> pour les vrais pings)
  const mentionsText =
    memberInfos.length > 0
      ? memberInfos.map((m) => m.mention).join(", ")
      : "_Aucun membre assigné_";

  // Texte de "ping" séparé — uniquement les vrais <@ID> pour notifier sur Discord
  const pingText = memberInfos
    .filter((m) => m.mention.startsWith("<@"))
    .map((m) => m.mention)
    .join(" ");

  // ── Labels ───────────────────────────────────────────────────────────────────
  const labelsText =
    card.labels && card.labels.length > 0
      ? card.labels.map((l) => `\`${l.name}\``).join(" ")
      : "_Aucun_";

  // ── Dates ────────────────────────────────────────────────────────────────────
  const startStr = formatDate((card as any).startDate);
  const dueStr = formatDate(card.dueDate);

  const datesFields = [];
  if (startStr) {
    datesFields.push({ name: "📅 Début", value: startStr, inline: true });
  }
  if (dueStr) {
    datesFields.push({ name: "⏰ Échéance", value: dueStr, inline: true });
  }

  // ── Embed Discord ─────────────────────────────────────────────────────────
  const embed = {
    title: `📋 ${card.title}`,
    description: card.description
      ? card.description.length > 300
        ? card.description.slice(0, 297) + "…"
        : card.description
      : "_Aucune description_",
    color: PRIORITY_COLORS[card.priority] ?? 0x3b82f6,
    fields: [
      {
        name: "👥 Assigné(s)",
        value: mentionsText,
        inline: false,
      },
      {
        name: "🏷️ Labels",
        value: labelsText,
        inline: true,
      },
      {
        name: "⚡ Priorité",
        value: PRIORITY_LABELS[card.priority] ?? card.priority,
        inline: true,
      },
      {
        name: "📌 Colonne",
        value: columnLabel,
        inline: true,
      },
      ...datesFields,
      {
        name: "📁 Projet",
        value: `**${projectTitle}** › ${boardTitle}`,
        inline: false,
      },
    ],
    footer: {
      text: "Notification Kanban",
    },
    timestamp: new Date().toISOString(),
  };

  // ── Body de la requête webhook ────────────────────────────────────────────
  // Le champ "content" est le texte hors embed — seul lui peut faire de vrais @mentions
  const body: Record<string, any> = {
    embeds: [embed],
  };

  // On ajoute les vraies mentions Discord en dehors de l'embed seulement si disponibles
  if (pingText) {
    body.content = pingText;
  }

  // ── Envoi ────────────────────────────────────────────────────────────────────
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Erreur inconnue");
      console.error("discord-api: Erreur webhook →", response.status, errorText);
      return {
        success: false,
        error: `Erreur Discord (${response.status}): ${errorText}`,
      };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur réseau";
    console.error("discord-api: Exception →", message);
    return { success: false, error: message };
  }
};

// ─── Notification simple (texte brut) ────────────────────────────────────────
// Utile pour des alertes rapides (ex: tâche supprimée, board créé…)

export const sendDiscordSimpleMessage = async (
  message: string
): Promise<DiscordSendResult> => {
  const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return { success: false, error: "Webhook Discord non configuré." };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Erreur Discord (${response.status})`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur réseau",
    };
  }
};