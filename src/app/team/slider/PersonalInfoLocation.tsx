import React from 'react';
import { Info, MapPin } from 'lucide-react';
import styles from './PersonalInfoLocation.module.css';

interface PersonalInfoLocationProps {
  teamMember: {
    firstName: string;
    lastName: string;
    age: number;
    agePublic: boolean;
    location: {
      country: string;
      city: string;
      district?: string;
      districtPublic: boolean;
    };
  };
  onUpdate: (field: string, value: any) => void;
}

export default function PersonalInfoLocation({ teamMember, onUpdate }: PersonalInfoLocationProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <Info size={20} />
        <span>Informations personnelles</span>
      </h2>
      
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Prénom</label>
          <input
            type="text"
            value={teamMember.firstName || ''}
            onChange={(e) => onUpdate('firstName', e.target.value)}
            className={styles.input}
            placeholder="Votre prénom"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Nom</label>
          <input
            type="text"
            value={teamMember.lastName || ''}
            onChange={(e) => onUpdate('lastName', e.target.value)}
            className={styles.input}
            placeholder="Votre nom"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Âge</label>
          <div className={styles.inputWithSwitch}>
            <input
              type="number"
              value={teamMember.age || ''}
              onChange={(e) => onUpdate('age', parseInt(e.target.value) || 0)}
              className={styles.input}
              placeholder="Votre âge"
              min="0"
            />
            <div className={styles.switchContainer}>
              <span className={styles.switchLabel}>
                {teamMember.agePublic ? 'Public' : 'Privé'}
              </span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={teamMember.agePublic}
                  onChange={(e) => onUpdate('agePublic', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className={styles.title} style={{ marginTop: '2rem' }}>
        <MapPin size={20} />
        <span>Localisation</span>
      </h2>
      
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Pays</label>
          <input
            type="text"
            value={teamMember.location?.country || ''}
            onChange={(e) => onUpdate('location.country', e.target.value)}
            className={styles.input}
            placeholder="Ex: Madagascar, France..."
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Ville</label>
          <input
            type="text"
            value={teamMember.location?.city || ''}
            onChange={(e) => onUpdate('location.city', e.target.value)}
            className={styles.input}
            placeholder="Ex: Antananarivo, Lyon..."
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Quartier/Arrondissement</label>
          <div className={styles.inputWithSwitch}>
            <input
              type="text"
              value={teamMember.location?.district || ''}
              onChange={(e) => onUpdate('location.district', e.target.value)}
              className={styles.input}
              placeholder="Ex: Ankorondrano, 7ème arrondissement..."
            />
            <div className={styles.switchContainer}>
              <span className={styles.switchLabel}>
                {teamMember.location?.districtPublic ? 'Public' : 'Privé'}
              </span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={teamMember.location?.districtPublic || false}
                  onChange={(e) => onUpdate('location.districtPublic', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}