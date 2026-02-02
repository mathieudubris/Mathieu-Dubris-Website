import React from 'react';
import { User, Camera } from 'lucide-react';
import styles from './Profile.module.css';

interface ProfileProps {
  teamMember: {
    image: string;
  };
  onImageUpload: () => void;
}

export default function Profile({ teamMember, onImageUpload }: ProfileProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <User size={20} />
        <span>Photo de profil</span>
      </h2>
      
      <div className={styles.imageContainer}>
        <div 
          onClick={onImageUpload}
          className={styles.image}
          title="Cliquer pour uploader une photo"
        >
          {teamMember.image ? (
            <img src={teamMember.image} alt="Profile" />
          ) : (
            <Camera size={40} className={styles.cameraIcon} />
          )}
        </div>
        
        <button onClick={onImageUpload} className={styles.uploadButton}>
          {teamMember.image ? 'Changer la photo' : 'Uploader une photo'}
        </button>
        
        <p className={styles.hint}>
          Format recommandé: JPG ou PNG • Taille max: 5MB
        </p>
      </div>
    </div>
  );
}