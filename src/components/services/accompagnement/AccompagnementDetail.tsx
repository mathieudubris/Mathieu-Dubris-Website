"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, ChevronRight,
  MoreVertical, CheckCircle2, Circle,
  BookOpen, FileText, MessageSquare, StickyNote, HelpCircle,
  Download, Link as LinkIcon, Check, Menu, X, Mail,
  ExternalLink, Users, UserCheck, Image as ImageIcon,
} from 'lucide-react';
import { FullAccompagnement, AccompagnementLesson, AccompagnementModule, incrementAccompagnementViews } from '@/utils/accompagnement-api';
import styles from './AccompagnementDetail.module.css';

interface Props {
  accompagnement: FullAccompagnement;
  currentUser: any;
  isMember: boolean;
  onBack: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  débutant: '#4ade80',
  intermédiaire: '#facc15',
  avancé: '#f97316',
  expert: '#f43f5e',
};

const TABS = ['Aperçu', 'Ressources', 'Discussions', 'Notes', 'Quiz'] as const;
type Tab = typeof TABS[number];

const LESSON_TYPE_LABELS: Record<string, string> = {
  introduction: 'Intro',
  developpement: 'Dév.',
  lecon: 'Leçon',
  pratique: 'Pratique',
  conclusion: 'Conclusion',
  autre: 'Autre',
};

const LESSON_TYPE_COLORS: Record<string, string> = {
  introduction: '#34d399',
  developpement: '#60a5fa',
  lecon: '#a78bfa',
  pratique: '#fbbf24',
  conclusion: '#f87171',
  autre: '#94a3b8',
};

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText size={14} />,
  link: <LinkIcon size={14} />,
  zip: <Download size={14} />,
  doc: <FileText size={14} />,
  autre: <ExternalLink size={14} />,
};

const AccompagnementDetail: React.FC<Props> = ({ accompagnement, currentUser, isMember, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Aperçu');
  const [openModules, setOpenModules] = useState<Set<number>>(new Set([0]));
  const [activeLesson, setActiveLesson] = useState<{ modIdx: number; lesIdx: number }>({ modIdx: 0, lesIdx: 0 });
  const [discussion, setDiscussion] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [hasIncremented, setHasIncremented] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const levelColor = LEVEL_COLORS[accompagnement.level] || '#34d399';

  useEffect(() => {
    if (currentUser && !hasIncremented && accompagnement.id) {
      incrementAccompagnementViews(accompagnement.id).catch(() => {});
      setHasIncremented(true);
    }
  }, [accompagnement.id, currentUser]);

  const modules: AccompagnementModule[] = (accompagnement.modules || [])
    .slice()
    .sort((a, b) => a.order - b.order);

  const effectiveModules: AccompagnementModule[] = modules.length > 0
    ? modules
    : [
        {
          id: 'placeholder-m1',
          title: 'Introduction',
          order: 0,
          lessons: [
            { id: 'placeholder-l1', title: "Bienvenue dans l'accompagnement", type: 'introduction', duration: '', order: 0 },
          ],
        },
      ];

  const toggleModule = (idx: number) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const getLessonStatus = (mIdx: number, lIdx: number): 'done' | 'current' | 'todo' => {
    if (mIdx < activeLesson.modIdx) return 'done';
    if (mIdx === activeLesson.modIdx && lIdx < activeLesson.lesIdx) return 'done';
    if (mIdx === activeLesson.modIdx && lIdx === activeLesson.lesIdx) return 'current';
    return 'todo';
  };

  const currentMod = effectiveModules[activeLesson.modIdx];
  const currentLes: AccompagnementLesson | undefined = currentMod?.lessons?.[activeLesson.lesIdx];

  const totalLessons = effectiveModules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const completedLessons = effectiveModules.slice(0, activeLesson.modIdx).reduce((sum, m) => sum + (m.lessons?.length || 0), 0) + activeLesson.lesIdx;

  const handleSendDiscussion = () => {
    if (!discussion.trim() || !currentUser?.email) return;
    const subject = encodeURIComponent(`[Accompagnement] ${accompagnement.title}`);
    const body = encodeURIComponent(discussion);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setDiscussion('');
  };

  const setQuizAnswer = (questionId: string, answerIdx: number) => {
    if (quizSubmitted[questionId]) return;
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerIdx }));
  };

  const submitQuiz = (questionId: string) => {
    if (quizAnswers[questionId] === null || quizAnswers[questionId] === undefined) return;
    setQuizSubmitted(prev => ({ ...prev, [questionId]: true }));
  };

  // Carousel images (images only, no videos)
  const carouselImages = (accompagnement.carouselImages || [])
    .map((item) => (typeof item === 'string' ? { url: item, type: 'image' } : item))
    .filter((item) => item.type !== 'video');

  // ─── NON-MEMBER VIEW ───────────────────────────────────────────
  if (!isMember) {
    return (
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.topHeader}>
          <button className={styles.backBtn} onClick={onBack}>
            <ChevronLeft size={13} />
            <span className={styles.backBtnText}>Retour</span>
          </button>
          <h1 className={styles.headerTitle}>{accompagnement.title}</h1>
          <div className={styles.headerRight}>
            <span className={styles.levelPill} style={{ color: levelColor, borderColor: levelColor }}>
              {accompagnement.level?.charAt(0).toUpperCase()}{accompagnement.level?.slice(1)}
            </span>
          </div>
        </div>

        <div className={styles.publicBody}>
          {/* Cover image */}
          {accompagnement.image && (
            <div className={styles.publicCoverWrap}>
              <img
                src={accompagnement.image}
                alt={accompagnement.title}
                className={styles.publicCover}
                onError={(e) => { e.currentTarget.src = '/default-accompagnement.jpg'; }}
              />
            </div>
          )}

          <div className={styles.publicContent}>
            <div className={styles.publicMain}>
              <div className={styles.publicCategoryRow}>
                {accompagnement.category && (
                  <span className={styles.publicCategory}>{accompagnement.category}</span>
                )}
              </div>
              <h2 className={styles.publicTitle}>{accompagnement.title}</h2>
              {accompagnement.description && (
                <p className={styles.publicDescription}>{accompagnement.description}</p>
              )}

              {/* Participant stats */}
              <div className={styles.publicStats}>
                <div className={styles.publicStatCard}>
                  <Users size={18} className={styles.publicStatIcon} />
                  <span className={styles.publicStatValue}>
                    {accompagnement.totalParticipants ?? 0}
                  </span>
                  <span className={styles.publicStatLabel}>participants au total</span>
                </div>
                <div className={styles.publicStatCard}>
                  <UserCheck size={18} className={styles.publicStatIcon} />
                  <span className={styles.publicStatValue}>
                    {accompagnement.activeParticipants ?? 0}
                  </span>
                  <span className={styles.publicStatLabel}>en cours actuellement</span>
                </div>
              </div>

              {/* Locked section indicator */}
              <div className={styles.lockedBanner}>
                <span className={styles.lockedIcon}>🔒</span>
                <div>
                  <p className={styles.lockedTitle}>Contenu réservé aux participants</p>
                  <p className={styles.lockedText}>
                    Faites une demande pour accéder au programme complet de cet accompagnement.
                  </p>
                </div>
              </div>

              <button
                className={styles.publicBookingBtn}
                onClick={() => { window.location.href = '/services/booking'; }}
              >
                Faire une demande
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── MEMBER VIEW ───────────────────────────────────────────────

  const SommaireContent = () => (
    <>
      <div className={styles.sommaireHeader}>
        <h2 className={styles.sommaireTitle}>Sommaire</h2>
        <span className={styles.sommaireCount}>{totalLessons} étape{totalLessons !== 1 ? 's' : ''}</span>
      </div>
      <div className={styles.sommaireScroll}>
        {effectiveModules.map((mod, mIdx) => {
          const lessons = mod.lessons || [];
          return (
            <div key={mod.id} className={styles.moduleGroup}>
              <button className={styles.moduleHeaderBtn} onClick={() => toggleModule(mIdx)}>
                <div className={styles.moduleHeaderLeft}>
                  <span className={styles.moduleHeaderNum}>{mIdx + 1}</span>
                  <span className={styles.moduleHeaderTitle}>
                    {mod.title.replace(/^Module \d+ ?:? ?/, '') || mod.title}
                  </span>
                </div>
                <div className={styles.moduleHeaderRight}>
                  {mod.duration && <span className={styles.modDuration}>{mod.duration}</span>}
                  <ChevronDown
                    size={13}
                    className={`${styles.chevron} ${openModules.has(mIdx) ? styles.chevronOpen : ''}`}
                  />
                </div>
              </button>

              {openModules.has(mIdx) && (
                <div className={styles.lessonList}>
                  {lessons.length === 0 ? (
                    <div className={styles.lessonEmpty}>Aucune étape définie</div>
                  ) : (
                    lessons.map((les, lIdx) => {
                      const status = getLessonStatus(mIdx, lIdx);
                      const isActive = mIdx === activeLesson.modIdx && lIdx === activeLesson.lesIdx;
                      const typeColor = LESSON_TYPE_COLORS[les.type] || '#34d399';
                      return (
                        <button
                          key={les.id}
                          className={`${styles.lessonBtn} ${isActive ? styles.lessonBtnActive : ''}`}
                          onClick={() => {
                            setActiveLesson({ modIdx: mIdx, lesIdx: lIdx });
                            setActiveTab('Aperçu');
                            setMobileMenuOpen(false);
                          }}
                        >
                          <div className={`${styles.lessonStatusIcon} ${
                            status === 'done' ? styles.lessonDone :
                            status === 'current' ? styles.lessonCurrent :
                            styles.lessonTodo
                          }`}>
                            {status === 'done' && <Check size={9} />}
                            {status === 'current' && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />}
                          </div>
                          <div className={styles.lessonBtnContent}>
                            <div className={styles.lessonBtnTop}>
                              <span
                                className={styles.lessonTypeBadge}
                                style={{ color: typeColor, borderColor: `${typeColor}55`, backgroundColor: `${typeColor}15` }}
                              >
                                {LESSON_TYPE_LABELS[les.type] || les.type}
                              </span>
                              {les.duration && <span className={styles.lessonBtnDuration}>{les.duration}</span>}
                            </div>
                            <span className={`${styles.lessonBtnTitle} ${isActive ? styles.lessonBtnTitleActive : ''}`}>
                              {les.title || `Étape ${lIdx + 1}`}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  const ProgressContent = () => (
    <>
      <h3 className={styles.progressLabel}>Progression</h3>
      <div className={styles.progressPctDisplay}>
        <span className={styles.progressPctSub}>{completedLessons}/{totalLessons} étapes</span>
      </div>
      <div className={styles.progressDivider} />
      <div className={styles.progressStatsGrid}>
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>Modules</span>
          <span className={styles.psValue}>{effectiveModules.length}</span>
        </div>
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>Étapes</span>
          <span className={styles.psValue}>{completedLessons} / {totalLessons}</span>
        </div>
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>Durée</span>
          <span className={styles.psValue}>{accompagnement.duration || '—'}</span>
        </div>
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>Niveau</span>
          <span className={styles.psValue} style={{ color: levelColor }}>
            {accompagnement.level?.charAt(0).toUpperCase()}{accompagnement.level?.slice(1)}
          </span>
        </div>
        {accompagnement.category && (
          <div className={styles.progressStatRow}>
            <span className={styles.psLabel}>Catégorie</span>
            <span className={styles.psValue}>{accompagnement.category}</span>
          </div>
        )}
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>Participants</span>
          <span className={styles.psValue}>{accompagnement.totalParticipants ?? 0}</span>
        </div>
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>En cours</span>
          <span className={styles.psValue}>{accompagnement.activeParticipants ?? 0}</span>
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* TOP HEADER */}
      <div className={styles.topHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <ChevronLeft size={13} />
          <span className={styles.backBtnText}>Retour</span>
        </button>
        <h1 className={styles.headerTitle}>{accompagnement.title}</h1>
        <div className={styles.headerRight}>
          <span className={styles.levelPill} style={{ color: levelColor, borderColor: levelColor }}>
            {accompagnement.level?.charAt(0).toUpperCase()}{accompagnement.level?.slice(1)}
          </span>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* MOBILE SLIDE PANEL */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className={styles.mobileOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className={styles.mobilePanel}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <div className={styles.mobilePanelHeader}>
                <span className={styles.mobilePanelTitle}>Sommaire & Progression</span>
                <button className={styles.mobilePanelClose} onClick={() => setMobileMenuOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className={styles.mobilePanelProgress}>
                <ProgressContent />
              </div>
              <div className={styles.mobilePanelDivider} />
              <div className={styles.mobileSommaireWrap}>
                <SommaireContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3-COLUMN BODY */}
      <div className={styles.body}>

        {/* LEFT: Sommaire */}
        <aside className={styles.sommaire}>
          <SommaireContent />
        </aside>

        {/* CENTER */}
        <div className={styles.centerCol}>
          <div className={styles.centerScroll}>

            {/* Breadcrumb */}
            <div className={styles.lessonLabel}>
              <span className={styles.lessonBreadcrumb}>
                {currentMod ? `${currentMod.title.replace(/^Module \d+ ?:? ?/, '') || currentMod.title}` : accompagnement.title}
                {currentLes && (
                  <>
                    <ChevronRight size={11} style={{ margin: '0 4px', opacity: 0.4 }} />
                    <span>{currentLes.title || `Étape ${activeLesson.lesIdx + 1}`}</span>
                  </>
                )}
              </span>
              {currentLes?.type && (
                <span
                  className={styles.lessonTypeTag}
                  style={{
                    color: LESSON_TYPE_COLORS[currentLes.type] || '#34d399',
                    borderColor: `${LESSON_TYPE_COLORS[currentLes.type] || '#34d399'}44`,
                    backgroundColor: `${LESSON_TYPE_COLORS[currentLes.type] || '#34d399'}12`,
                  }}
                >
                  {LESSON_TYPE_LABELS[currentLes.type] || currentLes.type}
                </span>
              )}
            </div>

            {/* Image display (replaces video player) */}
            <div className={styles.imageWrap}>
              {carouselImages.length > 0 ? (
                <div className={styles.carousel}>
                  <img
                    src={carouselImages[carouselIdx]?.url || accompagnement.image || '/default-accompagnement.jpg'}
                    alt={`Étape ${carouselIdx + 1}`}
                    className={styles.carouselImg}
                    onError={(e) => { e.currentTarget.src = '/default-accompagnement.jpg'; }}
                  />
                  {carouselImages.length > 1 && (
                    <div className={styles.carouselControls}>
                      <button
                        className={styles.carouselBtn}
                        onClick={() => setCarouselIdx((prev) => Math.max(0, prev - 1))}
                        disabled={carouselIdx === 0}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className={styles.carouselCount}>{carouselIdx + 1} / {carouselImages.length}</span>
                      <button
                        className={styles.carouselBtn}
                        onClick={() => setCarouselIdx((prev) => Math.min(carouselImages.length - 1, prev + 1))}
                        disabled={carouselIdx === carouselImages.length - 1}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.imagePlaceholder}>
                  <img
                    src={accompagnement.image || '/default-accompagnement.jpg'}
                    alt={accompagnement.title}
                    className={styles.imagePlaceholderImg}
                    onError={(e) => { e.currentTarget.src = '/default-accompagnement.jpg'; }}
                  />
                  <div className={styles.imagePlaceholderOverlay}>
                    <span className={styles.imagePlaceholderTitle}>{currentLes?.title || accompagnement.title}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              {TABS.map((t) => (
                <button
                  key={t}
                  className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className={styles.tabContent}>

              {activeTab === 'Aperçu' && (
                <div>
                  {currentLes?.notes && (
                    <div className={styles.notesBox}>
                      <div className={styles.notesBoxHeader}>
                        <StickyNote size={13} />
                        <span>Notes de l'étape</span>
                      </div>
                      <p className={styles.notesBoxText}>{currentLes.notes}</p>
                    </div>
                  )}
                  {accompagnement.description && (
                    <>
                      <p className={styles.apercuSubtitle}>Description</p>
                      <p className={styles.apercuText}>{accompagnement.description}</p>
                    </>
                  )}
                  {accompagnement.objective && (
                    <>
                      <p className={styles.apercuSubtitle}>Objectif</p>
                      <p className={styles.apercuText}>{accompagnement.objective}</p>
                    </>
                  )}
                  {accompagnement.targetAudience && (
                    <>
                      <p className={styles.apercuSubtitle}>Public cible</p>
                      <p className={styles.apercuText}>{accompagnement.targetAudience}</p>
                    </>
                  )}
                  {accompagnement.prerequisites && (
                    <>
                      <p className={styles.apercuSubtitle}>Prérequis</p>
                      <p className={styles.apercuText}>{accompagnement.prerequisites}</p>
                    </>
                  )}
                  {currentMod?.description && (
                    <>
                      <p className={styles.apercuSubtitle}>À propos de ce module</p>
                      <p className={styles.apercuText}>{currentMod.description}</p>
                    </>
                  )}
                  {!accompagnement.description && !currentLes?.notes && !currentMod?.description && (
                    <p className={styles.apercuText} style={{ opacity: 0.4, fontStyle: 'italic' }}>
                      Aucune description disponible pour cette étape.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'Ressources' && (
                <div>
                  {(currentLes?.resources || []).length === 0 ? (
                    <div className={styles.emptyTab}>
                      <FileText size={32} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
                      <p>Aucune ressource disponible pour cette étape.</p>
                    </div>
                  ) : (
                    <div className={styles.resourcesList}>
                      {(currentLes?.resources || []).map((r, i) => (
                        <a
                          key={r.id || i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.resourceItem}
                        >
                          <div className={styles.resourceIconWrap}>
                            {RESOURCE_ICONS[r.type] || <FileText size={14} />}
                          </div>
                          <div className={styles.resourceInfo}>
                            <span className={styles.resourceName}>{r.name || r.url}</span>
                            <span className={styles.resourceType}>{r.type?.toUpperCase()}</span>
                          </div>
                          <ExternalLink size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Discussions' && (
                <div>
                  <div className={styles.discussionsInfo}>
                    <Mail size={13} />
                    <span>Les discussions se font par e-mail via votre compte Google.</span>
                  </div>
                  <div className={styles.discussionCompose}>
                    <textarea
                      className={styles.discussionTA}
                      placeholder={`Poser une question sur "${currentLes?.title || accompagnement.title}"…`}
                      value={discussion}
                      onChange={(e) => setDiscussion(e.target.value)}
                      rows={4}
                    />
                    <div className={styles.discussionFooter}>
                      <span className={styles.discussionFrom}>
                        {currentUser?.email
                          ? `Envoi depuis : ${currentUser.email}`
                          : 'Connectez-vous pour envoyer un message'}
                      </span>
                      <button
                        className={styles.discussionSend}
                        onClick={handleSendDiscussion}
                        disabled={!discussion.trim() || !currentUser?.email}
                      >
                        <Mail size={13} />
                        Envoyer par e-mail
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Notes' && (
                <div>
                  {currentLes?.notes ? (
                    <div className={styles.notesBox} style={{ marginBottom: 16 }}>
                      <div className={styles.notesBoxHeader}>
                        <StickyNote size={13} />
                        <span>Notes de l'instructeur</span>
                      </div>
                      <p className={styles.notesBoxText} style={{ whiteSpace: 'pre-wrap' }}>{currentLes.notes}</p>
                    </div>
                  ) : (
                    <div className={styles.emptyTab}>
                      <StickyNote size={32} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
                      <p>Aucune note disponible pour cette étape.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Quiz' && (
                <div>
                  {(currentLes?.quiz || []).length === 0 ? (
                    <div className={styles.emptyTab}>
                      <HelpCircle size={32} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
                      <p>Aucun quiz disponible pour cette étape.</p>
                    </div>
                  ) : (
                    <div className={styles.quizList}>
                      {(currentLes?.quiz || []).map((q, qIdx) => {
                        const answered = quizAnswers[q.id] !== undefined && quizAnswers[q.id] !== null;
                        const submitted = quizSubmitted[q.id];
                        const selected = quizAnswers[q.id] ?? null;
                        const isCorrect = submitted && selected === q.correctIndex;
                        return (
                          <div key={q.id} className={styles.quizCard}>
                            <p className={styles.quizProgress}>Question {qIdx + 1} sur {(currentLes?.quiz || []).length}</p>
                            <p className={styles.quizQ}>{q.question}</p>
                            <div className={styles.quizOptions}>
                              {q.options.map((opt, oIdx) => {
                                let optClass = styles.quizOpt;
                                if (submitted) {
                                  if (oIdx === q.correctIndex) optClass = `${styles.quizOpt} ${styles.quizOptCorrect}`;
                                  else if (oIdx === selected) optClass = `${styles.quizOpt} ${styles.quizOptWrong}`;
                                } else if (selected === oIdx) {
                                  optClass = `${styles.quizOpt} ${styles.quizOptSelected}`;
                                }
                                return (
                                  <button
                                    key={oIdx}
                                    className={optClass}
                                    onClick={() => setQuizAnswer(q.id, oIdx)}
                                    disabled={submitted}
                                  >
                                    <div className={styles.quizOptDot}>
                                      {submitted && oIdx === q.correctIndex && <Check size={9} color="#052e16" />}
                                      {!submitted && selected === oIdx && <Check size={9} color="#052e16" />}
                                    </div>
                                    <span className={styles.quizOptText}>{opt.text}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {!submitted ? (
                              <button
                                className={styles.quizSubmit}
                                onClick={() => submitQuiz(q.id)}
                                disabled={!answered}
                              >
                                Valider
                              </button>
                            ) : (
                              <>
                                <div className={`${styles.quizResult} ${isCorrect ? styles.quizCorrect : styles.quizWrong}`}>
                                  {isCorrect
                                    ? '✓ Bonne réponse !'
                                    : `✗ Mauvaise réponse. Bonne réponse : "${q.options[q.correctIndex]?.text}"`}
                                </div>
                                {q.explanation && (
                                  <p className={styles.quizExplanation}>{q.explanation}</p>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Bottom nav */}
          <div className={styles.lessonNav}>
            <button
              className={styles.lessonNavBtn}
              disabled={activeLesson.modIdx === 0 && activeLesson.lesIdx === 0}
              onClick={() => {
                const { modIdx, lesIdx } = activeLesson;
                if (lesIdx > 0) {
                  setActiveLesson({ modIdx, lesIdx: lesIdx - 1 });
                } else if (modIdx > 0) {
                  const prevMod = effectiveModules[modIdx - 1];
                  const prevLessons = prevMod?.lessons || [];
                  setActiveLesson({ modIdx: modIdx - 1, lesIdx: Math.max(0, prevLessons.length - 1) });
                }
              }}
            >
              <ChevronLeft size={14} />
              Étape précédente
            </button>

            <span className={styles.lessonNavCount}>
              {completedLessons + 1} / {totalLessons}
            </span>

            <button
              className={`${styles.lessonNavBtn} ${styles.lessonNavBtnNext}`}
              disabled={
                activeLesson.modIdx === effectiveModules.length - 1 &&
                activeLesson.lesIdx === ((currentMod?.lessons?.length || 1) - 1)
              }
              onClick={() => {
                const { modIdx, lesIdx } = activeLesson;
                const mod = effectiveModules[modIdx];
                const lessons = mod?.lessons || [];
                if (lesIdx < lessons.length - 1) {
                  setActiveLesson({ modIdx, lesIdx: lesIdx + 1 });
                } else if (modIdx < effectiveModules.length - 1) {
                  setActiveLesson({ modIdx: modIdx + 1, lesIdx: 0 });
                  setOpenModules(prev => new Set([...prev, modIdx + 1]));
                }
              }}
            >
              Étape suivante
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* RIGHT: Progress sidebar */}
        <aside className={styles.progressSidebar}>
          <ProgressContent />
        </aside>

      </div>
    </motion.div>
  );
};

export default AccompagnementDetail;
