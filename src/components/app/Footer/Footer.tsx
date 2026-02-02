"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  ArrowRight,
  Globe
} from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
              <a href="#">Confidentialité</a>
              <span className={styles.dot} />
              <a href="#">Conditions</a>
            </div>
          </div>
          
          <div className={styles.bottomRight}>
            <div className={styles.socialIcons}>
              <a href="#" className={styles.socialBtn}><Twitter size={18} /></a>
              <a href="#" className={styles.socialBtn}><Linkedin size={18} /></a>
              <a href="#" className={styles.socialBtn}><Github size={18} /></a>
            </div>
            <div className={styles.languageSelector}>
              <Globe size={14} />
              <span>Français (FR)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;