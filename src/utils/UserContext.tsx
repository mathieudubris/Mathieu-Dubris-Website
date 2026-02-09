"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserData, getAllUsers } from '@/utils/firebase-api';

interface UsersContextType {
  users: UserData[];
  loading: boolean;
  refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers doit être utilisé dans un UsersProvider');
  }
  return context;
};

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider: React.FC<UsersProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <UsersContext.Provider value={{ users, loading, refreshUsers: loadUsers }}>
      {children}
    </UsersContext.Provider>
  );
};