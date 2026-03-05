"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Eye, MessageSquare, Tag as TagIcon, Trash2, Check } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, Timestamp, setDoc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase-api';
import { User } from 'firebase/auth';
import styles from './BlogModal.module.css';

interface Comment {
    id: string;
    text: string;
    authorName: string;
    authorId: string;
    authorPhoto: string;
    createdAt: Timestamp;
    approved: boolean;
}

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
}

interface BlogDetailModalProps {
    post: BlogPost;
    user: User | null;
    isAdmin: boolean;
    onClose: () => void;
}

const titleToSlug = (t: string): string =>
    t.toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-z0-9\s-]/g, '')
     .trim()
     .replace(/\s+/g, '-')
     .replace(/-+/g, '-') || 'article';

const BlogDetailModal = ({ post, user, isAdmin, onClose }: BlogDetailModalProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [viewsCount, setViewsCount] = useState(post.viewsCount);
    const [isLiked, setIsLiked] = useState(false);

    // ── Update URL with slug ────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const slug = titleToSlug(post.title);
        const url = new URL(window.location.href);
        url.searchParams.set('post', slug);
        window.history.pushState({}, '', url.toString());

        return () => {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('post');
            window.history.pushState({}, '', cleanUrl.toString());
        };
    }, [post.title]);

    // ── Sync likes & views from document fields ─────────────
    useEffect(() => {
        const unsubDoc = onSnapshot(doc(db, 'blogs', post.id), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setLikesCount(data.likesCount ?? 0);
            setViewsCount(data.viewsCount ?? 0);
            if (user) {
                // liked if user uid is in likedBy array
                setIsLiked((data.likedBy ?? []).includes(user.uid));
            }
        });
        return () => unsubDoc();
    }, [post.id, user]);

    // ── Increment view count once on open ───────────────────
    useEffect(() => {
        updateDoc(doc(db, 'blogs', post.id), {
            viewsCount: increment(1)
        }).catch(() => {});
    }, [post.id]);

    useEffect(() => {
        const q = query(collection(db, 'blogs', post.id, 'comments'), orderBy('createdAt', 'desc'));
        const unsubComments = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Comment[]);
        });
        return () => unsubComments();
    }, [post.id]);

    // ── Handle keyboard close ───────────────────────────────
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleLike = async () => {
        if (!user) return alert("Connectez-vous pour interagir");
        const blogRef = doc(db, 'blogs', post.id);
        const snap = await getDoc(blogRef);
        if (!snap.exists()) return;
        const likedBy: string[] = snap.data().likedBy ?? [];

        if (likedBy.includes(user.uid)) {
            // Unlike: remove uid, decrement
            await updateDoc(blogRef, {
                likedBy: likedBy.filter(id => id !== user.uid),
                likesCount: increment(-1)
            });
        } else {
            // Like: add uid, increment
            await updateDoc(blogRef, {
                likedBy: [...likedBy, user.uid],
                likesCount: increment(1)
            });
        }
    };

    const handleComment = async () => {
        if (!user) return alert("Connectez-vous pour commenter");
        if (!commentText.trim()) return;
        await addDoc(collection(db, 'blogs', post.id, 'comments'), {
            text: commentText,
            authorName: user.displayName || "Utilisateur",
            authorId: user.uid,
            authorPhoto: user.photoURL || "",
            createdAt: serverTimestamp(),
            approved: isAdmin
        });
        setCommentText('');
    };

    const deleteComment = async (commentId: string) => {
        await deleteDoc(doc(db, 'blogs', post.id, 'comments', commentId));
    };

    const formatDateTime = (timestamp: Timestamp) => {
        if (!timestamp) return "";
        const date = timestamp.toDate();
        return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit'
        })}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                className={styles.modalOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-label={post.title}
            >
                <motion.div
                    className={styles.modalContent}
                    initial={{ y: "100vh" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100vh" }}
                    transition={{ type: "spring", damping: 28, stiffness: 220 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button — always visible */}
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <X size={20} />
                    </button>

                    <div className={styles.modalMain}>

                        {/* ── Left column — Content ──────────────── */}
                        <div className={styles.leftColumn}>
                            <div className={styles.modalHeader}>
                                <div className={styles.headerImageContainer}>
                                    <img
                                        src={post.featuredImage || "/placeholder-blog.jpg"}
                                        alt={post.title}
                                        className={styles.headerImage}
                                    />
                                    <div className={styles.imageOverlay} />
                                </div>
                                <div className={styles.headerContent}>
                                    <div className={styles.container}>
                                        <span className={styles.categoryBadge}>{post.category}</span>
                                        <h1>{post.title}</h1>
                                        <div className={styles.meta}>
                                            <span>
                                                {post.createdAt?.toDate().toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <span>•</span>
                                            <span>Par {post.author}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.container}>
                                    {post.tags?.length > 0 && (
                                        <div className={styles.tagsContainer}>
                                            {post.tags.map(tag => (
                                                <span key={tag} className={styles.tag}>
                                                    <TagIcon size={10} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className={styles.content}>
                                        {post.content}
                                    </div>

                                    {post.mediaUrl && (
                                        <div className={styles.mediaSection}>
                                            {post.mediaType === 'video' ? (
                                                <video
                                                    src={post.mediaUrl}
                                                    controls
                                                    className={styles.media}
                                                    aria-label="Vidéo de l'article"
                                                />
                                            ) : (
                                                <img
                                                    src={post.mediaUrl}
                                                    alt="Média de l'article"
                                                    className={styles.media}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Right column — Interactions ────────── */}
                        <div className={styles.rightColumn}>
                            <div className={styles.statsColumn}>
                                <div className={styles.statItem}>
                                    <Eye size={15} />
                                    <span>{viewsCount} vues</span>
                                </div>
                                <div className={styles.statItem}>
                                    <Heart size={15} />
                                    <span>{likesCount} j'aime</span>
                                </div>
                                <div className={styles.statItem}>
                                    <MessageSquare size={15} />
                                    <span>{comments.length} comm.</span>
                                </div>
                                <button
                                    className={styles.likeBtn}
                                    onClick={handleLike}
                                    aria-pressed={isLiked}
                                    aria-label={isLiked ? "Retirer le j'aime" : "J'aime"}
                                >
                                    <Heart
                                        size={15}
                                        className={isLiked ? styles.activeHeart : ""}
                                    />
                                    <span>J'aime</span>
                                </button>
                            </div>

                            <div className={styles.commentsSection}>
                                <h3>
                                    <MessageSquare size={16} />
                                    Commentaires ({comments.length})
                                </h3>

                                {/* Comment input */}
                                <div className={styles.commentInputArea}>
                                    <div className={styles.userAvatar}>
                                        {user?.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName || "Utilisateur"}
                                            />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {user?.displayName?.charAt(0) || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        placeholder="Votre commentaire..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                                        aria-label="Écrire un commentaire"
                                    />
                                    <button
                                        onClick={handleComment}
                                        className={styles.submitCommentBtn}
                                        aria-label="Envoyer le commentaire"
                                        disabled={!commentText.trim()}
                                    >
                                        <Check size={15} />
                                    </button>
                                </div>

                                {/* Comments list */}
                                <div className={styles.commentsList} role="list">
                                    {comments.map(comment => (
                                        <div
                                            key={comment.id}
                                            className={styles.commentItem}
                                            role="listitem"
                                        >
                                            <div className={styles.commentAuthor}>
                                                {comment.authorPhoto ? (
                                                    <img
                                                        src={comment.authorPhoto}
                                                        alt={comment.authorName}
                                                        className={styles.commentAvatar}
                                                    />
                                                ) : (
                                                    <div className={styles.commentAvatarPlaceholder}>
                                                        {comment.authorName.charAt(0)}
                                                    </div>
                                                )}
                                                <div className={styles.commentMeta}>
                                                    <strong>{comment.authorName}</strong>
                                                    <span>{formatDateTime(comment.createdAt)}</span>
                                                </div>
                                            </div>
                                            <p className={styles.commentText}>{comment.text}</p>
                                            {(isAdmin || user?.uid === comment.authorId) && (
                                                <button
                                                    onClick={() => deleteComment(comment.id)}
                                                    className={styles.delComment}
                                                    aria-label="Supprimer ce commentaire"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {comments.length === 0 && (
                                        <p style={{
                                            color: 'var(--line)',
                                            fontSize: '0.85rem',
                                            textAlign: 'center',
                                            padding: '20px 0',
                                            opacity: 0.6
                                        }}>
                                            Aucun commentaire pour l'instant
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BlogDetailModal;
