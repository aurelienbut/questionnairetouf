// ---> Fichier : api/submit-tech-quiz.js (Nouveau - Pour Quiz Tech/Data) <---

import Airtable from 'airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Méthode ${request.method} non autorisée` });
  }

  // Utilise la variable d'environnement pour la table Tech/Data
  const {
      AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID,
      AIRTABLE_TECH_TABLE_NAME // <= NOUVELLE VARIABLE À CRÉER DANS VERCEL
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TECH_TABLE_NAME) {
    console.error("Erreur Critique: Variables d'environnement Airtable manquantes pour le quiz Tech ! Vérifiez AIRTABLE_API_KEY, AIRTABLE_BASE_ID, et AIRTABLE_TECH_TABLE_NAME.");
    return response.status(500).json({ error: "Erreur de configuration du serveur (Tech)." });
  }

  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    const table = base(AIRTABLE_TECH_TABLE_NAME); // Cible la table Tech

    const data = request.body;

    // Validation simple
    if (!data || typeof data !== 'object' || !data.Email || typeof data.ScoreTotal === 'undefined') {
        console.warn("Données Tech reçues invalides:", data);
        return response.status(400).json({ error: "Les données Tech envoyées sont incomplètes ou mal formatées." });
    }

    // Préparer les champs pour la TABLE TECHNIQUE
    // !! Ces clés doivent correspondre aux colonnes de votre table Tech !!
    const recordFields = {
      'Prénom': data.Prenom,
      'Nom': data.Nom,
      'Email': data.Email,
      'Score Total': data.ScoreTotal,
      'Niveau Maturité': data.NiveauMaturite, // Niveau adapté : Fondations, Connectée, Intégrée
      // Champs spécifiques au quiz Tech/Data (basés sur airtableFieldName)
      'Taille Flotte': data.TailleFlotte,                // Réutilisé
      'Équipement Télématique': data.EquipementTelematique, // Nouveau (match clé ci-dessous et airtableFieldName)
      'Intégration SI': data.IntegrationSI,             // Nouveau
      'Gouvernance Data': data.GouvernanceData,          // Nouveau
      'Enjeu Prioritaire Tech': data.EnjeuPrioritaireTech, // Nouveau
    };

    // Adaptez les clés ci-dessus si vos colonnes Airtable ont des noms différents.
    // Par exemple, pour 'Équipement Télématique', la clé doit être EXACTEMENT
    // ce que vous nommerez la colonne dans Airtable.

    const createdRecords = await table.create([{ fields: recordFields }]);

    console.log(`Enregistrement Airtable créé (Tech) dans ${AIRTABLE_TECH_TABLE_NAME}: ${createdRecords[0].getId()}`);
    return response.status(201).json({ success: true, message: "Diagnostic enregistré avec succès." });

  } catch (error) {
    console.error(`Erreur Airtable (Quiz Tech, Table: ${process.env.AIRTABLE_TECH_TABLE_NAME || 'NON DEFINIE'}) :`, error);
    let errorMessage = "Erreur interne (Tech).";
    let statusCode = 500;
     if (error.statusCode) {
      statusCode = error.statusCode;
      errorMessage = `Erreur base de données Tech (${error.statusCode}).`;
      if (statusCode === 422) {
        errorMessage = "Données Tech invalides pour la table Airtable (champs/types/options). Vérifiez config.";
         console.error("Détail erreur 422 Tech:", error.message);
      }
    }
    return response.status(statusCode).json({ error: errorMessage });
  }
}