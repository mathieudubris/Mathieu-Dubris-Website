// app/elevate/components/Elevate/Elevate.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { auth, signInWithPopup, provider } from '@/utils/firebase-api';
import {
  createVideo,
  getVideos,
  addView,
  toggleLike,
  checkUserLiked,
  Video,
  extractYouTubeId
} from '@/utils/video-api';
import styles from './Elevate.module.css';

// ── YouTube postMessage helpers ──────────────────────────────
// YouTube embeds accept these commands via postMessage.
// They work reliably on both desktop and Android Chrome.
function sendYTCommand(iframe: HTMLIFrameElement | null, command: string) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: 'command', func: command, args: [] }),
    'https://www.youtube.com'
  );
}

const Elevate: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [currentFilter, setCurrentFilter] = useState('recent');
  const [isAdding, setIsAdding] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  // true = current video is paused by the user
  const [isPaused, setIsPaused] = useState(false);
  const videoRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const likeInFlight = useRef<Record<string, boolean>>({});
  // Keep a ref to the previous index so we can pause it on scroll
  const prevIndexRef = useRef(0);

  // ── Load videos on filter change ──
  useEffect(() => {
    loadVideos(currentFilter);
  }, [currentFilter]);

  // ── Scroll listener → update currentVideoIndex ──
  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const idx = Math.round(container.scrollTop / container.clientHeight);
      if (idx !== currentVideoIndex && idx >= 0 && idx < videos.length) {
        setCurrentVideoIndex(idx);
      }
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [videos.length, currentVideoIndex]);

  // ── When the visible video changes: pause old, play new ──
  useEffect(() => {
    if (prevIndexRef.current !== currentVideoIndex) {
      // Pause the video we scrolled away from
      sendYTCommand(videoRefs.current[prevIndexRef.current], 'pause');
      // Play the new one (unless user already paused it — but we reset pause state on change)
      sendYTCommand(videoRefs.current[currentVideoIndex], 'play');
      prevIndexRef.current = currentVideoIndex;
    }
    // Every time we land on a new video, reset the pause flag
    setIsPaused(false);
  }, [currentVideoIndex]);

  // ── Close filter dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Scroll programmatically when index changes via arrows/swipe ──
  useEffect(() => {
    const container = videoContainerRef.current;
    if (container && videos.length > 0) {
      container.scrollTo({ top: currentVideoIndex * container.clientHeight, behavior: 'smooth' });
    }
  }, [currentVideoIndex, videos.length]);

  // ─────────── DATA ───────────

  const loadVideos = async (filter: string = 'recent') => {
    setLoading(true);
    try {
      const loaded = await getVideos(filter);
      setVideos(loaded);
      setCurrentVideoIndex(0);
      prevIndexRef.current = 0;
      setIsPaused(false);

      const likes: Record<string, boolean> = {};
      for (const v of loaded) {
        likes[v.id] = await checkUserLiked(v.id);
      }
      setUserLikes(likes);
    } catch (err) {
      console.error('Erreur chargement vidéos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim() || !newVideoTitle.trim()) return;
    setIsAdding(true);
    try {
      if (await createVideo(newVideoUrl, newVideoTitle)) {
        await loadVideos(currentFilter);
        setNewVideoUrl('');
        setNewVideoTitle('');
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Erreur ajout vidéo:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleVideoView = async (videoId: string) => {
    try {
      await addView(videoId);
      setVideos(prev => prev.map(v => (v.id === videoId ? { ...v, views: v.views + 1 } : v)));
    } catch (err) {
      console.error('Erreur vue:', err);
    }
  };

  // ── Like with in-flight guard ──
  const handleLike = async (videoId: string) => {
    if (!auth.currentUser || likeInFlight.current[videoId]) return;
    likeInFlight.current[videoId] = true;

    const wasLiked = !!userLikes[videoId];
    // Optimistic
    setUserLikes(prev => ({ ...prev, [videoId]: !wasLiked }));
    setVideos(prev =>
      prev.map(v => (v.id === videoId ? { ...v, likes: wasLiked ? v.likes - 1 : v.likes + 1 } : v))
    );

    try {
      const serverResult = await toggleLike(videoId);
      if (serverResult !== !wasLiked) {
        setUserLikes(prev => ({ ...prev, [videoId]: serverResult }));
        setVideos(prev =>
          prev.map(v => (v.id === videoId ? { ...v, likes: serverResult ? v.likes + 1 : v.likes - 1 } : v))
        );
      }
    } catch (err) {
      // Rollback
      setUserLikes(prev => ({ ...prev, [videoId]: wasLiked }));
      setVideos(prev =>
        prev.map(v => (v.id === videoId ? { ...v, likes: wasLiked ? v.likes + 1 : v.likes - 1 } : v))
      );
      console.error('Erreur like:', err);
    } finally {
      likeInFlight.current[videoId] = false;
    }
  };

  const handleShare = async (video: Video) => {
    const url = window.location.href.split('#')[0] + `?video=${video.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: video.title, text: `Regarde cette vidéo : ${video.title}`, url }); }
      catch (e) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Lien copié!')).catch(() => {});
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!auth.currentUser) return;
    setIsDeleting(true);
    try {
      // TODO: await deleteVideo(videoId);
      await loadVideos(currentFilter);
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Erreur suppression:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      loadVideos(currentFilter);
    } catch (err) {
      console.error('Erreur connexion:', err);
    }
  };

  const getYouTubeThumbnail = (url: string) => {
    const id = extractYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  };

  // ── Build the initial embed URL for each iframe.
  //     autoplay=1 only for the first (index 0) video on mount.
  //     loop=1 so when a video ends it restarts (YouTube native loop).
  //     enablejsapi=1 is REQUIRED for postMessage commands to work.
  //     controls=0 hides the native YouTube controls (we have our own play/pause).
  const buildEmbedUrl = (url: string, index: number): string => {
    const id = extractYouTubeId(url);
    if (!id) return '';
    const autoplay = index === 0 ? 1 : 0; // only first video autoplays on mount
    return `https://www.youtube.com/embed/${id}?autoplay=${autoplay}&loop=1&playlist=${id}&muted=1&controls=0&enablejsapi=1`;
  };

  // ── Play / Pause button ──
  const handlePlayPause = () => {
    const iframe = videoRefs.current[currentVideoIndex];
    if (isPaused) {
      sendYTCommand(iframe, 'play');
    } else {
      sendYTCommand(iframe, 'pause');
    }
    setIsPaused(!isPaused);
  };

  const filters = [
    { key: 'recent', label: 'Récents' },
    { key: 'oldest', label: 'Anciens' },
    { key: 'views', label: 'Plus vus' },
    { key: 'likes', label: 'Plus likés' }
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartX(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = touchStartY - e.changedTouches[0].clientY;
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 50) {
      if (dy > 0 && currentVideoIndex < videos.length - 1) setCurrentVideoIndex(p => p + 1);
      else if (dy < 0 && currentVideoIndex > 0) setCurrentVideoIndex(p => p - 1);
    }
  };

  const handleNextVideo = () => { if (currentVideoIndex < videos.length - 1) setCurrentVideoIndex(p => p + 1); };
  const handlePrevVideo = () => { if (currentVideoIndex > 0) setCurrentVideoIndex(p => p - 1); };

  // ─────────── RENDER ───────────

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Chargement des vidéos...</p>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex] || null;

  return (
    <div className={styles.elevateContainer}>

      {/* ── Filter dropdown (fixed top-left, desktop only) ── */}
      <div className={styles.filterDropdownContainer} ref={filterDropdownRef}>
        <button className={styles.filterDropdownButton} onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}>
          <span className={styles.filterText}>Les plus récents</span>
          <svg className={styles.dropdownIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4.5h18M5 9h14M7 13.5h10M9 18h6" />
          </svg>
        </button>
        {filterDropdownOpen && (
          <div className={styles.filterDropdownMenu}>
            {filters.map(f => (
              <button key={f.key} className={`${styles.filterDropdownItem} ${currentFilter === f.key ? styles.active : ''}`}
                onClick={() => { setCurrentFilter(f.key); setFilterDropdownOpen(false); }}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Add button (fixed top-right, desktop only) ── */}
      {auth.currentUser && (
        <div className={styles.addButtonContainer}>
          <button className={styles.addButton} onClick={() => setShowAddModal(true)} aria-label="Ajouter une vidéo">+</button>
        </div>
      )}

      {/* ── Main ── */}
      <main className={styles.mainContent}>
        {videos.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>Aucune vidéo disponible</p>
            {auth.currentUser ? (
              <button className={styles.addFirstButton} onClick={() => setShowAddModal(true)}>Ajouter la première vidéo</button>
            ) : (
              <div className={styles.loginContainer}>
                <p className={styles.loginPrompt}>Connectez-vous pour ajouter des vidéos</p>
                <button className={styles.addFirstButton} onClick={handleSignIn}>Connexion Google</button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.reelsContainer}>

            {/* LEFT — nav arrows (desktop only) */}
            <div className={styles.navArrowsColumn}>
              <button className={`${styles.navButton} ${currentVideoIndex === 0 ? styles.disabled : ''}`} onClick={handlePrevVideo} disabled={currentVideoIndex === 0}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
              </button>
              <button className={`${styles.navButton} ${currentVideoIndex === videos.length - 1 ? styles.disabled : ''}`} onClick={handleNextVideo} disabled={currentVideoIndex === videos.length - 1}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </div>

            {/* CENTER — video box */}
            <div className={styles.videoBoxWrapper}>

              {/* Mobile-only top bar: filter + add — rendered INSIDE the box so it's always below the Header */}
              <div className={styles.mobileTopBar}>
                <div className={styles.mobileFilterWrap} ref={filterDropdownOpen ? undefined : undefined}>
                  <button className={styles.mobileFilterBtn} onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 4.5h18M5 9h14M7 13.5h10M9 18h6" />
                    </svg>
                  </button>
                  {filterDropdownOpen && (
                    <div className={styles.mobileFilterMenu}>
                      {filters.map(f => (
                        <button key={f.key} className={`${styles.filterDropdownItem} ${currentFilter === f.key ? styles.active : ''}`}
                          onClick={() => { setCurrentFilter(f.key); setFilterDropdownOpen(false); }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {auth.currentUser && (
                  <button className={styles.mobileAddBtn} onClick={() => setShowAddModal(true)} aria-label="Ajouter">+</button>
                )}
              </div>

              {/* Scrolling iframes */}
              <div className={styles.videosList} ref={videoContainerRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                {videos.map((video, index) => (
                  <div key={video.id} className={styles.videoReel}>
                    <iframe
                      ref={el => videoRefs.current[index] = el}
                      src={buildEmbedUrl(video.url, index)}
                      className={styles.videoPlayer}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => {
                        // Only count view + send play command for the currently visible video
                        if (index === currentVideoIndex) {
                          handleVideoView(video.id);
                          // Ensure it's playing (in case the iframe reloaded)
                          if (!isPaused) sendYTCommand(videoRefs.current[index], 'play');
                        }
                      }}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              {/* Fixed overlay: Play (top-left) + Delete (top-right) */}
              <div className={styles.videoFixedOverlay}>
                {/* PLAY / PAUSE */}
                <button className={styles.overlayButton} onClick={handlePlayPause} aria-label={isPaused ? 'Play' : 'Pause'} style={{ top: 14, left: 14 }}>
                  {isPaused ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  )}
                </button>

                {/* DELETE — top right, owner only */}
                {currentVideo && auth.currentUser && auth.currentUser.uid === currentVideo.userId && (
                  <button className={styles.overlayButton} onClick={() => setShowDeleteConfirm(currentVideo.id)} aria-label="Supprimer" style={{ top: 14, right: 14 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT — stats */}
            <div className={styles.statsColumn}>
              {currentVideo && (
                <>
                  <div className={styles.statItem}>
                    <div className={styles.statCircle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <span className={styles.statLabel}>{currentVideo.views} vue</span>
                  </div>

                  <div className={styles.statItem}>
                    <button
                      className={`${styles.statCircle} ${styles.statCircleBtn} ${userLikes[currentVideo.id] ? styles.likedActive : ''}`}
                      onClick={() => handleLike(currentVideo.id)}
                      disabled={!auth.currentUser || !!likeInFlight.current[currentVideo.id]}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={userLikes[currentVideo.id] ? '#FF0000' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                    <span className={styles.statLabel}>{currentVideo.likes} like</span>
                  </div>

                  <div className={styles.statItem}>
                    <button className={`${styles.statCircle} ${styles.statCircleBtn}`} onClick={() => handleShare(currentVideo)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </button>
                    <span className={styles.statLabel}>0 partage</span>
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </main>

      {/* ── Delete modal ── */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <h3>Supprimer la vidéo</h3>
            <p>Êtes-vous sûr de vouloir supprimer cette vidéo ? Cette action est irréversible.</p>
            <div className={styles.confirmButtons}>
              <button className={styles.cancelButton} onClick={() => setShowDeleteConfirm(null)} disabled={isDeleting}>Annuler</button>
              <button className={styles.deleteConfirmButton} onClick={() => handleDeleteVideo(showDeleteConfirm)} disabled={isDeleting}>
                {isDeleting ? (<><span className={styles.spinner}></span>Suppression...</>) : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add video modal ── */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Ajouter une vidéo YouTube</h2>
              <button className={styles.closeButton} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddVideo} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="videoUrl" className={styles.formLabel}>URL YouTube</label>
                <input id="videoUrl" type="url" placeholder="https://www.youtube.com/watch?v=..." value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="videoTitle" className={styles.formLabel}>Titre de la vidéo</label>
                <input id="videoTitle" type="text" placeholder="Entrez un titre descriptif" value={newVideoTitle} onChange={e => setNewVideoTitle(e.target.value)} className={styles.input} required />
              </div>
              {newVideoUrl && extractYouTubeId(newVideoUrl) && (
                <div className={styles.videoPreview}>
                  <img src={getYouTubeThumbnail(newVideoUrl)} alt="Aperçu" className={styles.previewImage} />
                  <p className={styles.previewText}>Aperçu de la vidéo</p>
                </div>
              )}
              <div className={styles.modalButtons}>
                <button type="button" className={styles.cancelButton} onClick={() => setShowAddModal(false)} disabled={isAdding}>Annuler</button>
                <button type="submit" className={styles.submitButton} disabled={isAdding || !newVideoUrl || !newVideoTitle}>
                  {isAdding ? (<><span className={styles.spinner}></span>Ajout en cours...</>) : 'Ajouter la vidéo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Elevate;