import type { CountryGuide } from './guide';

/**
 * Built-in guides for the countries where many LFK students go after the bac (besides France).
 * General steps and official links only — rules and amounts change, so each step sends to the
 * official site. Admins can edit, unpublish or delete them in Admin → Guides pays.
 */
export const WORLD_GUIDES: CountryGuide[] = [
  {
    id: 'guide-es',
    country: 'ES',
    title: 'Partir étudier en Espagne',
    intro: 'Les étapes pour s’installer en Espagne : visa (hors Union européenne), NIE, empadronamiento, santé et vie sur place.',
    published: true,
    steps: [
      {
        id: 'es-visa', phase: 'before', title: 'Visa d’études (hors Union européenne)',
        body: 'Nationalité française ou européenne : pas de visa.\nAutres nationalités : demandez un visa d’études (« visado de estudios ») au consulat d’Espagne dont vous dépendez, dès la lettre d’admission. Pièces habituelles : passeport, admission, justificatif de ressources, assurance santé privée sans franchise, certificat médical et extrait de casier judiciaire (légalisés ou apostillés, avec traduction officielle).',
        url: 'https://www.exteriores.gob.es', urlLabel: 'Ministère des Affaires étrangères (consulats)',
      },
      {
        id: 'es-docs', phase: 'before', title: 'Préparer ses documents',
        body: 'Passeport, acte de naissance, diplômes et relevés de notes, attestation du bac. Pour certaines démarches, les documents étrangers doivent être apostillés et accompagnés d’une traduction assermentée (« traducción jurada »). Gardez une copie scannée de tout.',
      },
      {
        id: 'es-sante', phase: 'before', title: 'Assurance santé',
        body: 'Étudiants européens : demandez la Carte européenne d’assurance maladie (CEAM) avant le départ.\nAutres nationalités : une assurance santé privée couvrant tout le séjour est exigée pour le visa.',
      },
      {
        id: 'es-logement', phase: 'before', title: 'Trouver un logement',
        body: 'Résidences universitaires (« residencias » et « colegios mayores »), colocations (« pisos compartidos »). Les annonces se trouvent sur les grands sites immobiliers. Demandez aux alumni installés en Espagne dans Repère.',
      },
      {
        id: 'es-padron', phase: 'arrival', title: 'S’inscrire à la mairie (empadronamiento)',
        body: 'Inscrivez-vous au registre de la mairie de votre ville avec votre contrat de location et votre passeport. Le certificat d’empadronamiento est demandé pour beaucoup d’autres démarches.',
      },
      {
        id: 'es-nie', phase: 'arrival', title: 'NIE et titre de séjour',
        body: 'Étudiants européens restant plus de 3 mois : demandez le certificat d’enregistrement de citoyen de l’UE (avec votre NIE) auprès de la police ou de l’office des étrangers, sur rendez-vous.\nAutres nationalités : demandez la carte de séjour (TIE) dans le mois qui suit l’arrivée, sur rendez-vous (« cita previa »).',
        url: 'https://sede.administracionespublicas.gob.es', urlLabel: 'Cita previa extranjería',
      },
      {
        id: 'es-banque', phase: 'arrival', title: 'Compte bancaire et carte SIM',
        body: 'Un compte espagnol facilite le loyer et les abonnements ; le NIE est souvent demandé. Une carte SIM prépayée suffit au début.',
      },
      {
        id: 'es-transport', phase: 'months', title: 'Transports',
        body: 'Les grandes villes et régions proposent des abonnements jeunes à prix réduit (« abono joven »). Renseignez-vous auprès du réseau de votre ville.',
      },
      {
        id: 'es-travail', phase: 'year', title: 'Travailler pendant les études',
        body: 'Les étudiants européens peuvent travailler librement. Avec un titre de séjour étudiant, le travail est autorisé à temps partiel, dans la limite fixée par la loi, compatible avec les études.',
      },
      {
        id: 'es-renouvellement', phase: 'year', title: 'Renouveler son titre de séjour',
        body: 'Hors Union européenne : demandez le renouvellement de votre autorisation de séjour pour études avant son expiration (en général dans les 60 jours qui précèdent).',
      },
    ],
  },
  {
    id: 'guide-ca',
    country: 'CA',
    title: 'Partir étudier au Canada',
    intro: 'Permis d’études, CAQ pour le Québec, arrivée, numéro d’assurance sociale et vie étudiante au Canada.',
    published: true,
    steps: [
      {
        id: 'ca-caq', phase: 'before', title: 'Québec : le CAQ d’abord',
        body: 'Pour étudier au Québec, demandez d’abord le Certificat d’acceptation du Québec (CAQ) au ministère de l’Immigration du Québec, avec votre lettre d’admission. Il est nécessaire avant le permis d’études fédéral.\nLes étudiants français bénéficient de frais de scolarité préférentiels au Québec : vérifiez auprès de votre université.',
        url: 'https://www.quebec.ca/education/etudier-quebec', urlLabel: 'Étudier au Québec',
      },
      {
        id: 'ca-permis', phase: 'before', title: 'Demander le permis d’études',
        body: 'Demande en ligne auprès d’Immigration Canada (IRCC) : lettre d’acceptation d’un établissement désigné, attestation de la province ou du territoire (ou le CAQ pour le Québec), preuve de ressources, passeport, puis données biométriques. Les délais peuvent être longs : commencez dès l’admission.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html', urlLabel: 'Étudier au Canada (IRCC)',
      },
      {
        id: 'ca-sante', phase: 'before', title: 'Assurance maladie',
        body: 'La couverture dépend de la province : certaines incluent les étudiants étrangers, d’autres exigent l’assurance de l’université. Au Québec, les étudiants français peuvent être couverts par la RAMQ grâce à l’entente France-Québec (formulaire à obtenir avant le départ auprès de l’Assurance maladie).',
      },
      {
        id: 'ca-logement', phase: 'before', title: 'Trouver un logement',
        body: 'Résidences universitaires (à réserver tôt), colocations, appartements. Méfiez-vous des annonces qui demandent un paiement avant toute visite. Les alumni installés au Canada peuvent vous conseiller (Repère).',
      },
      {
        id: 'ca-arrivee', phase: 'arrival', title: 'Au point d’entrée',
        body: 'À l’aéroport, l’agent des services frontaliers vous remet le permis d’études. Ayez sur vous la lettre d’introduction, la lettre d’admission, la preuve de ressources (et le CAQ pour le Québec). Vérifiez les informations du permis avant de quitter le guichet.',
      },
      {
        id: 'ca-nas', phase: 'arrival', title: 'Numéro d’assurance sociale (NAS)',
        body: 'Indispensable pour travailler et être payé. Demandez-le gratuitement auprès de Service Canada, en ligne ou sur place, avec votre permis d’études.',
        url: 'https://www.canada.ca/fr/emploi-developpement-social/services/numero-assurance-sociale.html', urlLabel: 'Service Canada — NAS',
      },
      {
        id: 'ca-banque', phase: 'arrival', title: 'Compte bancaire et téléphone',
        body: 'Les grandes banques proposent des comptes pour étudiants étrangers, souvent ouvrables dès l’arrivée avec passeport et permis d’études. Prenez un forfait mobile local.',
      },
      {
        id: 'ca-travail', phase: 'year', title: 'Travailler pendant les études',
        body: 'Le permis d’études permet en général de travailler sur le campus, et hors campus dans une limite d’heures par semaine pendant les sessions (sans limite pendant les congés). Vérifiez les conditions inscrites sur votre permis.',
      },
      {
        id: 'ca-impots', phase: 'year', title: 'Déclarer ses revenus',
        body: 'Chaque printemps, faites votre déclaration de revenus (fédérale, et provinciale au Québec), même avec peu de revenus : elle ouvre droit à certains crédits et remboursements.',
      },
      {
        id: 'ca-renouvellement', phase: 'year', title: 'Prolonger son permis',
        body: 'Demandez la prolongation du permis d’études (et du CAQ au Québec) avant sa date d’expiration si vos études continuent.',
      },
    ],
  },
  {
    id: 'guide-us',
    country: 'US',
    title: 'Partir étudier aux États-Unis',
    intro: 'Formulaire I-20, visa F-1, arrivée sur le campus et règles à respecter pendant les études aux États-Unis.',
    published: true,
    steps: [
      {
        id: 'us-i20', phase: 'before', title: 'Recevoir le formulaire I-20',
        body: 'Après l’admission, l’université vous envoie le formulaire I-20 (après preuve de vos ressources). C’est la base de toute la procédure : vérifiez nom, dates et programme.',
        url: 'https://studyinthestates.dhs.gov', urlLabel: 'Study in the States',
      },
      {
        id: 'us-sevis', phase: 'before', title: 'Payer les frais SEVIS (I-901)',
        body: 'Payez les frais SEVIS en ligne avec le numéro de votre I-20, avant l’entretien de visa. Gardez le reçu.',
        url: 'https://www.fmjfee.com', urlLabel: 'Frais SEVIS I-901',
      },
      {
        id: 'us-visa', phase: 'before', title: 'Visa étudiant F-1',
        body: 'Remplissez le formulaire DS-160, payez les frais et prenez rendez-vous à l’ambassade ou au consulat des États-Unis pour l’entretien. L’ESTA ne permet pas d’étudier : le visa F-1 est obligatoire.',
        url: 'https://travel.state.gov/content/travel/en/us-visas/study.html', urlLabel: 'Visas étudiants (Département d’État)',
      },
      {
        id: 'us-sante', phase: 'before', title: 'Assurance santé',
        body: 'Les soins sont très chers : la plupart des universités imposent leur assurance santé, ou une assurance équivalente. Vérifiez ce qui est exigé avant le départ.',
      },
      {
        id: 'us-arrivee', phase: 'arrival', title: 'Entrée et arrivée sur le campus',
        body: 'Vous pouvez entrer au plus tôt 30 jours avant le début du programme indiqué sur l’I-20. Présentez-vous ensuite au bureau international de l’université (le « DSO ») pour valider votre arrivée dans SEVIS.',
      },
      {
        id: 'us-banque', phase: 'arrival', title: 'Compte bancaire et téléphone',
        body: 'Ouvrez un compte local (passeport, I-20, adresse) et prenez un forfait mobile. Le numéro de sécurité sociale (SSN) n’est délivré que si vous avez un emploi autorisé.',
      },
      {
        id: 'us-statut', phase: 'months', title: 'Garder son statut F-1',
        body: 'Restez inscrit à temps plein, prévenez le bureau international en cas de changement d’adresse ou de programme, et faites signer votre I-20 avant chaque voyage hors des États-Unis.',
      },
      {
        id: 'us-travail', phase: 'year', title: 'Travailler pendant les études',
        body: 'Le visa F-1 autorise un emploi sur le campus, à temps partiel pendant les cours. Le travail hors campus passe par les dispositifs CPT ou OPT, avec l’accord du bureau international.',
      },
      {
        id: 'us-impots', phase: 'year', title: 'Formulaire fiscal annuel',
        body: 'Chaque année, les étudiants F-1 doivent envoyer le formulaire 8843, même sans revenus, et une déclaration de revenus s’ils ont travaillé. Le bureau international propose souvent de l’aide.',
        url: 'https://www.irs.gov', urlLabel: 'IRS',
      },
    ],
  },
  {
    id: 'guide-gb',
    country: 'GB',
    title: 'Partir étudier au Royaume-Uni',
    intro: 'Student visa, CAS, surcharge santé, inscription chez un médecin et vie étudiante au Royaume-Uni.',
    published: true,
    steps: [
      {
        id: 'gb-cas', phase: 'before', title: 'Recevoir le CAS',
        body: 'Une fois votre offre acceptée (souvent via UCAS pour une licence), l’université vous délivre un CAS (Confirmation of Acceptance for Studies), indispensable pour la demande de visa.',
        url: 'https://www.ucas.com', urlLabel: 'UCAS',
      },
      {
        id: 'gb-visa', phase: 'before', title: 'Demander le Student visa',
        body: 'Depuis le Brexit, les étudiants français et européens ont aussi besoin d’un Student visa (sauf statut EU Settlement Scheme). Demande en ligne jusqu’à 6 mois avant le début des cours : CAS, passeport, preuve de ressources et de niveau d’anglais selon les cas. Le visa est délivré sous forme électronique (eVisa) dans votre compte UKVI.',
        url: 'https://www.gov.uk/student-visa', urlLabel: 'GOV.UK — Student visa',
      },
      {
        id: 'gb-ihs', phase: 'before', title: 'Surcharge santé (IHS)',
        body: 'Lors de la demande de visa, vous payez l’Immigration Health Surcharge, qui donne accès au système de santé public (NHS) pendant vos études.',
        url: 'https://www.gov.uk/healthcare-immigration-application', urlLabel: 'GOV.UK — IHS',
      },
      {
        id: 'gb-logement', phase: 'before', title: 'Trouver un logement',
        body: 'Les résidences universitaires (« halls ») sont souvent garanties en première année si vous postulez avant la date limite. Ensuite : colocations (« flatshares »).',
      },
      {
        id: 'gb-gp', phase: 'arrival', title: 'S’inscrire chez un médecin (GP)',
        body: 'Inscrivez-vous dès l’arrivée auprès d’un cabinet de médecins généralistes (GP) proche de chez vous : c’est gratuit et nécessaire pour accéder aux soins du NHS.',
        url: 'https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/', urlLabel: 'NHS — s’inscrire chez un GP',
      },
      {
        id: 'gb-banque', phase: 'arrival', title: 'Compte bancaire et téléphone',
        body: 'Ouvrez un compte (attestation d’inscription de l’université) et prenez une carte SIM. Les banques en ligne sont souvent plus rapides.',
      },
      {
        id: 'gb-ni', phase: 'arrival', title: 'National Insurance number',
        body: 'Nécessaire si vous travaillez. La demande se fait en ligne.',
        url: 'https://www.gov.uk/apply-national-insurance-number', urlLabel: 'GOV.UK — National Insurance',
      },
      {
        id: 'gb-council', phase: 'months', title: 'Council tax et transports',
        body: 'Les étudiants à temps plein sont exonérés de la council tax : demandez l’attestation à l’université. Pensez à la carte de réduction 16-25 Railcard et aux tarifs étudiants des transports locaux.',
      },
      {
        id: 'gb-travail', phase: 'year', title: 'Travailler pendant les études',
        body: 'Le Student visa autorise en général un nombre limité d’heures de travail par semaine pendant les cours (plein temps pendant les vacances). Le nombre exact figure sur votre visa.',
      },
      {
        id: 'gb-graduate', phase: 'year', title: 'Après le diplôme',
        body: 'Le Graduate visa permet de rester travailler après le diplôme pendant une durée limitée. Les règles évoluent : vérifiez-les sur GOV.UK avant la fin de vos études.',
        url: 'https://www.gov.uk/graduate-visa', urlLabel: 'GOV.UK — Graduate visa',
      },
    ],
  },
  {
    id: 'guide-it',
    country: 'IT',
    title: 'Partir étudier en Italie',
    intro: 'Pré-inscription Universitaly, visa (hors Union européenne), codice fiscale, permis de séjour et santé en Italie.',
    published: true,
    steps: [
      {
        id: 'it-universitaly', phase: 'before', title: 'Pré-inscription sur Universitaly',
        body: 'Les étudiants hors Union européenne font leur pré-inscription sur le portail Universitaly, qui sert aussi à la demande de visa. Les Européens s’inscrivent directement auprès de l’université.',
        url: 'https://www.universitaly.it', urlLabel: 'Universitaly',
      },
      {
        id: 'it-visa', phase: 'before', title: 'Visa d’études (hors Union européenne)',
        body: 'Nationalité française ou européenne : pas de visa.\nAutres nationalités : visa pour études auprès du consulat d’Italie (admission, ressources, logement, assurance santé).',
      },
      {
        id: 'it-diplome', phase: 'before', title: 'Faire reconnaître son diplôme',
        body: 'Selon l’université, une « dichiarazione di valore » ou une attestation CIMEA de votre bac peut être demandée. Renseignez-vous tôt : les délais peuvent être longs.',
        url: 'https://www.cimea.it', urlLabel: 'CIMEA',
      },
      {
        id: 'it-codice', phase: 'before', title: 'Codice fiscale',
        body: 'Le code fiscal italien est demandé partout (logement, banque, téléphone, université). Obtenez-le au consulat avant le départ ou à l’Agenzia delle Entrate à l’arrivée.',
        url: 'https://www.agenziaentrate.gov.it', urlLabel: 'Agenzia delle Entrate',
      },
      {
        id: 'it-permesso', phase: 'arrival', title: 'Permis de séjour (hors Union européenne)',
        body: 'Dans les 8 jours ouvrables après l’arrivée, demandez le « permesso di soggiorno » pour études avec le kit disponible dans les bureaux de poste, puis rendez-vous à la Questura.\nÉtudiants européens restant plus de 3 mois : inscription à l’état civil de la commune (anagrafe).',
        url: 'https://www.portaleimmigrazione.it', urlLabel: 'Portale Immigrazione',
      },
      {
        id: 'it-sante', phase: 'arrival', title: 'Santé',
        body: 'Étudiants européens : la Carte européenne d’assurance maladie (TEAM en Italie) couvre les soins.\nAutres nationalités : inscription volontaire au service de santé national (SSN) contre une cotisation annuelle, ou assurance privée.',
      },
      {
        id: 'it-banque', phase: 'arrival', title: 'Compte bancaire et carte SIM',
        body: 'Avec le codice fiscale et une pièce d’identité, ouvrez un compte et prenez une carte SIM italienne.',
      },
      {
        id: 'it-bourses', phase: 'months', title: 'Bourses et réductions (DSU, ISEE)',
        body: 'Les organismes régionaux pour le droit aux études (DSU) proposent bourses, logements et repas à prix réduit. Pour les frais d’inscription selon les revenus, l’université demande souvent un ISEE (pour les étrangers : « ISEE parificato »).',
      },
      {
        id: 'it-travail', phase: 'year', title: 'Travailler pendant les études',
        body: 'Les étudiants européens peuvent travailler librement. Avec un permis de séjour pour études, le travail à temps partiel est autorisé dans une limite d’heures par semaine fixée par la loi.',
      },
      {
        id: 'it-renouvellement', phase: 'year', title: 'Renouveler son permis de séjour',
        body: 'Hors Union européenne : demandez le renouvellement avant l’expiration, en justifiant de la réussite d’examens selon les règles de votre université.',
      },
    ],
  },
];
