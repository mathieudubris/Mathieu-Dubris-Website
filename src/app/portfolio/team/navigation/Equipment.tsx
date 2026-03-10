import React from 'react';
import { Laptop, Phone, Wifi, Signal, Globe, Plus, Trash2 } from 'lucide-react';
import styles from './Equipment.module.css';

export interface PhoneEntry {
  model: string;
  isPublic?: boolean;
}

export interface ComputerEntry {
  os: 'windows' | 'mac' | 'linux';
  ram: string;
  storage: string;
  gpu?: string;
  isPublic?: boolean;
}

interface EquipmentProps {
  teamMember: {
    equipment: {
      internet?: 'wifi' | 'mobile' | 'both';
      phones?: PhoneEntry[];
      computers?: ComputerEntry[];
      // Ancien format compatibilité
      phone?: { model: string; internet?: string; isPublic?: boolean };
      computer?: ComputerEntry;
    };
  };
  onUpdate: (field: string, value: any) => void;
  hideTitle?: boolean;
}

const defaultPhone = (): PhoneEntry => ({ model: '', isPublic: true });
const defaultComputer = (): ComputerEntry => ({ os: 'windows', ram: '', storage: '', gpu: '', isPublic: true });

const getPhones = (equipment: EquipmentProps['teamMember']['equipment']): PhoneEntry[] => {
  if (equipment.phones && equipment.phones.length > 0) return equipment.phones;
  if (equipment.phone?.model) return [{ model: equipment.phone.model, isPublic: equipment.phone.isPublic ?? true }];
  return [defaultPhone()];
};

const getComputers = (equipment: EquipmentProps['teamMember']['equipment']): ComputerEntry[] => {
  if (equipment.computers && equipment.computers.length > 0) return equipment.computers;
  if (equipment.computer) return [equipment.computer];
  return [defaultComputer()];
};

export default function Equipment({ teamMember, onUpdate, hideTitle }: EquipmentProps) {
  const phones = getPhones(teamMember.equipment);
  const computers = getComputers(teamMember.equipment);
  // Migration : si l'ancien format stockait internet dans phone, on le récupère
  const internet = teamMember.equipment.internet
    ?? (teamMember.equipment.phone as any)?.internet
    ?? 'wifi';

  const updatePhone = (index: number, field: keyof PhoneEntry, value: any) => {
    onUpdate('equipment.phones', phones.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };
  const addPhone = () => onUpdate('equipment.phones', [...phones, defaultPhone()]);
  const removePhone = (index: number) => {
    if (phones.length <= 1) return;
    onUpdate('equipment.phones', phones.filter((_, i) => i !== index));
  };

  const updateComputer = (index: number, field: keyof ComputerEntry, value: any) => {
    onUpdate('equipment.computers', computers.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };
  const addComputer = () => onUpdate('equipment.computers', [...computers, defaultComputer()]);
  const removeComputer = (index: number) => {
    if (computers.length <= 1) return;
    onUpdate('equipment.computers', computers.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      {!hideTitle && (
        <h2 className={styles.title}>
          <Laptop size={20} />
          <span>Matériels utilisés</span>
        </h2>
      )}

      {/* ── Connexion Internet — champ global ── */}
      <div className={styles.internetSection}>
        <label className={styles.internetSectionLabel}>
          <Wifi size={15} />
          Connexion Internet disponible <span className={styles.required}>*</span>
        </label>
        <div className={styles.internetButtons}>
          {([
            { value: 'wifi',   label: 'Wi-Fi',      Icon: Wifi   },
            { value: 'mobile', label: 'Mobile',     Icon: Signal },
            { value: 'both',   label: 'Les deux',   Icon: Globe  },
          ] as const).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate('equipment.internet', value)}
              className={`${styles.internetButton} ${internet === value ? styles.active : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {/* ── TÉLÉPHONES ── */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <div className={styles.columnHeaderLeft}>
              <Phone size={16} />
              <span className={styles.columnTitle}>Téléphones</span>
            </div>
            <button type="button" className={styles.addButton} onClick={addPhone}>
              <Plus size={14} />
              Ajouter
            </button>
          </div>

          {phones.map((phone, index) => (
            <div key={index} className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <h3 className={styles.sectionTitle}>
                    Téléphone {phones.length > 1 ? index + 1 : ''}
                    {index === 0 && <span className={styles.required}> *</span>}
                  </h3>
                </div>
                <div className={styles.sectionHeaderRight}>
                  <div className={styles.privacyToggle}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={phone.isPublic !== false}
                        onChange={(e) => updatePhone(index, 'isPublic', e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <span className={styles.privacyLabel}>
                      {phone.isPublic !== false ? 'Public' : 'Privé'}
                    </span>
                  </div>
                  {phones.length > 1 && (
                    <button type="button" className={styles.removeButton} onClick={() => removePhone(index)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Modèle {index === 0 && <span className={styles.required}>*</span>}
                </label>
                <input
                  type="text"
                  value={phone.model}
                  onChange={(e) => updatePhone(index, 'model', e.target.value)}
                  className={`${styles.input} ${index === 0 && !phone.model ? styles.error : ''}`}
                  placeholder="Ex: iPhone 15 Pro, Samsung Galaxy S23"
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── ORDINATEURS ── */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <div className={styles.columnHeaderLeft}>
              <Laptop size={16} />
              <span className={styles.columnTitle}>Ordinateurs</span>
            </div>
            <button type="button" className={styles.addButton} onClick={addComputer}>
              <Plus size={14} />
              Ajouter
            </button>
          </div>

          {computers.map((computer, index) => (
            <div key={index} className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <h3 className={styles.sectionTitle}>
                    Ordinateur {computers.length > 1 ? index + 1 : ''}
                  </h3>
                </div>
                <div className={styles.sectionHeaderRight}>
                  <div className={styles.privacyToggle}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={computer.isPublic !== false}
                        onChange={(e) => updateComputer(index, 'isPublic', e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <span className={styles.privacyLabel}>
                      {computer.isPublic !== false ? 'Public' : 'Privé'}
                    </span>
                  </div>
                  {computers.length > 1 && (
                    <button type="button" className={styles.removeButton} onClick={() => removeComputer(index)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Système d'exploitation</label>
                <div className={styles.osButtons}>
                  {(['windows', 'mac', 'linux'] as const).map((os) => (
                    <button
                      key={os}
                      type="button"
                      onClick={() => updateComputer(index, 'os', os)}
                      className={`${styles.osButton} ${computer.os === os ? styles.active : ''}`}
                    >
                      {os === 'windows' ? 'Windows' : os === 'mac' ? 'macOS' : 'Linux'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>RAM</label>
                <input
                  type="text"
                  value={computer.ram}
                  onChange={(e) => updateComputer(index, 'ram', e.target.value)}
                  className={styles.input}
                  placeholder="Ex: 16 Go DDR4"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Stockage</label>
                <input
                  type="text"
                  value={computer.storage}
                  onChange={(e) => updateComputer(index, 'storage', e.target.value)}
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
                  value={computer.gpu || ''}
                  onChange={(e) => updateComputer(index, 'gpu', e.target.value)}
                  className={styles.input}
                  placeholder="Ex: NVIDIA RTX 3060 12 Go"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}