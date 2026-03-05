"use client";

import React, { useState } from 'react';
import { Send, X, Image as ImageIcon, Video, Plus, Maximize2, Square, Star } from 'lucide-react';
import styles from './BlogEditor.module.css';
import NouveauteModal from '@/components/NouveauteModal/NouveauteModal';

interface BlogEditorProps {
    blogId?: string | null;
    title: string;
    content: string;
    category: string;
    tags: string[];
    featuredImage: string;
    mediaUrl: string;
    mediaType: 'image' | 'video' | null;
    cardSize: 'small' | 'medium' | 'large';
    setTitle: (val: string) => void;
    setContent: (val: string) => void;
    setCategory: (val: string) => void;
    setTags: (val: string[]) => void;
    setFeaturedImage: (val: string) => void;
    setMedia: (url: string, type: 'image' | 'video' | null) => void;
    setCardSize: (size: 'small' | 'medium' | 'large') => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel?: () => void;
    isSubmitting: boolean;
    isEditing?: boolean;
}

const titleToSlug = (t: string): string =>
    t.toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-z0-9\s-]/g, '')
     .trim()
     .replace(/\s+/g, '-')
     .replace(/-+/g, '-') || 'article';

const BlogEditor = ({
    blogId,
    title, content, category, tags, featuredImage, mediaUrl, mediaType, cardSize,
    setTitle, setContent, setCategory, setTags, setFeaturedImage, setMedia, setCardSize,
    onSubmit, onCancel, isSubmitting, isEditing = false
}: BlogEditorProps) => {

    const [tagInput, setTagInput] = useState('');
    const [showNouveauteModal, setShowNouveauteModal] = useState(false);
    const [noTitleToast, setNoTitleToast] = useState(false);

    const handleUpload = (target: 'featured' | 'content') => {
        // @ts-ignore
        if (typeof window !== "undefined" && window.cloudinary) {
            // @ts-ignore
            const widget = window.cloudinary.createUploadWidget({
                cloudName: 'dhqqx2m3y',
                uploadPreset: 'blog_preset',
                sources: ['local', 'url'],
                multiple: false,
                resourceType: 'auto',
                theme: "minimal",
            }, (error: any, result: any) => {
                if (!error && result && result.event === "success") {
                    if (target === 'featured') {
                        setFeaturedImage(result.info.secure_url);
                    } else {
                        const type = result.info.resource_type === 'video' ? 'video' : 'image';
                        setMedia(result.info.secure_url, type);
                    }
                }
            });
            widget.open();
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const blogSlug = titleToSlug(title);
    const blogLink = '/communaute/blog';
    const nouveauteSourceId = blogId || `blog-${blogSlug}`;
    const hasTitle = title.trim().length > 0;

    const handleNouveauteClick = () => {
        if (!hasTitle) {
            setNoTitleToast(true);
            setTimeout(() => setNoTitleToast(false), 3000);
            return;
        }
        setShowNouveauteModal(true);
    };

    return (
        <div className={styles.overlay}>
            <section className={styles.editorPanel}>

                {/* ── Header ─────────────────────────────────────── */}
                <div className={styles.editorHeader}>
                    <div className={styles.headerLeft}>
                        <span className={styles.headerTitle}>
                            {isEditing ? "Modifier l'article" : "Nouvel Article"}
                        </span>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            className={styles.publishBtnTop}
                            onClick={onSubmit}
                        >
                            {isSubmitting
                                ? "Envoi..."
                                : <><Send size={15} /> {isEditing ? "Mettre à jour" : "Publier"}</>
                            }
                        </button>

                        {/* Bouton Nouveauté */}
                        <div className={styles.nouveauteBtnWrap}>
                            <button
                                type="button"
                                className={`${styles.nouveauteBtn} ${!hasTitle ? styles.nouveauteBtnDisabled : ''}`}
                                onClick={handleNouveauteClick}
                                title={hasTitle ? "Ajouter / gérer dans la section Nouveautés" : "Saisissez d'abord un titre"}
                                aria-label="Nouveauté"
                            >
                                <Star size={14} />
                                <span>Nouveauté</span>
                            </button>
                            {noTitleToast && (
                                <div className={styles.saveToast} role="alert">
                                    Saisissez d'abord un titre
                                </div>
                            )}
                        </div>
                    </div>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className={styles.closeBtn}
                            aria-label="Fermer"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* ── Form ───────────────────────────────────────── */}
                <form onSubmit={onSubmit} className={styles.publishForm}>
                    <div className={styles.formGrid}>

                        {/* ── Main fields ──────────────────────────── */}
                        <div className={styles.mainFields}>
                            <input
                                type="text"
                                placeholder="Titre de l'article..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={styles.titleInput}
                                required
                                autoComplete="off"
                            />

                            <div className={styles.metaRow}>
                                <input
                                    type="text"
                                    placeholder="Catégorie..."
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={styles.categoryInput}
                                />

                                <div className={styles.tagInputWrapper}>
                                    <input
                                        type="text"
                                        placeholder="Ajouter un tag..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        aria-label="Nouveau tag"
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        className={styles.plusBtn}
                                        aria-label="Ajouter le tag"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {tags.length > 0 && (
                                <div className={styles.tagsPreview} role="list">
                                    {tags.map(t => (
                                        <span key={t} className={styles.tagBadge} role="listitem">
                                            {t}
                                            <X
                                                size={10}
                                                onClick={() => removeTag(t)}
                                                role="button"
                                                aria-label={`Supprimer le tag ${t}`}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </span>
                                    ))}
                                </div>
                            )}

                            <textarea
                                placeholder="Contenu de l'article..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={styles.contentInput}
                                required
                            />
                        </div>

                        {/* ── Sidebar ──────────────────────────────── */}
                        <div className={styles.mediaSidebar}>

                            {/* Taille de carte */}
                            <div className={styles.sidebarSection}>
                                <label>Taille de la carte</label>
                                <div className={styles.sizeSelector}>
                                    {[
                                        { key: 'small', icon: <Square size={13} />, label: 'Petit' },
                                        { key: 'medium', icon: <Maximize2 size={13} style={{ transform: 'rotate(90deg)' }} />, label: 'Rect.' },
                                        { key: 'large', icon: <Maximize2 size={13} />, label: 'Grand' },
                                    ].map(({ key, icon, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            className={`${styles.sizeOption} ${cardSize === key ? styles.activeSize : ''}`}
                                            onClick={() => setCardSize(key as 'small' | 'medium' | 'large')}
                                            aria-pressed={cardSize === key}
                                        >
                                            {icon}
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Image de couverture */}
                            <div className={styles.sidebarSection}>
                                <label>Image de couverture</label>
                                <div
                                    className={styles.featuredUpload}
                                    onClick={() => handleUpload('featured')}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Choisir une image de couverture"
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpload('featured')}
                                >
                                    {featuredImage
                                        ? <img src={featuredImage} alt="Couverture" />
                                        : <ImageIcon size={22} />
                                    }
                                </div>
                            </div>

                            {/* Média additionnel */}
                            <div className={styles.sidebarSection}>
                                <label>Média additionnel</label>
                                <button
                                    type="button"
                                    onClick={() => handleUpload('content')}
                                    className={styles.mediaBtn}
                                >
                                    <Video size={15} /> Ajouter média
                                </button>

                                {mediaUrl && (
                                    <div className={styles.miniPreview}>
                                        {mediaType === 'video'
                                            ? <video src={mediaUrl} />
                                            : <img src={mediaUrl} alt="Média" />
                                        }
                                        <button
                                            type="button"
                                            className={styles.removeMedia}
                                            onClick={() => setMedia('', null)}
                                            aria-label="Supprimer le média"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </section>

            {/* Modal Nouveauté */}
            {showNouveauteModal && (
                <NouveauteModal
                    sourceId={nouveauteSourceId}
                    type="blog"
                    title={title}
                    description={content.slice(0, 160)}
                    image={featuredImage}
                    link={blogLink}
                    tags={tags}
                    category={category}
                    onClose={() => setShowNouveauteModal(false)}
                />
            )}
        </div>
    );
};

export default BlogEditor;
