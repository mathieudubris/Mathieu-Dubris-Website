"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, ChevronRight,
  Play, SkipForward, Volume2, Maximize, Settings,
  MoreVertical, CheckCircle2, Circle,
  BookOpen, FileText, MessageSquare, StickyNote, HelpCircle,
  Download, Link as LinkIcon, Check, Menu, X, Mail,
  ExternalLink, Video,
} from 'lucide-react';
import { FullFormation, FormationLesson, FormationModule, incrementFormationViews } from '@/utils/formation-api';
import styles from './FormationDetail.module.css';

interface Props {
  formation: FullFormation;
  currentUser: any;
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
  video: <Video size={14} />,
  autre: <ExternalLink size={14} />,
};

const FormationDetail: React.FC<Props> = ({ formation, currentUser, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Aperçu');
  const [openModules, setOpenModules] = useState<Set<number>>(new Set([0]));
  const [activeLesson, setActiveLesson] = useState<{ modIdx: number; lesIdx: number }>({ modIdx: 0, lesIdx: 0 });
  const [discussion, setDiscussion] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [hasIncremented, setHasIncremented] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const levelColor = LEVEL_COLORS[formation.level] || '#34d399';

  // Simulated progress
  const progress = (() => {
    if (!formation.id) return 68;
    const hash = formation.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return [42, 55, 68, 75, 85, 100][hash % 6];
  })();

  useEffect(() => {
    if (currentUser && !hasIncremented && formation.id) {
      incrementFormationViews(formation.id).catch(() => {});
      setHasIncremented(true);
    }
  }, [formation.id, currentUser]);

  // Build real module/lesson structure from formation data
  const modules: FormationModule[] = (formation.modules || [])
    .slice()
    .sort((a, b) => a.order - b.order);

  // Fallback if no modules
  const effectiveModules: FormationModule[] = modules.length > 0
    ? modules
    : [
        {
          id: 'placeholder-m1',
          title: 'Introduction',
          order: 0,
          lessons: [
            { id: 'placeholder-l1', title: 'Bienvenue dans la formation', type: 'introduction', duration: '', order: 0 },
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
  const currentLes: FormationLesson | undefined = currentMod?.lessons?.[activeLesson.lesIdx];

  // Total lesson count
  const totalLessons = effectiveModules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const completedLessons = effectiveModules.slice(0, activeLesson.modIdx).reduce((sum, m) => sum + (m.lessons?.length || 0), 0) + activeLesson.lesIdx;

  // Gmail discussion compose
  const handleSendDiscussion = () => {
    if (!discussion.trim() || !currentUser?.email) return;
    const subject = encodeURIComponent(`[Formation] ${formation.title}`);
    const body = encodeURIComponent(discussion);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setDiscussion('');
  };

  // Quiz helpers
  const setQuizAnswer = (questionId: string, answerIdx: number) => {
    if (quizSubmitted[questionId]) return;
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerIdx }));
  };
  const submitQuiz = (questionId: string) => {
    if (quizAnswers[questionId] === null || quizAnswers[questionId] === undefined) return;
    setQuizSubmitted(prev => ({ ...prev, [questionId]: true }));
  };

  // Sidebar content (shared between desktop and mobile)
  const SommaireContent = () => (
    <>
      <div className={styles.sommaireHeader}>
        <h2 className={styles.sommaireTitle}>Sommaire</h2>
        <span className={styles.sommaireCount}>{totalLessons} leçon{totalLessons !== 1 ? 's' : ''}</span>
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
                    <div className={styles.lessonEmpty}>Aucune leçon définie</div>
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
                              {les.title || `Leçon ${lIdx + 1}`}
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

  // Progress sidebar content
  const ProgressContent = () => (
    <>
      <h3 className={styles.progressLabel}>Progression</h3>
      <div className={styles.progressPctDisplay}>
        <span className={styles.progressPctValue}>{progress}%</span>
        <span className={styles.progressPctSub}>{completedLessons}/{totalLessons} leçons</span>
      </div>
      <div className={styles.progressBarBig}>
        <div className={styles.progressBarBigFill} style={{ width: `${progress}%` }} />
      </div>
      <button className={styles.continueBtn} onClick={() => setActiveTab('Aperçu')}>
        Continuer le cours
      </button>
      <div className={styles.progressDivider} />
      <div className={styles.progressStatsGrid}>
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>Modules</span>
          <span className={styles.psValue}>{effectiveModules.length}</span>
        </div>
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>Leçons</span>
          <span className={styles.psValue}>{completedLessons} / {totalLessons}</span>
        </div>
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>Durée</span>
          <span className={styles.psValue}>{formation.duration || '—'}</span>
        </div>
        <div className={styles.progressStatRow}>
          <span className={styles.psLabel}>Niveau</span>
          <span className={styles.psValue} style={{ color: levelColor }}>
            {formation.level?.charAt(0).toUpperCase()}{formation.level?.slice(1)}
          </span>
        </div>
        {formation.category && (
          <div className={styles.progressStatRow}>
            <span className={styles.psLabel}>Catégorie</span>
            <span className={styles.psValue}>{formation.category}</span>
          </div>
        )}
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
      {/* ── TOP HEADER ── */}
      <div className={styles.topHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <ChevronLeft size={13} />
          <span className={styles.backBtnText}>Retour</span>
        </button>
        <h1 className={styles.headerTitle}>{formation.title}</h1>
        <div className={styles.headerRight}>
          <span className={styles.levelPill} style={{ color: levelColor, borderColor: levelColor }}>
            {formation.level?.charAt(0).toUpperCase()}{formation.level?.slice(1)}
          </span>
          {/* Mobile hamburger */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* ── MOBILE SLIDE PANEL ── */}
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

              {/* Progress section in mobile panel */}
              <div className={styles.mobilePanelProgress}>
                <ProgressContent />
              </div>

              <div className={styles.mobilePanelDivider} />

              {/* Sommaire in mobile panel */}
              <div className={styles.mobileSommaireWrap}>
                <SommaireContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 3-COLUMN BODY ── */}
      <div className={styles.body}>

        {/* ── LEFT: Sommaire (desktop) ── */}
        <aside className={styles.sommaire}>
          <SommaireContent />
        </aside>

        {/* ── CENTER ── */}
        <div className={styles.centerCol}>
          <div className={styles.centerScroll}>

            {/* Breadcrumb label */}
            <div className={styles.lessonLabel}>
              <span className={styles.lessonBreadcrumb}>
                {currentMod ? `${currentMod.title.replace(/^Module \d+ ?:? ?/, '') || currentMod.title}` : formation.title}
                {currentLes && (
                  <>
                    <ChevronRight size={11} style={{ margin: '0 4px', opacity: 0.4 }} />
                    <span>{currentLes.title || `Leçon ${activeLesson.lesIdx + 1}`}</span>
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

            {/* ── Video player ── */}
            <div className={styles.videoWrap}>
              {currentLes?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={currentLes.videoUrl}
                  className={styles.videoElement}
                  controls
                  controlsList="nodownload"
                  key={currentLes.id}
                />
              ) : (
                <>
                  <img
                    src={formation.image || '/default-formation.jpg'}
                    alt={formation.title}
                    className={styles.videoCover}
                    onError={(e) => { e.currentTarget.src = '/default-formation.jpg'; }}
                  />
                  <div className={styles.videoUI}>
                    <div className={styles.videoTopRow}>
                      <span className={styles.videoTitleChip}>
                        {currentLes?.title || formation.title}
                      </span>
                    </div>
                    <div className={styles.videoNoVideo}>
                      <Video size={32} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 8 }} />
                      <span>Aucune vidéo pour cette leçon</span>
                    </div>
                    <div className={styles.videoBottomRow}>
                      <div className={styles.seekBarWrap}>
                        <div className={styles.seekBarFill} style={{ width: '0%' }} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Tabs ── */}
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

            {/* ── Tab content ── */}
            <div className={styles.tabContent}>

              {/* ── APERÇU ── */}
              {activeTab === 'Aperçu' && (
                <div>
                  {/* Lesson notes (if set by admin) */}
                  {currentLes?.notes && (
                    <div className={styles.notesBox}>
                      <div className={styles.notesBoxHeader}>
                        <StickyNote size={13} />
                        <span>Notes de la leçon</span>
                      </div>
                      <p className={styles.notesBoxText}>{currentLes.notes}</p>
                    </div>
                  )}

                  {/* Formation description */}
                  {formation.description && (
                    <>
                      <p className={styles.apercuSubtitle}>Description de la formation</p>
                      <p className={styles.apercuText}>{formation.description}</p>
                    </>
                  )}

                  {formation.objective && (
                    <>
                      <p className={styles.apercuSubtitle}>Objectif</p>
                      <p className={styles.apercuText}>{formation.objective}</p>
                    </>
                  )}

                  {formation.targetAudience && (
                    <>
                      <p className={styles.apercuSubtitle}>Public cible</p>
                      <p className={styles.apercuText}>{formation.targetAudience}</p>
                    </>
                  )}

                  {formation.prerequisites && (
                    <>
                      <p className={styles.apercuSubtitle}>Prérequis</p>
                      <p className={styles.apercuText}>{formation.prerequisites}</p>
                    </>
                  )}

                  {/* Module description */}
                  {currentMod?.description && (
                    <>
                      <p className={styles.apercuSubtitle}>
                        À propos de ce module
                      </p>
                      <p className={styles.apercuText}>{currentMod.description}</p>
                    </>
                  )}

                  {/* Empty state */}
                  {!formation.description && !currentLes?.notes && !currentMod?.description && (
                    <p className={styles.apercuText} style={{ opacity: 0.4, fontStyle: 'italic' }}>
                      Aucune description disponible pour cette leçon.
                    </p>
                  )}
                </div>
              )}

              {/* ── RESSOURCES ── */}
              {activeTab === 'Ressources' && (
                <div>
                  {(currentLes?.resources || []).length === 0 ? (
                    <div className={styles.emptyTab}>
                      <FileText size={32} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
                      <p>Aucune ressource disponible pour cette leçon.</p>
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

              {/* ── DISCUSSIONS ── */}
              {activeTab === 'Discussions' && (
                <div>
                  <div className={styles.discussionsInfo}>
                    <Mail size={13} />
                    <span>Les discussions se font par e-mail via votre compte Google.</span>
                  </div>
                  <div className={styles.discussionCompose}>
                    <textarea
                      className={styles.discussionTA}
                      placeholder={`Poser une question sur "${currentLes?.title || formation.title}"…`}
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

              {/* ── NOTES ── */}
              {activeTab === 'Notes' && (
                <div>
                  {currentLes?.notes ? (
                    <>
                      <div className={styles.notesBox} style={{ marginBottom: 16 }}>
                        <div className={styles.notesBoxHeader}>
                          <StickyNote size={13} />
                          <span>Notes de l'instructeur</span>
                        </div>
                        <p className={styles.notesBoxText} style={{ whiteSpace: 'pre-wrap' }}>{currentLes.notes}</p>
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyTab}>
                      <StickyNote size={32} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
                      <p>Aucune note disponible pour cette leçon.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── QUIZ ── */}
              {activeTab === 'Quiz' && (
                <div>
                  {(currentLes?.quiz || []).length === 0 ? (
                    <div className={styles.emptyTab}>
                      <HelpCircle size={32} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
                      <p>Aucun quiz disponible pour cette leçon.</p>
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

          {/* ── Bottom nav: prev/next lesson ── */}
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
              Leçon précédente
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
              Leçon suivante
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── RIGHT: Progress sidebar (desktop) ── */}
        <aside className={styles.progressSidebar}>
          <ProgressContent />
        </aside>

      </div>
    </motion.div>
  );
};

export default FormationDetail;
