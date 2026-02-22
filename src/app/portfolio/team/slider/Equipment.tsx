import React from 'react';
import { Laptop, Phone, Wifi, Signal, Globe } from 'lucide-react';
import styles from './Equipment.module.css';

interface EquipmentProps {
  teamMember: {
    equipment: {
      phone: {
        model: string;
        internet: 'wifi' | 'mobile' | 'both';
        isPublic?: boolean; // Nouveau
      };
      computer: {
        os: 'windows' | 'mac' | 'linux';
        ram: string;
        storage: string;
        gpu?: string;
        isPublic?: boolean; // Nouveau
      };
    };
  };
  onUpdate: (field: string, value: any) => void;
  hideTitle?: boolean;
}

export default function Equipment({ teamMember, onUpdate, hideTitle }: EquipmentProps) {
  return (
    <div className={styles.container}>
      {!hideTitle && (
        <h2 className={styles.title}>
          <Laptop size={20} />
          <span>Matériels utilisés</span>
        </h2>
      )}
      
      <div className={styles.grid}>
        {/* Téléphone */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <Phone size={16} />
              <h3 className={styles.sectionTitle}>
                Téléphone <span className={styles.required}>*</span>
              </h3>
            </div>
            <div className={styles.privacyToggle}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={teamMember.equipment.phone.isPublic !== false}
                  onChange={(e) => onUpdate('equipment.phone.isPublic', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.privacyLabel}>
                {teamMember.equipment.phone.isPublic !== false ? 'Public' : 'Privé'}
              </span>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Modèle <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={teamMember.equipment.phone.model}
              onChange={(e) => onUpdate('equipment.phone.model', e.target.value)}
              className={`${styles.input} ${!teamMember.equipment.phone.model ? styles.error : ''}`}
              placeholder="Ex: iPhone 15 Pro, Samsung Galaxy S23"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Connexion Internet</label>
            <div className={styles.internetButtons}>
              <button
                type="button"
                onClick={() => onUpdate('equipment.phone.internet', 'wifi')}
                className={`${styles.internetButton} ${
                  teamMember.equipment.phone.internet === 'wifi' ? styles.active : ''
                }`}
                title="Wi-Fi uniquement"
              >
                <Wifi size={16} />
                <span>Wi-Fi</span>
              </button>
              
              <button
                type="button"
                onClick={() => onUpdate('equipment.phone.internet', 'mobile')}
                className={`${styles.internetButton} ${
                  teamMember.equipment.phone.internet === 'mobile' ? styles.active : ''
                }`}
                title="Données mobiles uniquement"
              >
                <Signal size={16} />
                <span>Mobile</span>
              </button>
              
              <button
                type="button"
                onClick={() => onUpdate('equipment.phone.internet', 'both')}
                className={`${styles.internetButton} ${
                  teamMember.equipment.phone.internet === 'both' ? styles.active : ''
                }`}
                title="Wi-Fi + données mobiles"
              >
                <Globe size={16} />
                <span>Les deux</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Ordinateur */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <Laptop size={16} />
              <h3 className={styles.sectionTitle}>Ordinateur</h3>
            </div>
            <div className={styles.privacyToggle}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={teamMember.equipment.computer.isPublic !== false}
                  onChange={(e) => onUpdate('equipment.computer.isPublic', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.privacyLabel}>
                {teamMember.equipment.computer.isPublic !== false ? 'Public' : 'Privé'}
              </span>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Système d'exploitation</label>
            <div className={styles.osButtons}>
              {(['windows', 'mac', 'linux'] as const).map((os) => (
                <button
                  key={os}
                  type="button"
                  onClick={() => onUpdate('equipment.computer.os', os)}
                  className={`${styles.osButton} ${
                    teamMember.equipment.computer.os === os ? styles.active : ''
                  }`}
                >
                  {os === 'windows' ? 'Windows' :
                   os === 'mac' ? 'macOS' : 'Linux'}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>RAM</label>
            <input
              type="text"
              value={teamMember.equipment.computer.ram}
              onChange={(e) => onUpdate('equipment.computer.ram', e.target.value)}
              className={styles.input}
              placeholder="Ex: 16 Go DDR4"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Stockage</label>
            <input
              type="text"
              value={teamMember.equipment.computer.storage}
              onChange={(e) => onUpdate('equipment.computer.storage', e.target.value)}
              className={styles.input}
              placeholder="Ex: 500 Go SSD + 1 To HDD"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Carte graphique <span className={styles.optional}>(facultatif)</span>
            </label>
            <input
              type="text"
              value={teamMember.equipment.computer.gpu || ''}
              onChange={(e) => onUpdate('equipment.computer.gpu', e.target.value)}
              className={styles.input}
              placeholder="Ex: NVIDIA RTX 3060 12 Go"
            />
          </div>
        </div>
      </div>
    </div>
  );
}