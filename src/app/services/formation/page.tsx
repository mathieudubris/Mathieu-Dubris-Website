"use client";

import React, { useState, useEffect, useRef } from 'react';
import { auth, setupAuthListener, isAdmin, getAllUsers } from '@/utils/firebase-api';
import {
  getAllFormations,
  FullFormation,
} from '@/utils/formation-api';
import Header from '@/components/app/Header/Header';
import Formation from '@/components/services/formation/Formation';
import styles from './formation.module.css';

export default function FormationPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [formations, setFormations] = useState<FullFormation[]>([]);
  const [loading, setLoading] = useState(true);

  const fullFormationCacheRef = useRef<Record<string, any>>({});
  const currentUserRef = useRef<any>(null);

  // ── Auth + chargement initial ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      currentUserRef.current = user;
      if (user) {
        setCurrentUser(user);
        const [users, formationsList] = await Promise.all([
          getAllUsers(),
          getAllFormations(),
        ]);
        setAllUsers(users);

        const enriched: FullFormation[] = formationsList.map((f) => {
          const members = (f.teamMembers || []).map((uid: string) => {
            const u = users.find((u: any) => u.uid === uid);
            return u
              ? { userId: u.uid as string, displayName: u.displayName as string | undefined, email: u.email as string | undefined, photoURL: u.photoURL as string | undefined }
              : null;
          }).filter((m): m is NonNullable<typeof m> => m !== null);
          return { ...f, members };
        });

        setFormations(enriched);

        enriched.forEach((f) => {
          const key = f.slug || f.id;
          if (key && !fullFormationCacheRef.current[key]) {
            fullFormationCacheRef.current[key] = f;
          }
        });
      } else {
        setCurrentUser(null);
        setFormations([]);
        setAllUsers([]);
        fullFormationCacheRef.current = {};
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const reloadFormations = async () => {
    fullFormationCacheRef.current = {};
    const [users, formationsList] = await Promise.all([
      getAllUsers(),
      getAllFormations(),
    ]);
    setAllUsers(users);
    const enriched: FullFormation[] = formationsList.map((f) => {
      const members = (f.teamMembers || []).map((uid: string) => {
        const u = users.find((u: any) => u.uid === uid);
        return u
          ? { userId: u.uid as string, displayName: u.displayName as string | undefined, email: u.email as string | undefined, photoURL: u.photoURL as string | undefined }
          : null;
      }).filter((m): m is NonNullable<typeof m> => m !== null);
      return { ...f, members };
    });
    setFormations(enriched);
    enriched.forEach((f) => {
      const key = f.slug || f.id;
      if (key) fullFormationCacheRef.current[key] = f;
    });
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <span className={styles.loadingText}>Chargement des formations…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <Formation
        formations={formations}
        currentUser={currentUser}
        allUsers={allUsers}
        fullFormationCacheRef={fullFormationCacheRef}
        onReload={reloadFormations}
      />
    </div>
  );
}