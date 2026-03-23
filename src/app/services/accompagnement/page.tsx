"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { auth, setupAuthListener, isAdmin, getAllUsers } from '@/utils/firebase-api';
import {
  getAllAccompagnements,
  deleteAccompagnement,
  hasAccessToAccompagnement,
  isUserInAccompagnement,
  getFullAccompagnement,
  FullAccompagnement,
} from '@/utils/accompagnement-api';
import Header from '@/components/app/Header/Header';
import Accompagnement from '@/components/services/accompagnement/Accompagnement';
import styles from './accompagnement.module.css';

export default function AccompagnementPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [accompagnements, setAccompagnements] = useState<FullAccompagnement[]>([]);
  const [loading, setLoading] = useState(true);

  const fullAccompagnementCacheRef = useRef<Record<string, any>>({});
  const currentUserRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      currentUserRef.current = user;
      if (user) {
        setCurrentUser(user);
        const [users, accompagnementsList] = await Promise.all([
          getAllUsers(),
          // ← On passe l'uid pour que getAllAccompagnements puisse faire
          //   les requêtes ciblées (public + membre/créateur)
          getAllAccompagnements(user.uid),
        ]);
        setAllUsers(users);

        const enriched: FullAccompagnement[] = accompagnementsList.map((a) => {
          const members = (a.teamMembers || []).map((uid: string) => {
            const u = users.find((u: any) => u.uid === uid);
            return u
              ? { userId: u.uid as string, displayName: u.displayName as string | undefined, email: u.email as string | undefined, photoURL: u.photoURL as string | undefined }
              : null;
          }).filter((m): m is NonNullable<typeof m> => m !== null);
          return { ...a, members };
        });

        setAccompagnements(enriched);

        enriched.forEach((a) => {
          const key = a.slug || a.id;
          if (key && !fullAccompagnementCacheRef.current[key]) {
            fullAccompagnementCacheRef.current[key] = a;
          }
        });
      } else {
        setCurrentUser(null);
        setAccompagnements([]);
        setAllUsers([]);
        fullAccompagnementCacheRef.current = {};
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const reloadAccompagnements = async () => {
    fullAccompagnementCacheRef.current = {};
    const userId = currentUserRef.current?.uid ?? null;
    const [users, accompagnementsList] = await Promise.all([
      getAllUsers(),
      getAllAccompagnements(userId),
    ]);
    setAllUsers(users);
    const enriched: FullAccompagnement[] = accompagnementsList.map((a) => {
      const members = (a.teamMembers || []).map((uid: string) => {
        const u = users.find((u: any) => u.uid === uid);
        return u
          ? { userId: u.uid as string, displayName: u.displayName as string | undefined, email: u.email as string | undefined, photoURL: u.photoURL as string | undefined }
          : null;
      }).filter((m): m is NonNullable<typeof m> => m !== null);
      return { ...a, members };
    });
    setAccompagnements(enriched);
    enriched.forEach((a) => {
      const key = a.slug || a.id;
      if (key) fullAccompagnementCacheRef.current[key] = a;
    });
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <span className={styles.loadingText}>Chargement des accompagnements…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <Accompagnement
        accompagnements={accompagnements}
        currentUser={currentUser}
        allUsers={allUsers}
        fullAccompagnementCacheRef={fullAccompagnementCacheRef}
        onReload={reloadAccompagnements}
      />
    </div>
  );
}