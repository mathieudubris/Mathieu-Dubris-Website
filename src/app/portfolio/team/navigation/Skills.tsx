import React from 'react';
import { Code2 } from 'lucide-react';
import styles from './Skills.module.css';

interface SkillsProps {
  teamMember: {
    skills?: string;
    skillsPublic?: boolean;
  };
  onUpdate: (field: string, value: any) => void;
  hideTitle?: boolean;
}

export default function Skills({ teamMember, onUpdate, hideTitle }: SkillsProps) {
  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // Limiter à 500 mots maximum
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    if (words <= 500) {
      onUpdate('skills', text);
    }
  };

  const wordCount = teamMember.skills?.trim() === '' ? 0 : (teamMember.skills?.trim().split(/\s+/).length || 0);

  return (
    <div className={styles.container}>
      {!hideTitle && (
        <h2 className={styles.title}>
          <Code2 size={20} />
          <span>Compétences</span>
        </h2>
      )}
      
      <div className={styles.skillsSection}>
        <div className={styles.skillsHeader}>
          <div className={styles.headerLeft}>
            <label className={styles.label}>
              Décrivez vos compétences, logiciels maîtrisés, expériences...
            </label>
            <div className={styles.privacyToggle}>
              <span className={styles.privacyLabel}>
                {teamMember.skillsPublic ? 'Public' : 'Privé'}
              </span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={teamMember.skillsPublic !== false}
                  onChange={(e) => onUpdate('skillsPublic', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
          <span className={`${styles.wordCount} ${wordCount >= 450 ? styles.warning : ''} ${wordCount >= 500 ? styles.maximum : ''}`}>
            {wordCount}/500 mots
          </span>
        </div>
        
        <textarea
          value={teamMember.skills || ''}
          onChange={handleSkillsChange}
          className={styles.textarea}
          placeholder="Ex: Maîtrise de Unity et Unreal Engine, 5 ans d'expérience en C++, spécialiste en animation 3D avec Maya, création de shaders, etc."
        />
      </div>
    </div>
  );
}