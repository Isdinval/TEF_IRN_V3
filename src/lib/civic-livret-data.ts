// Contenu du "Livret du citoyen" (Ministère de l'Intérieur, édition mai 2026), reformulé et
// condensé pour une lecture fluide en ligne. Source officielle et PDF téléchargeable :
// https://www.immigration.interieur.gouv.fr/documentation/guides-textes-et-brochures/livret-du-citoyen.html
//
// Contenu quasi-statique (mise à jour officielle 1-2x/an) : pas de table Supabase, juste ce
// fichier. Si un besoin d'édition sans déploiement apparaît un jour, on migrera vers Supabase
// à ce moment-là — pas avant (cf. décision produit du 28/07/2026).

export type LivretIcon =
  | "flag" | "scale" | "landmark" | "vote" | "map-pin" | "globe" | "shield-check"
  | "gavel" | "book-open-check" | "scroll-text" | "user-check" | "history"
  | "users" | "mountain" | "palette" | "home" | "bike" | "heart-pulse"
  | "briefcase" | "heart-handshake" | "file-text" | "sparkles";

export type LivretBlock =
  | { type: "lead"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "quote"; text: string; source?: string }
  | { type: "image"; src: string; alt: string; caption?: string };

export interface LivretPage {
  id: string;
  part: number; // 0 = avant-propos, 1-5 = parties du livret, 6 = annexes
  partTitle: string;
  title: string;
  icon: LivretIcon;
  blocks: LivretBlock[];
}

export const LIVRET_PARTS = [
  { index: 0, title: "Avant-propos" },
  { index: 1, title: "Principes et valeurs de la République" },
  { index: 2, title: "Système institutionnel et politique" },
  { index: 3, title: "Droits et devoirs des citoyens" },
  { index: 4, title: "Histoire, géographie et culture" },
  { index: 5, title: "Vivre dans la société française" },
  { index: 6, title: "Annexes" },
] as const;

export const LIVRET_PAGES: LivretPage[] = [
  // ───────────────────────── AVANT-PROPOS ─────────────────────────
  {
    id: "avant-propos",
    part: 0,
    partTitle: "Avant-propos",
    title: "Pourquoi ce livret ?",
    icon: "flag",
    blocks: [
      {
        type: "lead",
        text: "Demander la nationalité française, c'est manifester sa volonté de rejoindre la communauté nationale, d'en respecter les valeurs et de l'enrichir.",
      },
      {
        type: "paragraph",
        text: "L'assimilation à la communauté française suppose une maîtrise du français correspondant au niveau **B2** (oral et écrit) du cadre européen commun de référence, une connaissance suffisante de l'histoire, de la culture et de la société françaises, ainsi qu'une adhésion aux principes et valeurs de la République.",
      },
      {
        type: "paragraph",
        text: "Le dossier de naturalisation comprend un examen civique portant sur ces connaissances. S'il est recevable, un entretien en préfecture, sous-préfecture ou consulat permet ensuite d'évaluer le degré d'assimilation du candidat, notamment sa connaissance des droits et devoirs du citoyen et son adhésion aux principes républicains dans la vie quotidienne.",
      },
      {
        type: "callout",
        text: "Ce livret n'est pas exhaustif : il donne le niveau de connaissances attendu de tout candidat à la naturalisation, à étudier avant l'examen civique et l'entretien.",
      },
    ],
  },

  // ───────────────────────── PARTIE 1 ─────────────────────────
  {
    id: "devise-symboles",
    part: 1,
    partTitle: "Principes et valeurs de la République",
    title: "La devise et les symboles de la République",
    icon: "flag",
    blocks: [
      {
        type: "lead",
        text: "**« Liberté, égalité, fraternité »** : la devise de la France, inscrite sur le fronton des bâtiments publics, résume les valeurs fondatrices de la République.",
      },
      { type: "subheading", text: "Liberté" },
      {
        type: "paragraph",
        text: "Chacun est libre de ses choix, de ses opinions et de sa manière de vivre. Ce principe, posé par la Déclaration des droits de l'homme et du citoyen (DDHC) de 1789, se limite à ce qui ne nuit pas à autrui : les libertés sont les mêmes pour tous, dans le respect des lois.",
      },
      { type: "subheading", text: "Égalité" },
      {
        type: "paragraph",
        text: "Tous les citoyens ont les mêmes droits quels que soient leur sexe, leur origine, leur religion, leurs opinions ou leur orientation sexuelle. L'égalité entre femmes et hommes s'applique dans tous les domaines (travail, santé, éducation…). Les discriminations — sexisme, racisme, antisémitisme, discrimination religieuse ou anti-LGBT+ — sont interdites et punies par la loi.",
      },
      { type: "subheading", text: "Fraternité" },
      {
        type: "paragraph",
        text: "La fraternité républicaine repose sur la volonté de vivre ensemble, au-delà des différences. Elle se traduit par une solidarité collective (Sécurité sociale, impôts finançant les services publics) et intergénérationnelle (cotisations retraite), et contribue à réduire les inégalités.",
      },
      { type: "subheading", text: "Les symboles de la France" },
      {
        type: "list",
        items: [
          "La fête nationale, le 14 juillet, commémore la prise de la Bastille (1789) et la fête de la Fédération (1790).",
          "L'hymne national, La Marseillaise, a été écrit par Rouget de Lisle en 1792.",
          "La langue officielle de la République est le français.",
          "Marianne, femme au bonnet phrygien, incarne la République sur les documents officiels et dans les mairies.",
          "Le drapeau tricolore (bleu, blanc, rouge) est le drapeau officiel depuis 1794.",
          "Le coq, sans statut constitutionnel, est un symbole national reconnu depuis l'Antiquité.",
        ],
      },
    ],
  },
  {
    id: "principes-republique",
    part: 1,
    partTitle: "Principes et valeurs de la République",
    title: "Les principes de la République",
    icon: "scale",
    blocks: [
      {
        type: "lead",
        text: "L'article 1er de la Constitution du 4 octobre 1958 dispose que « la France est une **République indivisible, laïque, démocratique et sociale** ».",
      },
      { type: "subheading", text: "Une République indivisible" },
      {
        type: "paragraph",
        text: "Aucun individu ni groupe ne peut décider à la place de l'ensemble des Français. Tous, en métropole comme en outre-mer, sont soumis aux mêmes lois et ont les mêmes droits et devoirs — c'est l'unité de la République, qui n'a qu'une seule langue officielle.",
      },
      { type: "subheading", text: "Une République laïque" },
      {
        type: "paragraph",
        text: "La laïcité garantit à chacun la liberté de croire ou de ne pas croire, de changer de religion, et de pratiquer son culte dans le respect de l'ordre public. Elle impose la neutralité de l'État : celui-ci ne finance ni ne soutient aucune organisation religieuse (loi de 1905), sauf exceptions historiques (Alsace-Moselle).",
      },
      {
        type: "list",
        items: [
          "Prosélytisme : convaincre autrui d'adopter une religion est autorisé, tant qu'aucune violence ou pression n'est exercée ; il est interdit dans les services publics.",
          "Blasphème : critiquer ou se moquer d'une religion n'est pas un délit en France — c'est la liberté d'expression. Seuls la diffamation, l'incitation à la haine ou à la violence et le négationnisme sont sanctionnés.",
          "Espace public : chacun peut porter des signes religieux et exprimer ses convictions, dans le respect de l'ordre public (la loi du 11 octobre 2010 interdit la dissimulation du visage).",
          "Services publics : les agents publics (fonctionnaires) doivent rester neutres et ne peuvent porter de signes religieux au travail ; les usagers, eux, le peuvent.",
          "Salariés du privé : ils peuvent exprimer leurs convictions religieuses, sauf limites justifiées par la sécurité ou le bon fonctionnement de l'entreprise.",
          "École publique : la loi du 15 mars 2004 interdit les signes religieux ostensibles pour les élèves ; les signes discrets sont autorisés.",
        ],
      },
      { type: "subheading", text: "Une République démocratique et sociale" },
      {
        type: "paragraph",
        text: "La souveraineté appartient au peuple, qui l'exerce par ses représentants élus ou par référendum (article 3 de la Constitution). Le caractère social de la République découle du principe d'égalité : l'État favorise l'égalité des chances via l'éducation gratuite, le logement social, l'aide à l'emploi et la Sécurité sociale.",
      },
    ],
  },

  // ───────────────────────── PARTIE 2 ─────────────────────────
  {
    id: "democratie-etat-de-droit",
    part: 2,
    partTitle: "Système institutionnel et politique",
    title: "Démocratie et État de droit",
    icon: "landmark",
    blocks: [
      {
        type: "lead",
        text: "La France est un État de droit : la loi s'impose à tous, y compris à l'État lui-même. La Constitution de la Vᵉ République (1958) organise la séparation de trois pouvoirs.",
      },
      {
        type: "list",
        items: [
          "Le Président de la République, chef de l'État et des armées, est élu pour cinq ans au suffrage universel direct (renouvelable une fois). Il nomme le Gouvernement sur proposition du Premier ministre.",
          "Le Parlement (Assemblée nationale : 577 députés élus pour 5 ans ; Sénat : 348 sénateurs élus pour 6 ans) vote les lois et contrôle le Gouvernement.",
          "La justice, rendue par des juges indépendants, règle les litiges et sanctionne les infractions.",
          "Le Conseil constitutionnel veille à la conformité des lois avec la Constitution et contrôle la régularité des élections nationales.",
        ],
      },
      { type: "subheading", text: "Le droit de vote" },
      {
        type: "paragraph",
        text: "Le suffrage universel a été instauré en 1848 (hommes), puis étendu aux femmes en 1944 (premier vote en 1945). Pour voter, il faut être français (ou ressortissant de l'UE pour les élections municipales/européennes), majeur, inscrit sur les listes électorales et ne pas avoir été privé de ses droits civiques. Le vote est personnel et secret.",
      },
    ],
  },
  {
    id: "organisation-territoriale",
    part: 2,
    partTitle: "Système institutionnel et politique",
    title: "L'organisation territoriale de la République",
    icon: "map-pin",
    blocks: [
      {
        type: "paragraph",
        text: "Dans le cadre de la décentralisation, l'État transfère des compétences à des collectivités territoriales : communes, départements, régions, et collectivités d'outre-mer. Il y est représenté par les préfets.",
      },
      {
        type: "list",
        items: [
          "Communes (34 875) : gérées par un maire et un conseil municipal élus pour **6 ans** ; compétentes pour les écoles primaires, l'état civil, les activités locales.",
          "Départements (101, dont 5 en outre-mer) : conseils départementaux, compétents pour les collèges, l'action sociale, les routes départementales.",
          "Régions (18 : 13 en métropole, 5 en outre-mer) : conseils régionaux, compétents pour les transports, la formation professionnelle, les lycées.",
          "Outre-mer : 12 territoires — 5 sont à la fois départements et régions (Guadeloupe, Martinique, Mayotte, Guyane, La Réunion), 7 sont des collectivités à statut particulier (Nouvelle-Calédonie, Polynésie française, Saint-Martin, Saint-Barthélemy, Saint-Pierre-et-Miquelon, TAAF, Wallis-et-Futuna).",
        ],
      },
    ],
  },
  {
    id: "union-europeenne",
    part: 2,
    partTitle: "Système institutionnel et politique",
    title: "L'Union européenne et ses institutions",
    icon: "globe",
    blocks: [
      {
        type: "paragraph",
        text: "La France est l'un des six pays fondateurs de la construction européenne (traité de Rome, 1957). Le traité de Maastricht (1992) crée l'Union européenne, qui compte aujourd'hui 27 États membres partageant des principes démocratiques.",
      },
      {
        type: "paragraph",
        text: "Depuis 1992, les citoyens français sont aussi citoyens européens : ils élisent les députés du Parlement européen (Strasbourg) et peuvent circuler, travailler et s'installer librement dans l'Union. L'euro, monnaie unique, est en circulation depuis le 1er janvier 2002.",
      },
      {
        type: "callout",
        text: "La devise de l'Union européenne est « Unie dans la diversité » ; son hymne est l'Ode à la joie (9ᵉ symphonie de Beethoven).",
      },
    ],
  },

  // ───────────────────────── PARTIE 3 ─────────────────────────
  {
    id: "droits-fondamentaux",
    part: 3,
    partTitle: "Droits et devoirs des citoyens",
    title: "Les droits fondamentaux",
    icon: "shield-check",
    blocks: [
      {
        type: "paragraph",
        text: "Les droits fondamentaux sont garantis par la Constitution, la DDHC de 1789, le préambule de la Constitution de 1946, la Charte de l'environnement de 2004 et les textes internationaux ratifiés par la France (dont la CEDH).",
      },
      { type: "subheading", text: "Liberté individuelle" },
      {
        type: "list",
        items: [
          "Liberté de choix, de pensée, de conscience et de religion.",
          "Liberté d'expression, dans les limites fixées par la loi (pas d'appel à la violence ni de discours de haine).",
          "Liberté de la presse.",
          "Liberté d'aller et venir, avec des exceptions (détention, contrôle des frontières pour les étrangers hors UE, crise exceptionnelle).",
        ],
      },
      { type: "subheading", text: "Dignité et disposition de son corps" },
      {
        type: "paragraph",
        text: "Le droit au respect de la vie privée et à l'image protège l'intimité de chacun. Le droit à la dignité interdit la torture, l'esclavage et le travail forcé. Chacun est libre de ses choix médicaux : contraception, IVG (garantie par la Constitution depuis mars 2024), PMA ouverte à toutes les femmes depuis 2021.",
      },
    ],
  },
  {
    id: "surete-justice-droits-politiques",
    part: 3,
    partTitle: "Droits et devoirs des citoyens",
    title: "Sûreté, justice et droits politiques",
    icon: "gavel",
    blocks: [
      {
        type: "paragraph",
        text: "Le droit à la sûreté protège contre toute arrestation ou détention arbitraire. Le droit à la justice garantit un procès équitable, la présomption d'innocence et l'assistance d'un avocat. L'aide juridictionnelle et le Défenseur des droits facilitent l'accès à la justice.",
      },
      {
        type: "list",
        items: [
          "Droit de vote et de se porter candidat aux élections.",
          "Liberté de réunion et liberté de manifester (déclaration préalable requise).",
          "Liberté d'association (loi de 1901).",
          "Droit à un environnement équilibré (Charte de l'environnement, 2004).",
        ],
      },
      {
        type: "callout",
        text: "Les infractions se répartissent en trois catégories croissantes de gravité : contraventions (tribunal de police), délits (tribunal correctionnel), crimes (cour d'assises).",
      },
    ],
  },
  {
    id: "devoirs-citoyens",
    part: 3,
    partTitle: "Droits et devoirs des citoyens",
    title: "Les obligations et devoirs des citoyens",
    icon: "book-open-check",
    blocks: [
      {
        type: "lead",
        text: "Les droits fondamentaux s'accompagnent de devoirs qui garantissent la cohésion sociale et le bon fonctionnement de la démocratie.",
      },
      {
        type: "list",
        items: [
          "Respecter les lois, les institutions et les décisions de justice.",
          "Respecter les principes et valeurs de la République (liberté, égalité, fraternité, laïcité).",
          "Participer à la vie démocratique : le vote n'est pas obligatoire, mais reste un devoir civique important ; les résultats électoraux s'imposent à tous.",
          "Contribuer aux charges publiques : déclarer ses revenus et payer ses impôts (**article 13** de la DDHC).",
          "Défendre la patrie : recensement à 16 ans, Journée Défense et Citoyenneté, service militaire volontaire de **8 mois** depuis 2026.",
          "Protéger l'environnement (Charte de 2004).",
          "Transmettre les valeurs républicaines à ses enfants et respecter la scolarité obligatoire (**3-16 ans**).",
          "Porter assistance à personne en danger — la non-assistance est un délit.",
        ],
      },
    ],
  },

  // ───────────────────────── PARTIE 4 ─────────────────────────
  {
    id: "histoire-periodes-1",
    part: 4,
    partTitle: "Histoire, géographie et culture",
    title: "Les grandes périodes de l'histoire (I) — du Moyen Âge à la Restauration",
    icon: "history",
    blocks: [
      {
        type: "list",
        items: [
          "Moyen Âge (Vᵉ–XVᵉ s.) : Clovis unifie les royaumes francs ; Jeanne d'Arc devient une héroïne nationale pendant la guerre de Cent Ans.",
          "Ancien Régime (1492-1789) : monarchie absolue ; Henri IV met fin aux guerres de religion (édit de Nantes, 1598) ; Louis XIV (le « Roi-Soleil ») fait construire Versailles ; les philosophes des Lumières (Voltaire, Rousseau, Montesquieu…) influencent les idéaux de liberté, égalité et fraternité.",
          "Révolution française (1789-1792) : prise de la Bastille le 14 juillet 1789, adoption de la DDHC, fin de la monarchie absolue.",
          "Première République (1792-1804) : régime de la Terreur sous Robespierre ; Napoléon Bonaparte prend le pouvoir en 1799.",
          "Premier Empire (1804-1815) : Napoléon Ier crée le Code civil, la Banque de France, les préfets ; il rétablit l'esclavage (1802) puis abolit la traite des Noirs (1815).",
          "Restauration et Monarchie de Juillet (1815-1848) : retour de la monarchie, puis assouplissement sous Louis-Philippe.",
        ],
      },
    ],
  },
  {
    id: "histoire-periodes-2",
    part: 4,
    partTitle: "Histoire, géographie et culture",
    title: "Les grandes périodes de l'histoire (II) — de la IIᵉ République à la Vᵉ République",
    icon: "history",
    blocks: [
      {
        type: "list",
        items: [
          "IIᵉ République (1848-1852) : abolition de l'esclavage (1848, décret rédigé par Victor Schoelcher) — reconnue crime contre l'humanité par la loi Taubira de 2001.",
          "Second Empire (1852-1870) : Napoléon III ; modernisation économique, ouverture à l'Europe.",
          "IIIᵉ République (1870-1940) : école publique gratuite et laïque (lois Jules Ferry) ; grandes lois de liberté (presse 1881, syndicats 1884, association 1901, laïcité 1905) ; Première Guerre mondiale (1914-1918).",
          "Régime de Vichy et Résistance (1940-1944) : collaboration du régime de Vichy avec l'Allemagne nazie ; Résistance unifiée par Jean Moulin sous l'autorité du Général de Gaulle ; Libération à partir du débarquement du 6 juin 1944.",
          "IVᵉ République (1946-1958) : instabilité gouvernementale liée à la prépondérance du Parlement.",
          "Vᵉ République (1958-…) : Constitution adoptée par référendum le 28 septembre 1958 ; Charles de Gaulle en est le premier président. Étapes marquantes : décolonisation, Mai 1968, majorité à 18 ans (1974), dépénalisation de l'avortement (loi Veil, 1975), abolition de la peine de mort (1981), mariage pour tous (2013).",
        ],
      },
    ],
  },
  {
    id: "personnages-historiques",
    part: 4,
    partTitle: "Histoire, géographie et culture",
    title: "Personnages historiques et personnalités naturalisées",
    icon: "users",
    blocks: [
      {
        type: "paragraph",
        text: "Les 8 présidents de la Vᵉ République se sont succédé depuis 1959 : Charles de Gaulle, Georges Pompidou, Valéry Giscard d'Estaing, François Mitterrand, Jacques Chirac, Nicolas Sarkozy, François Hollande et Emmanuel Macron.",
      },
      {
        type: "paragraph",
        text: "De nombreuses personnalités naturalisées ont contribué au rayonnement de la France : parmi elles, Marie Curie (physicienne, prix Nobel), Léon Gambetta (père de la IIIᵉ République), Joséphine Baker (chanteuse et résistante), Marguerite Yourcenar (première femme à l'Académie française), Romain Gary (seul double lauréat du prix Goncourt) ou encore Simone Veil — sans être exhaustif.",
      },
    ],
  },
  {
    id: "territoire-geographie",
    part: 4,
    partTitle: "Histoire, géographie et culture",
    title: "Territoire, géographie et économie",
    icon: "mountain",
    blocks: [
      {
        type: "paragraph",
        text: "En 2025, la France compte 68,6 millions d'habitants sur 675 000 km², frontalière de 8 pays (Allemagne, Andorre, Belgique, Espagne, Italie, Luxembourg, Monaco, Suisse). Membre permanent du Conseil de sécurité de l'ONU, elle est la 7ᵉ puissance économique mondiale et la 1ʳᵉ puissance agricole de l'Union européenne.",
      },
      {
        type: "list",
        items: [
          "Chaînes de montagnes : les Alpes (Mont-Blanc, 4 810 m, point culminant d'Europe), les Pyrénées, le Massif central, le Jura, les Vosges.",
          "Fleuves : la Loire (le plus long), la Seine (Paris), la Garonne (Toulouse, Bordeaux), le Rhône (Lyon), le Rhin.",
          "Volcans actifs, notamment le Piton de la Fournaise à La Réunion.",
          "Forêts : 32 % du territoire métropolitain ; la forêt amazonienne de Guyane est la plus grande forêt française.",
          "Sites préhistoriques, dont la grotte de Lascaux (Dordogne).",
        ],
      },
    ],
  },
  {
    id: "culture-patrimoine",
    part: 4,
    partTitle: "Histoire, géographie et culture",
    title: "La culture et le patrimoine",
    icon: "palette",
    blocks: [
      {
        type: "paragraph",
        text: "La culture française se manifeste à travers le patrimoine architectural (tour Eiffel, Mont-Saint-Michel, Palais des Papes d'Avignon), les grands musées (Louvre, Orsay), la littérature et les arts (Molière, Victor Hugo, Camus, Simone de Beauvoir, Monet, Rodin…), la langue française (4ᵉ langue la plus parlée au monde) et la gastronomie — le repas gastronomique français est inscrit au patrimoine immatériel de l'UNESCO.",
      },
      {
        type: "list",
        items: [
          "Fêtes nationales : 14 juillet (fête nationale), 1er mai (fête du Travail), 21 juin (fête de la musique).",
          "Grands événements sportifs : le Tour de France, la Coupe du monde de football (victoires en 1998 et 2018), les Jeux Olympiques et Paralympiques de Paris 2024.",
        ],
      },
    ],
  },

  // ───────────────────────── PARTIE 5 ─────────────────────────
  {
    id: "vie-quotidienne",
    part: 5,
    partTitle: "Vivre dans la société française",
    title: "La vie quotidienne",
    icon: "home",
    blocks: [
      {
        type: "list",
        items: [
          "Se loger : propriété (acte notarié), location (droits et obligations du locataire et du propriétaire), logement social (HLM, sous conditions de ressources).",
          "Se déplacer : le code de la route s'impose à tous ; permis de conduire, assurance et contrôle technique obligatoires ; sanctions graduées selon la gravité des infractions.",
          "S'assurer : la responsabilité civile oblige à réparer les dommages causés à autrui (assurance habitation, véhicule, scolaire).",
          "Vivre ensemble : interdiction de fumer dans certains lieux publics depuis 2025, réglementation de l'alcool, respect de la tranquillité et de la propreté publiques.",
          "Préserver l'environnement : tri des déchets obligatoire, gestes pour limiter sa consommation d'énergie, mobilités plus écologiques.",
          "La santé : Sécurité sociale (carte Vitale), mutuelle complémentaire, confidentialité médicale.",
        ],
      },
      {
        type: "callout",
        text: "Numéros d'urgence à connaître : 15 (SAMU), 17 (police), 18 (pompiers), 112 (urgence européenne), 3919 (violences conjugales), 3018 (harcèlement scolaire), 3114 (prévention du suicide).",
      },
    ],
  },
  {
    id: "travailler-en-france",
    part: 5,
    partTitle: "Vivre dans la société française",
    title: "Travailler en France",
    icon: "briefcase",
    blocks: [
      {
        type: "paragraph",
        text: "Le droit du travail est fixé par le code du travail, les conventions collectives et le règlement intérieur. Tout salarié doit percevoir au moins le SMIC et bénéficie d'un contrat de travail (CDD, CDI, intérim). France Travail accompagne la recherche d'emploi et peut verser une allocation (ARE).",
      },
      {
        type: "paragraph",
        text: "Chacun est libre de créer son entreprise en France, sans condition de nationalité. L'accès aux emplois publics (fonction publique) est ouvert à tous sans discrimination, sous condition de nationalité française ou européenne pour certains concours, hors emplois de souveraineté.",
      },
    ],
  },
  {
    id: "vie-familiale",
    part: 5,
    partTitle: "Vivre dans la société française",
    title: "La vie familiale",
    icon: "heart-handshake",
    blocks: [
      {
        type: "list",
        items: [
          "Le mariage : civil uniquement, célébré en mairie à partir de 18 ans ; ouvert aux couples de même sexe depuis 2013 ; la polygamie est interdite.",
          "Droits des parents : congé maternité protégé, congé paternité de 28 jours, congé parental d'éducation, congé supplémentaire de naissance depuis 2026.",
          "Droits des enfants : Convention internationale des droits de l'enfant (1989) — égalité, protection, éducation, écoute.",
          "Autorité parentale : protéger, éduquer et assurer le bien-être de l'enfant, sans violence physique ni psychologique.",
          "Scolarité obligatoire de 3 à 16 ans (maternelle, élémentaire, collège, lycée).",
          "Numérique : majorité numérique fixée à 15 ans depuis 2023 pour s'inscrire seul sur les réseaux sociaux.",
        ],
      },
    ],
  },

  // ───────────────────────── ANNEXES ─────────────────────────
  {
    id: "ddhc-1789",
    part: 6,
    partTitle: "Annexes",
    title: "La Déclaration des droits de l'homme et du citoyen de 1789",
    icon: "scroll-text",
    blocks: [
      {
        type: "lead",
        text: "Texte fondateur de la République, intégré au bloc de constitutionnalité. En voici les principaux articles.",
      },
      {
        type: "quote",
        text: "Les hommes naissent et demeurent libres et égaux en droits.",
        source: "Article 1er",
      },
      {
        type: "quote",
        text: "La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui.",
        source: "Article 4",
      },
      {
        type: "quote",
        text: "Nul ne doit être inquiété pour ses opinions, même religieuses, pourvu que leur manifestation ne trouble pas l'ordre public établi par la loi.",
        source: "Article 10",
      },
      {
        type: "quote",
        text: "La libre communication des pensées et des opinions est un des droits les plus précieux de l'homme.",
        source: "Article 11",
      },
      {
        type: "quote",
        text: "Tout homme est présumé innocent jusqu'à ce qu'il ait été déclaré coupable.",
        source: "Article 9",
      },
      {
        type: "quote",
        text: "Pour l'entretien de la force publique et pour les dépenses d'administration, une contribution commune est indispensable.",
        source: "Article 13",
      },
      {
        type: "callout",
        text: "Le texte complet (17 articles) est disponible dans le PDF téléchargeable et sur conseil-constitutionnel.fr.",
      },
    ],
  },
  {
    id: "charte-citoyen",
    part: 6,
    partTitle: "Annexes",
    title: "La Charte des droits et devoirs du citoyen français",
    icon: "file-text",
    blocks: [
      {
        type: "paragraph",
        text: "Prévue par l'article 21-24 du code civil, cette charte rappelle les principes, valeurs et symboles de la République (drapeau, hymne, devise, fête nationale, Marianne, langue française) ainsi que les droits et devoirs attachés à la citoyenneté française, organisés autour des trois piliers Liberté, Égalité, Fraternité.",
      },
      {
        type: "list",
        items: [
          "Liberté : présomption d'innocence, respect de la vie privée, liberté d'expression et d'association, droit de vote et devoir civique de voter.",
          "Égalité : égalité devant la loi et entre les sexes, autorité parentale partagée, instruction obligatoire, accès à l'emploi public selon les capacités.",
          "Fraternité : concours à la défense et à la cohésion de la Nation, contribution aux dépenses publiques, protection de la santé et de la sécurité matérielle pour tous.",
        ],
      },
    ],
  },
  {
    id: "ressources",
    part: 6,
    partTitle: "Annexes",
    title: "Ressources et numéros utiles",
    icon: "sparkles",
    blocks: [
      {
        type: "list",
        items: [
          "Préambule de la Constitution de 1946 — conseil-constitutionnel.fr",
          "Constitution de la Vᵉ République — conseil-constitutionnel.fr",
          "Charte de l'environnement de 2004 — conseil-constitutionnel.fr",
          "Référentiel officiel de l'examen civique — legifrance.gouv.fr (arrêté du 10 octobre 2025)",
          "Toutes les lois — legifrance.gouv.fr",
          "Fonctionnement des institutions — vie-publique.fr",
        ],
      },
      {
        type: "callout",
        text: "Ce livret est basé sur l'édition officielle de mai 2026 du Ministère de l'Intérieur, disponible en téléchargement intégral ci-dessous.",
      },
    ],
  },
];
