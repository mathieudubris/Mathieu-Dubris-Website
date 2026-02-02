'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  MessageSquare,
  User,
  AtSign,
  FileText
} from 'lucide-react';
import styles from './contact.module.css';

// Types pour le formulaire
interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const ContactPage: React.FC = () => {
  // États pour le formulaire
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Gestion des changements dans les champs
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Effacer l'erreur du champ lorsqu'on commence à taper
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Formulaire soumis:', formData);
      
      // Réinitialiser le formulaire après succès
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      
      setSubmitSuccess(true);
      
      // Réinitialiser le message de succès après 5 secondes
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Erreur d\'envoi:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options pour le sujet
  const subjectOptions = [
    { value: '', label: 'Sélectionnez un sujet' },
    { value: 'general', label: 'Demande générale' },
    { value: 'support', label: 'Support technique' },
    { value: 'partnership', label: 'Partenariat' },
    { value: 'feedback', label: 'Retour d\'expérience' },
    { value: 'other', label: 'Autre' },
  ];

  // Informations de contact
  const contactInfo = [
    {
      icon: <MapPin size={20} />,
      title: 'Adresse',
      content: '123 Avenue de la République\n75011 Paris, France'
    },
    {
      icon: <Phone size={20} />,
      title: 'Téléphone',
      content: '+33 1 23 45 67 89\nLundi - Vendredi, 9h-18h'
    },
    {
      icon: <Mail size={20} />,
      title: 'Email',
      content: 'contact@example.com\nsupport@example.com'
    },
    {
      icon: <Clock size={20} />,
      title: 'Horaires',
      content: 'Lundi - Vendredi: 9h-18h\nSamedi: 10h-16h'
    }
  ];

  // Animations minimales
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.content}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* En-tête */}
        <motion.div className={styles.header} variants={itemVariants}>

        </motion.div>

        {/* Contenu principal - Grille responsive */}
        <div className={styles.mainGrid}>
          {/* Section gauche - Informations */}
          <motion.div 
            className={styles.infoSection}
            variants={itemVariants}
          >
            <h2 className={styles.sectionTitle}>
              <MessageSquare size={22} className={styles.sectionIcon} />
              Informations de contact
            </h2>
            
            <div className={styles.infoGrid}>
              {contactInfo.map((info, index) => (
                <motion.div 
                  key={index}
                  className={styles.infoCard}
                  variants={itemVariants}
                  whileHover={{ backgroundColor: 'rgba(199, 255, 68, 0.03)' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={styles.infoIcon}>{info.icon}</div>
                  <div className={styles.infoContent}>
                    <h3 className={styles.infoTitle}>{info.title}</h3>
                    <p className={styles.infoText}>{info.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Section réponse rapide */}
            <div className={styles.quickInfo}>
              <h3 className={styles.quickTitle}>Réponse rapide</h3>
              <p className={styles.quickText}>
                Nous nous engageons à répondre à toutes les demandes 
                dans un délai de 24 à 48 heures ouvrées.
              </p>
            </div>
          </motion.div>

          {/* Section droite - Formulaire */}
          <motion.div 
            className={styles.formSection}
            variants={itemVariants}
          >
            <h2 className={styles.sectionTitle}>Formulaire de contact</h2>
            
            {submitSuccess && (
              <motion.div 
                className={styles.successMessage}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CheckCircle size={18} />
                <span>Message envoyé avec succès. Nous vous répondrons rapidement.</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className={styles.contactForm}>
              {/* Nom */}
              <div className={styles.formGroup}>
                <div className={styles.inputHeader}>
                  <User size={16} className={styles.inputIcon} />
                  <label htmlFor="name" className={styles.formLabel}>
                    Nom complet *
                  </label>
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${styles.formInput} ${errors.name ? styles.inputError : ''}`}
                  placeholder="Votre nom et prénom"
                />
                {errors.name && (
                  <span className={styles.errorText}>{errors.name}</span>
                )}
              </div>

              {/* Email */}
              <div className={styles.formGroup}>
                <div className={styles.inputHeader}>
                  <AtSign size={16} className={styles.inputIcon} />
                  <label htmlFor="email" className={styles.formLabel}>
                    Adresse email *
                  </label>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${styles.formInput} ${errors.email ? styles.inputError : ''}`}
                  placeholder="votre.email@example.com"
                />
                {errors.email && (
                  <span className={styles.errorText}>{errors.email}</span>
                )}
              </div>

              {/* Sujet */}
              <div className={styles.formGroup}>
                <div className={styles.inputHeader}>
                  <FileText size={16} className={styles.inputIcon} />
                  <label htmlFor="subject" className={styles.formLabel}>
                    Sujet *
                  </label>
                </div>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`${styles.formSelect} ${errors.subject ? styles.inputError : ''}`}
                >
                  {subjectOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <span className={styles.errorText}>{errors.subject}</span>
                )}
              </div>

              {/* Message */}
              <div className={styles.formGroup}>
                <div className={styles.inputHeader}>
                  <MessageSquare size={16} className={styles.inputIcon} />
                  <label htmlFor="message" className={styles.formLabel}>
                    Votre message *
                  </label>
                </div>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className={`${styles.formTextarea} ${errors.message ? styles.inputError : ''}`}
                  rows={5}
                  placeholder="Décrivez votre demande en détail..."
                />
                {errors.message && (
                  <span className={styles.errorText}>{errors.message}</span>
                )}
              </div>

              {/* Bouton d'envoi */}
              <motion.button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className={styles.spinner} size={18} />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Envoyer le message</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactPage;