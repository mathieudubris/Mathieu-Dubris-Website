// @/components/auth/AdminGuard.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/utils/firebase-api';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'mathieudubris@gmail.com') {
        setLoading(false);
      } else {
        // Si non connecté ou mauvais email, redirection vers l'accueil
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Pendant le chargement
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#050505',
        color: '#fff'
      }}>
        Vérification des autorisations...
      </div>
    );
  }

  // Si on arrive ici, c'est que l'utilisateur est autorisé
  return <>{children}</>;
};

export default AdminGuard;  