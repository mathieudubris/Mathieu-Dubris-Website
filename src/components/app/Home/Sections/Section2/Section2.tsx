"use client";

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Wrench, 
  FileText, 
  Users, 
  FileSpreadsheet, 
  Diamond,
  LucideIcon 
} from 'lucide-react';
import styles from './Section2.module.css';

interface ServiceProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  index: number;
}

const ServiceCard = ({ title, description, Icon, index }: ServiceProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={styles.card}
      style={{ 
        '--x': `${mousePos.x}px`, 
        '--y': `${mousePos.y}px` 
      } as any}
    >
      <div className={styles.glow} />
      <div className={styles.iconWrapper}>
        <Icon size={24} color="white" strokeWidth={2} />
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
    </motion.div>
  );
};

const Section2 = () => {
  const services = [
    {
      title: "Services & Expertise",
      description: "Des solutions sur mesure pour vos projets web et mobiles, alliant performance et design moderne.",
      icon: Rocket
    },
    {
      title: "Outils & Ressources",
      description: "Accédez à une bibliothèque d'outils exclusifs pour booster votre productivité au quotidien.",
      icon: Wrench
    },
    {
      title: "Blog & Insights",
      description: "Articles techniques et retours d'expérience sur les dernières technologies du marché.",
      icon: FileText
    },
    {
      title: "Communauté & Échanges",
      description: "Rejoignez un espace d'entraide dédié aux passionnés et professionnels du secteur.",
      icon: Users
    },
    {
      title: "Demande de Devis",
      description: "Un projet en tête ? Obtenez une estimation précise et personnalisée en moins de 24h.",
      icon: FileSpreadsheet
    },
    {
      title: "Portfolio",
      description: "Découvrez mes réalisations les plus ambitieuses et les défis techniques relevés.",
      icon: Diamond
    }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.badge}>Écosystème Digital</span>
          <h2 className={styles.title}>Une plateforme, des possibilités infinies</h2>
        </motion.div>

        <div className={styles.grid}>
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              index={index}
              title={service.title}
              description={service.description}
              Icon={service.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Section2;