import React, { useState } from 'react';
import { Monitor, Info, X } from 'lucide-react';
import styles from './Role.module.css';

// Définition des rôles avec leur description
const roles = [
  { name: 'Game Director', description: 'Supervise la vision globale et la direction créative du jeu' },
  { name: 'Creative Director', description: 'Dirige la direction artistique et créative du projet' },
  { name: 'Technical Director', description: 'Responsable des aspects techniques et de l\'architecture du jeu' },
  { name: 'Project Manager', description: 'Gère la planification, les ressources et les délais du projet' },
  { name: 'Game Designer', description: 'Conçoit les mécaniques de jeu et les systèmes interactifs' },
  { name: 'Level Designer', description: 'Crée les niveaux, l\'environnement et le parcours du joueur' },
  { name: 'Gameplay Designer', description: 'Développe et équilibre les mécaniques de gameplay' },
  { name: 'Narrative Designer', description: 'Élabore l\'histoire, les dialogues et l\'univers narratif' },
  { name: 'Game Programmer', description: 'Développe les fonctionnalités principales du jeu' },
  { name: 'Engine Programmer', description: 'Travaille sur le moteur de jeu et les outils techniques' },
  { name: 'AI Programmer', description: 'Programme l\'intelligence artificielle des ennemis et PNJ' },
  { name: 'UI Programmer', description: 'Développe les interfaces utilisateur et les systèmes HUD' },
  { name: '3D Artist', description: 'Crée les modèles 3D des personnages et objets' },
  { name: '3D Cinematic', description: 'Réalise les cinématiques et séquences animées en 3D' },
  { name: 'Texture Artist', description: 'Crée les textures et matériaux pour les modèles 3D' },
  { name: 'Prop Artist', description: 'Modélise les objets et accessoires du jeu' },
  { name: 'Environment Artist', description: 'Construit les environnements et décors du jeu' },
  { name: '3D Animator', description: 'Anime les personnages et créatures en 3D' },
  { name: 'Mocap Actor', description: 'Effectue les performances pour la capture de mouvement' },
  { name: '3D Art Support', description: 'Assiste l\'équipe artistique sur les aspects techniques 3D' },
  { name: 'Technical Artist', description: 'Fait le pont entre artistes et programmeurs, crée des shaders' },
  { name: 'UX Designer', description: 'Conçoit l\'expérience utilisateur et la fluidité d\'interaction' },
  { name: 'UI Designer', description: 'Dessine les interfaces utilisateur et éléments d\'interface' },
  { name: 'UI Artist', description: 'Crée les assets graphiques pour les interfaces' },
  { name: 'UI Art Support', description: 'Assiste dans la création des éléments d\'interface' },
  { name: 'Music Composer', description: 'Compose la bande-son et les thèmes musicaux' },
  { name: 'Sound Designer', description: 'Crée les effets sonores et l\'ambiance audio' },
  { name: 'Voice Actor', description: 'Prête sa voix aux personnages du jeu' },
  { name: 'Voice Director', description: 'Dirige les séances d\'enregistrement vocal' },
  { name: 'Community Manager', description: 'Gère la relation avec la communauté de joueurs' },
  { name: 'Documentation Manager', description: 'Organise et maintient la documentation du projet' },
  { name: 'Team Coordinator', description: 'Coordonne les différentes équipes et assure la communication' },
  { name: 'Content Creator', description: 'Crée du contenu promotionnel et éducatif autour du jeu' },
  { name: 'Marketing Manager', description: 'Gère la stratégie marketing et la promotion du jeu' },
  { name: 'QA Tester', description: 'Teste le jeu pour identifier les bugs et problèmes' }
];

interface RoleProps {
  teamMember: {
    roles: string[];
  };
  onUpdate: (field: string, value: any) => void;
}

export default function Role({ teamMember, onUpdate }: RoleProps) {
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);

  const toggleRole = (roleName: string) => {
    const currentRoles = teamMember.roles || [];
    let newRoles: string[];
    
    if (currentRoles.includes(roleName)) {
      newRoles = currentRoles.filter(role => role !== roleName);
    } else {
      newRoles = [...currentRoles, roleName];
    }
    
    onUpdate('roles', newRoles);
  };

  const showInfo = (roleName: string) => {
    setSelectedInfo(selectedInfo === roleName ? null : roleName);
  };

  const removeRole = (roleName: string) => {
    const currentRoles = teamMember.roles || [];
    const newRoles = currentRoles.filter(role => role !== roleName);
    onUpdate('roles', newRoles);
  };

  // Regrouper les rôles par catégorie pour l'affichage
  const categorizedRoles = {
    'Direction & Management': roles.filter(role => 
      ['Game Director', 'Creative Director', 'Technical Director', 'Project Manager', 'Team Coordinator'].includes(role.name)
    ),
    'Design': roles.filter(role => 
      ['Game Designer', 'Level Designer', 'Gameplay Designer', 'Narrative Designer'].includes(role.name)
    ),
    'Programmation': roles.filter(role => 
      ['Game Programmer', 'Engine Programmer', 'AI Programmer', 'UI Programmer'].includes(role.name)
    ),
    'Art 3D': roles.filter(role => 
      ['3D Artist', '3D Cinematic', 'Texture Artist', 'Prop Artist', 'Environment Artist', '3D Animator', 'Mocap Actor', '3D Art Support', 'Technical Artist'].includes(role.name)
    ),
    'UI/UX': roles.filter(role => 
      ['UX Designer', 'UI Designer', 'UI Artist', 'UI Art Support'].includes(role.name)
    ),
    'Audio': roles.filter(role => 
      ['Music Composer', 'Sound Designer', 'Voice Actor', 'Voice Director'].includes(role.name)
    ),
    'Support & Marketing': roles.filter(role => 
      ['Community Manager', 'Documentation Manager', 'Content Creator', 'Marketing Manager', 'QA Tester'].includes(role.name)
    )
  };

  return (
    <div className={styles.roleContainer}>
      <div className={styles.sectionTitle}>
        <Monitor size={20} />
        <span>Rôles dans l'équipe</span>
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Sélectionnez un ou plusieurs rôles (sélection multiple)
          {teamMember.roles && teamMember.roles.length > 0 && (
            <span className={styles.selectionCount}>
              {teamMember.roles.length} sélectionné(s)
            </span>
          )}
        </label>
        
        {/* Rôles sélectionnés */}
        <div className={styles.selectedRolesContainer}>
          {(teamMember.roles || []).map((roleName) => {
            const role = roles.find(r => r.name === roleName);
            return (
              <div key={roleName} className={styles.selectedRoleTag}>
                <span>{roleName}</span>
                <button 
                  onClick={() => removeRole(roleName)}
                  className={styles.removeButton}
                  type="button"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Catégories de rôles */}
      {Object.entries(categorizedRoles).map(([category, categoryRoles]) => (
        <div key={category} className={styles.roleCategory}>
          <h4 className={styles.categoryTitle}>{category}</h4>
          <div className={styles.roleGrid}>
            {categoryRoles.map((role) => {
              const isSelected = (teamMember.roles || []).includes(role.name);
              return (
                <div key={role.name} className={styles.roleCard}>
                  <div className={styles.roleHeader}>
                    <div className={styles.roleButtonContainer}>
                      <button
                        type="button"
                        className={`${styles.roleButton} ${isSelected ? styles.selected : ''}`}
                        onClick={() => toggleRole(role.name)}
                      >
                        <div className={styles.roleButtonContent}>
                          <span className={styles.roleName}>{role.name}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={styles.infoButton}
                        onClick={() => showInfo(role.name)}
                        title="Plus d'informations"
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {selectedInfo === role.name && (
                    <div className={styles.roleInfo}>
                      <p className={styles.roleDescription}>{role.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className={styles.formGroup}>
        <p className={styles.locationHint}>
          Cliquez sur les rôles pour les sélectionner/désélectionner. Vous pouvez choisir plusieurs rôles.
        </p>
      </div>
    </div>
  );
}