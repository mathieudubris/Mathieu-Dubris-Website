"use client";

import React, { useState, useMemo } from 'react';
import { Users, Search, X, Check, Mail, UserPlus, UserMinus } from 'lucide-react';
import styles from './EquipeEditor.module.css';

interface EquipeEditorProps {
  teamMembers: string[];       // UIDs sélectionnés
  allUsers: any[];             // tous les users (uid, displayName, email, photoURL)
  onTeamMembersChange: (members: string[]) => void;
}

const EquipeEditor: React.FC<EquipeEditorProps> = ({
  teamMembers,
  allUsers,
  onTeamMembersChange,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [search, allUsers]);

  const selected = useMemo(
    () => allUsers.filter((u) => teamMembers.includes(u.uid)),
    [allUsers, teamMembers]
  );

  const toggle = (uid: string) => {
    if (teamMembers.includes(uid)) {
      onTeamMembersChange(teamMembers.filter((id) => id !== uid));
    } else {
      onTeamMembersChange([...teamMembers, uid]);
    }
  };

  const selectAll = () =>
    onTeamMembersChange([...new Set([...teamMembers, ...filtered.map((u) => u.uid)])]);

  const deselectAll = () =>
    onTeamMembersChange(teamMembers.filter((id) => !filtered.some((u) => u.uid === id)));

  return (
    <div className={styles.equipeEditor}>

      {/* ── Header stats ── */}
      <div className={styles.statsRow}>
        <div className={styles.statChip}>
          <Users size={13} />
          <span><strong>{teamMembers.length}</strong> membre{teamMembers.length !== 1 ? 's' : ''} sélectionné{teamMembers.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.statChip}>
          <span>{allUsers.length} utilisateur{allUsers.length !== 1 ? 's' : ''} disponible{allUsers.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Membres actuellement sélectionnés ── */}
      {selected.length > 0 && (
        <div className={styles.selectedSection}>
          <span className={styles.selectedLabel}>Équipe actuelle</span>
          <div className={styles.selectedAvatars}>
            {selected.map((u) => (
              <button
                key={u.uid}
                type="button"
                className={styles.selectedAvatar}
                onClick={() => toggle(u.uid)}
                title={`Retirer ${u.displayName || u.email}`}
              >
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.displayName} className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarInitial}>
                    {u.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className={styles.avatarRemoveOverlay}>
                  <X size={10} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Barre de recherche + actions ── */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className={styles.searchInput}
          />
          {search && (
            <button type="button" className={styles.searchClear} onClick={() => setSearch('')}>
              <X size={12} />
            </button>
          )}
        </div>
        <div className={styles.bulkActions}>
          <button type="button" className={styles.bulkBtn} onClick={selectAll}>
            <UserPlus size={12} />
            <span>Tout sélectionner</span>
          </button>
          <button type="button" className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`} onClick={deselectAll}>
            <UserMinus size={12} />
            <span>Tout désélectionner</span>
          </button>
        </div>
      </div>

      {/* ── Liste des users ── */}
      <div className={styles.userList}>
        {filtered.length === 0 ? (
          <div className={styles.emptySearch}>
            <Search size={24} />
            <p>Aucun utilisateur trouvé pour « {search} »</p>
          </div>
        ) : (
          filtered.map((user) => {
            const isMember = teamMembers.includes(user.uid);
            return (
              <div
                key={user.uid}
                className={`${styles.userRow} ${isMember ? styles.userRowSelected : ''}`}
                onClick={() => toggle(user.uid)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(user.uid)}
              >
                {/* Avatar */}
                <div className={styles.userAvatar}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarInitial}>
                      {user.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    {user.displayName || 'Sans nom'}
                  </span>
                  <span className={styles.userEmail}>
                    <Mail size={10} />
                    {user.email}
                  </span>
                </div>

                {/* Checkbox */}
                <div className={`${styles.checkbox} ${isMember ? styles.checkboxOn : ''}`}>
                  {isMember && <Check size={12} />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EquipeEditor;