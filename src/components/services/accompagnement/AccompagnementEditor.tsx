"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X, Save, Info, Tag, Target, Users2, Clock, DollarSign,
  Globe, Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon,
  Search, Check, Mail, BookOpen, FileText, Link as LinkIcon,
  HelpCircle, StickyNote, ChevronRight,
} from 'lucide-react';
import {
  FullAccompagnement,
  AccompagnementModule,
  AccompagnementLesson,
  LessonType,
  LessonResource,
  QuizQuestion,
  saveAccompagnement,
  generateUniqueAccompagnementSlug,
  generateAccompagnementSlug,
} from '@/utils/accompagnement-api';
import styles from './AccompagnementEditor.module.css';

const CATEGORIES = ['Coaching', 'Mentorat', 'Conseil', 'Formation', 'Suivi', 'Autre'];
const LEVELS = ['débutant', 'intermédiaire', 'avancé', 'expert'] as const;
const CURRENCIES = ['EUR', 'USD', 'GBP'];
const LESSON_TYPES: { value: LessonType; label: string }[] = [
  { value: 'introduction', label: 'Introduction' },
  { value: 'developpement', label: 'Développement' },
  { value: 'lecon', label: 'Leçon' },
  { value: 'pratique', label: 'Pratique' },
  { value: 'conclusion', label: 'Conclusion' },
  { value: 'autre', label: 'Autre' },
];
const RESOURCE_TYPES = ['pdf', 'link', 'zip', 'doc', 'autre'] as const;

const TABS = ['Informations', 'Médias', 'Modules', 'Équipe'] as const;
type Tab = typeof TABS[number];

interface Props {
  accompagnement: FullAccompagnement | null;
  currentUser: any;
  allUsers: any[];
  onClose: () => void;
  onSave: () => Promise<void>;
}

function detectType(url: string): string {
  if (/\.gif(\?|$)/i.test(url)) return 'gif';
  return 'image';
}

const AccompagnementEditor: React.FC<Props> = ({ accompagnement, currentUser, allUsers, onClose, onSave }) => {
  const isNew = !accompagnement?.id;

  const [activeTab, setActiveTab] = useState<Tab>('Informations');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Info fields ──
  const [title, setTitle] = useState(accompagnement?.title || '');
  const [slug, setSlug] = useState(accompagnement?.slug || '');
  const [editingSlug, setEditingSlug] = useState(false);
  const [category, setCategory] = useState(accompagnement?.category || '');
  const [level, setLevel] = useState<FullAccompagnement['level']>(accompagnement?.level || 'débutant');
  const [language, setLanguage] = useState(accompagnement?.language || 'Français');
  const [duration, setDuration] = useState(accompagnement?.duration || '');
  const [price, setPrice] = useState<number | ''>(accompagnement?.price ?? '');
  const [currency, setCurrency] = useState(accompagnement?.currency || 'EUR');
  const [description, setDescription] = useState(accompagnement?.description || '');
  const [objective, setObjective] = useState(accompagnement?.objective || '');
  const [targetAudience, setTargetAudience] = useState(accompagnement?.targetAudience || '');
  const [prerequisites, setPrerequisites] = useState(accompagnement?.prerequisites || '');

  // ── Media ──
  const [mainImage, setMainImage] = useState(accompagnement?.image || '');
  const [carouselImages, setCarouselImages] = useState<any[]>(
    (accompagnement?.carouselImages || []).map((i) =>
      typeof i === 'string' ? { url: i, type: 'image' } : i
    )
  );

  // ── Modules ──
  const [modules, setModules] = useState<AccompagnementModule[]>(accompagnement?.modules || []);
  const [expandedModuleIdx, setExpandedModuleIdx] = useState<number | null>(null);
  const [expandedLessonIdx, setExpandedLessonIdx] = useState<{ mod: number; les: number } | null>(null);

  // ── Team ──
  const [teamMembers, setTeamMembers] = useState<string[]>(accompagnement?.teamMembers || []);
  const [memberSearch, setMemberSearch] = useState('');
  const [totalParticipants, setTotalParticipants] = useState<number>(accompagnement?.totalParticipants ?? 0);
  const [activeParticipants, setActiveParticipants] = useState<number>(accompagnement?.activeParticipants ?? 0);

  useEffect(() => {
    if (isNew && title && !editingSlug) {
      setSlug(generateAccompagnementSlug(title));
    }
  }, [title, isNew, editingSlug]);

  const openCloudinary = (onSuccess: (url: string) => void, multiple = false) => {
    if (typeof window === 'undefined' || !(window as any).cloudinary) return;
    (window as any).cloudinary.createUploadWidget(
      { cloudName: 'dhqqx2m3y', uploadPreset: 'blog_preset', sources: ['local', 'url'], multiple, resourceType: 'image', theme: 'minimal' },
      (_: any, result: any) => {
        if (!_ && result?.event === 'success') onSuccess(result.info.secure_url);
      }
    ).open();
  };

  // ── Module helpers ──
  const addModule = () => {
    const idx = modules.length;
    setModules([...modules, { id: Date.now().toString(), title: '', description: '', duration: '', order: idx, lessons: [] }]);
    setExpandedModuleIdx(idx);
  };

  const updateModule = (i: number, field: keyof AccompagnementModule, val: any) => {
    setModules(modules.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const removeModule = (i: number) => {
    setModules(modules.filter((_, idx) => idx !== i).map((m, idx) => ({ ...m, order: idx })));
    setExpandedModuleIdx(null);
    setExpandedLessonIdx(null);
  };

  const moveModule = (i: number, dir: 'up' | 'down') => {
    const arr = [...modules];
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setModules(arr.map((m, idx) => ({ ...m, order: idx })));
  };

  // ── Lesson helpers ──
  const addLesson = (modIdx: number) => {
    const mod = modules[modIdx];
    const lessons = mod.lessons || [];
    const newLesson: AccompagnementLesson = {
      id: Date.now().toString(),
      title: '',
      type: 'lecon',
      duration: '',
      notes: '',
      resources: [],
      quiz: [],
      order: lessons.length,
    };
    const updated = [...modules];
    updated[modIdx] = { ...mod, lessons: [...lessons, newLesson] };
    setModules(updated);
    setExpandedLessonIdx({ mod: modIdx, les: lessons.length });
  };

  const updateLesson = (modIdx: number, lesIdx: number, field: keyof AccompagnementLesson, val: any) => {
    const updated = [...modules];
    const lessons = [...(updated[modIdx].lessons || [])];
    lessons[lesIdx] = { ...lessons[lesIdx], [field]: val };
    updated[modIdx] = { ...updated[modIdx], lessons };
    setModules(updated);
  };

  const removeLesson = (modIdx: number, lesIdx: number) => {
    const updated = [...modules];
    const lessons = (updated[modIdx].lessons || []).filter((_, i) => i !== lesIdx).map((l, i) => ({ ...l, order: i }));
    updated[modIdx] = { ...updated[modIdx], lessons };
    setModules(updated);
    setExpandedLessonIdx(null);
  };

  const moveLessonUp = (modIdx: number, lesIdx: number) => {
    if (lesIdx === 0) return;
    const updated = [...modules];
    const lessons = [...(updated[modIdx].lessons || [])];
    [lessons[lesIdx - 1], lessons[lesIdx]] = [lessons[lesIdx], lessons[lesIdx - 1]];
    updated[modIdx] = { ...updated[modIdx], lessons: lessons.map((l, i) => ({ ...l, order: i })) };
    setModules(updated);
  };

  const moveLessonDown = (modIdx: number, lesIdx: number) => {
    const lessons = modules[modIdx].lessons || [];
    if (lesIdx >= lessons.length - 1) return;
    const updated = [...modules];
    const les = [...lessons];
    [les[lesIdx], les[lesIdx + 1]] = [les[lesIdx + 1], les[lesIdx]];
    updated[modIdx] = { ...updated[modIdx], lessons: les.map((l, i) => ({ ...l, order: i })) };
    setModules(updated);
  };

  // ── Resource helpers ──
  const addResource = (modIdx: number, lesIdx: number) => {
    const newRes: LessonResource = { id: Date.now().toString(), name: '', url: '', type: 'link' };
    const lesson = modules[modIdx].lessons![lesIdx];
    updateLesson(modIdx, lesIdx, 'resources', [...(lesson.resources || []), newRes]);
  };

  const updateResource = (modIdx: number, lesIdx: number, resIdx: number, field: keyof LessonResource, val: any) => {
    const lesson = modules[modIdx].lessons![lesIdx];
    const resources = [...(lesson.resources || [])];
    resources[resIdx] = { ...resources[resIdx], [field]: val };
    updateLesson(modIdx, lesIdx, 'resources', resources);
  };

  const removeResource = (modIdx: number, lesIdx: number, resIdx: number) => {
    const lesson = modules[modIdx].lessons![lesIdx];
    updateLesson(modIdx, lesIdx, 'resources', (lesson.resources || []).filter((_, i) => i !== resIdx));
  };

  // ── Quiz helpers ──
  const addQuizQuestion = (modIdx: number, lesIdx: number) => {
    const newQ: QuizQuestion = {
      id: Date.now().toString(),
      question: '',
      options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
      correctIndex: 0,
      explanation: '',
    };
    const lesson = modules[modIdx].lessons![lesIdx];
    updateLesson(modIdx, lesIdx, 'quiz', [...(lesson.quiz || []), newQ]);
  };

  const updateQuizQuestion = (modIdx: number, lesIdx: number, qIdx: number, field: keyof QuizQuestion, val: any) => {
    const lesson = modules[modIdx].lessons![lesIdx];
    const quiz = [...(lesson.quiz || [])];
    quiz[qIdx] = { ...quiz[qIdx], [field]: val };
    updateLesson(modIdx, lesIdx, 'quiz', quiz);
  };

  const updateQuizOption = (modIdx: number, lesIdx: number, qIdx: number, oIdx: number, text: string) => {
    const lesson = modules[modIdx].lessons![lesIdx];
    const quiz = [...(lesson.quiz || [])];
    const options = [...quiz[qIdx].options];
    options[oIdx] = { text };
    quiz[qIdx] = { ...quiz[qIdx], options };
    updateLesson(modIdx, lesIdx, 'quiz', quiz);
  };

  const removeQuizQuestion = (modIdx: number, lesIdx: number, qIdx: number) => {
    const lesson = modules[modIdx].lessons![lesIdx];
    updateLesson(modIdx, lesIdx, 'quiz', (lesson.quiz || []).filter((_, i) => i !== qIdx));
  };

  // ── Team ──
  const filteredUsers = useMemo(() => {
    if (!memberSearch.trim()) return allUsers;
    const q = memberSearch.toLowerCase();
    return allUsers.filter(
      (u) => u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [allUsers, memberSearch]);

  const toggleMember = (uid: string) => {
    setTeamMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // ── Save ──
  const handleSave = async () => {
    if (!title.trim()) { setError('Le titre est obligatoire'); return; }
    if (!category) { setError('La catégorie est obligatoire'); return; }
    setSaving(true);
    setError('');
    try {
      const finalSlug = isNew
        ? await generateUniqueAccompagnementSlug(title, accompagnement?.slug)
        : slug;

      await saveAccompagnement(
        {
          title,
          slug: finalSlug,
          category,
          level,
          language,
          duration,
          price: price === '' ? undefined : Number(price),
          currency,
          visibility: 'public',
          teamMembers,
          createdBy: currentUser.uid,
          description,
          objective,
          targetAudience,
          prerequisites,
          image: mainImage,
          carouselImages,
          modules: modules.map((m, i) => ({ ...m, order: i })),
          totalParticipants,
          activeParticipants,
        },
        isNew ? undefined : accompagnement?.id
      );
      await onSave();
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la sauvegarde');
      setSaving(false);
    }
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.modal}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>{isNew ? 'Nouvel accompagnement' : 'Modifier l\'accompagnement'}</h2>
          <div className={styles.headerActions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              <Save size={14} />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button className={styles.closeBtn} onClick={onClose}><X size={17} /></button>
          </div>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`} onClick={() => setActiveTab(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className={styles.body}>

          {/* ────────────────── TAB: Informations ────────────────── */}
          {activeTab === 'Informations' && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.label}><Info size={14} /> Titre</label>
                <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Accompagnement entrepreneurial" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}><Tag size={14} /> Slug URL</label>
                <input
                  className={styles.input}
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }}
                  onFocus={() => setEditingSlug(true)}
                  onBlur={() => setEditingSlug(false)}
                  placeholder="accompagnement-entrepreneurial"
                />
                <p className={styles.hint}>Généré automatiquement depuis le titre</p>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}><Tag size={14} /> Catégorie</label>
                  <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">— Choisir —</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}><Target size={14} /> Niveau</label>
                  <select className={styles.select} value={level} onChange={(e) => setLevel(e.target.value as any)}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}><Globe size={14} /> Langue</label>
                  <input className={styles.input} value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Français" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}><Clock size={14} /> Durée</label>
                  <input className={styles.input} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 3 mois" />
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}><DollarSign size={14} /> Prix</label>
                  <input type="number" min={0} className={styles.input} value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0 = gratuit" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Devise</label>
                  <select className={styles.select} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}><Info size={14} /> Description</label>
                <textarea className={styles.textarea} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez l'accompagnement…" />
                <p className={styles.hint}>{description.length} caractères</p>
              </div>

              <div className={styles.field}>
                <label className={styles.label}><Target size={14} /> Objectif</label>
                <input className={styles.input} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Ce que le bénéficiaire va atteindre" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}><Users2 size={14} /> Public cible</label>
                <input className={styles.input} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Ex: Entrepreneurs, porteurs de projet…" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Prérequis</label>
                <input className={styles.input} value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} placeholder="Ex: Avoir une idée de projet…" />
              </div>
            </div>
          )}

          {/* ────────────────── TAB: Médias ────────────────── */}
          {activeTab === 'Médias' && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.label}><ImageIcon size={14} /> Image de couverture</label>
                <div className={styles.coverZone} onClick={() => openCloudinary(setMainImage)}>
                  {mainImage ? (
                    <>
                      <img src={mainImage} alt="Cover" className={styles.coverImg} />
                      <div className={styles.coverOverlay}><ImageIcon size={16} /><span>Remplacer</span></div>
                    </>
                  ) : (
                    <div className={styles.coverEmpty}>
                      <ImageIcon size={28} />
                      <span>Cliquer pour uploader</span>
                      <span className={styles.coverHint}>16:9 recommandé</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label}><ImageIcon size={14} /> Galerie</label>
                  <button type="button" className={styles.addSmallBtn} onClick={() => openCloudinary((url) => {
                    setCarouselImages((prev) => [...prev, { url, type: detectType(url) }]);
                  }, true)}>
                    <Plus size={12} /> Ajouter
                  </button>
                </div>
                {carouselImages.length === 0 ? (
                  <p className={styles.hint}>Aucun média — cliquez sur Ajouter</p>
                ) : (
                  <div className={styles.galleryGrid}>
                    {carouselImages.map((item, i) => (
                      <div key={i} className={styles.galleryItem}>
                        <img src={item.url || item} alt="" className={styles.galleryThumb} />
                        <button type="button" className={styles.galleryRemove} onClick={() => setCarouselImages(carouselImages.filter((_, idx) => idx !== i))}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ────────────────── TAB: Modules ────────────────── */}
          {activeTab === 'Modules' && (
            <div className={styles.section}>
              <div className={styles.modulesHeader}>
                <span className={styles.modulesCount}>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
                <button type="button" className={styles.addSmallBtn} onClick={addModule}>
                  <Plus size={12} /> Ajouter un module
                </button>
              </div>

              {modules.length === 0 ? (
                <div className={styles.emptyModules} onClick={addModule}>
                  <Plus size={22} />
                  <span>Ajouter le premier module</span>
                </div>
              ) : (
                <div className={styles.modulesList}>
                  {modules.map((mod, mIdx) => {
                    const isExpanded = expandedModuleIdx === mIdx;
                    const lessons = mod.lessons || [];
                    return (
                      <div key={mod.id} className={styles.moduleCard}>
                        {/* Module header row */}
                        <div className={styles.moduleCardHeader}>
                          <div className={styles.moduleIndex}>{mIdx + 1}</div>
                          <div className={styles.moduleFieldsRow} onClick={() => setExpandedModuleIdx(isExpanded ? null : mIdx)}>
                            <input
                              className={styles.moduleInput}
                              value={mod.title}
                              onChange={(e) => updateModule(mIdx, 'title', e.target.value)}
                              placeholder="Titre du module…"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className={styles.moduleMeta}>
                              <span className={styles.moduleMetaText}>{lessons.length} étape{lessons.length !== 1 ? 's' : ''}</span>
                              <ChevronDown size={13} className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} />
                            </div>
                          </div>
                          <div className={styles.moduleActions}>
                            <button type="button" onClick={() => moveModule(mIdx, 'up')} disabled={mIdx === 0} className={styles.moduleBtn}><ChevronUp size={13} /></button>
                            <button type="button" onClick={() => moveModule(mIdx, 'down')} disabled={mIdx === modules.length - 1} className={styles.moduleBtn}><ChevronDown size={13} /></button>
                            <button type="button" onClick={() => removeModule(mIdx)} className={`${styles.moduleBtn} ${styles.moduleBtnDelete}`}><Trash2 size={13} /></button>
                          </div>
                        </div>

                        {/* Module expanded content */}
                        {isExpanded && (
                          <div className={styles.moduleExpanded}>
                            <div className={styles.row2}>
                              <div className={styles.field}>
                                <label className={styles.label}><Clock size={12} /> Durée du module</label>
                                <input className={styles.input} value={mod.duration || ''} onChange={(e) => updateModule(mIdx, 'duration', e.target.value)} placeholder="Ex: 1h30" />
                              </div>
                              <div className={styles.field}>
                                <label className={styles.label}>Description</label>
                                <input className={styles.input} value={mod.description || ''} onChange={(e) => updateModule(mIdx, 'description', e.target.value)} placeholder="Description du module…" />
                              </div>
                            </div>

                            {/* Lessons */}
                            <div className={styles.lessonsSection}>
                              <div className={styles.lessonsSectionHeader}>
                                <span className={styles.lessonsSectionTitle}>Étapes / Leçons</span>
                                <button type="button" className={styles.addSmallBtn} onClick={() => addLesson(mIdx)}>
                                  <Plus size={11} /> Ajouter une étape
                                </button>
                              </div>

                              {lessons.length === 0 ? (
                                <div className={styles.emptyLessons} onClick={() => addLesson(mIdx)}>
                                  <BookOpen size={18} />
                                  <span>Ajouter la première étape</span>
                                </div>
                              ) : (
                                <div className={styles.lessonsList}>
                                  {lessons.map((les, lIdx) => {
                                    const isLesExpanded = expandedLessonIdx?.mod === mIdx && expandedLessonIdx?.les === lIdx;
                                    return (
                                      <div key={les.id} className={`${styles.lessonCard} ${isLesExpanded ? styles.lessonCardExpanded : ''}`}>
                                        {/* Lesson header */}
                                        <div
                                          className={styles.lessonCardHeader}
                                          onClick={() => setExpandedLessonIdx(isLesExpanded ? null : { mod: mIdx, les: lIdx })}
                                        >
                                          <div className={styles.lessonTypePill}>
                                            {LESSON_TYPES.find(t => t.value === les.type)?.label || 'Étape'}
                                          </div>
                                          <span className={styles.lessonCardTitle}>
                                            {les.title || `Étape ${lIdx + 1}`}
                                          </span>
                                          <div className={styles.lessonCardActions}>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); moveLessonUp(mIdx, lIdx); }} disabled={lIdx === 0} className={styles.moduleBtn}><ChevronUp size={11} /></button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); moveLessonDown(mIdx, lIdx); }} disabled={lIdx === lessons.length - 1} className={styles.moduleBtn}><ChevronDown size={11} /></button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeLesson(mIdx, lIdx); }} className={`${styles.moduleBtn} ${styles.moduleBtnDelete}`}><Trash2 size={11} /></button>
                                          </div>
                                        </div>

                                        {/* Lesson expanded */}
                                        {isLesExpanded && (
                                          <div className={styles.lessonExpanded}>
                                            <div className={styles.row2}>
                                              <div className={styles.field}>
                                                <label className={styles.label}>Titre de l'étape</label>
                                                <input className={styles.input} value={les.title} onChange={(e) => updateLesson(mIdx, lIdx, 'title', e.target.value)} placeholder="Ex: Introduction" />
                                              </div>
                                              <div className={styles.field}>
                                                <label className={styles.label}>Type</label>
                                                <select className={styles.select} value={les.type} onChange={(e) => updateLesson(mIdx, lIdx, 'type', e.target.value as LessonType)}>
                                                  {LESSON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                              </div>
                                            </div>

                                            <div className={styles.field}>
                                              <label className={styles.label}><Clock size={12} /> Durée</label>
                                              <input className={styles.input} value={les.duration || ''} onChange={(e) => updateLesson(mIdx, lIdx, 'duration', e.target.value)} placeholder="Ex: 12min" />
                                            </div>

                                            {/* Notes admin */}
                                            <div className={styles.field}>
                                              <label className={styles.label}><StickyNote size={12} /> Notes de l'étape (visibles par les bénéficiaires)</label>
                                              <textarea className={styles.textarea} rows={4} value={les.notes || ''} onChange={(e) => updateLesson(mIdx, lIdx, 'notes', e.target.value)} placeholder="Notes, points clés, résumé de l'étape…" />
                                            </div>

                                            {/* Resources */}
                                            <div className={styles.field}>
                                              <div className={styles.labelRow}>
                                                <label className={styles.label}><FileText size={12} /> Ressources</label>
                                                <button type="button" className={styles.addSmallBtn} onClick={() => addResource(mIdx, lIdx)}>
                                                  <Plus size={11} /> Ajouter
                                                </button>
                                              </div>
                                              {(les.resources || []).length === 0 ? (
                                                <p className={styles.hint}>Aucune ressource pour cette étape</p>
                                              ) : (
                                                <div className={styles.resourcesEditorList}>
                                                  {(les.resources || []).map((res, rIdx) => (
                                                    <div key={res.id} className={styles.resourceEditorRow}>
                                                      <select className={styles.resourceTypeSelect} value={res.type} onChange={(e) => updateResource(mIdx, lIdx, rIdx, 'type', e.target.value)}>
                                                        {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                                      </select>
                                                      <input className={styles.input} value={res.name} onChange={(e) => updateResource(mIdx, lIdx, rIdx, 'name', e.target.value)} placeholder="Nom de la ressource" style={{ flex: 1 }} />
                                                      <input className={styles.input} value={res.url} onChange={(e) => updateResource(mIdx, lIdx, rIdx, 'url', e.target.value)} placeholder="URL (Google Doc, PDF, ZIP…)" style={{ flex: 2 }} />
                                                      <button type="button" className={`${styles.moduleBtn} ${styles.moduleBtnDelete}`} onClick={() => removeResource(mIdx, lIdx, rIdx)}><Trash2 size={11} /></button>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>

                                            {/* Quiz */}
                                            <div className={styles.field}>
                                              <div className={styles.labelRow}>
                                                <label className={styles.label}><HelpCircle size={12} /> Quiz</label>
                                                <button type="button" className={styles.addSmallBtn} onClick={() => addQuizQuestion(mIdx, lIdx)}>
                                                  <Plus size={11} /> Ajouter une question
                                                </button>
                                              </div>
                                              {(les.quiz || []).length === 0 ? (
                                                <p className={styles.hint}>Aucune question pour cette étape</p>
                                              ) : (
                                                <div className={styles.quizEditorList}>
                                                  {(les.quiz || []).map((q, qIdx) => (
                                                    <div key={q.id} className={styles.quizEditorCard}>
                                                      <div className={styles.quizEditorHeader}>
                                                        <span className={styles.quizEditorNum}>Q{qIdx + 1}</span>
                                                        <input className={styles.input} value={q.question} onChange={(e) => updateQuizQuestion(mIdx, lIdx, qIdx, 'question', e.target.value)} placeholder="Question…" style={{ flex: 1 }} />
                                                        <button type="button" className={`${styles.moduleBtn} ${styles.moduleBtnDelete}`} onClick={() => removeQuizQuestion(mIdx, lIdx, qIdx)}><Trash2 size={11} /></button>
                                                      </div>
                                                      <div className={styles.quizEditorOptions}>
                                                        {q.options.map((opt, oIdx) => (
                                                          <div key={oIdx} className={styles.quizEditorOption}>
                                                            <button
                                                              type="button"
                                                              className={`${styles.quizCorrectBtn} ${q.correctIndex === oIdx ? styles.quizCorrectBtnActive : ''}`}
                                                              onClick={() => updateQuizQuestion(mIdx, lIdx, qIdx, 'correctIndex', oIdx)}
                                                              title="Marquer comme bonne réponse"
                                                            >
                                                              <Check size={10} />
                                                            </button>
                                                            <input
                                                              className={styles.input}
                                                              value={opt.text}
                                                              onChange={(e) => updateQuizOption(mIdx, lIdx, qIdx, oIdx, e.target.value)}
                                                              placeholder={`Option ${oIdx + 1}`}
                                                              style={{ flex: 1 }}
                                                            />
                                                          </div>
                                                        ))}
                                                      </div>
                                                      <div className={styles.field}>
                                                        <input className={styles.input} value={q.explanation || ''} onChange={(e) => updateQuizQuestion(mIdx, lIdx, qIdx, 'explanation', e.target.value)} placeholder="Explication de la bonne réponse (optionnel)" />
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>

                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ────────────────── TAB: Équipe ────────────────── */}
          {activeTab === 'Équipe' && (
            <div className={styles.section}>
              <div className={styles.statsRow}>
                <span className={styles.statChip}><strong>{teamMembers.length}</strong> bénéficiaire{teamMembers.length !== 1 ? 's' : ''}</span>
                <span className={styles.statChip}>{allUsers.length} utilisateurs</span>
              </div>

              {/* Participant counters (public-facing stats) */}
              <div className={styles.row2} style={{ marginBottom: 12 }}>
                <div className={styles.field}>
                  <label className={styles.label}>👥 Participants au total</label>
                  <input
                    type="number"
                    min={0}
                    className={styles.input}
                    value={totalParticipants}
                    onChange={(e) => setTotalParticipants(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                  />
                  <p className={styles.hint}>Nombre affiché publiquement</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>✅ En cours actuellement</label>
                  <input
                    type="number"
                    min={0}
                    className={styles.input}
                    value={activeParticipants}
                    onChange={(e) => setActiveParticipants(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                  />
                  <p className={styles.hint}>Participants actifs affichés</p>
                </div>
              </div>

              {teamMembers.length > 0 && (
                <div className={styles.selectedSection}>
                  <span className={styles.selectedLabel}>Bénéficiaires inscrits</span>
                  <div className={styles.selectedAvatars}>
                    {allUsers.filter((u) => teamMembers.includes(u.uid)).map((u) => (
                      <button key={u.uid} type="button" className={styles.selAvatar} onClick={() => toggleMember(u.uid)} title={`Retirer ${u.displayName || u.email}`}>
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} className={styles.selAvatarImg} />
                        ) : (
                          <div className={styles.selAvatarLetter}>{u.displayName?.[0]?.toUpperCase() || '?'}</div>
                        )}
                        <div className={styles.selAvatarRemove}><X size={10} /></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.memberSearchWrap}>
                <Search size={14} className={styles.memberSearchIcon} />
                <input
                  type="text"
                  className={styles.memberSearchInput}
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Rechercher par nom ou email…"
                />
                {memberSearch && (
                  <button type="button" className={styles.memberSearchClear} onClick={() => setMemberSearch('')}><X size={12} /></button>
                )}
              </div>

              <div className={styles.userList}>
                {filteredUsers.map((user) => {
                  const selected = teamMembers.includes(user.uid);
                  return (
                    <div
                      key={user.uid}
                      className={`${styles.userRow} ${selected ? styles.userRowSelected : ''}`}
                      onClick={() => toggleMember(user.uid)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleMember(user.uid)}
                    >
                      <div className={styles.userAvatar}>
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName} className={styles.selAvatarImg} />
                        ) : (
                          <div className={styles.selAvatarLetter}>{user.displayName?.[0]?.toUpperCase() || '?'}</div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.displayName || 'Sans nom'}</span>
                        <span className={styles.userEmail}><Mail size={10} />{user.email}</span>
                      </div>
                      <div className={`${styles.checkbox} ${selected ? styles.checkboxOn : ''}`}>
                        {selected && <Check size={12} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
};

export default AccompagnementEditor;