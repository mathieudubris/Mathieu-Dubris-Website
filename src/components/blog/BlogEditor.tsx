"use client";

import React, { useState } from 'react';
import { Send, X, Image as ImageIcon, Video, Plus, Maximize2, Minus, Square } from 'lucide-react';
import styles from './BlogEditor.module.css';

interface BlogEditorProps {
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

const BlogEditor = ({ 
    title, content, category, tags, featuredImage, mediaUrl, mediaType, cardSize,
    setTitle, setContent, setCategory, setTags, setFeaturedImage, setMedia, setCardSize,
    onSubmit, onCancel, isSubmitting, isEditing = false 
}: BlogEditorProps) => {

    const [tagInput, setTagInput] = useState('');

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

    return (
        <div className={styles.overlay}>
            <section className={styles.editorPanel}>
                <div className={styles.editorHeader}>
                    <div className={styles.headerLeft}>
                        <span className={styles.headerTitle}>{isEditing ? "Modifier l'article" : "Nouvel Article"}</span>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className={styles.publishBtnTop}
                            onClick={onSubmit}
                        >
                            {isSubmitting ? "Envoi..." : <><Send size={16} /> {isEditing ? "Mettre à jour" : "Publier"}</>}
                        </button>
                    </div>
                    
                    {onCancel && (
                        <button type="button" onClick={onCancel} className={styles.closeBtn}>
                            <X size={18} />
                        </button>
                    )}
                </div>
                
                <form onSubmit={onSubmit} className={styles.publishForm}>
                    <div className={styles.formGrid}>
                        <div className={styles.mainFields}>
                            <input 
                                type="text" 
                                placeholder="Titre de l'article..." 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={styles.titleInput}
                                required
                            />
                            
                            <div className={styles.metaRow}>
                                <input
                                    type="text"
                                    placeholder="Écrire une catégorie..."
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
                                    />
                                    <button type="button" onClick={addTag} className={styles.plusBtn}><Plus size={14}/></button>
                                </div>
                            </div>

                            <div className={styles.tagsPreview}>
                                {tags.map(t => (
                                    <span key={t} className={styles.tagBadge}>
                                        {t} <X size={10} onClick={() => removeTag(t)} />
                                    </span>
                                ))}
                            </div>

                            <textarea 
                                placeholder="Contenu de l'article..." 
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={styles.contentInput}
                                required
                            />
                        </div>

                        <div className={styles.mediaSidebar}>
                            <div className={styles.sidebarSection}>
                                <label>Taille de la carte</label>
                                <div className={styles.sizeSelector}>
                                    <button 
                                        type="button"
                                        className={`${styles.sizeOption} ${cardSize === 'small' ? styles.activeSize : ''}`}
                                        onClick={() => setCardSize('small')}
                                        title="Petit (1x1)"
                                    >
                                        <Square size={14} />
                                        <span>Petit</span>
                                    </button>
                                    <button 
                                        type="button"
                                        className={`${styles.sizeOption} ${cardSize === 'medium' ? styles.activeSize : ''}`}
                                        onClick={() => setCardSize('medium')}
                                        title="Moyen (2x1)"
                                    >
                                        <Maximize2 size={14} style={{ transform: 'rotate(90deg)' }} />
                                        <span>Rectangulaire</span>
                                    </button>
                                    <button 
                                        type="button"
                                        className={`${styles.sizeOption} ${cardSize === 'large' ? styles.activeSize : ''}`}
                                        onClick={() => setCardSize('large')}
                                        title="Grand (2x2)"
                                    >
                                        <Maximize2 size={14} />
                                        <span>Grand</span>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.sidebarSection}>
                                <label>Image de couverture</label>
                                <div className={styles.featuredUpload} onClick={() => handleUpload('featured')}>
                                    {featuredImage ? <img src={featuredImage} alt="Featured" /> : <ImageIcon size={24} />}
                                </div>
                            </div>

                            <div className={styles.sidebarSection}>
                                <label>Média additionnel</label>
                                <button type="button" onClick={() => handleUpload('content')} className={styles.mediaBtn}>
                                    <Video size={16} /> Ajouter média
                                </button>
                                
                                {mediaUrl && (
                                    <div className={styles.miniPreview}>
                                        {mediaType === 'video' ? <video src={mediaUrl} /> : <img src={mediaUrl} />}
                                        <button type="button" className={styles.removeMedia} onClick={() => setMedia('', null)}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default BlogEditor;