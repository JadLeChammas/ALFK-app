-- 056 — Guides « Partir étudier » : Allemagne, Belgique, Suisse, Pays-Bas (publiés), Liban et Égypte
-- (brouillons, visibles des seuls admins, à faire relire avant de les publier dans Admin → Guides).
-- Français et anglais. Étapes générales : chaque étape renvoie au site officiel, les règles et montants
-- changent chaque année. N'ajoute un guide que si aucun guide n'a déjà son id ou son pays (relancer
-- ce fichier ne crée pas de doublon) ; les guides existants ne sont pas touchés.

with nouveaux as (
  select g from jsonb_array_elements($guides$[
 {
  "id": "guide-de",
  "country": "DE",
  "title": "Partir étudier en Allemagne",
  "intro": "Candidature, visa (hors Union européenne), compte bloqué, assurance santé, Anmeldung et vie étudiante en Allemagne.",
  "titleEn": "Studying in Germany",
  "introEn": "Applying, visa (outside the European Union), blocked account, health insurance, Anmeldung and student life in Germany.",
  "published": true,
  "steps": [
   {
    "id": "de-candidature",
    "phase": "before",
    "title": "Candidater à l’université",
    "body": "Selon l’université, la candidature se fait directement auprès d’elle ou via uni-assist, qui vérifie les diplômes étrangers. Les dates limites sont souvent le 15 juillet pour le semestre d’hiver et le 15 janvier pour le semestre d’été : vérifiez celles de votre formation.",
    "titleEn": "Apply to the university",
    "bodyEn": "Depending on the university, you apply directly or through uni-assist, which checks foreign diplomas. Deadlines are often 15 July for the winter semester and 15 January for the summer semester: check those of your programme.",
    "url": "https://www.uni-assist.de",
    "urlLabel": "uni-assist",
    "urlLabelEn": "uni-assist"
   },
   {
    "id": "de-visa",
    "phase": "before",
    "title": "Visa d’études (hors Union européenne)",
    "body": "Nationalité française ou européenne : pas de visa.\nAutres nationalités : demandez un visa pour études à l’ambassade ou au consulat d’Allemagne dès l’admission. Il faut prouver ses ressources, le plus souvent avec un compte bloqué (Sperrkonto) dont le montant mensuel est fixé chaque année par l’Allemagne.",
    "titleEn": "Student visa (outside the European Union)",
    "bodyEn": "French or European nationality: no visa.\nOther nationalities: apply for a student visa at the German embassy or consulate as soon as you are admitted. You must prove your funds, usually with a blocked account (Sperrkonto) whose monthly amount is set each year by Germany.",
    "url": "https://www.auswaertiges-amt.de",
    "urlLabel": "Ministère fédéral des Affaires étrangères",
    "urlLabelEn": "Federal Foreign Office"
   },
   {
    "id": "de-sante",
    "phase": "before",
    "title": "Assurance maladie",
    "body": "L’assurance santé est obligatoire pour s’inscrire à l’université. Étudiants européens : la Carte européenne d’assurance maladie (CEAM) suffit souvent, avec une attestation d’exemption d’une caisse publique.\nAutres nationalités : affiliation à une caisse publique (gesetzliche Krankenversicherung), à tarif étudiant.",
    "titleEn": "Health insurance",
    "bodyEn": "Health insurance is compulsory to enrol at university. European students: the European Health Insurance Card (EHIC) is often enough, with an exemption certificate from a public insurer.\nOther nationalities: join a public insurer (gesetzliche Krankenversicherung) at the student rate."
   },
   {
    "id": "de-logement",
    "phase": "before",
    "title": "Trouver un logement",
    "body": "Résidences du Studierendenwerk (à demander très tôt) ou colocations (WG). Méfiez-vous des annonces qui demandent un paiement avant toute visite. Demandez aux alumni installés en Allemagne dans Repère.",
    "titleEn": "Find accommodation",
    "bodyEn": "Studierendenwerk residences (apply very early) or flatshares (WG). Beware of listings asking for payment before any visit. Ask the alumni living in Germany on Repère.",
    "url": "https://www.studierendenwerke.de",
    "urlLabel": "Studierendenwerke",
    "urlLabelEn": "Studierendenwerke"
   },
   {
    "id": "de-anmeldung",
    "phase": "arrival",
    "title": "Déclarer son adresse (Anmeldung)",
    "body": "Dans les deux semaines qui suivent l’emménagement, déclarez votre adresse au Bürgeramt de votre ville, avec votre passeport et l’attestation du logeur (Wohnungsgeberbestätigung). L’Anmeldung est demandée pour la banque, le titre de séjour et le numéro fiscal, envoyé ensuite par courrier.",
    "titleEn": "Register your address (Anmeldung)",
    "bodyEn": "Within two weeks of moving in, register your address at your city’s Bürgeramt, with your passport and the landlord’s certificate (Wohnungsgeberbestätigung). The Anmeldung is needed for the bank, the residence permit and the tax number, sent to you afterwards by post."
   },
   {
    "id": "de-sejour",
    "phase": "arrival",
    "title": "Titre de séjour (hors Union européenne)",
    "body": "Avant la fin de votre visa, demandez le titre de séjour pour études auprès du service des étrangers (Ausländerbehörde) de votre ville, sur rendez-vous : prenez-le dès l’arrivée, les délais peuvent être longs.",
    "titleEn": "Residence permit (outside the European Union)",
    "bodyEn": "Before your visa expires, apply for the student residence permit at your city’s foreigners’ office (Ausländerbehörde), by appointment: book it as soon as you arrive, waiting times can be long."
   },
   {
    "id": "de-banque",
    "phase": "arrival",
    "title": "Compte bancaire et téléphone",
    "body": "Un compte allemand facilite le loyer et les abonnements. Le foyer paie aussi la redevance audiovisuelle (Rundfunkbeitrag), une fois par logement : en colocation, un seul colocataire la paie.",
    "titleEn": "Bank account and phone",
    "bodyEn": "A German account makes rent and subscriptions easier. Each household also pays the broadcasting fee (Rundfunkbeitrag), once per home: in a flatshare, only one flatmate pays it.",
    "url": "https://www.rundfunkbeitrag.de",
    "urlLabel": "Rundfunkbeitrag",
    "urlLabelEn": "Rundfunkbeitrag"
   },
   {
    "id": "de-transport",
    "phase": "months",
    "title": "Transports",
    "body": "La cotisation semestrielle de l’université (Semesterbeitrag) comprend souvent un abonnement de transport (Semesterticket ou Deutschlandticket). Vérifiez ce qu’elle couvre dans votre ville.",
    "titleEn": "Transport",
    "bodyEn": "The university’s semester fee (Semesterbeitrag) often includes a transport pass (Semesterticket or Deutschlandticket). Check what it covers in your city."
   },
   {
    "id": "de-travail",
    "phase": "year",
    "title": "Travailler pendant les études",
    "body": "Les étudiants européens peuvent travailler librement. Avec un titre de séjour étudiant, le travail est limité à un nombre de jours par an fixé par la loi ; les emplois à l’université ont des règles à part.",
    "titleEn": "Working while studying",
    "bodyEn": "European students can work freely. With a student residence permit, work is limited to a number of days per year set by law; jobs at the university have their own rules.",
    "url": "https://www.make-it-in-germany.com",
    "urlLabel": "Make it in Germany",
    "urlLabelEn": "Make it in Germany"
   }
  ]
 },
 {
  "id": "guide-be",
  "country": "BE",
  "title": "Partir étudier en Belgique",
  "intro": "Inscription, visa (hors Union européenne), inscription à la commune, mutuelle, kot et job étudiant en Belgique.",
  "titleEn": "Studying in Belgium",
  "introEn": "Enrolment, visa (outside the European Union), registering with the commune, health insurance, student housing and student jobs in Belgium.",
  "published": true,
  "steps": [
   {
    "id": "be-inscription",
    "phase": "before",
    "title": "S’inscrire dans l’enseignement supérieur",
    "body": "Les inscriptions se font directement auprès de l’université ou de la haute école. Certaines filières (médecine, dentisterie) ont un examen d’entrée. Selon votre diplôme, une équivalence peut être demandée : vérifiez auprès de l’établissement.",
    "titleEn": "Enrol in higher education",
    "bodyEn": "You enrol directly with the university or college. Some programmes (medicine, dentistry) have an entrance exam. Depending on your diploma, an equivalence may be required: check with the institution.",
    "url": "https://www.equivalences.cfwb.be",
    "urlLabel": "Équivalences (Fédération Wallonie-Bruxelles)",
    "urlLabelEn": "Equivalences (Wallonia-Brussels Federation)"
   },
   {
    "id": "be-visa",
    "phase": "before",
    "title": "Visa d’études (hors Union européenne)",
    "body": "Nationalité française ou européenne : pas de visa.\nAutres nationalités : demandez un visa long séjour (type D) pour études au consulat de Belgique, avec l’attestation d’inscription, la preuve de ressources (montant fixé chaque année), un certificat médical et un extrait de casier judiciaire.",
    "titleEn": "Student visa (outside the European Union)",
    "bodyEn": "French or European nationality: no visa.\nOther nationalities: apply for a long-stay (type D) student visa at the Belgian consulate, with the enrolment certificate, proof of funds (amount set each year), a medical certificate and a criminal record extract.",
    "url": "https://dofi.ibz.be",
    "urlLabel": "Office des étrangers",
    "urlLabelEn": "Immigration Office"
   },
   {
    "id": "be-logement",
    "phase": "before",
    "title": "Trouver un kot",
    "body": "Le « kot » est le logement étudiant belge : résidences universitaires ou chambres chez des particuliers. Les services logement des universités publient des annonces vérifiées.",
    "titleEn": "Find a « kot »",
    "bodyEn": "A « kot » is Belgian student housing: university residences or rooms in private houses. University housing services publish checked listings."
   },
   {
    "id": "be-commune",
    "phase": "arrival",
    "title": "S’inscrire à la commune",
    "body": "Dans les huit jours qui suivent l’arrivée, présentez-vous à l’administration communale de votre domicile. Un agent de quartier vient vérifier l’adresse, puis la commune délivre votre titre de séjour.",
    "titleEn": "Register with the commune",
    "bodyEn": "Within eight days of arriving, go to the administration of the commune where you live. A local police officer comes to check the address, then the commune issues your residence card."
   },
   {
    "id": "be-mutuelle",
    "phase": "arrival",
    "title": "Mutuelle et santé",
    "body": "Étudiants européens : la Carte européenne d’assurance maladie (CEAM) couvre les soins, présentez-la à une mutuelle.\nAutres nationalités : affiliez-vous à une mutuelle belge dès l’arrivée.",
    "titleEn": "Health insurance",
    "bodyEn": "European students: the European Health Insurance Card (EHIC) covers care; show it to a mutual insurer (mutuelle).\nOther nationalities: join a Belgian mutuelle as soon as you arrive."
   },
   {
    "id": "be-banque",
    "phase": "arrival",
    "title": "Compte bancaire et transports",
    "body": "Ouvrez un compte belge pour le loyer, et prenez l’abonnement étudiant du réseau de votre ville (STIB à Bruxelles, TEC en Wallonie, De Lijn en Flandre).",
    "titleEn": "Bank account and transport",
    "bodyEn": "Open a Belgian account for rent, and get the student pass of your city’s network (STIB in Brussels, TEC in Wallonia, De Lijn in Flanders)."
   },
   {
    "id": "be-job",
    "phase": "year",
    "title": "Job étudiant",
    "body": "Les étudiants peuvent travailler sous contrat étudiant dans la limite d’un nombre d’heures par an ; le compteur se suit sur Student@work. Avec un titre de séjour étudiant hors Union européenne, des règles d’heures par semaine s’appliquent en plus.",
    "titleEn": "Student job",
    "bodyEn": "Students can work under a student contract within a number of hours per year; the counter is on Student@work. With a non-EU student residence permit, weekly hour rules apply as well.",
    "url": "https://www.studentatwork.be",
    "urlLabel": "Student@work",
    "urlLabelEn": "Student@work"
   },
   {
    "id": "be-renouvellement",
    "phase": "year",
    "title": "Renouveler son titre de séjour",
    "body": "Hors Union européenne : le titre de séjour étudiant est valable un an. Demandez son renouvellement à la commune avant l’expiration, avec la nouvelle attestation d’inscription et la preuve de ressources.",
    "titleEn": "Renew your residence card",
    "bodyEn": "Outside the European Union: the student residence card is valid for one year. Ask the commune to renew it before it expires, with the new enrolment certificate and proof of funds."
   }
  ]
 },
 {
  "id": "guide-ch",
  "country": "CH",
  "title": "Partir étudier en Suisse",
  "intro": "Admission, visa (hors UE/AELE), annonce à la commune, permis de séjour, assurance maladie et vie étudiante en Suisse.",
  "titleEn": "Studying in Switzerland",
  "introEn": "Admission, visa (outside the EU/EFTA), registering with the commune, residence permit, health insurance and student life in Switzerland.",
  "published": true,
  "steps": [
   {
    "id": "ch-admission",
    "phase": "before",
    "title": "Admission à l’université",
    "body": "Candidatez directement auprès de l’université ou de l’école polytechnique (EPFL, ETH Zurich). L’admission avec un baccalauréat français dépend de l’établissement et parfois des notes ou de la spécialité : vérifiez ses conditions.",
    "titleEn": "University admission",
    "bodyEn": "Apply directly to the university or federal institute of technology (EPFL, ETH Zurich). Admission with a French baccalauréat depends on the institution and sometimes on grades or subjects: check its conditions.",
    "url": "https://www.swissuniversities.ch",
    "urlLabel": "swissuniversities",
    "urlLabelEn": "swissuniversities"
   },
   {
    "id": "ch-visa",
    "phase": "before",
    "title": "Visa (hors UE/AELE)",
    "body": "Nationalité française ou européenne : pas de visa.\nAutres nationalités : après l’admission, demandez un visa national (type D) pour études à la représentation suisse, avec la preuve de ressources et l’attestation d’admission. Comptez plusieurs semaines.",
    "titleEn": "Visa (outside the EU/EFTA)",
    "bodyEn": "French or European nationality: no visa.\nOther nationalities: after admission, apply for a national (type D) student visa at the Swiss representation, with proof of funds and the admission letter. Allow several weeks.",
    "url": "https://www.sem.admin.ch",
    "urlLabel": "Secrétariat d’État aux migrations",
    "urlLabelEn": "State Secretariat for Migration"
   },
   {
    "id": "ch-logement",
    "phase": "before",
    "title": "Trouver un logement",
    "body": "Le logement est cher et rare dans les villes universitaires : visez les résidences étudiantes et les colocations, et commencez tôt. Demandez aux alumni installés en Suisse dans Repère.",
    "titleEn": "Find accommodation",
    "bodyEn": "Housing is expensive and scarce in university cities: aim for student residences and flatshares, and start early. Ask the alumni living in Switzerland on Repère."
   },
   {
    "id": "ch-commune",
    "phase": "arrival",
    "title": "S’annoncer à la commune et permis de séjour",
    "body": "Dans les 14 jours qui suivent l’arrivée, annoncez-vous au contrôle des habitants de votre commune. Pour plus de trois mois de séjour, il faut un permis (en général un permis B étudiant), délivré par le canton.",
    "titleEn": "Register with the commune and residence permit",
    "bodyEn": "Within 14 days of arriving, register with your commune’s residents’ office. For a stay of more than three months you need a permit (usually a B student permit), issued by the canton."
   },
   {
    "id": "ch-sante",
    "phase": "arrival",
    "title": "Assurance maladie obligatoire",
    "body": "Toute personne qui réside en Suisse doit s’assurer dans les trois mois. Les étudiants européens avec la Carte européenne d’assurance maladie (CEAM) peuvent souvent demander une dispense : renseignez-vous auprès du canton.",
    "titleEn": "Compulsory health insurance",
    "bodyEn": "Everyone living in Switzerland must take out insurance within three months. European students with the European Health Insurance Card (EHIC) can often ask for an exemption: check with the canton.",
    "url": "https://www.priminfo.admin.ch",
    "urlLabel": "Priminfo (comparatif officiel)",
    "urlLabelEn": "Priminfo (official comparison)"
   },
   {
    "id": "ch-banque",
    "phase": "arrival",
    "title": "Compte bancaire et transports",
    "body": "Un compte suisse facilite le loyer. Pour les trains, l’abonnement demi-tarif des CFF divise par deux le prix de la plupart des billets.",
    "titleEn": "Bank account and transport",
    "bodyEn": "A Swiss account makes rent easier. For trains, the SBB Half Fare travelcard halves the price of most tickets.",
    "url": "https://www.sbb.ch",
    "urlLabel": "CFF / SBB",
    "urlLabelEn": "SBB / CFF"
   },
   {
    "id": "ch-travail",
    "phase": "year",
    "title": "Travailler pendant les études",
    "body": "Étudiants européens : travail possible, à déclarer selon les règles du canton.\nAutres nationalités : le travail est limité à quelques heures par semaine pendant les cours, et autorisé seulement après un premier délai de séjour.",
    "titleEn": "Working while studying",
    "bodyEn": "European students: work is possible, to be declared under the canton’s rules.\nOther nationalities: work is limited to a few hours a week during term, and only allowed after a first period of residence."
   },
   {
    "id": "ch-renouvellement",
    "phase": "year",
    "title": "Renouveler son permis",
    "body": "Le permis étudiant se renouvelle chaque année, avec l’attestation d’inscription et la preuve de ressources.",
    "titleEn": "Renew your permit",
    "bodyEn": "The student permit is renewed each year, with the enrolment certificate and proof of funds."
   }
  ]
 },
 {
  "id": "guide-nl",
  "country": "NL",
  "title": "Partir étudier aux Pays-Bas",
  "intro": "Studielink, titre de séjour (hors Union européenne), logement, inscription à la commune (BSN), assurance et vie étudiante aux Pays-Bas.",
  "titleEn": "Studying in the Netherlands",
  "introEn": "Studielink, residence permit (outside the European Union), housing, registering with the municipality (BSN), insurance and student life in the Netherlands.",
  "published": true,
  "steps": [
   {
    "id": "nl-studielink",
    "phase": "before",
    "title": "Candidater via Studielink",
    "body": "La plupart des candidatures se font sur Studielink, puis auprès de l’université. Certaines formations ont un nombre de places limité (numerus fixus) avec une date limite plus tôt dans l’année.",
    "titleEn": "Apply through Studielink",
    "bodyEn": "Most applications go through Studielink, then the university. Some programmes have a limited number of places (numerus fixus) with an earlier deadline.",
    "url": "https://www.studielink.nl",
    "urlLabel": "Studielink",
    "urlLabelEn": "Studielink"
   },
   {
    "id": "nl-sejour",
    "phase": "before",
    "title": "Titre de séjour (hors Union européenne)",
    "body": "Nationalité française ou européenne : pas de visa.\nAutres nationalités : c’est l’université qui demande pour vous le visa d’entrée et le titre de séjour auprès de l’IND. Envoyez-lui tôt les pièces demandées (passeport, preuve de ressources).",
    "titleEn": "Residence permit (outside the European Union)",
    "bodyEn": "French or European nationality: no visa.\nOther nationalities: the university applies to the IND for your entry visa and residence permit. Send it the documents it asks for early (passport, proof of funds).",
    "url": "https://ind.nl/en",
    "urlLabel": "IND",
    "urlLabelEn": "IND"
   },
   {
    "id": "nl-logement",
    "phase": "before",
    "title": "Trouver un logement (tôt !)",
    "body": "Le logement étudiant est très rare : commencez dès l’admission, inscrivez-vous auprès des organismes de logement étudiant et méfiez-vous des annonces qui demandent un paiement avant toute visite.",
    "titleEn": "Find accommodation (early!)",
    "bodyEn": "Student housing is very scarce: start as soon as you are admitted, sign up with student housing organisations and beware of listings asking for payment before any visit."
   },
   {
    "id": "nl-gemeente",
    "phase": "arrival",
    "title": "S’inscrire à la commune (BSN)",
    "body": "Pour un séjour de plus de quatre mois, inscrivez-vous auprès de la commune (gemeente) dans les jours qui suivent l’arrivée. Vous recevez votre numéro BSN, demandé pour la banque, l’assurance et un emploi.",
    "titleEn": "Register with the municipality (BSN)",
    "bodyEn": "For a stay of more than four months, register with the municipality (gemeente) in the days after you arrive. You get your BSN number, needed for the bank, insurance and a job."
   },
   {
    "id": "nl-sante",
    "phase": "arrival",
    "title": "Assurance santé",
    "body": "Étudiants européens qui ne font qu’étudier : la Carte européenne d’assurance maladie (CEAM) suffit. Dès que vous travaillez, même quelques heures, l’assurance néerlandaise (zorgverzekering) devient obligatoire.\nAutres nationalités : une assurance étudiante privée est exigée.",
    "titleEn": "Health insurance",
    "bodyEn": "European students who only study: the European Health Insurance Card (EHIC) is enough. As soon as you work, even a few hours, Dutch insurance (zorgverzekering) becomes compulsory.\nOther nationalities: private student insurance is required."
   },
   {
    "id": "nl-banque",
    "phase": "arrival",
    "title": "Banque, DigiD et transports",
    "body": "Ouvrez un compte néerlandais, puis demandez votre DigiD (identifiant pour les démarches en ligne). Dans les transports, on paie avec une carte bancaire sans contact ou la carte OV-chipkaart.",
    "titleEn": "Bank, DigiD and transport",
    "bodyEn": "Open a Dutch account, then apply for your DigiD (login for online government services). On public transport you pay with a contactless bank card or the OV-chipkaart.",
    "url": "https://www.digid.nl/en",
    "urlLabel": "DigiD",
    "urlLabelEn": "DigiD"
   },
   {
    "id": "nl-travail",
    "phase": "year",
    "title": "Travailler pendant les études",
    "body": "Les étudiants européens peuvent travailler librement. Hors Union européenne : l’employeur doit obtenir un permis de travail, et le travail est limité en heures par semaine pendant l’année (temps plein possible l’été).",
    "titleEn": "Working while studying",
    "bodyEn": "European students can work freely. Outside the European Union: the employer must get a work permit, and work is limited in hours per week during the year (full time allowed in summer)."
   }
  ]
 },
 {
  "id": "guide-lb",
  "country": "LB",
  "title": "Partir étudier au Liban",
  "intro": "Brouillon à faire relire : inscription, équivalence du bac, séjour, argent et vie quotidienne au Liban.",
  "titleEn": "Studying in Lebanon",
  "introEn": "Draft to be checked: enrolment, baccalauréat equivalence, residence, money and daily life in Lebanon.",
  "published": false,
  "steps": [
   {
    "id": "lb-inscription",
    "phase": "before",
    "title": "Candidater à l’université",
    "body": "Les universités (Université Saint-Joseph, Université libanaise, AUB, LAU, USEK…) ont chacune leur dossier, leurs examens ou tests de langue et leurs dates. Le baccalauréat français est reconnu.",
    "titleEn": "Apply to university",
    "bodyEn": "Universities (Université Saint-Joseph, Lebanese University, AUB, LAU, USEK…) each have their own application, entrance or language tests and dates. The French baccalauréat is recognised."
   },
   {
    "id": "lb-equivalence",
    "phase": "before",
    "title": "Équivalence du baccalauréat",
    "body": "Pour s’inscrire, l’université demande en général l’équivalence du bac délivrée par le ministère libanais de l’Éducation. Gardez les originaux et des copies légalisées de vos relevés de notes.",
    "titleEn": "Baccalauréat equivalence",
    "bodyEn": "To enrol, universities usually ask for the baccalauréat equivalence issued by the Lebanese Ministry of Education. Keep the originals and certified copies of your transcripts."
   },
   {
    "id": "lb-sejour",
    "phase": "arrival",
    "title": "Séjour (étudiants non libanais)",
    "body": "Étudiants de nationalité libanaise : rien à faire.\nAutres nationalités : avec l’attestation d’inscription, demandez un permis de séjour étudiant auprès de la Sûreté générale.",
    "titleEn": "Residence (non-Lebanese students)",
    "bodyEn": "Students with Lebanese nationality: nothing to do.\nOther nationalities: with the enrolment certificate, apply for a student residence permit at General Security.",
    "url": "https://www.general-security.gov.lb",
    "urlLabel": "Sûreté générale",
    "urlLabelEn": "General Security"
   },
   {
    "id": "lb-argent",
    "phase": "arrival",
    "title": "Argent et paiements",
    "body": "Renseignez-vous auprès de l’université sur la monnaie et les modes de paiement acceptés pour les frais de scolarité. Au quotidien, beaucoup de paiements se font en espèces.",
    "titleEn": "Money and payments",
    "bodyEn": "Ask the university which currency and payment methods it accepts for tuition. Day to day, many payments are made in cash."
   },
   {
    "id": "lb-vie",
    "phase": "arrival",
    "title": "Logement, électricité et téléphone",
    "body": "En location, demandez ce que comprend le loyer (abonnement au générateur, eau). Une carte SIM locale (Alfa ou Touch) s’achète avec le passeport.",
    "titleEn": "Housing, electricity and phone",
    "bodyEn": "When renting, ask what the rent includes (generator subscription, water). A local SIM card (Alfa or Touch) is bought with your passport."
   },
   {
    "id": "lb-sante",
    "phase": "months",
    "title": "Santé et sécurité",
    "body": "Une assurance santé privée est recommandée. Consultez les conseils aux voyageurs avant le départ et pendant le séjour.",
    "titleEn": "Health and safety",
    "bodyEn": "Private health insurance is recommended. Check travel advice before leaving and during your stay.",
    "url": "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/",
    "urlLabel": "Conseils aux voyageurs",
    "urlLabelEn": "Travel advice (France)"
   }
  ]
 },
 {
  "id": "guide-eg",
  "country": "EG",
  "title": "Partir étudier en Égypte",
  "intro": "Brouillon à faire relire : candidature, visa et permis de séjour étudiant, vie quotidienne en Égypte.",
  "titleEn": "Studying in Egypt",
  "introEn": "Draft to be checked: applying, visa and student residence permit, daily life in Egypt.",
  "published": false,
  "steps": [
   {
    "id": "eg-candidature",
    "phase": "before",
    "title": "Candidater à l’université",
    "body": "Les universités privées (Université américaine du Caire, Université française d’Égypte…) recrutent directement. Pour les universités publiques, les étudiants étrangers passent par la plateforme officielle « Study in Egypt ».",
    "titleEn": "Apply to university",
    "bodyEn": "Private universities (American University in Cairo, French University of Egypt…) recruit directly. For public universities, international students go through the official « Study in Egypt » platform.",
    "url": "https://www.studyinegypt.gov.eg",
    "urlLabel": "Study in Egypt",
    "urlLabelEn": "Study in Egypt"
   },
   {
    "id": "eg-visa",
    "phase": "before",
    "title": "Entrer en Égypte",
    "body": "Beaucoup de nationalités peuvent obtenir un visa électronique sur le portail officiel avant le départ. Vérifiez auprès du consulat ce qui s’applique à votre nationalité pour un séjour d’études.",
    "titleEn": "Entering Egypt",
    "bodyEn": "Many nationalities can get an e-visa on the official portal before leaving. Check with the consulate what applies to your nationality for a study stay.",
    "url": "https://www.visa2egypt.gov.eg",
    "urlLabel": "Visa électronique (portail officiel)",
    "urlLabelEn": "e-Visa (official portal)"
   },
   {
    "id": "eg-sejour",
    "phase": "arrival",
    "title": "Permis de séjour étudiant",
    "body": "Une fois sur place, avec l’attestation de l’université, demandez le permis de séjour étudiant auprès de l’administration des passeports et de l’immigration. L’université aide souvent à constituer le dossier.",
    "titleEn": "Student residence permit",
    "bodyEn": "Once there, with the university’s letter, apply for the student residence permit at the passports and immigration administration. The university often helps with the file."
   },
   {
    "id": "eg-vie",
    "phase": "arrival",
    "title": "Logement, banque et téléphone",
    "body": "Résidences universitaires ou appartements partagés. Une carte SIM locale s’achète avec le passeport. Gardez un peu d’espèces : beaucoup de petits paiements se font en liquide.",
    "titleEn": "Housing, bank and phone",
    "bodyEn": "University residences or shared flats. A local SIM card is bought with your passport. Keep some cash: many small payments are made in cash."
   },
   {
    "id": "eg-sante",
    "phase": "months",
    "title": "Santé et sécurité",
    "body": "Une assurance santé privée est recommandée. Consultez les conseils aux voyageurs avant le départ et pendant le séjour.",
    "titleEn": "Health and safety",
    "bodyEn": "Private health insurance is recommended. Check travel advice before leaving and during your stay.",
    "url": "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/",
    "urlLabel": "Conseils aux voyageurs",
    "urlLabelEn": "Travel advice (France)"
   }
  ]
 }
]$guides$::jsonb) g
),
actuels as (
  select coalesce((select value::jsonb from public.app_settings where key = 'guides'), '[]'::jsonb) arr
)
insert into public.app_settings (key, value)
select 'guides', (
  (select arr from actuels)
  || coalesce((
       select jsonb_agg(n.g)
       from nouveaux n
       where not exists (
         select 1 from jsonb_array_elements((select arr from actuels)) e
         where e->>'id' = n.g->>'id' or e->>'country' = n.g->>'country'
       )
     ), '[]'::jsonb)
)::text
on conflict (key) do update set value = excluded.value;

-- Vérification : un guide par ligne, avec son pays, s'il est publié et son nombre d'étapes.
select g->>'country' as pays, g->>'title' as titre, g->>'published' as publie, jsonb_array_length(g->'steps') as etapes
from public.app_settings, jsonb_array_elements(value::jsonb) g
where key = 'guides';
