// ---> Fichier : api/submit-sales-quiz.js (Nouveau - Pour Quiz Vente/Stratégie) <---

import Airtable from 'airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Méthode ${request.method} non autorisée` });
  }

  // Utilise la variable d'environnement pour la table Vente/Stratégie
  const {
      AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID,
      AIRTABLE_SALES_TABLE_NAME // <= NOUVELLE VARIABLE À CRÉER DANS VERCEL
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_SALES_TABLE_NAME) {
    console.error("Erreur Critique: Variables d'environnement Airtable manquantes pour le quiz Vente ! Vérifiez AIRTABLE_API_KEY, AIRTABLE_BASE_ID, et AIRTABLE_SALES_TABLE_NAME.");
    return response.status(500).json({ error: "Erreur de configuration du serveur (Vente)." });
  }

  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    const table = base(AIRTABLE_SALES_TABLE_NAME); // Cible la table Vente

    const data = request.body;

    // Validation simple
    if (!data || typeof data !== 'object' || !data.Email || typeof data.ScoreTotal === 'undefined') {
        console.warn("Données Vente reçues invalides:", data);
        return response.status(400).json({ error: "Les données Vente envoyées sont incomplètes ou mal formatées." });
    }

    // Préparer les champs pour la TABLE VENTE/STRATÉGIE
    // !! Ces clés doivent correspondre aux colonnes de votre table Vente !!
    const recordFields = {
      'Prénom': data.Prenom,
      'Nom': data.Nom,
      'Email': data.Email,
      'Score Total': data.ScoreTotal,
      'Niveau Maturité': data.NiveauMaturite,
      // Champs spécifiques au quiz Vente/Stratégie (basés sur airtableFieldName)
      'Taille Flotte': data.TailleFlotte,
      'Mix Énergétique': data.MixEnergetique, // Réutilisé
      'Suivi CO2': data.SuiviCO2,             // Réutilisé
      'Politique Flotte Verte': data.PolitiqueFlotteVerte, // Nouveau champ (match airtableFieldName)
      'Enjeu Prioritaire Business': data.EnjeuPrioritaireBusiness, // Nouveau champ (match airtableFieldName)
    };

    const createdRecords = await table.create([{ fields: recordFields }]);

    console.log(`Enregistrement Airtable créé (Vente) dans ${AIRTABLE_SALES_TABLE_NAME}: ${createdRecords[0].getId()}`);
    return response.status(201).json({ success: true, message: "Bilan enregistré avec succès." });

  } catch (error) {
    console.error(`Erreur Airtable (Quiz Vente, Table: ${process.env.AIRTABLE_SALES_TABLE_NAME || 'NON DEFINIE'}) :`, error);
    let errorMessage = "Erreur interne (Vente).";
    let statusCode = 500;
     if (error.statusCode) {
      statusCode = error.statusCode;
      errorMessage = `Erreur base de données Vente (${error.statusCode}).`;
      if (statusCode === 422) {
        errorMessage = "Données Vente invalides pour la table Airtable (champs/types/options). Vérifiez config.";
         console.error("Détail erreur 422 Vente:", error.message);
      }
    }
    return response.status(statusCode).json({ error: errorMessage });
  }
}