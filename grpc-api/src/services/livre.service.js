// src/services/livre.service.js
// Utilisation de la base de données en mémoire
const { db } = require('../config/db.config');
const { livreToProto, protoToLivre } = require('../helpers/conversion.helper');

// Récupérer tous les livres (avec pagination)
const obtenirLivres = async (call, callback) => {
  try {
    const page = call.request.page || 1;
    const limite = call.request.limite || 10;
    const skip = (page - 1) * limite;
    
    // Utiliser la DB en mémoire
    const livres = await db.findLivres(skip, limite);
    const total = db.livres.length;
    
    const response = {
      livres: livres.map(livreToProto),
      total,
      page,
      pages: Math.ceil(total / limite),
    };
    callback(null, response);
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la récupération des livres : ${error.message}`,
    });
  }
};

// Récupérer un livre par son ID
const obtenirLivre = async (call, callback) => {
  try {
    const livre = await db.findLivreById(call.request.id);
    if (!livre) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: 'Livre non trouvé',
      });
    }
    callback(null, livreToProto(livre));
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la récupération du livre : ${error.message}`,
    });
  }
};

// Créer un nouveau livre
const creerLivre = async (call, callback) => {
  try {
    const livreData = protoToLivre(call.request);
    const livre = await db.createLivre(livreData);
    callback(null, livreToProto(livre));
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la création du livre : ${error.message}`,
    });
  }
};

// Mettre à jour un livre
const mettreAJourLivre = async (call, callback) => {
  try {
    const { id } = call.request;
    const livre = await db.findLivreById(id);
    if (!livre) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: 'Livre non trouvé',
      });
    }
    const livreData = protoToLivre(call.request);
    // Empêcher la modification des champs spécifiques liés à l'emprunt
    delete livreData.emprunteurId;
    delete livreData.dateEmprunt;
    delete livreData.nbEmprunts;
    delete livreData._id; // Ne pas modifier l'ID
    delete livreData.id;  // Ne pas modifier l'ID
    
    const livreMisAJour = await db.updateLivre(id, livreData);
    callback(null, livreToProto(livreMisAJour));
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la mise à jour du livre : ${error.message}`,
    });
  }
};

// Supprimer un livre
const supprimerLivre = async (call, callback) => {
  try {
    const livre = await db.findLivreById(call.request.id);
    if (!livre) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: 'Livre non trouvé',
      });
    }
    // Vérifier si le livre est actuellement emprunté
    if (!livre.disponible) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: 'Impossible de supprimer un livre actuellement emprunté',
      });
    }
    await db.deleteLivre(call.request.id);
    callback(null, {
      succes: true,
      message: 'Livre supprimé avec succès',
    });
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la suppression du livre : ${error.message}`
    });
  }
};

// Rechercher des livres
const rechercherLivres = async (call, callback) => {
  try {
    const { terme, champ } = call.request;
    if (!terme) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: 'Un terme de recherche est requis',
      });
    }
    
    // Recherche avec la DB en mémoire
    const query = {};
    if (champ === 'titre') query.titre = terme;
    else if (champ === 'auteur') query.auteur = terme;
    else if (champ === 'genre') query.genre = terme;
    else {
      // Si aucun champ spécifique, recherche dans tous les champs
      query.terme = terme; // Sera traité comme une recherche générale
    }
    
    const livres = await db.searchLivres(query);
    callback(null, {
      livres: livres.map(livreToProto),
      total: livres.length
    });
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la recherche de livres : ${error.message}`,
    });
  }
};

// Emprunter un livre
const emprunterLivre = async (call, callback) => {
  try {
    const { livreId, utilisateurId } = call.request;
    
    if (!utilisateurId) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: "L'ID de l'utilisateur est requis",
      });
    }
    
    // Vérifier si le livre existe
    const livre = await db.findLivreById(livreId);
    if (!livre) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: 'Livre non trouvé',
      });
    }
    
    // Vérifier si le livre est disponible
    if (!livre.disponible) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: 'Ce livre est déjà emprunté',
      });
    }
    
    // Vérifier si l'utilisateur existe
    const utilisateur = await db.findUtilisateurById(utilisateurId);
    if (!utilisateur) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: 'Utilisateur non trouvé',
      });
    }
    
    // Vérifier si l'utilisateur a atteint sa limite d'emprunts
    const livresEmpruntes = await db.getLivresEmpruntes(utilisateurId);
    if (livresEmpruntes && livresEmpruntes.length >= 5) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: "L'utilisateur a atteint sa limite d'emprunts",
      });
    }
    
    // Emprunter le livre avec notre DB en mémoire
    const resultat = await db.emprunterLivre(livreId, utilisateurId);
    
    if (!resultat.success) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: resultat.message || "Erreur lors de l'emprunt du livre",
      });
    }
    
    callback(null, livreToProto(resultat.livre));
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de l'emprunt du livre : ${error.message}`,
    });
  }
};

// Retourner un livre
const retournerLivre = async (call, callback) => {
  try {
    const { livreId, utilisateurId } = call.request;
    
    if (!utilisateurId) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: "L'ID de l'utilisateur est requis",
      });
    }
    
    // Vérifier si le livre existe
    const livre = await db.findLivreById(livreId);
    if (!livre) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: 'Livre non trouvé',
      });
    }
    
    // Vérifier si l'utilisateur existe
    const utilisateur = await db.findUtilisateurById(utilisateurId);
    if (!utilisateur) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: 'Utilisateur non trouvé',
      });
    }
    
    // Vérifier si le livre est bien emprunté par cet utilisateur
    if (livre.disponible || livre.emprunteurId !== utilisateurId) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: "Ce livre n'est pas emprunté par cet utilisateur",
      });
    }
    
    // Retourner le livre avec la DB en mémoire
    const resultat = await db.retournerLivre(livreId);
    
    if (!resultat.success) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: resultat.message || "Erreur lors du retour du livre",
      });
    }
    
    callback(null, livreToProto(resultat.livre));
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors du retour du livre : ${error.message}`,
    });
  }
};

// Obtenir des statistiques
const obtenirStatistiques = async (call, callback) => {
  try {
    // Si un ID de livre est spécifié, récupérer les stats pour ce livre
    if (call.request.livreId) {
      const stats = await db.getLivreStats(call.request.livreId);
      if (!stats) {
        return callback({
          code: 5, // NOT_FOUND en gRPC
          message: 'Livre non trouvé',
        });
      }
      return callback(null, {
        livreId: stats.id,
        titre: stats.titre,
        nbEmprunts: stats.nbEmprunts || 0,
        disponible: stats.disponible
      });
    }
    
    // Sinon, récupérer les stats globales
    const stats = await db.getAllStats();
    
    // Trier les livres par nombre d'emprunts pour trouver les plus populaires
    const tousLesLivres = [...db.livres];
    const livresPopulaires = tousLesLivres
      .sort((a, b) => (b.nbEmprunts || 0) - (a.nbEmprunts || 0))
      .slice(0, 10)
      .map(livre => ({
        id: livre.id,
        titre: livre.titre,
        auteur: livre.auteur,
        nbEmprunts: livre.nbEmprunts || 0,
      }));
    
    callback(null, {
      livresPopulaires,
      totalEmprunts: stats.totalEmprunts,
      moyenneEmprunts: stats.moyenneEmprunts,
      totalLivres: stats.totalLivres,
      livresDisponibles: stats.livresDisponibles,
      livresEmpruntes: stats.livresEmpruntes
    });
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la récupération des statistiques : ${error.message}`,
    });
  }
};

module.exports = {
  obtenirLivres,
  obtenirLivre,
  creerLivre,
  mettreAJourLivre,
  supprimerLivre,
  rechercherLivres,
  emprunterLivre,
  retournerLivre,
  obtenirStatistiques
};
