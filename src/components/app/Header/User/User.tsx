"use client";

import React, { useState } from 'react';
import { User } from '@/utils/firebase-api';
import styles from './User.module.css';

interface Props {
  user: User | null;
  onProfileClick: () => void;
}

const UserComp: React.FC<Props> = ({ user, onProfileClick }) => {
  const defaultAvatar = "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";
  const [avatarError, setAvatarError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pour un utilisateur non connecté, on affiche directement l'image par défaut
  const avatarUrl = user?.photoURL && !avatarError ? user.photoURL : defaultAvatar;
  
  // Si pas d'utilisateur, on affiche directement l'avatar par défaut
  const shouldShowPlaceholder = user && user.photoURL && !imageLoaded;
  const shouldShowDefaultAvatar = !user || !user.photoURL || avatarError;

  return (
    <div className={styles.userWrapper}>
      <button className={styles.iconBtn} onClick={onProfileClick} type="button">
        <div className={styles.avatarContainer}>
          {/* Avatar par défaut pour les non-connectés */}
          {shouldShowDefaultAvatar ? (
            <img 
              src={defaultAvatar}
              className={`${styles.userAvatar} ${styles.loaded}`}
              alt="Default Profile"
              onError={() => {
                setAvatarError(true);
              }}
              onLoad={() => {
                setImageLoaded(true);
              }}
            />
          ) : (
            <>
              {/* Avatar utilisateur connecté */}
              <img 
                src={avatarUrl}
                className={`${styles.userAvatar} ${imageLoaded ? styles.loaded : ''}`}
                alt={user?.displayName || "User Profile"}
                onError={() => {
                  setAvatarError(true);
                }}
                onLoad={() => {
                  setImageLoaded(true);
                }}
                loading="lazy"
              />
              {/* Placeholder uniquement pour les utilisateurs connectés pendant le chargement */}
              {shouldShowPlaceholder && (
                <div className={styles.avatarPlaceholder}>
                  {user?.displayName?.charAt(0) || "U"}
                </div>
              )}
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default UserComp;