/* page.tsx */
import styles from './privacy-policy.module.css';

export default function Confidentialite() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>POLITIQUE DE CONFIDENTIALITÉ</h1>
        <p className={styles.lastUpdated}>Version effective au : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Préambule et Définitions</h2>
          <p className={styles.text}>
            La présente <span className={styles.emphasis}>Politique de Confidentialité</span> (ci-après dénommée la "Politique") 
            constitue un engagement contractuel entre <span className={styles.emphasis}>[Nom de l'Entreprise/Indépendant]</span> 
            (ci-après "nous", "notre", "nos") et tout utilisateur (ci-après "vous", "votre", "utilisateur") 
            accédant à notre site portfolio <span className={styles.highlight}>[URL du site]</span>. Elle a pour objet 
            de définir les principes et les pratiques en matière de collecte, de traitement, de conservation 
            et de protection des données à caractère personnel dans le strict respect du Règlement Général 
            sur la Protection des Données (RGPD) 2016/679 et de la Loi Informatique et Libertés modifiée.
          </p>
          
          <div className={styles.definition}>
            <div className={styles.definitionTitle}>Définitions légales :</div>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Donnée à caractère personnel</span> : toute information se rapportant 
                à une personne physique identifiée ou identifiable.
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Traitement</span> : toute opération ou ensemble d'opérations 
                effectuées ou non à l'aide de procédés automatisés et appliquées à des données.
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Responsable du traitement</span> : la personne physique ou morale 
                qui détermine les finalités et les moyens du traitement.
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Sous-traitant</span> : la personne physique ou morale qui traite 
                des données pour le compte du responsable du traitement.
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Champ d'Application et Consentement</h2>
          <p className={styles.text}>
            Cette Politique s'applique exclusivement aux données collectées via notre site portfolio 
            <span className={styles.highlight}>[URL du site]</span> et ses sous-domaines. Elle ne couvre pas les 
            pratiques de sites tiers, y compris ceux vers lesquels nous pourrions fournir des liens.
          </p>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>2.1. Base Légale du Traitement</h3>
            <p className={styles.text}>
              Tout traitement de vos données personnelles repose sur l'une des bases légales suivantes, 
              conformément à l'article 6 du RGPD :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Votre consentement libre, spécifique, éclairé et univoque</li>
              <li className={styles.listItem}>L'exécution d'un contrat ou de mesures précontractuelles</li>
              <li className={styles.listItem}>Le respect d'une obligation légale à laquelle nous sommes soumis</li>
              <li className={styles.listItem}>La sauvegarde de nos intérêts légitimes, sous réserve que vos intérêts 
                ou vos droits et libertés fondamentaux ne prévalent pas</li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>2.2. Modification de la Politique</h3>
            <p className={styles.text}>
              Nous nous réservons le droit de modifier cette Politique à tout moment pour nous conformer 
              aux évolutions législatives, réglementaires ou jurisprudentielles, ou pour adapter nos pratiques. 
              La version mise à jour sera publiée sur cette page avec indication de la date de prise d'effet. 
              Nous vous encourageons à consulter régulièrement cette Politique.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Nature et Finalités des Données Collectées</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>3.1. Catégories de Données Traitées</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.tableCell}>Catégorie de données</th>
                    <th className={styles.tableCell}>Exemples</th>
                    <th className={styles.tableCell}>Base légale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tableCell}>Données d'identification</td>
                    <td className={styles.tableCell}>Nom, prénom, adresse e-mail, numéro de téléphone</td>
                    <td className={styles.tableCell}>Consentement / Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className={styles.tableCell}>Données techniques</td>
                    <td className={styles.tableCell}>Adresse IP, user agent, système d'exploitation, résolution d'écran</td>
                    <td className={styles.tableCell}>Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className={styles.tableCell}>Données de navigation</td>
                    <td className={styles.tableCell}>Pages consultées, durée de visite, actions effectuées</td>
                    <td className={styles.tableCell}>Consentement</td>
                  </tr>
                  <tr>
                    <td className={styles.tableCell}>Données de communication</td>
                    <td className={styles.tableCell}>Contenu des messages, historique des échanges</td>
                    <td className={styles.tableCell}>Exécution précontractuelle</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>3.2. Finalités Spécifiques du Traitement</h3>
            <p className={styles.text}>
              Nous traitons vos données exclusivement pour les finalités déterminées, explicites et légitimes suivantes :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Gestion des demandes de contact</span> : 
                Traitement et suivi de vos sollicitations via nos formulaires
                <ul className={styles.nestedList}>
                  <li className={styles.nestedListItem}>Authentification et identification</li>
                  <li className={styles.nestedListItem}>Réponse personnalisée à vos demandes</li>
                  <li className={styles.nestedListItem}>Archivage des échanges à des fins probatoires</li>
                </ul>
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Analyse et optimisation technique</span> : 
                Mesure d'audience, détection d'incidents, amélioration des performances
                <ul className={styles.nestedList}>
                  <li className={styles.nestedListItem}>Analyse statistique anonymisée</li>
                  <li className={styles.nestedListItem}>Détection et correction des dysfonctionnements</li>
                  <li className={styles.nestedListItem}>Optimisation de l'expérience utilisateur</li>
                </ul>
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Sécurité et prévention des fraudes</span> : 
                Protection de l'intégrité de nos systèmes et de vos données
                <ul className={styles.nestedList}>
                  <li className={styles.nestedListItem}>Détection des activités suspectes</li>
                  <li className={styles.nestedListItem}>Protection contre les attaques informatiques</li>
                  <li className={styles.nestedListItem}>Sauvegarde et restauration des données</li>
                </ul>
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Conformité légale et réglementaire</span> : 
                Respect de nos obligations en matière de conservation et de communication
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Modalités de Collecte des Données</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>4.1. Collecte Directe</h3>
            <p className={styles.text}>
              Nous collectons des informations que vous nous fournissez volontairement lorsque vous :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Remplissez un formulaire de contact</li>
              <li className={styles.listItem}>Nous envoyez un courrier électronique</li>
              <li className={styles.listItem}>Participez à une enquête ou étude (avec consentement préalable)</li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>4.2. Collecte Automatique</h3>
            <p className={styles.text}>
              Certaines informations sont collectées automatiquement via des technologies telles que :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Cookies et traceurs</span> : 
                Fichiers texte déposés sur votre terminal permettant de mémoriser vos préférences
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Journaux d'accès (logs)</span> : 
                Enregistrement automatique des requêtes serveur
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Balises web (web beacons)</span> : 
                Images invisibles permettant le suivi de certaines actions
              </li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>4.3. Politique relative aux Cookies</h3>
            <p className={styles.text}>
              Notre site utilise différents types de cookies, classés selon leur finalité :
            </p>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.tableCell}>Type de cookie</th>
                    <th className={styles.tableCell}>Finalité</th>
                    <th className={styles.tableCell}>Durée</th>
                    <th className={styles.tableCell}>Gestion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tableCell}>Cookies essentiels</td>
                    <td className={styles.tableCell}>Navigation de base, sécurité, authentification</td>
                    <td className={styles.tableCell}>Session</td>
                    <td className={styles.tableCell}>Obligatoires</td>
                  </tr>
                  <tr>
                    <td className={styles.tableCell}>Cookies fonctionnels</td>
                    <td className={styles.tableCell}>Mémorisation des préférences</td>
                    <td className={styles.tableCell}>13 mois</td>
                    <td className={styles.tableCell}>Consentement</td>
                  </tr>
                  <tr>
                    <td className={styles.tableCell}>Cookies analytiques</td>
                    <td className={styles.tableCell}>Mesure d'audience anonymisée</td>
                    <td className={styles.tableCell}>13 mois</td>
                    <td className={styles.tableCell}>Consentement</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={styles.text}>
              Vous pouvez configurer vos préférences concernant les cookies à tout moment via notre 
              <span className={styles.highlight}> [lien vers le gestionnaire de cookies]</span> ou directement dans 
              les paramètres de votre navigateur. Le refus des cookies non essentiels n'affectera pas 
              votre accès au contenu principal du site.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Partage et Communication des Données</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>5.1. Communication à des Tiers</h3>
            <p className={styles.text}>
              Nous ne commercialisons, ne louons ni ne transférons vos données personnelles à des 
              tiers à des fins commerciales. Toutefois, nous pouvons être amenés à partager vos 
              données avec les catégories de destinataires suivantes :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Sous-traitants techniques</span> : 
                Prestataires d'hébergement, de maintenance, d'analyse
                <ul className={styles.nestedList}>
                  <li className={styles.nestedListItem}>Contrats incluant des clauses de protection des données</li>
                  <li className={styles.nestedListItem}>Accès strictement limité aux données nécessaires</li>
                  <li className={styles.nestedListItem}>Localisation des données dans l'Espace Économique Européen</li>
                </ul>
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Autorités judiciaires ou administratives</span> : 
                En cas d'injonction légale, de réquisition ou de procédure judiciaire
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Professionnels du droit</span> : 
                Dans le cadre de la défense de nos droits et intérêts légitimes
              </li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>5.2. Transferts Internationaux</h3>
            <p className={styles.text}>
              Dans la mesure du possible, nous veillons à ce que vos données soient traitées au sein 
              de l'Union Européenne. En cas de transfert vers un pays tiers, nous nous assurons que :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Le pays bénéficie d'une décision d'adéquation de la Commission européenne</li>
              <li className={styles.listItem}>Des clauses contractuelles types sont mises en place</li>
              <li className={styles.listItem}>Des garanties supplémentaires sont prévues si nécessaire</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Durée de Conservation des Données</h2>
          <p className={styles.text}>
            Nous conservons vos données personnelles uniquement pendant la durée nécessaire aux finalités 
            pour lesquelles elles ont été collectées, conformément aux prescriptions légales.
          </p>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.tableCell}>Type de données</th>
                  <th className={styles.tableCell}>Durée de conservation</th>
                  <th className={styles.tableCell}>Justification</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.tableCell}>Données de contact</td>
                  <td className={styles.tableCell}>3 ans après le dernier contact</td>
                  <td className={styles.tableCell}>Délai de prescription de l'action en responsabilité</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}>Données techniques</td>
                  <td className={styles.tableCell}>13 mois</td>
                  <td className={styles.tableCell}>Recommandations de la CNIL</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}>Cookies</td>
                  <td className={styles.tableCell}>13 mois maximum</td>
                  <td className={styles.tableCell}>Obligation légale</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}>Données comptables</td>
                  <td className={styles.tableCell}>10 ans</td>
                  <td className={styles.tableCell}>Obligation légale (article L123-22 du Code de commerce)</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <p className={styles.text}>
            Passé ces délais, les données sont soit anonymisées pour des études statistiques, 
            soit définitivement supprimées de nos systèmes actifs. Les sauvegardes sont purgées 
            selon un cycle défini, avec une rétention maximale de 6 mois.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Sécurité et Protection des Données</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>7.1. Mesures Techniques et Organisationnelles</h3>
            <p className={styles.text}>
              Nous mettons en œuvre des mesures de sécurité proportionnées aux risques présentés par le traitement, 
              conformément à l'article 32 du RGPD :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Chiffrement</span> : 
                Transport des données en TLS 1.2+ (HTTPS), stockage chiffré des données sensibles
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Sécurité des systèmes</span> : 
                Pare-feu, détection d'intrusion, mises à jour régulières, authentification forte
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Gestion des accès</span> : 
                Principe du moindre privilège, journalisation des accès, révocation systématique
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Sauvegarde et reprise</span> : 
                Sauvegardes chiffrées et régulières, plan de reprise d'activité testé
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Sécurité physique</span> : 
                Accès contrôlé aux locaux, destruction sécurisée des supports
              </li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>7.2. Gestion des Incidents</h3>
            <p className={styles.text}>
              En cas de violation de données à caractère personnel, nous nous engageons à :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Notifier la CNIL dans les 72 heures si la violation présente un risque</li>
              <li className={styles.listItem}>Vous informer si la violation présente un risque élevé pour vos droits</li>
              <li className={styles.listItem}>Prendre immédiatement des mesures correctives</li>
              <li className={styles.listItem}>Documenter toute violation pour analyse et prévention</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Vos Droits et leur Exercice</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>8.1. Catalogue des Droits</h3>
            <p className={styles.text}>
              Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Droit d'accès (article 15 RGPD)</span> : 
                Obtenir la confirmation que des données vous concernant sont traitées et y accéder
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Droit de rectification (article 16 RGPD)</span> : 
                Faire rectifier des données inexactes ou incomplètes
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Droit à l'effacement (article 17 RGPD)</span> : 
                Faire supprimer vos données dans les cas prévus par la loi
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Droit à la limitation (article 18 RGPD)</span> : 
                Obtenir la limitation du traitement dans des situations spécifiques
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Droit à la portabilité (article 20 RGPD)</span> : 
                Recevoir vos données dans un format structuré et les transférer
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Droit d'opposition (article 21 RGPD)</span> : 
                Vous opposer à tout moment au traitement pour des motifs légitimes
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Droit de retirer votre consentement</span> : 
                À tout moment, sans affecter la licéité du traitement antérieur
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Droit de définir des directives post-mortem</span> : 
                Donner des instructions concernant le sort de vos données après votre décès
              </li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>8.2. Modalités d'Exercice</h3>
            <p className={styles.text}>
              Pour exercer vos droits, vous pouvez nous contacter par :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Courrier électronique : <span className={styles.highlight}>[adresse email dédiée]</span></li>
              <li className={styles.listItem}>Courrier postal : <span className={styles.highlight}>[adresse postale]</span></li>
              <li className={styles.listItem}>Formulaire de contact dédié : <span className={styles.highlight}>[lien vers le formulaire]</span></li>
            </ul>
            <p className={styles.text}>
              Afin de protéger vos données, nous devons vérifier votre identité. Joignez à votre demande 
              une copie d'une pièce d'identité (la partie relative aux données personnelles peut être masquée). 
              Nous nous engageons à répondre dans un délai d'un mois maximum, prolongeable de deux mois 
              en cas de demande complexe.
            </p>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>8.3. Recours</h3>
            <p className={styles.text}>
              Si vous estimez que vos droits ne sont pas respectés, vous avez le droit d'introduire 
              une réclamation auprès de l'autorité de contrôle compétente :
            </p>
            <div className={styles.definition}>
              <div className={styles.definitionTitle}>Commission Nationale de l'Informatique et des Libertés (CNIL)</div>
              <p className={styles.text}>3 Place de Fontenoy<br />
              TSA 80715<br />
              75334 PARIS CEDEX 07<br />
              Tél. : 01 53 73 22 22<br />
              Site web : <span className={styles.highlight}>www.cnil.fr</span></p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Dispositions Finales</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>9.1. Protection des Mineurs</h3>
            <p className={styles.text}>
              Notre site n'est pas destiné aux personnes de moins de 16 ans. Nous ne collectons pas 
              sciemment de données personnelles concernant des mineurs. Si vous avez moins de 16 ans, 
              vous ne devez pas nous fournir d'informations personnelles. Si nous apprenons que nous 
              avons collecté des données personnelles concernant un mineur de moins de 16 ans, nous 
              prendrons des mesures pour les supprimer.
            </p>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>9.2. Textes Applicables</h3>
            <ul className={styles.list}>
              <li className={styles.listItem}>Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (RGPD)</li>
              <li className={styles.listItem}>Loi n° 78-17 du 6 janvier 1978 modifiée relative à l'informatique, aux fichiers et aux libertés</li>
              <li className={styles.listItem}>Directive 2002/58/CE modifiée concernant le traitement des données à caractère personnel (ePrivacy)</li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>9.3. Juridiction Compétente</h3>
            <p className={styles.text}>
              La présente Politique est régie par le droit français. Tout litige relatif à son interprétation 
              ou à son exécution relève de la compétence exclusive des tribunaux français.
            </p>
            <p className={styles.legalReference}>
              Référence : Article 3 du Règlement (UE) n°1215/2012 concernant la compétence judiciaire, 
              la reconnaissance et l'exécution des décisions en matière civile et commerciale.
            </p>
          </div>
        </section>

        <div className={styles.contactSection}>
          <h3 className={styles.contactTitle}>DÉLÉGUÉ À LA PROTECTION DES DONNÉES (DPO)</h3>
          <p className={styles.contactInfo}>
            Notre Délégué à la Protection des Données est votre interlocuteur privilégié pour toute question 
            relative à la protection de vos données personnelles et à l'exercice de vos droits.<br /><br />
            
            <span className={styles.emphasis}>Contact DPO :</span><br />
            <span className={styles.highlight}>[Nom du DPO]</span><br />
            <span className={styles.highlight}>[Adresse email dédiée]</span><br />
            <span className={styles.highlight}>[Adresse postale si différente]</span><br /><br />
            
            Réponse garantie sous 30 jours ouvrés maximum.
          </p>
        </div>

        <div className={styles.footerNote}>
          <p>
            <span className={styles.emphasis}>Documentation de conformité :</span> 
            Cette Politique fait partie intégrante de notre documentation RGPD, qui comprend également :
            le registre des activités de traitement, les analyses d'impact, les accords avec les sous-traitants, 
            et les procédures de gestion des incidents.
          </p>
          <p className={styles.legalReference}>
            Document ID : POL-CONF-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}<br />
            Version : 2.0<br />
            Statut : En vigueur<br />
            Approbation : Direction / Responsable légal
          </p>
        </div>
      </main>
    </div>
  );
}