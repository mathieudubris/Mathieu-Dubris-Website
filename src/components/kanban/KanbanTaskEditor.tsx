"use client";

import React, { useState, useRef } from "react";
import { X, Plus, Flag, Calendar, Link2, Users, Image as ImageIcon, Upload, Loader, Check, ExternalLink } from "lucide-react";
import { updateCard } from "@/utils/kanban-projet-api";
import type { KanbanCard, KanbanPriority } from "@/utils/kanban-projet-api";
import styles from "./KanbanTaskEditor.module.css";

const CLOUDINARY_CLOUD  = "dhqqx2m3y";
const CLOUDINARY_PRESET = "kanban-projet";
const CLOUDINARY_URL    = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

const PRIORITIES = [
  { value: "low",      label: "Basse",    color: "var(--green)"  },
  { value: "medium",   label: "Moyenne",  color: "var(--blue)"   },
  { value: "high",     label: "Haute",    color: "var(--orange)" },
  { value: "critical", label: "Critique", color: "var(--red)"    },
];

const COLOR_PALETTE = [
  { css: "var(--red)",     hex: "#d30000" },
  { css: "var(--orange)",  hex: "#f97316" },
  { css: "var(--yellow)",  hex: "#fbff11" },
  { css: "var(--green)",   hex: "#10ce55" },
  { css: "var(--blue)",    hex: "#3b82f6" },
  { css: "var(--purple)",  hex: "#d60aff" },
  { css: "var(--gray)",    hex: "#6b7280" },
  { css: "var(--primary)", hex: "#c7ff44" },
];

export interface TeamMemberForKanban {
  userId: string;
  displayName?: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
}

interface LinkEntry { id: string; name: string; url: string; }

interface KanbanTaskEditorProps {
  card?: KanbanCard;
  isNew?: boolean;
  columnId?: string;
  currentUser: any;
  onClose: () => void;
  onSave?: (title: string, assignees: string[]) => void;
  onToast: (msg: string) => void;
  columnActions?: { id: string; label: string }[];
  onMoveCard?: (cardId: string, targetColumnId: string) => void;
  projectId: string;
  boardId: string;
  teamMembers?: TeamMemberForKanban[];
}

export default function KanbanTaskEditor({
  card, isNew, columnId, currentUser, onClose, onSave, onToast,
  columnActions = [], onMoveCard, projectId, boardId, teamMembers = [],
}: KanbanTaskEditorProps) {
  const [title, setTitle]       = useState(card?.title || "");
  const [description, setDesc]  = useState(card?.description || "");
  const [priority, setPriority] = useState<KanbanPriority>(card?.priority || "medium");
  const [startDate, setStart]   = useState(
    (card as any)?.startDate
      ? (() => { const d = (card as any).startDate; return (d.toDate ? d.toDate() : new Date(d)).toISOString().split("T")[0]; })()
      : ""
  );
  const [dueDate, setDue] = useState(
    card?.dueDate
      ? (card.dueDate.toDate ? card.dueDate.toDate() : new Date(card.dueDate)).toISOString().split("T")[0]
      : ""
  );
  const [labels, setLabels]         = useState(card?.labels || []);
  const [assignees, setAssignees]   = useState<string[]>(card?.assignees || []);
  const [links, setLinks]           = useState<LinkEntry[]>(
    (card?.attachments || []).map(a => ({ id: a.id, name: a.name, url: a.url }))
  );
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl]   = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [selColorHex, setSelColorHex] = useState(COLOR_PALETTE[4].hex);
  const [selColorCss, setSelColorCss] = useState(COLOR_PALETTE[4].css);
  const [saving, setSaving]           = useState(false);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [targetCol, setTargetCol]     = useState(card?.columnId || columnId || "");
  const [uploading, setUploading]     = useState<string[]>([]);
  const [dragOver, setDragOver]       = useState(false);

  // ── Image URL input mode ──
  const [imgMode, setImgMode]         = useState<"upload" | "url">("upload");
  const [imgUrlInput, setImgUrlInput] = useState("");
  const [imgNameInput, setImgNameInput] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const IMAGE_EXTS = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i;
  const isImg = (url: string) => IMAGE_EXTS.test(url.split("?")[0]);
  const imageLinks = links.filter(l => isImg(l.url));
  const otherLinks = links.filter(l => !isImg(l.url));

  // Compact name: "Jean D."
  const memberName = (m: TeamMemberForKanban) =>
    m.firstName && m.lastName
      ? `${m.firstName} ${m.lastName[0]}.`
      : m.displayName || "Membre";

  const getMemberInfo = (m: TeamMemberForKanban) => ({
    name:    memberName(m),
    avatar:  m.image || m.photoURL || "",
    initial: (m.firstName || m.displayName || "?")[0].toUpperCase(),
  });

  const toggleAssignee = (uid: string) =>
    setAssignees(p => p.includes(uid) ? p.filter(id => id !== uid) : [...p, uid]);

  // ── Cloudinary upload ──
  const uploadFile = async (file: File): Promise<LinkEntry | null> => {
    const tid = `t-${Date.now()}`;
    setUploading(p => [...p, tid]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      fd.append("folder", `kanban/${projectId}`);
      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return { id: `img-${Date.now()}`, name: file.name, url: data.secure_url };
    } catch { onToast("Erreur upload"); return null; }
    finally { setUploading(p => p.filter(id => id !== tid)); }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!imgs.length) { onToast("Seules les images sont acceptées"); return; }
    const results = (await Promise.all(imgs.map(uploadFile))).filter(Boolean) as LinkEntry[];
    if (results.length) { setLinks(p => [...p, ...results]); onToast(`${results.length} image(s) uploadée(s)`); }
  };

  // ── Add image via URL ──
  const addImageUrl = () => {
    const url = imgUrlInput.trim();
    if (!url) return;
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    // Accept any URL as image (user knows what they paste)
    const name = imgNameInput.trim() || url.split("/").pop()?.split("?")[0] || "image";
    setLinks(p => [...p, { id: `img-url-${Date.now()}`, name, url: normalized }]);
    setImgUrlInput("");
    setImgNameInput("");
    onToast("Image ajoutée");
  };

  const addLink = () => {
    if (!newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    setLinks(p => [...p, { id: `link-${Date.now()}`, name: newLinkName.trim() || url, url }]);
    setNewLinkName(""); setNewLinkUrl("");
  };

  const addLabel = () => {
    if (!newLabelName.trim()) return;
    setLabels(p => [...p, { id: `lbl-${Date.now()}`, name: newLabelName.trim(), color: selColorHex }]);
    setNewLabelName(""); setShowLabelForm(false);
  };

  const handleSave = async () => {
    if (isNew && onSave) {
      if (!title.trim()) return;
      onSave(title.trim(), assignees);
      onClose();
      return;
    }
    if (!card) return;
    setSaving(true);
    try {
      await updateCard(projectId, boardId, card.id!, {
        title, description: description, priority, labels, assignees,
        dueDate:     dueDate     ? new Date(dueDate)     : null,
        startDate:   startDate   ? new Date(startDate)   : null,
        attachments: links,
      } as any);
      if (onMoveCard && targetCol !== card.columnId) await onMoveCard(card.id!, targetCol);
      onToast("Tâche mise à jour"); onClose();
    } catch { onToast("Erreur sauvegarde"); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.headerOuter}><div className={styles.header}>
          <input
            className={styles.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isNew ? "Titre de la tâche..." : "Titre..."}
            autoFocus
          />
          <button className={styles.closeBtn} onClick={onClose}><X size={17} /></button>
        </div></div>

        {/* Body */}
        <div className={styles.body}>
        <div className={styles.bodyInner}>

          {/* Description */}
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Description</span>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Description..."
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Priorité</span>
            <div className={styles.priorityPills}>
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  className={`${styles.priorityPill} ${priority === p.value ? styles.priorityPillActive : ""}`}
                  style={priority === p.value ? { background: p.color, borderColor: p.color } : {}}
                  onClick={() => setPriority(p.value as KanbanPriority)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Move column */}
          {!isNew && columnActions.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Déplacer vers</span>
              <div className={styles.movePills}>
                {columnActions.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.movePill} ${targetCol === c.id ? styles.movePillActive : ""}`}
                    onClick={() => setTargetCol(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className={styles.section}>
            <span className={styles.sectionTitle}><Calendar size={11} /> Dates</span>
            <div className={styles.dateRow}>
              <div className={styles.fieldGroup}>
                <span className={styles.sectionTitle}>Début</span>
                <input type="date" className={styles.smallInput} value={startDate} onChange={e => setStart(e.target.value)} style={{ colorScheme: "dark" }} />
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.sectionTitle}>Échéance</span>
                <input type="date" className={styles.smallInput} value={dueDate} onChange={e => setDue(e.target.value)} style={{ colorScheme: "dark" }} />
              </div>
            </div>
          </div>

          {/* Assignees */}
          {teamMembers.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionTitle}><Users size={11} /> Assignés</span>
              <div className={styles.assigneeGrid}>
                {teamMembers.map(m => {
                  const { name, avatar, initial } = getMemberInfo(m);
                  const on = assignees.includes(m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      className={`${styles.assigneeRow} ${on ? styles.assigneeOn : ""}`}
                      onClick={() => toggleAssignee(m.userId)}
                    >
                      <div className={styles.assigneeAvatar}>
                        {avatar
                          ? <img src={avatar} alt={name} className={styles.assigneeImg} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <span className={styles.assigneeInit}>{initial}</span>
                        }
                      </div>
                      <span className={styles.assigneeName}>{name}</span>
                      {on && <div className={styles.checkIcon}><Check size={7} /></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Labels */}
          <div className={styles.section}>
            <span className={styles.sectionTitle}><Flag size={11} /> Labels</span>
            <div className={styles.labelsWrap}>
              {labels.map(l => (
                <div key={l.id} className={styles.labelChip} style={{ background: l.color + "22", color: l.color }}>
                  {l.name}
                  <button className={styles.removeLabel} onClick={() => setLabels(labels.filter(x => x.id !== l.id))}><X size={8} /></button>
                </div>
              ))}
              <button className={styles.addLabelBtn} onClick={() => setShowLabelForm(!showLabelForm)}>
                <Plus size={9} /> Label
              </button>
            </div>
            {showLabelForm && (
              <div className={styles.labelCreator}>
                <input className={styles.smallInput} value={newLabelName} onChange={e => setNewLabelName(e.target.value)} placeholder="Nom du label" autoFocus />
                <div className={styles.palette}>
                  {COLOR_PALETTE.map(c => (
                    <div
                      key={c.hex}
                      className={`${styles.swatch} ${selColorHex === c.hex ? styles.swatchOn : ""}`}
                      style={{ background: c.css }}
                      onClick={() => { setSelColorHex(c.hex); setSelColorCss(c.css); }}
                    />
                  ))}
                </div>
                <div className={styles.labelActions}>
                  <button className={styles.btnPrimary} onClick={addLabel}>Ajouter</button>
                  <button className={styles.btnGhost} onClick={() => setShowLabelForm(false)}>Annuler</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Images — Upload OR URL ── */}
          <div className={styles.section}>
            <span className={styles.sectionTitle}><ImageIcon size={11} /> Images</span>

            {/* Mode toggle */}
            <div className={styles.imgModeTabs}>
              <button
                type="button"
                className={`${styles.imgModeTab} ${imgMode === "upload" ? styles.imgModeTabActive : ""}`}
                onClick={() => setImgMode("upload")}
              >
                <Upload size={10} /> Upload
              </button>
              <button
                type="button"
                className={`${styles.imgModeTab} ${imgMode === "url" ? styles.imgModeTabActive : ""}`}
                onClick={() => setImgMode("url")}
              >
                <Link2 size={10} /> Lien URL
              </button>
            </div>

            {imgMode === "upload" ? (
              <>
                <div
                  className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={async e => { e.preventDefault(); setDragOver(false); await handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading.length > 0
                    ? <span className={styles.dropZoneUploading}><Loader size={13} className={styles.spinIcon} /> Upload...</span>
                    : <><Upload size={13} style={{ opacity: 0.4 }} /><span>Glisser ou <u>cliquer</u></span></>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
              </>
            ) : (
              <div className={styles.imgUrlForm}>
                <input
                  className={styles.smallInput}
                  value={imgNameInput}
                  onChange={e => setImgNameInput(e.target.value)}
                  placeholder="Nom (optionnel)"
                />
                <div className={styles.imgUrlRow}>
                  <input
                    className={styles.smallInput}
                    value={imgUrlInput}
                    onChange={e => setImgUrlInput(e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    onKeyDown={e => e.key === "Enter" && addImageUrl()}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={addImageUrl}
                    disabled={!imgUrlInput.trim()}
                    style={{ padding: "0.38rem 0.65rem", flexShrink: 0 }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Previews */}
            {imageLinks.length > 0 && (
              <div className={styles.imagePreviewGrid}>
                {imageLinks.map(img => (
                  <div key={img.id} className={styles.imagePreviewItem}>
                    {/* No external link — clicking handled in Detail viewer */}
                    <div className={styles.imagePreviewLink}>
                      <img src={img.url} alt={img.name} className={styles.imagePreviewThumb} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <button className={styles.imageRemoveBtn} onClick={() => setLinks(p => p.filter(l => l.id !== img.id))}><X size={8} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className={styles.section}>
            <span className={styles.sectionTitle}><Link2 size={11} /> Liens</span>
            {otherLinks.length > 0 && (
              <div className={styles.linksList}>
                {otherLinks.map(l => (
                  <div key={l.id} className={styles.linkRow}>
                    <Link2 size={10} style={{ color: "var(--primary)", flexShrink: 0 }} />
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className={styles.linkAnchor} onClick={e => e.stopPropagation()}>{l.name}</a>
                    <button className={styles.removeLabel} onClick={() => setLinks(p => p.filter(x => x.id !== l.id))}><X size={9} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.linkAddRow}>
              <input className={styles.smallInput} value={newLinkName} onChange={e => setNewLinkName(e.target.value)} placeholder="Nom" style={{ flex: "0 0 95px" }} />
              <input className={styles.smallInput} value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." onKeyDown={e => e.key === "Enter" && addLink()} />
              <button className={styles.btnPrimary} onClick={addLink} style={{ padding: "0.38rem 0.6rem", flexShrink: 0 }}><Plus size={12} /></button>
            </div>
          </div>

        </div>
        </div>

        {/* Footer */}
        <div className={styles.footerOuter}><div className={styles.footer}>
          <button className={styles.btnGhost} onClick={onClose}>Annuler</button>
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={saving || uploading.length > 0 || !title.trim()}
          >
            {saving ? "Sauvegarde..." : uploading.length > 0 ? "Upload..." : isNew ? "Créer" : "Sauvegarder"}
          </button>
        </div></div>

      </div>
    </div>
  );
}