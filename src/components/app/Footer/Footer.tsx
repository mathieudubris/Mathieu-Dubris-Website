
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
      title: "Produit",
      links: ["Fonctionnalités", "Solutions", "Tarifs", "Mises à jour"]
    },
    {
      title: "Société",
      links: ["À propos", "Carrières", "Contact", "Presse"]
    },
    {
      title: "Ressources",
      links: ["Blog", "Newsletter", "Événements", "Centre d'aide"]
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

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        
        {/* Section Principale */}
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

          {/* Colonnes de Liens */}
          <div className={styles.linksWrapper}>
            {footerLinks.map((group, idx) => (
              <div key={idx} className={styles.linkGroup}>
                <h4 className={styles.groupTitle}>{group.title}</h4>
                <ul className={styles.list}>
                  {group.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a href="#" className={styles.linkItem}>
                        {link}
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
              <a href="/confidentialite">Confidentialité</a>
              <span className={styles.dot} />
              <a href="/conditions">Conditions</a>
            </div>
          </div>
          
          <div className={styles.bottomRight}>
            <div className={styles.socialIcons}>
              {/* Ordre professionnel : plus professionnel → moins professionnel */}
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