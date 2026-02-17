/* terms-of-service/page.tsx */
import styles from './terms-of-service.module.css';

export default function Conditions() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Conditions Générales d'Utilisation</h1>
        <p className={styles.lastUpdated}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Préambule</h2>
          <p className={styles.text}>
            Les présentes Conditions Générales d'Utilisation (ci-après désignées "CGU") constituent un contrat entre <span className={styles.emphasis}>Miarintsoa Fanampy Nirinah</span>, entrepreneur individuel (ci-après désigné "je", "mon", "mes"), propriétaire et exploitant du site portfolio <span className={styles.highlight}>mathieu-dubris.web.app</span> (ci-après désigné "le Site"), et toute personne physique (ci-après désignée "l'Utilisateur") accédant ou utilisant le Site. En accédant, naviguant ou utilisant de quelque manière que ce soit le Site, l'Utilisateur reconnaît avoir lu, compris et accepté sans réserve l'intégralité des dispositions des présentes CGU. Si l'Utilisateur n'accepte pas ces conditions dans leur totalité, il doit immédiatement cesser toute utilisation du Site.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Définitions</h2>
          <p className={styles.text}>
            Aux fins des présentes CGU, les termes suivants auront la signification ci-après :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}><span className={styles.emphasis}>Site :</span> Désigne l'ensemble des pages web, contenus, fonctionnalités et services accessibles via l'adresse mathieu-dubris.web.app, y compris toutes ses sous-pages.</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Utilisateur :</span> Toute personne physique qui accède au Site, le consulte, l'utilise ou interagit avec ses fonctionnalités.</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Contenu :</span> Ensemble des éléments présents sur le Site, incluant textes, images, photographies, graphismes, logos, sons, vidéos, code source, portfolio, formations, etc.</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Services :</span> Désigne l'ensemble des fonctionnalités offertes par le Site, notamment la présentation du portfolio, la diffusion d'informations professionnelles, la vente de formations, les services de freelancing, le gestionnaire de projet, et le formulaire de contact.</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Propriétaire/Éditeur :</span> Miarintsoa Fanampy Nirinah, entrepreneur individuel, domicilié à Ankerana, Antananarivo, Madagascar.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Objet du Site</h2>
          <p className={styles.text}>
            Le Site a pour objet de présenter mon activité professionnelle complète en tant que freelance. Il constitue à la fois :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}><span className={styles.emphasis}>Un portfolio</span> présentant mes compétences, mon expertise et mes réalisations passées</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Une plateforme de services de freelancing</span> (développement web, conception digitale, etc.)</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Un gestionnaire de projet</span> pour le suivi des collaborations avec mes clients</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Une boutique de formations</span> professionnelles en ligne</li>
            <li className={styles.listItem}><span className={styles.emphasis}>Un guide</span> et une ressource pour les professionnels</li>
          </ul>
          <p className={styles.text}>
            Le Site facilite également l'établissement de contacts professionnels via le formulaire disponible à la page <span className={styles.highlight}>/contact</span>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Acceptation et modification des CGU</h2>
          <p className={styles.text}>
            L'accès et l'utilisation du Site sont soumis au respect intégral des présentes CGU. L'Utilisateur est réputé avoir accepté les CGU au moment même où il accède au Site.
          </p>
          <p className={styles.text}>
            Je me réserve le droit exclusif de modifier, à tout moment et sans préavis, tout ou partie des stipulations des présentes CGU afin de les adapter aux évolutions du Site, des technologies légales ou réglementaires. Les modifications entrent en vigueur dès leur publication en ligne. L'Utilisateur est invité à consulter régulièrement cette page.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Accès au Site et responsabilités de l'Utilisateur</h2>
          <p className={styles.text}>
            Je mets en œuvre les moyens raisonnables à ma disposition pour assurer un accès continu et sécurisé au Site. Toutefois, je ne saurais garantir que le Site sera exempt d'interruptions, de pannes, d'erreurs techniques, de retard, ou de problèmes liés aux réseaux de télécommunication.
          </p>
          <p className={styles.text}>
            L'Utilisateur s'engage à :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Utiliser le Site de manière loyale, conforme à sa destination professionnelle et dans le respect des lois et règlements en vigueur</li>
            <li className={styles.listItem}>Ne pas utiliser le Site à des fins illicites, frauduleuses, nuisibles, diffamatoires ou obscènes</li>
            <li className={styles.listItem}>Ne pas tenter de contourner les mesures de sécurité du Site</li>
            <li className={styles.listItem}>Fournir des informations exactes et sincères lors de l'utilisation du formulaire de contact</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Propriété intellectuelle</h2>
          <h3 className={styles.subsectionTitle}>5.1 Droits du Propriétaire</h3>
          <p className={styles.text}>
            Le Site, dans son ensemble, ainsi que chacun des éléments le composant (notamment textes, images, photographies, graphismes, logos, formations, code source, etc.) sont ma propriété exclusive et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.
          </p>
          <p className={styles.text}>
            Toute représentation, reproduction, traduction, adaptation ou exploitation, partielle ou intégrale, par quelque procédé que ce soit, sans mon autorisation expresse, préalable et écrite, est strictement interdite et constituerait une contrefaçon.
          </p>
          
          <h3 className={styles.subsectionTitle}>5.2 Formations et contenu payant</h3>
          <p className={styles.text}>
            Les formations achetées sur le Site sont pour un usage personnel uniquement. Il est interdit de les partager, revendre, redistribuer ou modifier sans autorisation écrite.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Services de freelancing et gestion de projet</h2>
          <p className={styles.text}>
            Les services de freelancing proposés sur le Site (développement, conception, etc.) font l'objet de devis personnalisés et de contrats spécifiques établis avec chaque client. Les présentes CGU ne constituent pas un contrat de prestation de services. Les modalités détaillées (délais, livrables, prix, etc.) sont définies dans le contrat de projet signé entre les parties.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Vente de formations</h2>
          <p className={styles.text}>
            Les formations proposées à la vente sur le Site sont des produits numériques. Lors de l'achat d'une formation, l'Utilisateur accepte les conditions suivantes :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Le prix est indiqué en euros, toutes taxes comprises (je ne suis pas assujetti à la TVA en tant que micro-entrepreneur)</li>
            <li className={styles.listItem}>L'accès à la formation est personnel et non transférable</li>
            <li className={styles.listItem}>En raison de la nature numérique des produits, aucun remboursement n'est possible après l'accès au contenu, sauf dispositions légales contraires</li>
            <li className={styles.listItem}>Les formations sont accessibles via la plateforme Firebase après paiement</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Limitation de responsabilité</h2>
          <p className={styles.text}>
            Les informations et documents présents sur le Site sont fournis à titre indicatif et professionnel. Bien que je m'efforce de diffuser des informations exactes et à jour, je ne peux en garantir l'exhaustivité, l'exactitude, la fiabilité ou l'adéquation à un usage particulier. L'Utilisateur reconnaît utiliser ces informations sous sa seule et entière responsabilité.
          </p>
          <p className={styles.text}>
            Je ne saurais être tenu responsable, dans les limites autorisées par la loi, des dommages de quelque nature que ce soit, directs ou indirects, résultant de :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>L'accès ou l'impossibilité d'accéder au Site</li>
            <li className={styles.listItem}>L'utilisation du Site, y compris toute défaillance, interruption, bug, erreur, omission, suppression de données</li>
            <li className={styles.listItem}>Le contenu de sites tiers accessibles via des liens hypertextes</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Données personnelles</h2>
          <p className={styles.text}>
            La collecte et le traitement des données personnelles des Utilisateurs sont régis par ma <span className={styles.emphasis}>Politique de Confidentialité</span> et ma <span className={styles.emphasis}>Politique de Cookies</span>, qui constituent des parties intégrantes des présentes CGU. En utilisant le Site, l'Utilisateur consent expressément au traitement de ses données personnelles dans les conditions décrites.
          </p>
          <p className={styles.text}>
            Les informations collectées via le formulaire de contact (nom, prénom, email, téléphone, message libre) ainsi que les informations personnelles optionnelles (photo de profil, réseaux sociaux, âge, localisation) sont utilisées uniquement à des fins statistiques ou contractuelles (projets avec des clients).
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Contact</h2>
          <p className={styles.text}>
            Pour toute question, réclamation ou demande d'information concernant les présentes Conditions Générales d'Utilisation, l'Utilisateur peut me contacter :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Par le formulaire de contact : <span className={styles.highlight}>mathieu-dubris.web.app/contact</span></li>
            <li className={styles.listItem}>Par courrier électronique : <span className={styles.highlight}>mathieudubris@gmail.com</span></li>
            <li className={styles.listItem}>Par téléphone : <span className={styles.highlight}>034 25 269 58</span></li>
            <li className={styles.listItem}>Par courrier postal : <span className={styles.highlight}>Ankerana, Antananarivo, Madagascar</span></li>
          </ul>
          <p className={styles.text}>
            Je m'engage à répondre dans un délai raisonnable.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Droit applicable</h2>
          <p className={styles.text}>
            Les présentes CGU sont régies, interprétées et appliquées conformément au droit français, sans égard aux principes de conflits de lois. En cas de litige relatif à la validité, l'interprétation, l'exécution ou la rupture des présentes CGU, et à défaut de résolution amiable, les tribunaux compétents seront ceux du ressort de Antananarivo, Madagascar.
          </p>
        </section>

        <div className={styles.footerSection}>
          <div className={styles.contactBox}>
            <h3 className={styles.contactBoxTitle}>Miarintsoa Fanampy Nirinah</h3>
            <p className={styles.text}>
              Email : mathieudubris@gmail.com<br />
              Téléphone : 034 25 269 58<br />
              Site : mathieu-dubris.web.app<br />
              Adresse : Ankerana, Antananarivo, Madagascar
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}