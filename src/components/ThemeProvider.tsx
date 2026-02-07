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

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadTheme();
  }, [user]);

  const loadTheme = async () => {
    setIsLoading(true);
    try {
      let savedTheme: 'dark' | 'light' = 'dark';
      
      // Vérifier d'abord le localStorage (pour garder la cohérence)
      const localTheme = localStorage.getItem('theme') as 'dark' | 'light';
      
      if (user && localTheme) {
        // Si l'utilisateur est connecté ET qu'il y a un thème dans localStorage,
        // sauvegarder ce thème dans Firestore
        try {
          const prefs = await getUserPreferences(user.uid);
          if (!prefs?.theme && localTheme) {
            await saveUserPreferences(user.uid, { theme: localTheme });
          }
          savedTheme = prefs?.theme || localTheme || 'dark';
        } catch (error) {
          console.error("Erreur lors du chargement des préférences Firestore:", error);
          savedTheme = localTheme || 'dark';
        }
      } else if (user && !localTheme) {
        // Utilisateur connecté mais pas de thème dans localStorage
        try {
          const prefs = await getUserPreferences(user.uid);
          savedTheme = prefs?.theme || 'dark';
          if (savedTheme) {
            localStorage.setItem('theme', savedTheme);
          }
        } catch (error) {
          console.error("Erreur lors du chargement des préférences Firestore:", error);
          savedTheme = 'dark';
        }
      } else {
        // Utilisateur non connecté
        savedTheme = localTheme || 'dark';
      }
      
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } catch (error) {
      console.error("Erreur lors du chargement du thème:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (theme: 'dark' | 'light') => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
    }
  };

  const setTheme = async (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Sauvegarder dans Firestore si l'utilisateur est connecté
    if (user) {
      try {
        await saveUserPreferences(user.uid, { theme: newTheme });
      } catch (error) {
        console.error("Erreur lors de la sauvegarde du thème dans Firestore:", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};