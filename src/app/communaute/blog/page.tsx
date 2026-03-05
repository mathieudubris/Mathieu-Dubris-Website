"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/utils/firebase-api';
import { 
    collection, addDoc, onSnapshot, query, orderBy, 
    doc, deleteDoc, updateDoc, serverTimestamp, Timestamp,
    getDocs, increment, getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Trash2, Edit3, AlertTriangle, Tag as TagIcon, Plus, Bookmark } from 'lucide-react';
import BlogEditor from '@/components/blog/BlogEditor';
import Header from '@/components/app/Header/Header';
import BlogModal from '@/components/blog/BlogModal';
import styles from './blog.module.css';

interface BlogPost {
    id: string;
    title: string;
    content: string;
    author: string;
    category: string;
    tags: string[];
    featuredImage: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    createdAt: Timestamp;
    likesCount: number;
    viewsCount: number;
    savedByUser?: boolean;
    likedByUser?: boolean;
    likedBy?: string[];
    cardSize: 'small' | 'medium' | 'large';
}

type SortOption = 'recent' | 'views' | 'likes' | 'category';

const toggleBodyScroll = (disable: boolean) => {
  if (disable) {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }
};

const BlogPage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form States
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [featuredImage, setFeaturedImage] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('small');
    
    // UI States
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [userSavedPosts, setUserSavedPosts] = useState<string[]>([]);
    const [showSavedOnly, setShowSavedOnly] = useState(false);

    const isAdmin = user?.email === 'mathieudubris@gmail.com';

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const unsubscribePosts = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(), 
                likesCount: doc.data().likesCount ?? 0, 
                viewsCount: doc.data().viewsCount ?? 0,
                cardSize: doc.data().cardSize || 'small'
            })) as BlogPost[];
            setPosts(fetchedPosts);
        });
        
        return () => {
            unsubscribe();
            unsubscribePosts();
        };
    }, []);

    // Charger les posts sauvegardés
    useEffect(() => {
        if (!user) {
            setUserSavedPosts([]);
            return;
        }

        const fetchSavedPosts = async () => {
            try {
                const savedRef = collection(db, 'users', user.uid, 'savedPosts');
                const snapshot = await getDocs(savedRef);
                const savedIds = snapshot.docs.map(doc => doc.id);
                setUserSavedPosts(savedIds);
            } catch (error) {
                console.error("Erreur lors du chargement des posts sauvegardés:", error);
            }
        };

        fetchSavedPosts();
    }, [user]);

    // Appliquer les filtres et tri
    useEffect(() => {
        let filtered = [...posts];

        // Filtre par posts sauvegardés
        if (showSavedOnly && user) {
            filtered = filtered.filter(post => userSavedPosts.includes(post.id));
        }

        // Ajouter l'état savedByUser et likedByUser
        filtered = filtered.map(post => ({
            ...post,
            savedByUser: userSavedPosts.includes(post.id),
            likedByUser: user ? (post.likedBy ?? []).includes(user.uid) : false
        }));

        // Trier les posts
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return b.createdAt?.toMillis() - a.createdAt?.toMillis();
                case 'views':
                    return b.viewsCount - a.viewsCount;
                case 'likes':
                    return b.likesCount - a.likesCount;
                case 'category':
                    return a.category.localeCompare(b.category);
                default:
                    return 0;
            }
        });

        setFilteredPosts(filtered);
    }, [posts, sortBy, showSavedOnly, userSavedPosts, user]);

    // likes & views sont lus directement depuis les champs du document via onSnapshot ci-dessus

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = { 
                title, 
                content, 
                category, 
                tags, 
                featuredImage, 
                mediaUrl, 
                mediaType, 
                cardSize,
                updatedAt: serverTimestamp() 
            };
            
            if (editingId) {
                await updateDoc(doc(db, 'blogs', editingId), data);
                setEditingId(null);
            } else {
                await addDoc(collection(db, 'blogs'), { 
                    ...data, 
                    author: user?.displayName || "Utilisateur", 
                    createdAt: serverTimestamp(),
                    likesCount: 0,
                    viewsCount: 0,
                    likedBy: []
                });
            }
            resetForm();
            setShowEditor(false);
            toggleBodyScroll(false);
        } catch (err) { 
            console.error(err); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setCategory('');
        setTags([]);
        setFeaturedImage('');
        setMediaUrl('');
        setMediaType(null);
        setCardSize('small');
    };

    const handleLike = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) { alert("Connectez-vous pour interagir"); return; }
        const blogRef = doc(db, 'blogs', id);
        const snap = await getDoc(blogRef);
        if (!snap.exists()) return;
        const likedBy: string[] = snap.data().likedBy ?? [];
        if (likedBy.includes(user.uid)) {
            await updateDoc(blogRef, { likedBy: likedBy.filter(uid => uid !== user.uid), likesCount: increment(-1) });
        } else {
            await updateDoc(blogRef, { likedBy: [...likedBy, user.uid], likesCount: increment(1) });
        }
    };

    const handleSavePost = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) { alert("Connectez-vous pour sauvegarder des articles"); return; }
        try {
            const savedRef = doc(db, 'users', user.uid, 'savedPosts', postId);
            if (userSavedPosts.includes(postId)) {
                await deleteDoc(savedRef);
                setUserSavedPosts(prev => prev.filter(id => id !== postId));
            } else {
                await updateDoc(savedRef, { postId, savedAt: serverTimestamp() }).catch(() =>
                    // doc doesn't exist yet, create it via addDoc workaround
                    import('firebase/firestore').then(({ setDoc }) =>
                        setDoc(savedRef, { postId, savedAt: serverTimestamp() })
                    )
                );
                setUserSavedPosts(prev => [...prev, postId]);
            }
        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
        }
    };

    const handleEdit = (post: BlogPost, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(post.id);
        setTitle(post.title);
        setContent(post.content);
        setCategory(post.category);
        setTags(post.tags);
        setFeaturedImage(post.featuredImage);
        setMediaUrl(post.mediaUrl || '');
        setMediaType(post.mediaType || null);
        setCardSize(post.cardSize || 'small');
        setShowEditor(true);
        toggleBodyScroll(true);
    };

    const handleCardClick = (post: BlogPost) => {
        setSelectedPost(post);
        setShowModal(true);
        toggleBodyScroll(true);
        // Incrémenter viewsCount directement dans le document
        updateDoc(doc(db, 'blogs', post.id), { viewsCount: increment(1) }).catch(() => {});
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedPost(null);
        toggleBodyScroll(false);
    };

    const handleCancelEditor = () => {
        setShowEditor(false);
        setEditingId(null);
        resetForm();
        toggleBodyScroll(false);
    };

    return (
        <div className={styles.blogContainer}>
            <Header />

            {/* Barre de filtres simplifiée */}
            <div className={styles.filtersBar}>
                <div className={styles.filterControls}>
                    <button 
                        className={`${styles.filterBtn} ${sortBy === 'recent' ? styles.active : ''}`}
                        onClick={() => setSortBy('recent')}
                    >
                        Plus récent
                    </button>
                    <button 
                        className={`${styles.filterBtn} ${sortBy === 'views' ? styles.active : ''}`}
                        onClick={() => setSortBy('views')}
                    >
                        Plus vus
                    </button>
                    <button 
                        className={`${styles.filterBtn} ${sortBy === 'likes' ? styles.active : ''}`}
                        onClick={() => setSortBy('likes')}
                    >
                        Plus likés
                    </button>
                    <button 
                        className={`${styles.filterBtn} ${sortBy === 'category' ? styles.active : ''}`}
                        onClick={() => setSortBy('category')}
                    >
                        Par catégorie
                    </button>
                    
                    {user && (
                        <button 
                            className={`${styles.filterBtn} ${showSavedOnly ? styles.active : ''}`}
                            onClick={() => setShowSavedOnly(!showSavedOnly)}
                        >
                            <Bookmark size={14} style={{ marginRight: '5px' }} />
                            {showSavedOnly ? 'Tous les posts' : 'Mes sauvegardes'}
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.blogGrid}>
                <AnimatePresence mode='popLayout'>
                    {filteredPosts.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '50px 20px', 
                            color: '#666',
                            gridColumn: '1 / -1'
                        }}>
                            {showSavedOnly 
                                ? "Vous n'avez aucun article sauvegardé"
                                : "Aucun article trouvé"}
                        </div>
                    ) : (
                        filteredPosts.map((post) => (
                            <motion.article 
                                key={post.id} 
                                className={`${styles.blogCard} ${
                                    post.cardSize === 'medium' ? styles.mediumCard :
                                    post.cardSize === 'large' ? styles.largeCard :
                                    styles.smallCard
                                }`}
                                layout 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => handleCardClick(post)}
                            >
                                {deleteConfirmId === post.id ? (
                                    <div className={styles.confirmOverlay}>
                                        <AlertTriangle color="var(--primary)" size={40} />
                                        <p>Supprimer cet article ?</p>
                                        <div className={styles.confirmBtns}>
                                            <button 
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await deleteDoc(doc(db,'blogs',post.id)); 
                                                    setDeleteConfirmId(null);
                                                }} 
                                                className={styles.yesBtn}
                                            >
                                                OUI
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirmId(null);
                                                }} 
                                                className={styles.noBtn}
                                            >
                                                NON
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.mediaContent}>
                                            <div className={styles.categoryBadge}>{post.category}</div>
                                            <img src={post.featuredImage || "/placeholder-blog.jpg"} alt={post.title} className={styles.blogImg} />
                                        </div>
                                        
                                        <div className={styles.cardBody}>
                                            <div className={styles.cardHeader}>
                                                <span className={styles.date}>
                                                    {post.createdAt?.toDate().toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })} • {post.author}
                                                </span>
                                                {isAdmin && (
                                                    <div className={styles.adminControls} onClick={(e) => e.stopPropagation()}>
                                                        <button 
                                                            onClick={(e) => handleEdit(post, e)} 
                                                            className={styles.controlBtn}
                                                        >
                                                            <Edit3 size={14}/>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteConfirmId(post.id);
                                                            }} 
                                                            className={styles.controlBtn}
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <h2 className={styles.postTitle}>{post.title}</h2>
                                            
                                            <div className={styles.tagsContainer}>
                                                {post.tags?.map(tag => (
                                                    <span key={tag} className={styles.tag}><TagIcon size={10} /> {tag}</span>
                                                ))}
                                            </div>

                                            <p className={styles.postContent}>{post.content}</p>
                                            
                                            <div className={styles.cardFooter}>
                                                <div className={styles.stats}>
                                                    <span className={styles.stat}><Eye size={14} /> {post.viewsCount}</span>
                                                    <span className={styles.stat}><Heart size={14} /> {post.likesCount}</span>
                                                </div>
                                                <div className={styles.actionBtns}>
                                                    <button 
                                                        className={`${styles.saveBtn} ${post.savedByUser ? styles.activeSave : ''}`}
                                                        onClick={(e) => handleSavePost(post.id, e)}
                                                        title={post.savedByUser ? "Retirer des sauvegardes" : "Sauvegarder"}
                                                    >
                                                        <Bookmark size={14} fill={post.savedByUser ? "currentColor" : "none"} />
                                                    </button>
                                                    <button 
                                                        className={styles.likeBtn} 
                                                        onClick={(e) => handleLike(post.id, e)}
                                                    >
                                                        <Heart size={14} className={post.likedByUser ? styles.activeHeart : ""} />
                                                        <span>{post.likesCount}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.article>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {isAdmin && (
                <motion.button
                    className={styles.floatingBtn}
                    onClick={() => {
                        setEditingId(null);
                        resetForm();
                        setShowEditor(!showEditor);
                        toggleBodyScroll(!showEditor);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Plus size={28} className={showEditor ? styles.rotated : ""} />
                </motion.button>
            )}

            <AnimatePresence>
                {showEditor && isAdmin && (
                    <motion.div
                        className={styles.editorOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCancelEditor}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <BlogEditor 
                                title={title} 
                                content={content} 
                                category={category} 
                                tags={tags} 
                                featuredImage={featuredImage} 
                                mediaUrl={mediaUrl} 
                                mediaType={mediaType}
                                cardSize={cardSize}
                                setTitle={setTitle} 
                                setContent={setContent} 
                                setCategory={setCategory} 
                                setTags={setTags} 
                                setFeaturedImage={setFeaturedImage}
                                setMedia={(url, type) => {
                                    setMediaUrl(url); 
                                    setMediaType(type);
                                }}
                                setCardSize={setCardSize}
                                onSubmit={handlePublish} 
                                onCancel={handleCancelEditor}
                                isSubmitting={isSubmitting}
                                isEditing={!!editingId}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showModal && selectedPost && (
                    <BlogModal 
                        post={selectedPost}
                        user={user}
                        isAdmin={isAdmin}
                        onClose={closeModal}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default BlogPage;