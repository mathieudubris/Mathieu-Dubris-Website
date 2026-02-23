"use client";

import React from 'react';
import { Image as ImageIcon, Plus, X } from 'lucide-react';
import styles from './ImagesEditor.module.css';

interface ImagesEditorProps {
  mainImage: string;
  carouselImages: string[];
  onMainImageChange: (url: string) => void;
  onCarouselImagesChange: (images: string[]) => void;
}

const ImagesEditor: React.FC<ImagesEditorProps> = ({
  mainImage,
  carouselImages,
  onMainImageChange,
  onCarouselImagesChange
}) => {
  const handleMainImageUpload = () => {
    if (typeof window !== "undefined" && (window as any).cloudinary) {
      const widget = (window as any).cloudinary.createUploadWidget({
        cloudName: 'dhqqx2m3y',
        uploadPreset: 'blog_preset',
        sources: ['local', 'url'],
        multiple: false,
        resourceType: 'image',
        theme: "minimal",
      }, (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          onMainImageChange(result.info.secure_url);
        }
      });
      widget.open();
    }
  };

  const handleCarouselUpload = () => {
    if (typeof window !== "undefined" && (window as any).cloudinary) {
      const widget = (window as any).cloudinary.createUploadWidget({
        cloudName: 'dhqqx2m3y',
        uploadPreset: 'blog_preset',
        sources: ['local', 'url'],
        multiple: true,
        resourceType: 'image',
        theme: "minimal",
      }, (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          onCarouselImagesChange([...carouselImages, result.info.secure_url]);
        }
      });
      widget.open();
    }
  };

  const removeCarouselImage = (index: number) => {
    onCarouselImagesChange(carouselImages.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.imagesEditor}>
      {/* Image principale */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          <ImageIcon size={16} />
          <span>Image principale</span>
        </label>
        <div className={styles.featuredUpload} onClick={handleMainImageUpload}>
          {mainImage ? (
            <img src={mainImage} alt="Principale" className={styles.featuredImage} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <ImageIcon size={32} />
              <span>Cliquer pour uploader l'image principale</span>
            </div>
          )}
        </div>
        <p className={styles.fieldHint}>
          Image principale du projet (format 16:9 recommandé)
        </p>
      </div>

      {/* Carousel d'images */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          Images du carousel
        </label>
        <div className={styles.carouselContainer}>
          <div className={styles.carouselGrid}>
            {carouselImages.map((img, index) => (
              <div key={index} className={styles.carouselItem}>
                <div className={styles.carouselNumber}>{index + 1}</div>
                <img src={img} alt={`Carousel ${index + 1}`} className={styles.carouselImage} />
                <button
                  type="button"
                  onClick={() => removeCarouselImage(index)}
                  className={styles.removeBtn}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <div 
              className={styles.addCarouselBtn}
              onClick={handleCarouselUpload}
            >
              <Plus size={24} />
              <span>Ajouter</span>
            </div>
          </div>
        </div>
        <p className={styles.fieldHint}>
          Images supplémentaires pour le carousel (optionnel)
        </p>
      </div>
    </div>
  );
};

export default ImagesEditor;