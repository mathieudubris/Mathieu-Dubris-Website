"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/utils/firebase-api';
import styles from './Humberger.module.css';

interface Props {
  user: User | null;
  onRequireLogin: () => void;
  onProfileClick: () => void;
}

const Humberger: React.FC<Props> = ({ user, onRequireLogin, onProfileClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<number | null>(null);

  // Vérification si l'utilisateur est l'admin
  const isAdmin = user?.email === 'mathieudubris@gmail.com';

  const navigation = [
    {
      title: 'Accueil',
      links: [
        { label: "Bienvenue", path: "section1" },
        { label: "Nouveauté", path: "section2" },
        { label: "Nos Services", path: "section3" },
        { label: "Pourquoi nous", path: "section4" },
        { label: "Partenaire", path: "section5" }
      ]
    },
    { 
      title: 'Services', 
      links: [
        { label: 'Developper', path: '/services/pending' },
        { label: '3D Designer', path: '/services/pending' },
        { label: 'UI/UX Designer', path: '/services/pending' },
        { label: 'Content Creation', path: '/services/pending' },
        { label: 'Formation', path: '/services/formation' },
        { label: 'Accompagnement', path: '/services/accompagnement' }
      ]
    },
    { 
      title: 'Portfolio', 
      links: [
        { label: 'Projets Réalisés', path: '/security/access' },
        { label: 'Projets en Cours', path: '/portfolio/projet-en-cours' },
        { label: 'Galerie Créative', path: '/security/access' },
        { label: 'Expertises', path: '/security/access' },
        { label: 'Diplômes', path: '/security/access' }
      ]
    },
    { 
      title: 'Communauté', 
      links: [
        { label: 'Événements', path: '/security/access' },
        { label: 'Actualités', path: '/communaute/actualite' },
        { label: 'Blog', path: '/communaute/blog' },
        { label: 'Entraides', path: '/security/access' }
      ]
    }
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setActiveSection(null);
    }
  }, [isOpen]);

  // Fonction pour scroller vers une section avec offset
  const scrollToSection = (sectionId: string) => {
    // sectionId est maintenant sans # (ex: "section1")
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Ajustez cette valeur selon la hauteur de votre header
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Optionnel : enlever le hash de l'URL après le scroll
      setTimeout(() => {
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname);
        }
      }, 100);
    }
  };

  const handleNav = (path: string) => {
    setIsOpen(false);

    // Gestion des sections d'accueil (sans #)
    if (path === "section1" || path === "section2" || path === "section3" || path === "section4" || path === "section5") {
      // Si on est sur la page d'accueil
      if (pathname === '/home') {
        // On scroll directement vers la section
        setTimeout(() => {
          scrollToSection(path);
        }, 100);
      } else {
        // On redirige vers /home et on scroll après chargement
        router.push('/home');
        // Le scroll sera géré par le useEffect ci-dessous
        // On stocke la section cible dans sessionStorage pour la récupérer après navigation
        sessionStorage.setItem('targetSection', path);
      }
      return;
    }

    // Gestion des routes standards avec vérification de connexion
    if (path.startsWith('/')) {
      if (user) {
        router.push(path);
      } else {
        onRequireLogin();
      }
    }
  };

  // Effet pour gérer le scroll quand on arrive sur /home
  useEffect(() => {
    if (pathname === '/home') {
      // Vérifier s'il y a une section cible dans sessionStorage
      const targetSection = sessionStorage.getItem('targetSection');
      if (targetSection) {
        // Nettoyer sessionStorage
        sessionStorage.removeItem('targetSection');
        
        // Petit délai pour que le DOM soit complètement chargé
        setTimeout(() => {
          scrollToSection(targetSection);
        }, 300);
      }
    }
  }, [pathname]);

  const handleProfileIntClick = () => {
    setIsOpen(false);
    onProfileClick();
  };

  return (
    <div className={styles.navManager}>
      {/* DESKTOP NAV */}
      <nav className={`${styles.navDesktop} ${styles.desktopOnly}`}>
        <ul className={styles.navList}>
          {navigation.map((menu, index) => (
            <li key={index} className={styles.dropdown}>
              <div className={styles.navLinkWrapper}>
                <span className={styles.navLink}>{menu.title}</span>
                <svg className={styles.chevronIcon} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div className={styles.dropdownContent}>
                {menu.links.map((link) => (
                  <a key={link.label} onClick={() => handleNav(link.path)}>
                    {link.label}
                  </a>
                ))}
              </div>
            </li>
          ))}
          <li className={styles.quoteItem}>
            {isAdmin ? (
              <button className={styles.quoteBtn} onClick={() => router.push('/security/admin')}>Admin</button>
            ) : (
              <button className={styles.quoteBtn} onClick={() => handleNav('/services/pending')}>Free Quote</button>
            )}
          </li>
        </ul>
      </nav>

      {/* MOBILE TRIGGER */}
      <button 
        className={`${styles.iconBtn} ${styles.menuToggle} ${styles.mobileOnly}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        <span className={`${styles.hamburger} ${isOpen ? styles.open : ''}`}></span>
      </button>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.mobileMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button className={styles.closeMobile} onClick={() => setIsOpen(false)}>&times;</button>

            <div className={styles.mobileContainer}>
              <div className={styles.mobileProfile} onClick={handleProfileIntClick}>
                <div className={styles.profileCard}>
                  <img src={user?.photoURL || "/assets/default/images/jpg/default.jpg"} className={styles.userAvatarLarge} alt="User" />
                  <div className={styles.profileText}>
                    <span className={styles.profileName}>{user ? user.displayName || 'Utilisateur' : 'Se connecter'}</span>
                    <span className={styles.profileSubtext}>{user ? 'Gérer mon compte' : 'Accéder à votre espace'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.mobileNavContent}>
                {navigation.map((menu, index) => (
                  <div key={index} className={styles.mobileSection}>
                    <button 
                      className={`${styles.mobileDropdownTrigger} ${activeSection === index ? styles.active : ''}`}
                      onClick={() => setActiveSection(activeSection === index ? null : index)}
                    >
                      <h3 className={styles.mobileSectionTitle}>{menu.title}</h3>
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        style={{ 
                          transform: activeSection === index ? 'rotate(180deg)' : 'none', 
                          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                      >
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>

                    <motion.div 
                      className={styles.mobileLinksGrid}
                      initial={false}
                      animate={{ 
                        height: activeSection === index ? "auto" : 0,
                        opacity: activeSection === index ? 1 : 0
                      }}
                      transition={{ 
                        duration: 0.3, 
                        ease: [0.4, 0, 0.2, 1] 
                      }}
                      style={{ overflow: 'hidden' }}
                    >
                      {menu.links.map((link) => (
                        <a key={link.label} className={styles.mobileLinkItem} onClick={() => handleNav(link.path)}>
                          {link.label}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                        </a>
                      ))}
                    </motion.div>
                  </div>
                ))}
                
                {/* Bouton Admin en Mobile */}
                {isAdmin && (
                  <div className={styles.mobileSection} style={{ marginTop: '15px' }}>
                    <button 
                      className={styles.quoteBtn} 
                      style={{ width: '100%', padding: '12px' }} 
                      onClick={() => { setIsOpen(false); router.push('/security/admin'); }}
                    >
                      Accéder à l'administration
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Humberger;