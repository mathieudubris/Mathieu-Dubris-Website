"use client";

import React, { useState } from 'react';
import { User } from '@/utils/firebase-api';
import styles from './User.module.css';

interface Props {
  user: User | null;
  onProfileClick: () => void;
}

const UserComp: React.FC<Props> = ({ user, onProfileClick }) => {
  // On définit le chemin par défaut à partir du dossier public
  const defaultAvatar = "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";
  const [avatarError, setAvatarError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // URL de l'avatar à utiliser
  const avatarUrl = user?.photoURL && !avatarError ? user.photoURL : defaultAvatar;

  return (
    <div className={styles.userWrapper}>
      <button className={styles.iconBtn} onClick={onProfileClick} type="button">
        <div className={styles.avatarContainer}>
          <img 
            src={avatarUrl}
            className={`${styles.userAvatar} ${imageLoaded ? styles.loaded : ''}`}
            alt={user?.displayName || "Default Profile"}
            onError={() => {
              setAvatarError(true);
            }}
            onLoad={() => {
              setImageLoaded(true);
            }}
            loading="lazy"
          />
          {!imageLoaded && (
            <div className={styles.avatarPlaceholder}>
              {user?.displayName?.charAt(0) || "U"}
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

export default UserComp;