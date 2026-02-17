import React, { useState } from 'react';
import { Monitor, Info, X } from 'lucide-react';
import styles from './Role.module.css';

// Définition des rôles avec leur description et catégorie de couleur
const roles = [
  // Direction & Management - Blanc
  { 
    name: 'Game Director', 
    description: 'Définit et supervise la vision créative globale du jeu. Prend les décisions finales sur le game design, l\'histoire et l\'expérience utilisateur.', 
    colorClass: 'Direction' 
  },
  { 
    name: 'Creative Director', 
    description: 'Garantit la cohérence artistique et créative du projet. Supervise l\'équipe créative et s\'assure que la vision du jeu est respectée.', 
    colorClass: 'Direction' 
  },
  { 
    name: 'Technical Director', 
    description: 'Définit l\'architecture technique et les choix technologiques. Supervise l\'équipe de développement et assure la faisabilité technique du projet.', 
    colorClass: 'Direction' 
  },
  { 
    name: 'Project Manager', 
    description: 'Planifie, coordonne et suit l\'avancement du projet. Gère les ressources, les délais et la communication entre les équipes.', 
    colorClass: 'Direction' 
  },
  { 
    name: 'Team Coordinator', 
    description: 'Facilite la communication quotidienne entre les membres de l\'équipe. Organise les réunions et assure le bon déroulement des processus internes.', 
    colorClass: 'Direction' 
  },
  
  // Design - Rouge
  { 
    name: 'Game Designer', 
    description: 'Conçoit les mécaniques de jeu, les systèmes et les règles. Crée l\'expérience ludique et documente les fonctionnalités du jeu.', 
    colorClass: 'Design' 
  },
  { 
    name: 'Level Designer', 
    description: 'Construit les niveaux et environnements de jeu. Place les obstacles, ennemis et objets pour créer un parcours engageant et équilibré.', 
    colorClass: 'Design' 
  },
  { 
    name: 'Gameplay Designer', 
    description: 'Spécialiste des mécaniques de jeu interactives. Travaille sur la sensation des contrôles, le feedback des actions et l\'équilibrage des systèmes.', 
    colorClass: 'Design' 
  },
  { 
    name: 'Narrative Designer', 
    description: 'Intègre l\'histoire et les éléments narratifs dans le gameplay. Écrit les dialogues et crée un univers cohérent qui sert l\'expérience de jeu.', 
    colorClass: 'Design' 
  },
  
  // Programmation - Orange
  { 
    name: 'Game Programmer', 
    description: 'Développe les fonctionnalités interactives du jeu. Implémente les mécaniques de gameplay et assure leur bon fonctionnement.', 
    colorClass: 'Programming' 
  },
  { 
    name: 'Engine Programmer', 
    description: 'Travaille sur le moteur de jeu et les outils internes. Optimise les performances et développe des fonctionnalités techniques avancées.', 
    colorClass: 'Programming' 
  },
  { 
    name: 'AI Programmer', 
    description: 'Programme le comportement des ennemis, alliés et personnages non-joueurs. Crée des intelligences artificielles adaptatives et crédibles.', 
    colorClass: 'Programming' 
  },
  { 
    name: 'UI Programmer', 
    description: 'Développe les interfaces utilisateur et les systèmes d\'affichage. Assure la liaison entre les données du jeu et ce que voit le joueur.', 
    colorClass: 'Programming' 
  },
  
  // Art 3D - Jaune
  { 
    name: '3D Artist', 
    description: 'Crée les modèles 3D des personnages, créatures et objets. Donne vie à l\'univers visuel du jeu en respectant le style artistique établi.', 
    colorClass: 'Art3D' 
  },
  { 
    name: '3D Cinematic Artist', 
    description: 'Réalise les séquences animées et cinématiques du jeu. Met en scène les moments clés de l\'histoire avec un souci de réalisation cinématographique.', 
    colorClass: 'Art3D' 
  },
  { 
    name: 'Texture Artist', 
    description: 'Crée les surfaces, couleurs et matériaux appliqués aux modèles 3D. Donne du réalisme ou du style aux objets grâce aux textures et shading.', 
    colorClass: 'Art3D' 
  },
  { 
    name: 'Prop Artist', 
    description: 'Spécialiste des objets et accessoires du jeu. Crée tout ce que le joueur peut voir et utiliser dans l\'environnement (armes, meubles, éléments décoratifs).', 
    colorClass: 'Art3D' 
  },
  { 
    name: 'Environment Artist', 
    description: 'Construit les décors et mondes du jeu. Assemble les éléments pour créer des environnements immersifs et cohérents.', 
    colorClass: 'Art3D' 
  },
  { 
    name: '3D Animator', 
    description: 'Donne vie aux personnages et créatures par l\'animation. Crée des mouvements fluides et expressifs pour les actions et les émotions.', 
    colorClass: 'Art3D' 
  },
  { 
    name: 'Mocap Actor', 
    description: 'Interprète physiquement les mouvements des personnages lors des sessions de capture de mouvement. Apporte réalisme et expressivité aux animations.', 
    colorClass: 'Art3D' 
  },
  { 
    name: '3D Art Support', 
    description: 'Assiste l\'équipe artistique sur les tâches techniques et la production. Aide à l\'intégration des assets et au respect des contraintes techniques.', 
    colorClass: 'Art3D' 
  },
  { 
    name: 'Technical Artist', 
    description: 'Fait le pont entre les artistes et les programmeurs. Crée des shaders, optimise les assets et développe des outils pour faciliter le travail artistique.', 
    colorClass: 'Art3D' 
  },
  
  // UI/UX - Vert
  { 
    name: 'UX Designer', 
    description: 'Conçoit l\'expérience utilisateur globale. Étudie comment les joueurs interagissent avec le jeu et optimise la fluidité de navigation et de compréhension.', 
    colorClass: 'UIUX' 
  },
  { 
    name: 'UI Designer', 
    description: 'Crée l\'apparence visuelle des interfaces. Dessine les menus, icônes et éléments graphiques avec lesquels le joueur interagit.', 
    colorClass: 'UIUX' 
  },
  { 
    name: 'UI Artist', 
    description: 'Réalise les assets graphiques pour les interfaces. Illustre et met en forme tous les éléments visuels de l\'interface utilisateur.', 
    colorClass: 'UIUX' 
  },
  { 
    name: 'UI Art Support', 
    description: 'Assiste l\'équipe UI dans la production des éléments d\'interface. Aide à l\'intégration et à la déclinaison des assets graphiques.', 
    colorClass: 'UIUX' 
  },
  
  // Audio - Turquoise
  { 
    name: 'Music Composer', 
    description: 'Compose la bande originale du jeu. Crée des thèmes musicaux qui soutiennent l\'émotion, l\'action et l\'immersion du joueur.', 
    colorClass: 'Audio' 
  },
  { 
    name: 'Sound Designer', 
    description: 'Crée tous les effets sonores du jeu : bruitages, ambiances, sons d\'interfaces. Donne une identité audio cohérente et immersive.', 
    colorClass: 'Audio' 
  },
  { 
    name: 'Voice Actor', 
    description: 'Prête sa voix aux personnages du jeu. Interprète les dialogues avec justesse pour donner vie et personnalité aux protagonistes.', 
    colorClass: 'Audio' 
  },
  { 
    name: 'Voice Director', 
    description: 'Dirige les sessions d\'enregistrement des voix. Guide les comédiens pour obtenir des performances cohérentes avec le personnage et l\'histoire.', 
    colorClass: 'Audio' 
  },
  
  // Support & Marketing - Rose
  { 
    name: 'Community Manager', 
    description: 'Anime et modère la communauté autour du jeu. Communique avec les joueurs, recueille les retours et maintient l\'engagement sur les réseaux sociaux.', 
    colorClass: 'Support' 
  },
  { 
    name: 'Documentation Manager', 
    description: 'Organise et maintient toute la documentation du projet. Crée des guides, wikis et procédures pour faciliter le travail d\'équipe et l\'onboarding.', 
    colorClass: 'Support' 
  },
  { 
    name: 'Content Creator', 
    description: 'Produit du contenu promotionnel et éducatif : vidéos, tutoriels, making-of. Aide à présenter le jeu et à attirer l\'attention du public.', 
    colorClass: 'Support' 
  },
  { 
    name: 'Marketing Manager', 
    description: 'Élabore et pilote la stratégie marketing. Gère la marque, les campagnes de communication et la relation avec les partenaires et la presse.', 
    colorClass: 'Support' 
  },
  { 
    name: 'QA Tester', 
    description: 'Teste le jeu en profondeur pour identifier bugs et problèmes. Vérifie la stabilité, l\'équilibrage et la qualité générale avant la sortie.', 
    colorClass: 'Support' 
  }
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
              <div key={roleName} className={`${styles.selectedRoleTag} ${role ? styles[role.colorClass] : ''}`}>
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
                        className={`${styles.roleButton} ${styles[role.colorClass]} ${isSelected ? styles.selected : ''}`}
                        onClick={() => toggleRole(role.name)}
                      >
                        <span className={styles.roleName}>{role.name}</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      className={styles.infoButton}
                      onClick={() => showInfo(role.name)}
                      title="Plus d'informations"
                    >
                      <Info size={14} />
                    </button>
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