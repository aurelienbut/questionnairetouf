// ---> Fichier : api/submit-logistics-opti-quiz.js (Nouveau - Pour Quiz Optimisation Logistique) <---

import Airtable from 'airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Méthode ${request.method} non autorisée` });
  }

  // Utilise la variable d'environnement pour la table Optimisation Logistique
  const {
      AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID,
      AIRTABLE_LOGI_OPTI_TABLE_NAME // <= NOUVELLE VARIABLE À CRÉER DANS VERCEL
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_LOGI_OPTI_TABLE_NAME) {
    console.error("Erreur Critique: Variables d'environnement Airtable manquantes pour le quiz Opti. Logistique ! Vérifiez AIRTABLE_API_KEY, AIRTABLE_BASE_ID, et AIRTABLE_LOGI_OPTI_TABLE_NAME.");
    return response.status(500).json({ error: "Erreur de configuration du serveur (Opti. Logistique)." });
  }

  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    const table = base(AIRTABLE_LOGI_OPTI_TABLE_NAME); // Cible la table Opti Logistique

    const data = request.body;

    // Validation simple
    if (!data || typeof data !== 'object' || !data.Email || typeof data.ScoreTotal === 'undefined') {
        console.warn("Données Opti Logistique reçues invalides:", data);
        return response.status(400).json({ error: "Les données Opti Logistique envoyées sont incomplètes ou mal formatées." });
    }

    // Préparer les champs pour la TABLE OPTIMISATION LOGISTIQUE
    // !! Ces clés doivent correspondre aux colonnes de votre table Opti Logistique !!
    const recordFields = {
      'Prénom': data.Prenom,
      'Nom': data.Nom,
      'Email': data.Email,
      'Score Total': data.ScoreTotal,
      'Niveau Maturité': data.NiveauMaturite, // Niveau adapté : Opportunités..., Optimisée, Pilotée...
      // Champs spécifiques au quiz Opti Logistique (basés sur airtableFieldName)
      'Taille Flotte': data.TailleFlotte,                      // Réutilisé
      'Visibilité Temps Réel': data.VisibiliteTempsReel,         // Nouveau (match clé ci-dessous et airtableFieldName)
      'Mesure Taux Chargement': data.MesureTauxChargement,       // Nouveau
      'Optimisation Tournée': data.OptimisationTournee,         // Nouveau
      'Enjeu Prioritaire Logistique': data.EnjeuPrioritaireLogistique, // Nouveau
    };

    // Adaptez les clés ci-dessus si vos colonnes Airtable ont des noms différents.
    // Utilisez les noms exacts de VOS colonnes Airtable comme clés ici.

    const createdRecords = await table.create([{ fields: recordFields }]);

    console.log(`Enregistrement Airtable créé (Opti. Log.) dans ${AIRTABLE_LOGI_OPTI_TABLE_NAME}: ${createdRecords[0].getId()}`);
    return response.status(201).json({ success: true, message: "Diagnostic enregistré avec succès." });

  } catch (error) {
    console.error(`Erreur Airtable (Quiz Opti. Log., Table: ${process.env.AIRTABLE_LOGI_OPTI_TABLE_NAME || 'NON DEFINIE'}) :`, error);
    let errorMessage = "Erreur interne (Opti. Log.).";
    let statusCode = 500;
     if (error.statusCode) {
      statusCode = error.statusCode;
      errorMessage = `Erreur base de données Opti. Log. (${error.statusCode}).`;
      if (statusCode === 422) {
        errorMessage = "Données Opti. Log. invalides pour la table Airtable (champs/types/options). Vérifiez config.";
         console.error("Détail erreur 422 Opti. Log.:", error.message);
      }
    }
    return response.status(statusCode).json({ error: errorMessage });
  }
}