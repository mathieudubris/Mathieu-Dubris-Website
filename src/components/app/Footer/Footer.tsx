"use client";

import React, { useState } from 'react';
import { 
  Linkedin, 
  Github, 
  Mail, 
  Youtube,
  MessageSquare,
  Instagram,
  Phone,
  Globe,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [selectedLanguage, setSelectedLanguage] = useState('Français (FR)');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const footerLinks = [
    {
      title: "Accueil",
      links: [
        { label: "Bienvenue", path: "#section1" },
        { label: "Nouveauté", path: "#section2" },
        { label: "Nos Services", path: "#section3" },
        { label: "Pourquoi nous", path: "#section4" },
        { label: "Partenaire", path: "#section5" }
      ]
    },
    {
      title: "Services",
      links: [
        { label: "Développeur", path: "/services/pending" },
        { label: "3D Designer", path: "/services/pending" },
        { label: "UI/UX Designer", path: "/services/pending" },
        { label: "Content Creation", path: "/services/pending" },
        { label: "Formation", path: "/services/pending" }
      ]
    },
    {
      title: "Portfolio",
      links: [
        { label: "Projets Réalisés", path: "/security/access" },
        { label: "Travaux en Cours", path: "/portfolio/projet-en-cours" },
        { label: "Galerie Créative", path: "/security/access" },
        { label: "Expertises", path: "/security/access" },
        { label: "Diplômes", path: "/security/access" }
      ]
    },
    {
      title: "Communauté",
      links: [
        { label: "Événements", path: "/security/access" },
        { label: "Actualités", path: "/security/access" },
        { label: "Blog", path: "/communaute/blog" },
        { label: "Entraides", path: "/security/access" }
      ]
    }
  ];

  const languages = [
    { code: 'FR', label: 'Français (FR)' },
    { code: 'EN', label: 'English (EN)' },
    { code: 'MG', label: 'Malagasy (MG)' }
  ];

  const handleLanguageSelect = (language: { code: string, label: string }) => {
    setSelectedLanguage(language.label);
    setShowLanguageDropdown(false);
  };

  const handleLinkClick = (path: string) => {
    if (path.startsWith('#')) {
      const element = document.querySelector(path);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    
    window.location.href = path;
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        
        {/* Section Principale - CORRIGÉ */}
        <div className={styles.mainGrid}>
          
          {/* Colonne Marque */}
          <div className={styles.brandColumn}>
            <div className={styles.logo}>
              <img 
                src="/assets/mathieu/images/png/profil.png" 
                alt="Mathieu Dubris" 
                className={styles.profileImage} 
              />
              <span className={styles.logoText}>Mathieu Dubris</span>
            </div>
            <p className={styles.brandTagline}>
              Construire le futur du web avec précision et élégance. 
              Solutions technologiques pour entreprises ambitieuses.
            </p>
            <div className={styles.status}>
              <span className={styles.statusIndicator} />
              <span className={styles.statusText}>Tous les systèmes sont opérationnels</span>
            </div>
          </div>

          {/* Colonnes de Liens - CORRIGÉ (4 colonnes alignées) */}
          <div className={styles.linksWrapper}>
            {footerLinks.map((group, idx) => (
              <div key={idx} className={styles.linkGroup}>
                <h4 className={styles.groupTitle}>{group.title}</h4>
                <ul className={styles.list}>
                  {group.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a 
                        href={link.path} 
                        className={styles.linkItem}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick(link.path);
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Section Newsletter Premium */}
        <div className={styles.ctaRow}>
          <div className={styles.ctaText}>
            <h3>Prêt à transformer votre vision ?</h3>
            <p>Rejoignez 500+ entreprises qui reçoivent nos insights.</p>
          </div>
          <div className={styles.newsletterBox}>
            <input type="email" placeholder="votre@email.com" className={styles.input} />
            <button className={styles.submitBtn}>
              S'inscrire <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Barre de fin */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomLeft}>
            <span>© {currentYear} Mathieu Dubris. Tous droits réservés.</span>
            <div className={styles.legalLinks}>
              <a href="/security/privacy-policy">Confidentialité</a>
              <span className={styles.dot} />
              <a href="/security/terms-of-service">Conditions</a>
            </div>
          </div>
          
          <div className={styles.bottomRight}>
            <div className={styles.socialIcons}>
              <a href="https://www.linkedin.com/in/fanampy-nirinah-%E2%80%8Emiarintsoa-5061313a3?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="https://github.com/mathieudubris" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="GitHub">
                <Github size={18} />
              </a>
              <a href="mailto:mathieudubris@gmail.com" className={styles.socialBtn} title="Email">
                <Mail size={18} />
              </a>
              <a href="https://youtube.com/@mathieu_dubris" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="YouTube">
                <Youtube size={18} />
              </a>
              <a href="https://instagram.com/mathieu_dubris" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://discord.gg/mathieu_dubris" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="Discord">
                <MessageSquare size={18} />
              </a>
              <a href="https://wa.me/0342526948" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="WhatsApp">
                <Phone size={18} />
              </a>
            </div>
            
            <div 
              className={styles.languageSelector}
              onMouseEnter={() => setShowLanguageDropdown(true)}
              onMouseLeave={() => setShowLanguageDropdown(false)}
            >
              <Globe size={14} />
              <span>{selectedLanguage}</span>
              <ChevronDown size={12} />
              
              {showLanguageDropdown && (
                <div className={styles.languageDropdown}>
                  {languages.map((lang) => (
                    <div
                      key={lang.code}
                      className={styles.languageOption}
                      onClick={() => handleLanguageSelect(lang)}
                    >
                      {lang.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;