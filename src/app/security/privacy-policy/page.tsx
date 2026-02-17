/* privacy-policy/page.tsx */
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
            constitue un engagement contractuel entre <span className={styles.emphasis}>Miarintsoa Fanampy Nirinah</span>, entrepreneur individuel (ci-après "je", "mon", "mes") 
            et tout utilisateur (ci-après "vous", "votre", "utilisateur") accédant à mon site portfolio <span className={styles.highlight}>mathieu-dubris.web.app</span>. 
            Elle a pour objet de définir les principes et les pratiques en matière de collecte, de traitement, de conservation 
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
                <span className={styles.emphasis}>Responsable du traitement</span> : Miarintsoa Fanampy Nirinah, en tant qu'indépendant.
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
            Cette Politique s'applique exclusivement aux données collectées via mon site portfolio 
            <span className={styles.highlight}> mathieu-dubris.web.app</span> et ses sous-domaines. Elle ne couvre pas les 
            pratiques de sites tiers, y compris ceux vers lesquels des liens pourraient être fournis.
          </p>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>2.1. Base Légale du Traitement</h3>
            <p className={styles.text}>
              Tout traitement de vos données personnelles repose sur l'une des bases légales suivantes, 
              conformément à l'article 6 du RGPD :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Votre consentement libre, spécifique, éclairé et univoque</li>
              <li className={styles.listItem}>L'exécution d'un contrat ou de mesures précontractuelles (projets freelance, formations)</li>
              <li className={styles.listItem}>Le respect d'une obligation légale à laquelle je suis soumis</li>
              <li className={styles.listItem}>Mon intérêt légitime à gérer et développer mon activité professionnelle</li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>2.2. Modification de la Politique</h3>
            <p className={styles.text}>
              Je me réserve le droit de modifier cette Politique à tout moment pour me conformer 
              aux évolutions législatives, réglementaires ou jurisprudentielles, ou pour adapter mes pratiques. 
              La version mise à jour sera publiée sur cette page avec indication de la date de prise d'effet. 
              Je vous encourage à consulter régulièrement cette Politique.
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
                    <td className={styles.tableCell}>Nom, prénom, adresse e-mail (mathieudubris@gmail.com), téléphone (034 25 269 58)</td>
                    <td className={styles.tableCell}>Consentement / Exécution de contrat</td>
                  </tr>
                  <tr>
                    <td className={styles.tableCell}>Données de profil</td>
                    <td className={styles.tableCell}>Photo de profil, réseaux sociaux, âge, localisation (Ankerana, Antananarivo)</td>
                    <td className={styles.tableCell}>Consentement</td>
                  </tr>
                  <tr>
                    <td className={styles.tableCell}>Données techniques</td>
                    <td className={styles.tableCell}>Adresse IP, user agent, système d'exploitation</td>
                    <td className={styles.tableCell}>Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className={styles.tableCell}>Données de navigation</td>
                    <td className={styles.tableCell}>Pages consultées, durée de visite</td>
                    <td className={styles.tableCell}>Consentement</td>
                  </tr>
                  <tr>
                    <td className={styles.tableCell}>Données de communication</td>
                    <td className={styles.tableCell}>Contenu des messages, historique des échanges</td>
                    <td className={styles.tableCell}>Exécution précontractuelle/contractuelle</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>3.2. Finalités Spécifiques du Traitement</h3>
            <p className={styles.text}>
              Je traite vos données exclusivement pour les finalités déterminées, explicites et légitimes suivantes :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Gestion des demandes de contact</span> : 
                Traitement et suivi de vos sollicitations via le formulaire de contact
                <ul className={styles.nestedList}>
                  <li className={styles.nestedListItem}>Réponse personnalisée à vos demandes</li>
                  <li className={styles.nestedListItem}>Échanges concernant mes services de freelancing</li>
                  <li className={styles.nestedListItem}>Informations sur mes formations</li>
                </ul>
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Gestion de projets et relations clients</span> : 
                Pour les projets réalisés avec des clients
                <ul className={styles.nestedList}>
                  <li className={styles.nestedListItem}>Suivi des projets freelance</li>
                  <li className={styles.nestedListItem}>Facturation et gestion administrative simplifiée</li>
                  <li className={styles.nestedListItem}>Communication pendant la durée du projet</li>
                </ul>
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Statistiques et amélioration des services</span> : 
                Analyse anonymisée pour comprendre mon audience et améliorer mon offre
                <ul className={styles.nestedList}>
                  <li className={styles.nestedListItem}>Analyse des données démographiques (âge, localisation)</li>
                  <li className={styles.nestedListItem}>Compréhension des besoins des visiteurs</li>
                  <li className={styles.nestedListItem}>Optimisation de mon portfolio et de mes formations</li>
                </ul>
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Sécurité et prévention des fraudes</span> : 
                Protection de l'intégrité de mes systèmes
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Modalités de Collecte des Données</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>4.1. Collecte Directe</h3>
            <p className={styles.text}>
              Je collecte des informations que vous me fournissez volontairement lorsque vous :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Remplissez le formulaire de contact (page /contact)</li>
              <li className={styles.listItem}>M'envoyez un courrier électronique à mathieudubris@gmail.com</li>
              <li className={styles.listItem}>M'appelez au 034 25 269 58</li>
              <li className={styles.listItem}>Téléchargez une photo de profil ou fournissez des informations personnelles</li>
              <li className={styles.listItem}>Partagez vos réseaux sociaux, âge ou localisation (Ankerana, Antananarivo)</li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>4.2. Collecte Automatique</h3>
            <p className={styles.text}>
              Certaines informations sont collectées automatiquement via des technologies telles que les cookies et traceurs, détaillées dans ma <a href="/cookies" className={styles.emphasis}>Politique de Cookies</a>.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Sous-traitants et Partage des Données</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>5.1. Sous-traitants Techniques</h3>
            <p className={styles.text}>
              Pour assurer le fonctionnement de mon site et de mes services, je fais appel aux sous-traitants suivants :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Firebase (Google)</span> : Hébergement du site, base de données, authentification
                <ul className={styles.nestedList}>
                  <li className={styles.nestedListItem}>Localisation des données : Belgique (europe-west1)</li>
                  <li className={styles.nestedListItem}>Certifié RGPD, clauses contractuelles types en place</li>
                </ul>
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Google Analytics</span> : Analyse d'audience anonymisée
                <ul className={styles.nestedList}>
                  <li className={styles.nestedListItem}>Anonymisation des adresses IP activée</li>
                  <li className={styles.nestedListItem}>Données utilisées uniquement pour des statistiques</li>
                </ul>
              </li>
              <li className={styles.listItem}>
                <span className={styles.emphasis}>Google Workspace</span> : Gestion des emails (mathieudubris@gmail.com)
              </li>
            </ul>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>5.2. Communication à des Tiers</h3>
            <p className={styles.text}>
              Je ne commercialise, ne loue ni ne transfère vos données personnelles à des tiers à des fins commerciales. 
              Je ne partage vos données qu'avec mon sous-traitant Firebase/Google, dans le strict cadre technique, et éventuellement avec les autorités judiciaires en cas d'obligation légale.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Durée de Conservation des Données</h2>
          <p className={styles.text}>
            Je conserve vos données personnelles uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées :
          </p>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.tableCell}>Type de données</th>
                  <th className={styles.tableCell}>Durée de conservation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.tableCell}>Données de contact (sans suite)</td>
                  <td className={styles.tableCell}>1 an</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}>Données des clients/projets</td>
                  <td className={styles.tableCell}>3 ans après la fin du projet</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}>Données des formations</td>
                  <td className={styles.tableCell}>3 ans après l'achat</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}>Données de profil (statistiques)</td>
                  <td className={styles.tableCell}>2 ans (anonymisées ensuite)</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}>Cookies</td>
                  <td className={styles.tableCell}>13 mois maximum</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Sécurité</h2>
          <p className={styles.text}>
            Je m'engage à protéger vos données personnelles en mettant en œuvre des mesures de sécurité techniques et organisationnelles appropriées :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Chiffrement des données en transit (HTTPS)</li>
            <li className={styles.listItem}>Accès sécurisé à Firebase (règles de sécurité)</li>
            <li className={styles.listItem}>Authentification à deux facteurs sur mes comptes</li>
            <li className={styles.listItem}>Sauvegardes régulières via Firebase</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Vos Droits</h2>
          <p className={styles.text}>
            Conformément au RGPD, vous disposez des droits suivants sur vos données :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}><span className={styles.emphasis}>Droit d'accès</span> : savoir quelles données je détiens</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Droit de rectification</span> : corriger des données inexactes</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Droit à l'effacement</span> : demander la suppression de vos données</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Droit à la limitation</span> : restreindre le traitement</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Droit d'opposition</span> : vous opposer au traitement</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Droit à la portabilité</span> : récupérer vos données dans un format réutilisable</li>
          </ul>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>8.1. Comment exercer vos droits</h3>
            <p className={styles.text}>
              Pour exercer vos droits, vous pouvez me contacter directement :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Email : <span className={styles.highlight}>mathieudubris@gmail.com</span></li>
              <li className={styles.listItem}>Téléphone : <span className={styles.highlight}>034 25 269 58</span></li>
              <li className={styles.listItem}>Formulaire de contact : <span className={styles.highlight}>mathieu-dubris.web.app/contact</span></li>
              <li className={styles.listItem}>Adresse : <span className={styles.highlight}>Ankerana, Antananarivo, Madagascar</span></li>
            </ul>
            <p className={styles.text}>
              Je m'engage à répondre à votre demande dans un délai d'un mois maximum. Une pièce d'identité pourra vous être demandée pour vérification.
            </p>
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>8.2. Réclamation</h3>
            <p className={styles.text}>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL ou de l'autorité de contrôle de Madagascar.
            </p>
          </div>
        </section>

        <div className={styles.contactSection}>
          <h3 className={styles.contactTitle}>CONTACT</h3>
          <p className={styles.contactInfo}>
            <span className={styles.emphasis}>Miarintsoa Fanampy Nirinah</span><br />
            Email : mathieudubris@gmail.com<br />
            Téléphone : 034 25 269 58<br />
            Site : mathieu-dubris.web.app<br />
            Adresse : Ankerana, Antananarivo, Madagascar<br /><br />
            Pour toute question concernant vos données personnelles, je suis à votre disposition.
          </p>
        </div>

        <div className={styles.footerNote}>
          <p>
            <span className={styles.emphasis}>Document mis à jour le :</span> {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </main>
    </div>
  );
}