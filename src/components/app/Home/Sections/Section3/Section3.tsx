"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  Layers, 
  Code2, 
  Rocket, 
  CheckCircle2 
} from 'lucide-react';
import styles from './Section3.module.css';

interface StepProps {
  number: string;
  title: string;
  description: string;
  Icon: any;
  index: number;
}

const StepCard = ({ number, title, description, Icon, index }: StepProps) => {
  return (
    <motion.div 
      className={styles.stepCard}
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
    >
      <div className={styles.stepHeader}>
        <div className={styles.iconContainer}>
          <Icon size={28} className={styles.stepIcon} />
          <span className={styles.stepNumber}>{number}</span>
        </div>
        <div className={styles.line} />
      </div>
      <div className={styles.stepContent}>
        <h3 className={styles.stepTitle}>{title}</h3>
        <p className={styles.stepDescription}>{description}</p>
      </div>
    </motion.div>
  );
};

const Section3 = () => {
  const steps = [
    {
      number: "01",
      title: "Stratégie & Analyse",
      description: "Nous définissons ensemble vos objectifs pour établir une feuille de route claire et efficace.",
      icon: Lightbulb
    },
    {
      number: "02",
      title: "Design & UX",
      description: "Conception d'interfaces intuitives et modernes centrées sur l'expérience utilisateur.",
      icon: Layers
    },
    {
      number: "03",
      title: "Développement",
      description: "Codage propre, performant et évolutif utilisant les dernières technologies du marché.",
      icon: Code2
    },
    {
      number: "04",
      title: "Lancement",
      description: "Déploiement optimisé et tests rigoureux pour garantir un produit final impeccable.",
      icon: Rocket
    }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <motion.div 
            className={styles.textSide}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className={styles.badge}>Méthodologie</span>
            <h2 className={styles.title}>Un processus pensé pour la réussite</h2>
            <p className={styles.subtitle}>
              De l'idée initiale à la mise en ligne, chaque étape est optimisée pour transformer votre vision en réalité numérique.
            </p>
            <div className={styles.features}>
              <div className={styles.featureItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>Accompagnement personnalisé</span>
              </div>
              <div className={styles.featureItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>Transparence totale sur l'avancement</span>
              </div>
            </div>
          </motion.div>

          <div className={styles.stepsSide}>
            {steps.map((step, index) => (
              <StepCard 
                key={index}
                index={index}
                number={step.number}
                title={step.title}
                description={step.description}
                Icon={step.icon}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Section3;