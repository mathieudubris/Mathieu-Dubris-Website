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
            Les présentes Conditions Générales d'Utilisation (ci-après désignées "CGU") constituent un contrat juridiquement contraignant entre [Nom de l'entreprise ou du professionnel], propriétaire et exploitant du site portfolio (ci-après désigné "le Site"), et toute personne physique ou morale (ci-après désignée "l'Utilisateur") accédant ou utilisant le Site. En accédant, naviguant ou utilisant de quelque manière que ce soit le Site, l'Utilisateur reconnaît avoir lu, compris et accepté sans réserve l'intégralité des dispositions des présentes CGU. Si l'Utilisateur n'accepte pas ces conditions dans leur totalité, il doit immédiatement cesser toute utilisation du Site et quitter celui-ci.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Définitions</h2>
          <p className={styles.text}>
            Aux fins des présentes CGU, les termes suivants auront la signification ci-après :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Site :</strong> Désigne l'ensemble des pages web, contenus, fonctionnalités et services accessibles via l'adresse [URL du site], y compris toutes ses sous-pages, versions mobiles et adaptations.</li>
            <li className={styles.listItem}><strong>Utilisateur :</strong> Toute personne physique ou morale qui accède au Site, le consulte, l'utilise ou interagit avec ses fonctionnalités, quelle que soit la finalité de cette interaction.</li>
            <li className={styles.listItem}><strong>Contenu :</strong> Ensemble des éléments présents sur le Site, incluant, sans s'y limiter, textes, images, photographies, graphismes, logos, marques, icônes, sons, vidéos, animations, interfaces, code source, bases de données, métadonnées, ainsi que toute autre donnée ou information.</li>
            <li className={styles.listItem}><strong>Services :</strong> Désigne l'ensemble des fonctionnalités offertes par le Site, notamment la présentation du portfolio, la diffusion d'informations professionnelles, et le formulaire de contact.</li>
            <li className={styles.listItem}><strong>Propriétaire/Éditeur :</strong> [Nom complet ou raison sociale], propriétaire des droits intellectuels sur le Site et responsable de son édition et de son exploitation.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Objet du Site</h2>
          <p className={styles.text}>
            Le Site a pour objet exclusif de présenter un portfolio professionnel dans les domaines du développement web, de la conception digitale et des services associés. Il constitue une vitrine présentant les compétences, l'expertise, les réalisations passées et les services proposés par le Propriétaire. Le Site a également pour fonction de faciliter l'établissement de contacts professionnels via les moyens de communication mis à disposition. Il est précisé que le Site n'est pas une plateforme de commerce électronique et ne permet pas la conclusion de contrats en ligne.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Acceptation et modification des CGU</h2>
          <p className={styles.text}>
            L'accès et l'utilisation du Site sont soumis au respect intégral des présentes CGU. L'Utilisateur est réputé avoir accepté les CGU au moment même où il accède au Site. Cette acceptation est matérialisée par la simple action de navigation, sans nécessité de déclaration expresse.
          </p>
          <p className={styles.text}>
            Le Propriétaire se réserve le droit exclusif de modifier, à tout moment et sans préavis, tout ou partie des stipulations des présentes CGU afin de les adapter aux évolutions du Site, des technologies légales ou réglementaires, ou pour toute autre raison jugée nécessaire. Les modifications entrent en vigueur dès leur publication en ligne. L'Utilisateur est invité à consulter régulièrement cette page pour prendre connaissance des CGU applicables. La poursuite de l'utilisation du Site après publication des modifications vaut acceptation tacite et sans réserve de la nouvelle version des CGU.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Accès au Site et responsabilités de l'Utilisateur</h2>
          <p className={styles.text}>
            Le Propriétaire met en œuvre les moyens raisonnables à sa disposition pour assurer un accès continu et sécurisé au Site. Toutefois, il ne saurait garantir que le Site sera exempt d'interruptions, de pannes, d'erreurs techniques, de retard, ou de problèmes liés aux réseaux de télécommunication. L'accès au Site peut être temporairement suspendu pour des opérations de maintenance, de mise à jour ou pour toute autre raison technique, sans que cela n'ouvre droit à une quelconque indemnisation.
          </p>
          <p className={styles.text}>
            L'Utilisateur s'engage à :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Utiliser le Site de manière loyale, conforme à sa destination professionnelle et dans le respect des lois et règlements en vigueur.</li>
            <li className={styles.listItem}>Ne pas utiliser le Site à des fins illicites, frauduleuses, nuisibles, diffamatoires, obscènes, ou de quelque manière que ce soit préjudiciable.</li>
            <li className={styles.listItem}>Ne pas tenter de contourner les mesures de sécurité du Site, d'accéder à des zones non publiques, ou d'interférer avec son fonctionnement normal (notamment par déni de service, injection de code malveillant, etc.).</li>
            <li className={styles.listItem}>Ne pas collecter ou tenter de collecter des données personnelles concernant d'autres utilisateurs ou visiteurs.</li>
            <li className={styles.listItem}>Ne pas utiliser des systèmes automatisés (robots, spiders, scrapers) pour accéder au Site ou en extraire des données sans autorisation expresse et préalable.</li>
            <li className={styles.listItem}>Assurer la confidentialité de ses identifiants de connexion le cas échéant, et assumer l'entière responsabilité des activités conduites sous son compte.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Propriété intellectuelle</h2>
          <h3 className={styles.subsectionTitle}>5.1 Droits du Propriétaire</h3>
          <p className={styles.text}>
            Le Site, dans son ensemble, ainsi que chacun des éléments le composant (notamment textes, schémas, arborescences, logiciels, animations, photographies, illustrations, sons, savoir-faire, etc.) sont la propriété exclusive du Propriétaire ou de ses partenaires, et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle, notamment le droit d'auteur, le droit des marques, le droit des dessins et modèles, et le droit des bases de données.
          </p>
          <p className={styles.text}>
            La structure générale du Site, ainsi que les logiciels, textes, images animées ou non, sons, savoir-faire, dessins, graphismes et tout autre élément composant le Site, sont la propriété du Propriétaire ou font l'objet d'une licence d'utilisation. Toute représentation, reproduction, traduction, adaptation ou exploitation, partielle ou intégrale, par quelque procédé que ce soit, sur quelque support que ce soit, à quelque fin que ce soit (notamment commerciale, publicitaire ou informative), sans l'autorisation expresse, préalable et écrite du Propriétaire, est strictement interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </p>
          
          <h3 className={styles.subsectionTitle}>5.2 Marques et logos</h3>
          <p className={styles.text}>
            Les marques et logos apparaissant sur le Site sont des marques déposées par le Propriétaire ou par des tiers. Toute reproduction, imitation ou usage, total ou partiel, de ces marques ou logos, sans autorisation expresse et préalable, est prohibée aux termes des articles L.713-2 et suivants du Code de la propriété intellectuelle.
          </p>
          
          <h3 className={styles.subsectionTitle}>5.3 Contenu de l'Utilisateur</h3>
          <p className={styles.text}>
            Dans l'hypothèse où le Site permettrait à l'Utilisateur de publier du contenu (commentaires, messages via formulaire), l'Utilisateur garantit être titulaire de tous les droits intellectuels sur ce contenu ou en avoir obtenu les autorisations nécessaires. En soumettant un contenu, l'Utilisateur accorde au Propriétaire une licence non exclusive, gratuite, mondiale et perpétuelle pour utiliser, reproduire, modifier, adapter, publier, traduire et distribuer ledit contenu sur le Site et sur tout support de communication lié à l'activité du Propriétaire.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Limitation de responsabilité</h2>
          <p className={styles.text}>
            Les informations et documents présents sur le Site sont fournis à titre indicatif et professionnel. Bien que le Propriétaire s'efforce de diffuser des informations exactes et à jour, il ne peut en garantir l'exhaustivité, l'exactitude, la fiabilité ou l'adéquation à un usage particulier. L'Utilisateur reconnaît utiliser ces informations sous sa seule et entière responsabilité.
          </p>
          <p className={styles.text}>
            Le Propriétaire ne saurait être tenu responsable, dans les limites autorisées par la loi, des dommages de quelque nature que ce soit, directs ou indirects, matériels ou immatériels, résultant de :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>L'accès ou l'impossibilité d'accéder au Site.</li>
            <li className={styles.listItem}>L'utilisation du Site, y compris toute défaillance, interruption, bug, erreur, omission, suppression de données, altération de données, virus, retard dans l'opération ou la transmission.</li>
            <li className={styles.listItem}>Le contenu de sites tiers accessibles via des liens hypertextes présents sur le Site. Le Propriétaire n'exerce aucun contrôle sur ces sites externes et décline toute responsabilité quant à leur contenu, leur politique de confidentialité, leurs pratiques ou leur disponibilité. La création de liens vers des sites tiers n'implique aucune approbation de leur contenu par le Propriétaire.</li>
            <li className={styles.listItem}>Toute perte de données, perte d'exploitation, perte de chance, perte de clientèle ou atteinte à l'image de marque.</li>
            <li className={styles.listItem}>L'utilisation frauduleuse par un tiers des informations diffusées sur le Site.</li>
          </ul>
          <p className={styles.text}>
            La responsabilité du Propriétaire ne pourra en aucun cas être engagée pour un dommage résultant d'une faute, d'une négligence ou d'un usage non conforme aux présentes CGU par l'Utilisateur.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Données personnelles et confidentialité</h2>
          <p className={styles.text}>
            La collecte et le traitement des données personnelles des Utilisateurs dans le cadre de l'utilisation du Site, notamment via le formulaire de contact, sont régis par notre <strong>Politique de Confidentialité</strong>, qui constitue une partie intégrante des présentes CGU. En utilisant le Site, et particulièrement en soumettant des informations via le formulaire de contact, l'Utilisateur consent expressément au traitement de ses données personnelles dans les conditions décrites dans ladite Politique de Confidentialité.
          </p>
          <p className={styles.text}>
            L'Utilisateur garantit que les informations fournies via le formulaire de contact sont exactes, complètes et sincères. Il s'engage à ne pas transmettre de contenu illicite, menaçant, abusif, harcelant, diffamatoire, vulgaire, obscène, haineux, ou portant atteinte à la vie privée ou aux droits de propriété intellectuelle de tiers.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Liens hypertextes</h2>
          <p className={styles.text}>
            La création de liens hypertextes pointant vers la page d'accueil du Site est autorisée, sous réserve que cette création soit faite de manière loyale, non commerciale, et ne porte pas atteinte à l'image du Propriétaire. La technique du "framing" ou de l'insertion par "inline linking" est strictement interdite sans autorisation écrite préalable.
          </p>
          <p className={styles.text}>
            Comme précisé à l'article 6, le Propriétaire décline toute responsabilité concernant le contenu des sites vers lesquels des liens sont établis depuis le Site. L'accès à ces sites externes se fait aux risques et périls de l'Utilisateur.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Force majeure</h2>
          <p className={styles.text}>
            Le Propriétaire ne pourra être tenu pour responsable de l'inexécution ou du retard dans l'exécution de ses obligations au titre des présentes CGU, lorsque cette inexécution ou ce retard est dû à un cas de force majeure au sens de la jurisprudence des tribunaux français et communautaires, incluant notamment les pannes de réseau ou serveur, les interruptions du réseau électrique, les incendies, les inondations, les tremblements de terre, les conflits sociaux, les guerres, les émeutes, les actes de terrorisme, les blocages des moyens de transport ou d'approvisionnement, les pandémies, ainsi que toute intervention gouvernementale ou légale.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Durée et résiliation</h2>
          <p className={styles.text}>
            Les présentes CGU sont conclues pour une durée indéterminée à compter de leur acceptation par l'Utilisateur.
          </p>
          <p className={styles.text}>
            Le Propriétaire se réserve le droit, à sa seule discrétion et sans préavis, de :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Suspendre ou limiter l'accès au Site, notamment en cas de violation présumée ou avérée des présentes CGU par l'Utilisateur.</li>
            <li className={styles.listItem}>Supprimer tout contenu soumis par l'Utilisateur qui contreviendrait aux présentes CGU ou à la loi.</li>
            <li className={styles.listItem}>Mettre fin à l'accès de l'Utilisateur au Site, sans indemnité, en cas de manquement grave aux obligations découlant des présentes CGU.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Dispositions générales</h2>
          <h3 className={styles.subsectionTitle}>11.1 Intégralité de l'accord</h3>
          <p className={styles.text}>
            Les présentes CGU, ainsi que la Politique de Confidentialité référencée, constituent l'intégralité de l'accord entre l'Utilisateur et le Propriétaire concernant l'objet des présentes et se substituent à toutes propositions, accords, déclarations ou communications antérieures, écrites ou orales.
          </p>
          
          <h3 className={styles.subsectionTitle}>11.2 Non-renonciation</h3>
          <p className={styles.text}>
            Le fait pour le Propriétaire de ne pas se prévaloir d'un manquement par l'Utilisateur à l'une des obligations énoncées dans les présentes CGU ne saurait être interprété comme une renonciation à exiger ultérieurement l'exécution de ladite obligation.
          </p>
          
          <h3 className={styles.subsectionTitle}>11.3 Divisibilité</h3>
          <p className={styles.text}>
            Si une ou plusieurs stipulations des présentes CGU sont tenues pour non valides ou déclarées comme telles en application d'une loi, d'un règlement ou d'une décision définitive d'une juridiction compétente, les autres stipulations garderont toute leur force et leur portée.
          </p>
          
          <h3 className={styles.subsectionTitle}>11.4 Titres</h3>
          <p className={styles.text}>
            Les titres des différents articles sont insérés uniquement pour faciliter la lecture des présentes CGU. En cas de divergence entre les titres et le contenu des articles, ce dernier prévaudra.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>12. Droit applicable et règlement des litiges</h2>
          <p className={styles.text}>
            Les présentes CGU sont régies, interprétées et appliquées conformément au droit français, sans égard aux principes de conflits de lois.
          </p>
          <p className={styles.text}>
            En cas de litige relatif à la validité, l'interprétation, l'exécution ou la rupture des présentes CGU, et à défaut de résolution amiable, les tribunaux compétents seront ceux du ressort de [Ville du siège social ou domicile du Propriétaire], nonobstant la pluralité de défendeurs ou d'appel en garantie.
          </p>
          <p className={styles.text}>
            L'Utilisateur est informé qu'il peut recourir à un médiateur de la consommation en cas de litige non résolu avec le Propriétaire, conformément aux articles L.611-1 et suivants du Code de la consommation. Les coordonnées du médiateur concerné sont disponibles sur le site de la Commission d'évaluation et de contrôle de la médiation de la consommation (CECMC) ou auprès du Propriétaire sur simple demande.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>13. Contact</h2>
          <p className={styles.text}>
            Pour toute question, réclamation ou demande d'information concernant les présentes Conditions Générales d'Utilisation, l'Utilisateur peut contacter le Propriétaire :
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Par le formulaire de contact disponible sur le Site.</li>
            <li className={styles.listItem}>Par courrier électronique à l'adresse : [adresse email professionnelle]</li>
            <li className={styles.listItem}>Par courrier postal à l'adresse : [adresse postale complète]</li>
          </ul>
          <p className={styles.text}>
            Le Propriétaire s'engage à répondre dans un délai raisonnable.
          </p>
        </section>
      </main>
    </div>
  );
}