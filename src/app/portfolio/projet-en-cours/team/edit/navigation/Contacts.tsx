import React, { useState, useRef, useEffect } from 'react';
import {
  Phone, Instagram, MessageCircle,
  Youtube, Facebook, Linkedin,
  Plus, X, Music, MessageSquare, Globe, ChevronDown, Search,
} from 'lucide-react';
import styles from './Contacts.module.css';
import { countryCodes, type CountryCode } from './countryCodes';

interface Contact {
  type: 'instagram' | 'whatsapp' | 'discord' | 'tiktok' | 'youtube' | 'facebook' | 'linkedin' | 'website';
  value: string;
  label?: string;
  isPublic: boolean;
}

interface ContactsProps {
  teamMember: { contacts: Contact[] };
  onAddContact: (contact: Omit<Contact, 'isPublic'>) => void;
  onRemoveContact: (index: number) => void;
  onUpdateContactPrivacy: (index: number, isPublic: boolean) => void;
  hideTitle?: boolean;
}

const contactTypes = [
  { type: 'instagram', label: 'Instagram',  icon: Instagram     },
  { type: 'whatsapp',  label: 'WhatsApp',   icon: MessageCircle },
  { type: 'discord',   label: 'Discord',    icon: MessageSquare },
  { type: 'tiktok',    label: 'TikTok',     icon: Music         },
  { type: 'youtube',   label: 'YouTube',    icon: Youtube       },
  { type: 'facebook',  label: 'Facebook',   icon: Facebook      },
  { type: 'linkedin',  label: 'LinkedIn',   icon: Linkedin      },
  { type: 'website',   label: 'Website',    icon: Globe         },
];

const typeHint: Record<string, string> = {
  instagram: 'Ton @username Instagram',
  tiktok:    'Ton @username TikTok',
  discord:   'Ton Discord User ID (18 chiffres) — Paramètres → Avancés → Mode développeur, clic droit sur ton profil',
  youtube:   'Ex : youtube.com/@machaîne',
  facebook:  'Ex : facebook.com/monprofil',
  linkedin:  'Ex : linkedin.com/in/monprofil',
  website:   'URL complète — ex : https://monsite.com',
  whatsapp:  'Sélectionne ton indicatif pays puis saisis le numéro sans le 0 initial',
};

const typePlaceholder: Record<string, string> = {
  instagram: '@username',
  tiktok:    '@username',
  discord:   '123456789012345678',
  youtube:   'youtube.com/@machaîne',
  facebook:  'facebook.com/monprofil',
  linkedin:  'linkedin.com/in/monprofil',
  website:   'https://monsite.com',
};

// ── Custom Country Picker ────────────────────────────────────────────────────

interface CountryPickerProps {
  value: CountryCode;
  onChange: (c: CountryCode) => void;
}

function CountryPicker({ value, onChange }: CountryPickerProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef             = useRef<HTMLDivElement>(null);
  const searchRef           = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? countryCodes.filter(c =>
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
      )
    : countryCodes;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div className={styles.pickerWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.pickerTrigger}
        onClick={() => { setOpen(o => !o); setSearch(''); }}
      >
        <img src={value.flag} alt={value.country} className={styles.pickerFlagImg} />
        <span className={styles.pickerCode}>{value.code}</span>
        <ChevronDown size={13} className={`${styles.pickerChevron} ${open ? styles.pickerChevronOpen : ''}`} />
      </button>

      {open && (
        <div className={styles.pickerDropdown}>
          <div className={styles.pickerSearch}>
            <Search size={13} className={styles.pickerSearchIcon} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un pays…"
              className={styles.pickerSearchInput}
            />
          </div>
          <div className={styles.pickerList}>
            {filtered.length === 0 && (
              <div className={styles.pickerEmpty}>Aucun résultat</div>
            )}
            {filtered.map(c => (
              <button
                key={`${c.iso}-${c.code}`}
                type="button"
                className={`${styles.pickerItem} ${c.iso === value.iso ? styles.pickerItemActive : ''}`}
                onClick={() => { onChange(c); setOpen(false); setSearch(''); }}
              >
                <img src={c.flag} alt={c.country} className={styles.pickerItemFlagImg} />
                <span className={styles.pickerItemCode}>{c.code}</span>
                <span className={styles.pickerItemCountry}>{c.country}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_COUNTRY = countryCodes.find(c => c.iso === 'fr')!;

export default function Contacts({
  teamMember,
  onAddContact,
  onRemoveContact,
  onUpdateContactPrivacy,
  hideTitle,
}: ContactsProps) {
  const [newContact, setNewContact] = useState<{ type: Contact['type']; value: string; label: string }>({
    type: 'instagram',
    value: '',
    label: '',
  });
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);

  const handleTypeChange = (type: Contact['type']) =>
    setNewContact({ type, value: '', label: '' });

  const handleAddContact = () => {
    const rawValue = newContact.value.trim();
    if (!rawValue) return;
    let finalValue = rawValue;
    if (newContact.type === 'whatsapp') {
      finalValue = `${selectedCountry.code} ${rawValue.replace(/^0+/, '')}`;
    }
    onAddContact({ ...newContact, value: finalValue });
    setNewContact({ type: newContact.type, value: '', label: '' });
  };

  const getContactIcon = (type: string) =>
    contactTypes.find(ct => ct.type === type)?.icon || MessageCircle;

  const isWhatsApp = newContact.type === 'whatsapp';

  return (
    <div className={styles.container}>
      {!hideTitle && (
        <h2 className={styles.title}>
          <Phone size={20} />
          <span>Contacts</span>
        </h2>
      )}

      <div className={styles.addContactSection}>
        <h3 className={styles.subtitle}>Ajouter un réseau social</h3>

        {/* Platform selector */}
        <div className={styles.row}>
          <select
            value={newContact.type}
            onChange={e => handleTypeChange(e.target.value as Contact['type'])}
            className={styles.input}
          >
            {contactTypes.map(ct => (
              <option key={ct.type} value={ct.type}>{ct.label}</option>
            ))}
          </select>
        </div>

        {/* Value input */}
        {isWhatsApp ? (
          <div className={styles.phoneRow}>
            <CountryPicker value={selectedCountry} onChange={setSelectedCountry} />
            <input
              type="tel"
              inputMode="numeric"
              value={newContact.value}
              onChange={e =>
                setNewContact(prev => ({ ...prev, value: e.target.value.replace(/[^0-9 \-]/g, '') }))
              }
              className={`${styles.input} ${styles.phoneInput}`}
              placeholder={`Ex : ${selectedCountry.example}`}
            />
          </div>
        ) : (
          <div className={styles.row}>
            <input
              type={newContact.type === 'website' ? 'url' : 'text'}
              inputMode={newContact.type === 'discord' ? 'numeric' : undefined}
              value={newContact.value}
              onChange={e => {
                let val = e.target.value;
                if (newContact.type === 'discord') val = val.replace(/\D/g, '');
                setNewContact(prev => ({ ...prev, value: val }));
              }}
              className={styles.input}
              placeholder={typePlaceholder[newContact.type] ?? ''}
            />
          </div>
        )}

        {/* Add button */}
        <div className={styles.row}>
          <button onClick={handleAddContact} className={styles.addButton}>
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        <p className={styles.hint}>{typeHint[newContact.type]}</p>
      </div>

      {/* Contacts list */}
      <div className={styles.contactsList}>
        {teamMember.contacts?.map((contact, index) => {
          const ContactIcon = getContactIcon(contact.type);
          const typeLabel = contactTypes.find(ct => ct.type === contact.type)?.label;
          return (
            <div key={index} className={styles.contactItem}>
              <div className={styles.contactInfo}>
                <ContactIcon size={18} className={styles.contactIcon} />
                <div className={styles.contactDetails}>
                  <div className={styles.contactType}>{typeLabel}</div>
                  <div className={styles.contactValue}>{contact.value}</div>
                </div>
              </div>
              <div className={styles.contactActions}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={contact.isPublic}
                    onChange={e => onUpdateContactPrivacy(index, e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.privacyLabel}>
                  {contact.isPublic ? 'Public' : 'Privé'}
                </span>
                <button onClick={() => onRemoveContact(index)} className={styles.removeButton} title="Supprimer">
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {(!teamMember.contacts || teamMember.contacts.length === 0) && (
          <div className={styles.emptyState}>
            <MessageCircle size={32} />
            <p>Aucun réseau social ajouté</p>
          </div>
        )}
      </div>
    </div>
  );
}