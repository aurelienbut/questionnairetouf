// Importer la librairie Airtable
import Airtable from 'airtable';

// Fonction handler principale pour Vercel
export default async function handler(request, response) {
  // 1. Vérifier que la méthode est POST
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Méthode ${request.method} non autorisée` });
  }

  // 2. Récupérer les secrets Airtable depuis les variables d'environnement
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    console.error("Erreur Critique: Variables d'environnement Airtable (API_KEY, BASE_ID, TABLE_NAME) manquantes !");
    return response.status(500).json({ error: "Erreur de configuration du serveur." });
  }

  // 3. Initialiser la connexion à Airtable
  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    const table = base(AIRTABLE_TABLE_NAME);

    // 4. Récupérer et valider les données du corps de la requête
    const data = request.body;

    // Vérification (Assurez-vous que ScoreTotal existe bien, même si 0)
    if (!data || typeof data !== 'object' || !data.Email || data.ScoreTotal === undefined ) {
        console.warn("Données reçues invalides ou manquantes:", data);
        return response.status(400).json({ error: "Les données envoyées sont incomplètes ou mal formatées." });
    }

    // ---> AJOUT LOG 1 : Voir les données reçues <---
    // Affiche l'objet entier reçu du frontend pour vérification
    console.log('[BACKEND LOG 1] Données reçues (request.body):', JSON.stringify(data, null, 2));

    // 5. Préparer l'objet à envoyer à Airtable
    const recordFields = {
      'Prénom': data.Prenom,
      'Nom': data.Nom,
      'Email': data.Email,
      'Score Total': data.ScoreTotal, // C'est le pourcentage maintenant
      'Niveau Maturité': data.NiveauMaturite,
      'Taille Flotte': data.TailleFlotte,
      'Mix Énergétique': data.MixEnergetique,
      'Suivi CO2': data.SuiviCO2,
      'Politique RSE': data.PolitiqueRSE,
      'Enjeu Prioritaire': data.EnjeuPrioritaire,
      // Rappel: retirer la ligne 'Date Soumission' si vous utilisez un champ 'Created time' dans Airtable
    };

    // ---> AJOUT LOG 2 : Voir les données préparées pour Airtable <---
    // Affiche l'objet exact qui sera envoyé à la fonction .create d'Airtable
    console.log('[BACKEND LOG 2] Données préparées pour Airtable (recordFields):', JSON.stringify(recordFields, null, 2));

    // 6. Envoyer les données pour créer un enregistrement dans Airtable
    const createdRecords = await table.create([{ fields: recordFields }]);

    // 7. Confirmer le succès au frontend
    console.log(`Enregistrement Airtable créé avec succès: ${createdRecords[0].getId()}`);
    return response.status(201).json({ success: true, message: "Résultats enregistrés avec succès." });

  } catch (error) {
    // ---> AJOUT LOG 3 : Afficher l'erreur exacte interceptée <---
    // C'est le log le plus important si une erreur se produit !
    console.error("[BACKEND LOG 3] ERREUR DANS LE BLOC CATCH:", error);

    // 8. Gérer les erreurs potentielles (code inchangé ici)
    let errorMessage = "Une erreur interne est survenue lors de l'enregistrement.";
    let statusCode = 500;
    if (error.statusCode) {
        statusCode = error.statusCode;
        errorMessage = `Erreur lors de la communication avec la base de données (${error.statusCode}).`;
        if (statusCode === 422) {
            errorMessage = "Certaines données fournies ne correspondent pas au format attendu par la base de données.";
        }
    }
    return response.status(statusCode).json({ error: errorMessage });
  }
}