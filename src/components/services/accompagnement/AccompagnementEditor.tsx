"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X, Save, Info, Tag, Target, Users2, Clock, DollarSign,
  Globe, Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon,
  Search, Check, Mail,
} from 'lucide-react';
import {
  FullAccompagnement,
  AccompagnementModule,
  saveAccompagnement,
  generateUniqueAccompagnementSlug,
  generateAccompagnementSlug,
} from '@/utils/accompagnement-api';
import styles from './AccompagnementEditor.module.css';

const CATEGORIES = ['Coaching', 'Mentorat', 'Conseil', 'Formation', 'Suivi', 'Autre'];
const LEVELS = ['débutant', 'intermédiaire', 'avancé', 'expert'] as const;
const CURRENCIES = ['EUR', 'USD', 'GBP'];
const TABS = ['Informations', 'Médias', 'Étapes', 'Bénéficiaires'] as const;
type Tab = typeof TABS[number];

interface Props {
  accompagnement: FullAccompagnement | null;
  currentUser: any;
  allUsers: any[];
  onClose: () => void;
  onSave: () => Promise<void>;
}

function detectType(url: string): string {
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return 'video';
  if (/\.gif(\?|$)/i.test(url)) return 'gif';
  return 'image';
}

const AccompagnementEditor: React.FC<Props> = ({ accompagnement, currentUser, allUsers, onClose, onSave }) => {
  const isNew = !accompagnement?.id;

  const [activeTab, setActiveTab] = useState<Tab>('Informations');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const [mainImage, setMainImage] = useState(accompagnement?.image || '');
  const [carouselImages, setCarouselImages] = useState<any[]>(
    (accompagnement?.carouselImages || []).map((i) =>
      typeof i === 'string' ? { url: i, type: 'image' } : i
    )
  );

  const [modules, setModules] = useState<AccompagnementModule[]>(accompagnement?.modules || []);
  const [teamMembers, setTeamMembers] = useState<string[]>(accompagnement?.teamMembers || []);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    if (isNew && title && !editingSlug) {
      setSlug(generateAccompagnementSlug(title));
    }
  }, [title, isNew, editingSlug]);

  const openCloudinary = (onSuccess: (url: string) => void, multiple = false) => {
    if (typeof window === 'undefined' || !(window as any).cloudinary) return;
    (window as any).cloudinary.createUploadWidget(
      { cloudName: 'dhqqx2m3y', uploadPreset: 'blog_preset', sources: ['local', 'url'], multiple, resourceType: 'auto', theme: 'minimal' },
      (_: any, result: any) => {
        if (!_ && result?.event === 'success') onSuccess(result.info.secure_url);
      }
    ).open();
  };

  const addModule = () => {
    setModules([...modules, { id: Date.now().toString(), title: '', description: '', duration: '', order: modules.length }]);
  };

  const updateModule = (i: number, field: keyof AccompagnementModule, val: any) => {
    setModules(modules.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const removeModule = (i: number) => setModules(modules.filter((_, idx) => idx !== i));

  const moveModule = (i: number, dir: 'up' | 'down') => {
    const arr = [...modules];
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setModules(arr.map((m, idx) => ({ ...m, order: idx })));
  };

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
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`} onClick={() => setActiveTab(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className={styles.body}>

          {/* ── TAB: Informations ── */}
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

          {/* ── TAB: Médias ── */}
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

          {/* ── TAB: Étapes ── */}
          {activeTab === 'Étapes' && (
            <div className={styles.section}>
              <div className={styles.modulesHeader}>
                <span className={styles.modulesCount}>{modules.length} étape{modules.length !== 1 ? 's' : ''}</span>
                <button type="button" className={styles.addSmallBtn} onClick={addModule}>
                  <Plus size={12} /> Ajouter une étape
                </button>
              </div>

              {modules.length === 0 ? (
                <div className={styles.emptyModules} onClick={addModule}>
                  <Plus size={22} />
                  <span>Ajouter la première étape</span>
                </div>
              ) : (
                <div className={styles.modulesList}>
                  {modules.map((mod, i) => (
                    <div key={mod.id} className={styles.moduleCard}>
                      <div className={styles.moduleIndex}>{i + 1}</div>
                      <div className={styles.moduleFields}>
                        <input className={styles.moduleInput} value={mod.title} onChange={(e) => updateModule(i, 'title', e.target.value)} placeholder="Titre de l'étape…" />
                        <input className={`${styles.moduleInput} ${styles.moduleSmall}`} value={mod.duration || ''} onChange={(e) => updateModule(i, 'duration', e.target.value)} placeholder="Durée (ex: 2 semaines)" />
                        <input className={`${styles.moduleInput} ${styles.moduleDesc}`} value={mod.description || ''} onChange={(e) => updateModule(i, 'description', e.target.value)} placeholder="Description optionnelle…" />
                      </div>
                      <div className={styles.moduleActions}>
                        <button type="button" onClick={() => moveModule(i, 'up')} disabled={i === 0} className={styles.moduleBtn}><ChevronUp size={13} /></button>
                        <button type="button" onClick={() => moveModule(i, 'down')} disabled={i === modules.length - 1} className={styles.moduleBtn}><ChevronDown size={13} /></button>
                        <button type="button" onClick={() => removeModule(i)} className={`${styles.moduleBtn} ${styles.moduleBtnDelete}`}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Bénéficiaires ── */}
          {activeTab === 'Bénéficiaires' && (
            <div className={styles.section}>
              <div className={styles.statsRow}>
                <span className={styles.statChip}><strong>{teamMembers.length}</strong> bénéficiaire{teamMembers.length !== 1 ? 's' : ''}</span>
                <span className={styles.statChip}>{allUsers.length} utilisateurs</span>
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
      </motion.div>
    </motion.div>
  );
};

export default AccompagnementEditor;