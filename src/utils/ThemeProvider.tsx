"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, getUserPreferences, onAuthStateChanged, auth, saveUserPreferences } from '@/utils/firebase-api';

interface ThemeContextType {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Couleurs de la barre navigateur selon le thème
const THEME_COLORS = {
  dark: '#0e0e0e',
  light: '#e0e0e0',
} as const;

// Applique le thème immédiatement sur le DOM (synchrone, zéro latence)
const applyTheme = (theme: 'dark' | 'light') => {
  if (theme === 'light') {
    document.documentElement.classList.add('light-theme');
    document.body.classList.add('light-theme');
  } else {
    document.documentElement.classList.remove('light-theme');
    document.body.classList.remove('light-theme');
  }

  // Met à jour la couleur de la barre du navigateur (mobile Chrome, Safari, PWA)
  let metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.content = THEME_COLORS[theme];
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialisation synchrone depuis localStorage pour éviter tout flash
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Appliquer le thème dès le premier render (avant tout effet async)
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Synchroniser avec Firestore en arrière-plan (sans bloquer l'UI)
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const syncFromFirestore = async () => {
      try {
        const prefs = await getUserPreferences(user.uid);
        if (cancelled) return;

        const localTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;

        if (prefs?.theme) {
          // Firestore est la source de vérité quand l'utilisateur est connecté
          if (prefs.theme !== localTheme) {
            localStorage.setItem('theme', prefs.theme);
            setThemeState(prefs.theme);
            applyTheme(prefs.theme);
          }
        } else if (localTheme) {
          // Migrer le localStorage vers Firestore silencieusement
          saveUserPreferences(user.uid, { theme: localTheme }).catch(console.error);
        }
      } catch (error) {
        console.error("Erreur lors de la synchronisation du thème:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    syncFromFirestore();
    return () => { cancelled = true; };
  }, [user]);

  const setTheme = (newTheme: 'dark' | 'light') => {
    // 1. Appliquer immédiatement sur le DOM (synchrone, instantané)
    applyTheme(newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // 2. Persister dans Firestore en arrière-plan (non-bloquant)
    if (user) {
      saveUserPreferences(user.uid, { theme: newTheme }).catch((error) => {
        console.error("Erreur lors de la sauvegarde du thème dans Firestore:", error);
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
