// ---> Fichier : api/submit-logistics-quiz.js (Nouveau - Pour Quiz Logistique) <---

import Airtable from 'airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Méthode ${request.method} non autorisée` });
  }

  // Utilise la variable d'environnement pour la table Logistique
  const {
      AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID,
      AIRTABLE_LOGISTICS_TABLE_NAME // Variable spécifique Logistique
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_LOGISTICS_TABLE_NAME) {
    console.error("Erreur Critique: Variables d'environnement Airtable manquantes pour le quiz Logistique ! Vérifiez AIRTABLE_API_KEY, AIRTABLE_BASE_ID, et AIRTABLE_LOGISTICS_TABLE_NAME.");
    return response.status(500).json({ error: "Erreur de configuration du serveur (Logistique)." });
  }

  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    const table = base(AIRTABLE_LOGISTICS_TABLE_NAME); // Cible la table Logistique

    const data = request.body;

    // Validation pour le quiz Logistique
    if (!data || typeof data !== 'object' || !data.Email || typeof data.ScoreTotal === 'undefined') {
        console.warn("Données Logistique reçues invalides:", data);
        return response.status(400).json({ error: "Les données Logistique envoyées sont incomplètes ou mal formatées." });
    }

    // Préparer les champs pour la TABLE LOGISTIQUE
    // !! Ces clés doivent correspondre aux colonnes de votre table Logistique !!
    const recordFields = {
      'Prénom': data.Prenom,
      'Nom': data.Nom,
      'Email': data.Email,
      'Score Total': data.ScoreTotal,        // Type Nombre (Pourcentage)
      'Niveau Maturité': data.NiveauMaturite, // Type Texte ou Single Select
      // Champs spécifiques au quiz Logistique
      'Taille Flotte': data.TailleFlotte,               // Type Single Select
      "Mode d'acquisition": data.ModeAcquisition,       // Type Single Select
      'Suivi TCO': data.SuiviTCO,                       // Type Single Select
      'Politique Achats RSE': data.PolitiqueAchatsRSE,  // Type Single Select
      'Enjeu Prioritaire': data.EnjeuPrioritaire,       // Type Single Select
    };

    const createdRecords = await table.create([{ fields: recordFields }]);

    console.log(`Enregistrement Airtable créé (Logistique) dans ${AIRTABLE_LOGISTICS_TABLE_NAME}: ${createdRecords[0].getId()}`);
    return response.status(201).json({ success: true, message: "Résultats Logistique enregistrés." });

  } catch (error) {
    console.error(`Erreur Airtable (Quiz Logistique, Table: ${process.env.AIRTABLE_LOGISTICS_TABLE_NAME || 'NON DEFINIE'}) :`, error);
    let errorMessage = "Erreur interne (Logistique).";
    let statusCode = 500;
     if (error.statusCode) {
      statusCode = error.statusCode;
      errorMessage = `Erreur base de données Logistique (${error.statusCode}).`;
      if (statusCode === 422) {
        errorMessage = "Données Logistique invalides pour la table Airtable (champs/types/options). Vérifiez config.";
         console.error("Détail erreur 422 Logistique:", error.message);
      }
    }
    return response.status(statusCode).json({ error: errorMessage });
  }
}