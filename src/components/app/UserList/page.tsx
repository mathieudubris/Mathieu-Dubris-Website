"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/utils/firebase-api';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Search, Filter, User as UserIcon, Mail, Calendar } from 'lucide-react';
import styles from './UsersList.module.css';

interface User {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: string;
  lastLogin: string;
}

interface UsersListProps {
  title?: string;
  className?: string;
}

const UsersList: React.FC<UsersListProps> = ({ 
  title = "Utilisateurs Connectés",
  className = ""
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'date-asc' | 'date-desc'>('date-desc');
  const [loading, setLoading] = useState(true);

  // Récupérer les utilisateurs depuis Firestore
  useEffect(() => {
    setLoading(true);
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("lastLogin", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as User);
      });
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtrer et trier les utilisateurs
  useEffect(() => {
    let result = [...users];

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.displayName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }

    // Tri
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return (a.displayName || '').localeCompare(b.displayName || '');
        case 'name-desc':
          return (b.displayName || '').localeCompare(a.displayName || '');
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredUsers(result);
  }, [searchQuery, sortOrder, users]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`${styles.usersListContainer} ${className}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterContainer}>
          <Filter size={18} />
          <select 
            value={sortOrder} 
            onChange={handleSortChange}
            className={styles.sortSelect}
          >
            <option value="date-desc">Plus récent</option>
            <option value="date-asc">Plus ancien</option>
            <option value="name-asc">Nom (A-Z)</option>
            <option value="name-desc">Nom (Z-A)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <UserIcon size={48} />
          <h3>Aucun utilisateur trouvé</h3>
          <p>{searchQuery ? "Aucun résultat pour votre recherche" : "Aucun utilisateur connecté pour le moment"}</p>
        </div>
      ) : (
        <div className={styles.usersGrid}>
          {filteredUsers.map((user) => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userAvatar}>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Utilisateur'} 
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              
              <div className={styles.userInfo}>
                <h3 className={styles.userName}>
                  {user.displayName || 'Utilisateur anonyme'}
                </h3>
                
                <div className={styles.userEmail}>
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                
                <div className={styles.userMeta}>
                  <div className={styles.metaItem}>
                    <Calendar size={14} />
                    <span>Inscrit le: {formatDate(user.createdAt)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.lastLogin}>
                      Dernière connexion: {formatDate(user.lastLogin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersList;