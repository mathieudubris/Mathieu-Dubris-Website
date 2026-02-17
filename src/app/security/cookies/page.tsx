/* cookies/page.tsx */
import styles from './cookies.module.css';

export default function Cookies() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>POLITIQUE DE COOKIES</h1>
        <p className={styles.lastUpdated}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Qu'est-ce qu'un cookie ?</h2>
          <p className={styles.text}>
            Un cookie est un petit fichier texte déposé sur votre ordinateur, tablette ou smartphone lors de la visite d'un site web. Les cookies sont utilisés pour collecter des informations sur votre navigation et vous offrir une expérience personnalisée. Ils ne permettent pas de vous identifier personnellement mais de reconnaître votre appareil.
          </p>
          <p className={styles.text}>
            En tant que freelance, j'utilise des cookies pour améliorer le fonctionnement de mon site <span className={styles.highlight}>mathieu-dubris.web.app</span> et comprendre comment les visiteurs interagissent avec mon portfolio, mes formations et mes services.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Types de cookies utilisés</h2>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.tableCell}>Type de cookie</th>
                  <th className={styles.tableCell}>Finalité</th>
                  <th className={styles.tableCell}>Durée</th>
                  <th className={styles.tableCell}>Base légale</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.tableCell}><span className={styles.emphasis}>Cookies essentiels</span></td>
                  <td className={styles.tableCell}>Nécessaires au fonctionnement du site : authentification, sécurité, session utilisateur</td>
                  <td className={styles.tableCell}>Session</td>
                  <td className={styles.tableCell}>Intérêt légitime</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}><span className={styles.emphasis}>Cookies fonctionnels</span></td>
                  <td className={styles.tableCell}>Mémorisation de vos préférences (langue, région, choix d'affichage)</td>
                  <td className={styles.tableCell}>13 mois</td>
                  <td className={styles.tableCell}>Consentement</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}><span className={styles.emphasis}>Cookies analytiques (Google Analytics)</span></td>
                  <td className={styles.tableCell}>Mesure d'audience anonymisée, compréhension du comportement des visiteurs, amélioration du contenu</td>
                  <td className={styles.tableCell}>13 mois</td>
                  <td className={styles.tableCell}>Consentement</td>
                </tr>
                <tr>
                  <td className={styles.tableCell}><span className={styles.emphasis}>Cookies de session Firebase</span></td>
                  <td className={styles.tableCell}>Gestion de l'authentification et des sessions utilisateur pour les formations et services</td>
                  <td className={styles.tableCell}>Session</td>
                  <td className={styles.tableCell}>Exécution du service</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Cookies détaillés</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>3.1. Cookies essentiels</h3>
            <p className={styles.text}>
              Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés. Ils permettent d'assurer la sécurité de votre navigation et l'accès aux fonctionnalités de base.
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}><span className={styles.emphasis}>__session</span> : Maintien de votre session de navigation (durée : session)</li>
              <li className={styles.listItem}><span className={styles.emphasis}>XSRF-TOKEN</span> : Protection contre les attaques CSRF (durée : session)</li>
              <li className={styles.listItem}><span className={styles.emphasis}>firebase-auth</span> : Gestion de l'authentification Firebase (durée : session)</li>
            </ul>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>3.2. Cookies fonctionnels</h3>
            <p className={styles.text}>
              Ces cookies améliorent votre expérience en mémorisant vos préférences.
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}><span className={styles.emphasis}>cookie-consent</span> : Mémorisation de votre choix de consentement aux cookies (durée : 13 mois)</li>
              <li className={styles.listItem}><span className={styles.emphasis}>theme-preference</span> : Préférence de thème (clair/sombre) (durée : 13 mois)</li>
            </ul>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>3.3. Cookies analytiques (Google Analytics)</h3>
            <p className={styles.text}>
              J'utilise Google Analytics pour comprendre comment les visiteurs interagissent avec mon site et améliorer mon contenu. Les données sont anonymisées.
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}><span className={styles.emphasis}>_ga</span> : Identifiant unique utilisé pour distinguer les utilisateurs (durée : 2 ans)</li>
              <li className={styles.listItem}><span className={styles.emphasis}>_gid</span> : Identifiant utilisé pour distinguer les utilisateurs (durée : 24 heures)</li>
              <li className={styles.listItem}><span className={styles.emphasis}>_gat</span> : Utilisé pour limiter le taux de requêtes (durée : 1 minute)</li>
            </ul>
            <p className={styles.text}>
              <span className={styles.emphasis}>Anonymisation IP :</span> J'ai activé l'option d'anonymisation IP de Google Analytics. Votre adresse IP est tronquée avant d'être envoyée aux serveurs Google.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Sous-traitants et transferts</h2>
          <p className={styles.text}>
            Les cookies utilisés sur mon site impliquent les sous-traitants suivants :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <span className={styles.emphasis}>Firebase (Google LLC)</span> : Hébergement du site, authentification, base de données
              <ul className={styles.nestedList}>
                <li className={styles.nestedListItem}>Données hébergées en Belgique (europe-west1)</li>
                <li className={styles.nestedListItem}>Google est certifié RGPD et adhère aux clauses contractuelles types</li>
              </ul>
            </li>
            <li className={styles.listItem}>
              <span className={styles.emphasis}>Google Analytics (Google LLC)</span> : Analyse d'audience
              <ul className={styles.nestedList}>
                <li className={styles.nestedListItem}>Données pouvant être transférées aux États-Unis</li>
                <li className={styles.nestedListItem}>Google s'est engagé dans le cadre du Data Privacy Framework (DPF)</li>
                <li className={styles.nestedListItem}>Anonymisation IP activée pour renforcer votre confidentialité</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Gestion de vos préférences</h2>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>5.1. Bannière de consentement</h3>
            <p className={styles.text}>
              Lors de votre première visite sur mon site, une bannière vous informe de l'utilisation des cookies et vous permet de paramétrer vos préférences. Vous pouvez à tout moment modifier vos choix en cliquant sur le lien <span className={styles.highlight}>"Gérer mes cookies"</span> en bas de page ou via le gestionnaire ci-dessous.
            </p>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>5.2. Gestionnaire de cookies</h3>
            <div className={styles.cookieManager}>
              <p className={styles.text}>
                Utilisez ce panneau pour gérer vos préférences en matière de cookies :
              </p>
              
              <div className={styles.preferenceCard}>
                <div className={styles.preferenceHeader}>
                  <span className={styles.preferenceTitle}>Cookies essentiels</span>
                  <span className={styles.preferenceStatus}>Toujours actifs</span>
                </div>
                <p className={styles.preferenceDescription}>Nécessaires au fonctionnement du site. Ne peuvent pas être désactivés.</p>
              </div>

              <div className={styles.preferenceCard}>
                <div className={styles.preferenceHeader}>
                  <span className={styles.preferenceTitle}>Cookies fonctionnels</span>
                  <label className={styles.switch}>
                    <input type="checkbox" className={styles.checkbox} defaultChecked={false} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <p className={styles.preferenceDescription}>Permettent de mémoriser vos préférences.</p>
              </div>

              <div className={styles.preferenceCard}>
                <div className={styles.preferenceHeader}>
                  <span className={styles.preferenceTitle}>Cookies analytiques (Google Analytics)</span>
                  <label className={styles.switch}>
                    <input type="checkbox" className={styles.checkbox} defaultChecked={false} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <p className={styles.preferenceDescription}>Aident à comprendre comment les visiteurs utilisent le site (données anonymisées).</p>
              </div>

              <div className={styles.buttonGroup}>
                <button className={styles.saveButton}>Enregistrer mes préférences</button>
                <button className={styles.acceptAllButton}>Tout accepter</button>
                <button className={styles.refuseAllButton}>Tout refuser</button>
              </div>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>5.3. Configuration via le navigateur</h3>
            <p className={styles.text}>
              Vous pouvez également configurer votre navigateur pour accepter ou refuser les cookies :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}><span className={styles.emphasis}>Chrome :</span> Paramètres → Confidentialité et sécurité → Cookies et autres données</li>
              <li className={styles.listItem}><span className={styles.emphasis}>Firefox :</span> Options → Vie privée et sécurité → Cookies</li>
              <li className={styles.listItem}><span className={styles.emphasis}>Safari :</span> Préférences → Confidentialité → Cookies</li>
              <li className={styles.listItem}><span className={styles.emphasis}>Edge :</span> Paramètres → Cookies et autorisations</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Conséquences du refus des cookies</h2>
          <p className={styles.text}>
            Le refus des cookies non essentiels n'affecte pas votre accès au contenu principal du site. Cependant, certaines fonctionnalités optionnelles pourraient être limitées :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Personnalisation de l'expérience (préférences non mémorisées)</li>
            <li className={styles.listItem}>Analyse statistique (je ne pourrai pas mesurer l'audience pour améliorer mon site)</li>
            <li className={styles.listItem}>Les cookies essentiels restent actifs pour garantir le fonctionnement technique</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Durée de conservation</h2>
          <p className={styles.text}>
            Conformément aux recommandations de la CNIL, les cookies non essentiels sont conservés pour une durée maximale de 13 mois. Passé ce délai, votre consentement est à nouveau requis.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Vos droits</h2>
          <p className={styles.text}>
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et d'effacement de vos données. Pour exercer ces droits concernant les cookies, vous pouvez :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Utiliser le gestionnaire de cookies ci-dessus</li>
            <li className={styles.listItem}>Configurer votre navigateur</li>
            <li className={styles.listItem}>Me contacter directement</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Contact</h2>
          <p className={styles.text}>
            Pour toute question concernant ma politique de cookies ou l'exercice de vos droits, vous pouvez me contacter :
          </p>
          <div className={styles.contactCard}>
            <p className={styles.text}>
              <span className={styles.emphasis}>Miarintsoa Fanampy Nirinah</span><br />
              Email : <span className={styles.highlight}>mathieudubris@gmail.com</span><br />
              Téléphone : <span className={styles.highlight}>034 25 269 58</span><br />
              Site : <span className={styles.highlight}>mathieu-dubris.web.app</span><br />
              Formulaire : <span className={styles.highlight}>mathieu-dubris.web.app/contact</span><br />
              Adresse : <span className={styles.highlight}>Ankerana, Antananarivo, Madagascar</span>
            </p>
          </div>
        </section>

        <div className={styles.footerNote}>
          <p>
            <span className={styles.emphasis}>Document mis à jour le :</span> {new Date().toLocaleDateString('fr-FR')}
          </p>
          <p className={styles.small}>
            Cette politique de cookies fait partie intégrante de ma Politique de Confidentialité et de mes Conditions Générales d'Utilisation.
          </p>
        </div>
      </main>
    </div>
  );
}