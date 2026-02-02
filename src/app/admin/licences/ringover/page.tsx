"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/utils/firebase-api'; 
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import styles from './page.module.css';

const AdminLicence = () => {
  const [licences, setLicences] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [customKey, setCustomKey] = useState("");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLicences = async () => {
    try {
      const q = query(collection(db, "licences"), orderBy("expires", "desc"));
      const querySnapshot = await getDocs(q);
      setLicences(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Erreur lors de la récupération:", error);
    }
  };

  const formatLicenseKey = (key: string) => {
    const cleaned = key.replace(/-/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join('-');
  };

  const createLicence = async () => {
    const cleanedKey = customKey.replace(/-/g, '');
    
    if (cleanedKey.length !== 16) {
      alert("La clé doit comporter exactement 16 caractères.");
      return;
    }

    if (!clientName.trim()) {
      alert("Veuillez entrer le nom du client.");
      return;
    }

    setLoading(true);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    const newLicence = {
      key: cleanedKey.toUpperCase(),
      clientName: clientName.trim(),
      expires: expirationDate.toISOString(),
      hwid: "", 
      status: "active"
    };

    try {
      const docRef = await addDoc(collection(db, "licences"), newLicence);
      setLicences([{ id: docRef.id, ...newLicence }, ...licences]);
      setCustomKey("");
      setClientName("");
      alert(`Licence créée avec succès pour ${clientName} !`);
    } catch (error) {
      alert("Erreur lors de la création.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (id: string, clientName: string) => {
    if (!confirm(`Supprimer la licence de ${clientName} ?`)) return;
    
    try {
      setLicences(licences.filter(l => l.id !== id));
      await deleteDoc(doc(db, "licences", id));
    } catch (error) {
      console.error("Erreur:", error);
      fetchLicences();
    }
  };

  const copyToClipboard = (key: string, id: string) => {
    const formattedKey = formatLicenseKey(key);
    navigator.clipboard.writeText(formattedKey)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie:', err);
        const textArea = document.createElement('textarea');
        textArea.value = formattedKey;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
  };

  useEffect(() => {
    fetchLicences();
  }, []);

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.splitLayout}>
        {/* Section GAUCHE : Création */}
        <section className={styles.leftSection}>
          <div className={styles.stickyContent}>
            <div className={styles.card}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Client</label>
                <input 
                  type="text" 
                  placeholder="Nom de l'entreprise ou client" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={styles.input}
                />

                <label className={styles.label}>Clé de licence (16 caractères)</label>
                <input 
                  type="text" 
                  placeholder="XXXX-XXXX-XXXX-XXXX" 
                  value={customKey}
                  onChange={(e) => {
                    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setCustomKey(formatLicenseKey(cleaned));
                  }}
                  maxLength={19}
                  className={styles.inputKey}
                />

                <label className={styles.label}>Durée de validité</label>
                <div className={styles.controls}>
                  <select className={styles.select} onChange={(e) => setDays(Number(e.target.value))}>
                    <option value="30">1 Mois</option>
                    <option value="90">3 Mois</option>
                    <option value="180">6 Mois</option>
                    <option value="365">1 An</option>
                  </select>
                </div>

                <button 
                  className={styles.addBtn} 
                  onClick={createLicence} 
                  disabled={loading || customKey.replace(/-/g, '').length !== 16 || !clientName.trim()}
                >
                  {loading ? "Génération..." : "Enregistrer la licence"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section DROITE : Liste */}
        <section className={styles.rightSection}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Détails</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {licences.length > 0 ? (
                  licences.map((l) => (
                    <tr key={l.id}>
                      <td className={styles.nameCol}>
                        {l.clientName}
                        <div className={styles.mobileKey}>{formatLicenseKey(l.key)}</div>
                      </td>
                      <td className={styles.infoCol}>
                        <div className={styles.keyText}>{formatLicenseKey(l.key)}</div>
                        <div className={styles.expiryText}>Expire le: {new Date(l.expires).toLocaleDateString()}</div>
                        <div className={styles.hwidText}>HWID: {l.hwid || "Non lié"}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          <button 
                            className={`${styles.copyBtn} ${copiedId === l.id ? styles.copied : ''}`}
                            onClick={() => copyToClipboard(l.key, l.id)}
                          >
                            {copiedId === l.id ? '✓ Copié' : '📋 Copier'}
                          </button>
                          <button className={styles.delBtn} onClick={() => revokeKey(l.id, l.clientName)}>
                            Révoquer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className={styles.empty}>Aucune licence disponible</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminLicence;