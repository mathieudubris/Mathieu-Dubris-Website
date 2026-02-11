import React, { useState } from 'react';
import { 
  Phone, Mail, Instagram, MessageCircle, 
  Youtube, Facebook, Twitter, Linkedin, 
  Plus, X, Music, Video, MessageSquare
} from 'lucide-react';
import styles from './Contacts.module.css';

interface Contact {
  type: 'instagram' | 'whatsapp' | 'discord' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
  value: string;
  label?: string;
  isPublic: boolean;
}

interface ContactsProps {
  teamMember: {
    contacts: Contact[];
  };
  onAddContact: (contact: Omit<Contact, 'isPublic'>) => void;
  onRemoveContact: (index: number) => void;
  onUpdateContactPrivacy: (index: number, isPublic: boolean) => void;
}

const contactTypes = [
  { type: 'instagram', label: 'Instagram', icon: Instagram },
  { type: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { type: 'discord', label: 'Discord', icon: MessageSquare },
  { type: 'tiktok', label: 'TikTok', icon: Music },
  { type: 'youtube', label: 'YouTube', icon: Youtube },
  { type: 'facebook', label: 'Facebook', icon: Facebook },
  { type: 'twitter', label: 'Twitter (X)', icon: Twitter },
  { type: 'linkedin', label: 'LinkedIn', icon: Linkedin },
];

export default function Contacts({ 
  teamMember, 
  onAddContact, 
  onRemoveContact,
  onUpdateContactPrivacy 
}: ContactsProps) {
  const [newContact, setNewContact] = useState({
    type: 'instagram' as const,
    value: '',
    label: ''
  });

  const handleAddContact = () => {
    if (newContact.value.trim()) {
      onAddContact(newContact);
      setNewContact({ type: 'instagram', value: '', label: '' });
    }
  };

  const getContactIcon = (type: string) => {
    return contactTypes.find(ct => ct.type === type)?.icon || MessageCircle;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <Phone size={20} />
        <span>Contacts</span>
      </h2>
      
      <div className={styles.addContactSection}>
        <h3 className={styles.subtitle}>Ajouter un réseau social</h3>
        
        <div className={styles.contactInputs}>
          <select
            value={newContact.type}
            onChange={(e) => setNewContact(prev => ({ ...prev, type: e.target.value as any }))}
            className={styles.input}
          >
            {contactTypes.map((ct) => (
              <option key={ct.type} value={ct.type}>{ct.label}</option>
            ))}
          </select>
          
          <input
            type="text"
            value={newContact.value}
            onChange={(e) => setNewContact(prev => ({ ...prev, value: e.target.value }))}
            className={styles.input}
            placeholder="@username, ID Discord ou URL"
          />
          
          <button onClick={handleAddContact} className={styles.addButton}>
            <Plus size={16} />
            Ajouter
          </button>
        </div>
        
        <p className={styles.hint}>
          Exemples: @instagram_user, username#1234, youtube.com/channel/...
        </p>
      </div>
      
      <div className={styles.contactsList}>
        {teamMember.contacts && teamMember.contacts.map((contact, index) => {
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
                    onChange={(e) => onUpdateContactPrivacy(index, e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.privacyLabel}>
                  {contact.isPublic ? 'Public' : 'Privé'}
                </span>
                <button
                  onClick={() => onRemoveContact(index)}
                  className={styles.removeButton}
                  title="Supprimer"
                >
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