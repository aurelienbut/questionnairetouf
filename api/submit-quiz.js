// Importer la librairie Airtable
import Airtable from 'airtable';

// Fonction handler principale pour Vercel
export default async function handler(request, response) {
  // 1. Vérifier que la méthode est POST
  if (request.method !== 'POST') {
    // Si ce n'est pas POST, renvoyer une erreur 405 Method Not Allowed
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Méthode ${request.method} non autorisée` });
  }

  // 2. Récupérer les secrets Airtable depuis les variables d'environnement
  // !! IMPORTANT : Configurez ces variables dans les réglages de votre projet Vercel !!
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

  // Vérifier si les variables d'environnement sont bien définies
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    console.error("Erreur Critique: Variables d'environnement Airtable (API_KEY, BASE_ID, TABLE_NAME) manquantes !");
    // Ne pas exposer les détails de la config au client
    return response.status(500).json({ error: "Erreur de configuration du serveur." });
  }

  // 3. Initialiser la connexion à Airtable
  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    const table = base(AIRTABLE_TABLE_NAME); // Utilise le nom de table depuis les env vars

    // 4. Récupérer et valider les données du corps de la requête
    // Vercel parse automatiquement le JSON pour les requêtes POST
    const data = request.body;

    // Vérification simple que les données essentielles sont présentes
    if (!data || typeof data !== 'object' || !data.Email || !data.ScoreTotal) {
        console.warn("Données reçues invalides ou manquantes:", data);
        return response.status(400).json({ error: "Les données envoyées sont incomplètes ou mal formatées." });
    }

    // 5. Préparer l'objet à envoyer à Airtable
    // !! ATTENTION : Les clés ici ('Prénom', 'Nom', 'Score Total', etc.)
    //    doivent correspondre EXACTEMENT aux noms de vos colonnes dans Airtable (sensible à la casse!).
    //    Adaptez-les si nécessaire.
    const recordFields = {
      // --- Infos Utilisateur ---
      'Prénom': data.Prenom,
      'Nom': data.Nom,
      'Email': data.Email,

      // --- Résultats Quiz ---
      'Score Total': data.ScoreTotal,
      'Niveau Maturité': data.NiveauMaturite,

      // --- Réponses Quiz (basées sur airtableFieldName) ---
      // Assurez-vous que ces noms de colonnes existent dans Airtable
      'Taille Flotte': data.TailleFlotte,
      'Mix Énergétique': data.MixEnergetique, // Attention à l'accent potentiel
      'Suivi CO2': data.SuiviCO2,
      'Politique RSE': data.PolitiqueRSE,
      'Enjeu Prioritaire': data.EnjeuPrioritaire,
    };

    // 6. Envoyer les données pour créer un enregistrement dans Airtable
    // La méthode .create attend un tableau d'objets, même pour un seul enregistrement
    const createdRecords = await table.create([{ fields: recordFields }]);

    // 7. Confirmer le succès au frontend
    console.log(`Enregistrement Airtable créé avec succès: ${createdRecords[0].getId()}`);
    // Renvoyer un statut 201 Created avec un message de succès
    return response.status(201).json({ success: true, message: "Résultats enregistrés avec succès." });

  } catch (error) {
    // 8. Gérer les erreurs potentielles (connexion Airtable, données invalides pour Airtable, etc.)
    console.error("Erreur lors de l'interaction avec Airtable:", error);

    let errorMessage = "Une erreur interne est survenue lors de l'enregistrement.";
    let statusCode = 500; // Erreur serveur par défaut

    // Essayer de fournir une erreur plus précise si possible
    if (error.statusCode) { // Erreur spécifique renvoyée par l'API Airtable
        statusCode = error.statusCode;
        // Ne pas renvoyer error.message directement au client pour la sécurité, sauf si jugé sûr
        errorMessage = `Erreur lors de la communication avec la base de données (${error.statusCode}).`;
        if (statusCode === 422) { // Unprocessable Entity - souvent un problème de type de données ou champ manquant
            errorMessage = "Certaines données fournies ne correspondent pas au format attendu par la base de données.";
        }
    }

    // Renvoyer une réponse d'erreur au frontend
    return response.status(statusCode).json({ error: errorMessage });
  }
}