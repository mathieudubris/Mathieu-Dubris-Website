"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Eye, MessageSquare, Tag as TagIcon, Trash2, Check } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, Timestamp, setDoc } from 'firebase/firestore';
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

const BlogDetailModal = ({ post, user, isAdmin, onClose }: BlogDetailModalProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [viewsCount, setViewsCount] = useState(post.viewsCount);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const unsubLikes = onSnapshot(collection(db, 'blogs', post.id, 'likes'), (snapshot) => {
            setLikesCount(snapshot.size);
            if (user) {
                setIsLiked(snapshot.docs.some(doc => doc.id === user.uid));
            }
        });
        return () => unsubLikes();
    }, [post.id, user]);

    useEffect(() => {
        const unsubViews = onSnapshot(collection(db, 'blogs', post.id, 'views'), (snapshot) => {
            setViewsCount(snapshot.size);
        });
        return () => unsubViews();
    }, [post.id]);

    useEffect(() => {
        const q = query(collection(db, 'blogs', post.id, 'comments'), orderBy('createdAt', 'desc'));
        const unsubComments = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[]);
        });
        return () => unsubComments();
    }, [post.id]);

    const handleLike = async () => {
        if (!user) return alert("Connectez-vous pour interagir");
        await setDoc(doc(db, 'blogs', post.id, 'likes', user.uid), { at: serverTimestamp() });
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
        return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <AnimatePresence>
            <motion.div 
                className={styles.modalOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div 
                    className={styles.modalContent}
                    initial={{ y: "100vh" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100vh" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>

                    <div className={styles.modalMain}>
                        {/* Colonne de gauche - Contenu */}
                        <div className={styles.leftColumn}>
                            <div className={styles.modalHeader}>
                                <div className={styles.headerImageContainer}>
                                    <img 
                                        src={post.featuredImage || "/placeholder-blog.jpg"} 
                                        alt={post.title} 
                                        className={styles.headerImage} 
                                    />
                                    <div className={styles.imageOverlay}></div>
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
                                    <div className={styles.tagsContainer}>
                                        {post.tags?.map(tag => (
                                            <span key={tag} className={styles.tag}>
                                                <TagIcon size={10} /> {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className={styles.content}>
                                        {post.content}
                                    </div>

                                    {post.mediaUrl && (
                                        <div className={styles.mediaSection}>
                                            {post.mediaType === 'video' ? (
                                                <video src={post.mediaUrl} controls className={styles.media} />
                                            ) : (
                                                <img src={post.mediaUrl} alt="Media" className={styles.media} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Colonne de droite - Interactions */}
                        <div className={styles.rightColumn}>
                            <div className={styles.statsColumn}>
                                <div className={styles.statItem}>
                                    <Eye size={16} />
                                    <span>{viewsCount} vues</span>
                                </div>
                                
                                <div className={styles.statItem}>
                                    <Heart size={16} />
                                    <span>{likesCount} j'aime</span>
                                </div>
                                
                                <div className={styles.statItem}>
                                    <MessageSquare size={16} />
                                    <span>{comments.length} commentaires</span>
                                </div>
                                
                                <button className={styles.likeBtn} onClick={handleLike}>
                                    <Heart size={16} className={isLiked ? styles.activeHeart : ""} />
                                    <span>J'aime</span>
                                </button>
                            </div>

                            <div className={styles.commentsSection}>
                                <h3><MessageSquare size={18} /> Commentaires ({comments.length})</h3>
                                
                                <div className={styles.commentInputArea}>
                                    <div className={styles.userAvatar}>
                                        {user?.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName || "User"} />
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
                                    />
                                    <button onClick={handleComment} className={styles.submitCommentBtn}>
                                        <Check size={16} />
                                    </button>
                                </div>

                                <div className={styles.commentsList}>
                                    {comments.map(comment => (
                                        <div key={comment.id} className={styles.commentItem}>
                                            <div className={styles.commentAuthor}>
                                                {comment.authorPhoto ? (
                                                    <img src={comment.authorPhoto} alt={comment.authorName} className={styles.commentAvatar} />
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
                                                <button onClick={() => deleteComment(comment.id)} className={styles.delComment}>
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
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