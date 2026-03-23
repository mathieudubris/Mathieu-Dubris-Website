"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X, Save, Info, Tag, Target, Users2, Clock, DollarSign,
  Globe, Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon,
  Search, Check, Mail,
} from 'lucide-react';
import {
  FullFormation,
  FormationModule,
  saveFormation,
  generateUniqueFormationSlug,
  generateFormationSlug,
} from '@/utils/formation-api';
import styles from './FormationEditor.module.css';

const CATEGORIES = ['Développement', 'Design', 'Marketing', 'Business', 'Data', 'Autre'];
const LEVELS = ['débutant', 'intermédiaire', 'avancé', 'expert'] as const;
const CURRENCIES = ['EUR', 'USD', 'GBP'];
const TABS = ['Informations', 'Médias', 'Modules', 'Équipe'] as const;
type Tab = typeof TABS[number];

interface Props {
  formation: FullFormation | null;
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

const FormationEditor: React.FC<Props> = ({ formation, currentUser, allUsers, onClose, onSave }) => {
  const isNew = !formation?.id;

  const [activeTab, setActiveTab] = useState<Tab>('Informations');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(formation?.title || '');
  const [slug, setSlug] = useState(formation?.slug || '');
  const [editingSlug, setEditingSlug] = useState(false);
  const [category, setCategory] = useState(formation?.category || '');
  const [level, setLevel] = useState<FullFormation['level']>(formation?.level || 'débutant');
  const [language, setLanguage] = useState(formation?.language || 'Français');
  const [duration, setDuration] = useState(formation?.duration || '');
  const [price, setPrice] = useState<number | ''>(formation?.price ?? '');
  const [currency, setCurrency] = useState(formation?.currency || 'EUR');
  const [description, setDescription] = useState(formation?.description || '');
  const [objective, setObjective] = useState(formation?.objective || '');
  const [targetAudience, setTargetAudience] = useState(formation?.targetAudience || '');
  const [prerequisites, setPrerequisites] = useState(formation?.prerequisites || '');

  const [mainImage, setMainImage] = useState(formation?.image || '');
  const [carouselImages, setCarouselImages] = useState<any[]>(
    (formation?.carouselImages || []).map((i) =>
      typeof i === 'string' ? { url: i, type: 'image' } : i
    )
  );

  const [modules, setModules] = useState<FormationModule[]>(formation?.modules || []);
  const [teamMembers, setTeamMembers] = useState<string[]>(formation?.teamMembers || []);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    if (isNew && title && !editingSlug) {
      setSlug(generateFormationSlug(title));
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

  const updateModule = (i: number, field: keyof FormationModule, val: any) => {
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
        ? await generateUniqueFormationSlug(title, formation?.slug)
        : slug;

      await saveFormation(
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
        isNew ? undefined : formation?.id
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
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>{isNew ? 'Nouvelle formation' : 'Modifier la formation'}</h2>
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
                <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Formation React avancé" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}><Tag size={14} /> Slug URL</label>
                <input
                  className={styles.input}
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }}
                  onFocus={() => setEditingSlug(true)}
                  onBlur={() => setEditingSlug(false)}
                  placeholder="formation-react-avance"
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
                  <input className={styles.input} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 6h30" />
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
                <textarea className={styles.textarea} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez la formation…" />
                <p className={styles.hint}>{description.length} caractères</p>
              </div>

              <div className={styles.field}>
                <label className={styles.label}><Target size={14} /> Objectif</label>
                <input className={styles.input} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Ce que les participants vont apprendre" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}><Users2 size={14} /> Public cible</label>
                <input className={styles.input} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Ex: Développeurs junior, designers…" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Prérequis</label>
                <input className={styles.input} value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} placeholder="Ex: Bases de JavaScript, HTML/CSS" />
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

          {/* ── TAB: Modules ── */}
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
                  {modules.map((mod, i) => (
                    <div key={mod.id} className={styles.moduleCard}>
                      <div className={styles.moduleIndex}>{i + 1}</div>
                      <div className={styles.moduleFields}>
                        <input className={styles.moduleInput} value={mod.title} onChange={(e) => updateModule(i, 'title', e.target.value)} placeholder="Titre du module…" />
                        <input className={`${styles.moduleInput} ${styles.moduleSmall}`} value={mod.duration || ''} onChange={(e) => updateModule(i, 'duration', e.target.value)} placeholder="Durée (ex: 45min)" />
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

          {/* ── TAB: Équipe ── */}
          {activeTab === 'Équipe' && (
            <div className={styles.section}>
              <div className={styles.statsRow}>
                <span className={styles.statChip}><strong>{teamMembers.length}</strong> membre{teamMembers.length !== 1 ? 's' : ''}</span>
                <span className={styles.statChip}>{allUsers.length} utilisateurs</span>
              </div>

              {teamMembers.length > 0 && (
                <div className={styles.selectedSection}>
                  <span className={styles.selectedLabel}>Membres inscrits</span>
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

export default FormationEditor;