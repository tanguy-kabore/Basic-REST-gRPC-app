// src/services/utilisateur.service.js
// Utilisation de la base de données en mémoire
const { db } = require('../config/db.config');
const {
  utilisateurToProto,
  protoToUtilisateur,
  livreToProto,
} = require("../helpers/conversion.helper");
// Récupérer tous les utilisateurs (avec pagination)
const obtenirUtilisateurs = async (call, callback) => {
  try {
    const page = call.request.page || 1;
    const limite = call.request.limite || 10;
    const skip = (page - 1) * limite;
    
    // Utiliser la DB en mémoire
    const utilisateurs = await db.findUtilisateurs(skip, limite);
    const total = db.utilisateurs.length;
    
    const response = {
      utilisateurs: utilisateurs.map(utilisateurToProto),
      total,
      page,
      pages: Math.ceil(total / limite),
    };
    callback(null, response);
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la récupération des utilisateurs : ${error.message}`,
    });
  }
};
// Récupérer un utilisateur par son ID
const obtenirUtilisateur = async (call, callback) => {
  try {
    const utilisateur = await db.findUtilisateurById(call.request.id);
    if (!utilisateur) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: "Utilisateur non trouvé",
      });
    }
    callback(null, utilisateurToProto(utilisateur));
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la récupération de l'utilisateur : ${error.message}`,
    });
  }
};
// Créer un nouvel utilisateur
const creerUtilisateur = async (call, callback) => {
  try {
    const utilisateurData = protoToUtilisateur(call.request);
    const utilisateur = await db.createUtilisateur(utilisateurData);
    callback(null, utilisateurToProto(utilisateur));
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la création de l'utilisateur : ${error.message}`,
    });
  }
};
// Mettre à jour un utilisateur
const mettreAJourUtilisateur = async (call, callback) => {
  try {
    const { id } = call.request;
    const utilisateur = await db.findUtilisateurById(id);
    if (!utilisateur) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: "Utilisateur non trouvé",
      });
    }
    const utilisateurData = protoToUtilisateur(call.request);
    // Ne pas modifier les livres empruntés ou l historique
    delete utilisateurData.livresEmpruntes;
    delete utilisateurData.historique;
    delete utilisateurData._id; // Ne pas modifier l ID
    delete utilisateurData.id;  // Ne pas modifier l ID
    
    const utilisateurMisAJour = await db.updateUtilisateur(id, utilisateurData);
    callback(null, utilisateurToProto(utilisateurMisAJour));
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la mise à jour de l'utilisateur : ${error.message}`,
    });
  }
};
// Supprimer un utilisateur
const supprimerUtilisateur = async (call, callback) => {
  try {
    const utilisateur = await db.findUtilisateurById(call.request.id);
    if (!utilisateur) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: "Utilisateur non trouvé",
      });
    }
    
    // Vérifier si l'utilisateur a des livres empruntés
    const livresEmpruntes = await db.getLivresEmpruntes(call.request.id);
    if (livresEmpruntes && livresEmpruntes.length > 0) {
      return callback({
        code: 3, // INVALID_ARGUMENT en gRPC
        message: "Impossible de supprimer un utilisateur ayant des livres empruntés",
      });
    }
    
    await db.deleteUtilisateur(call.request.id);
    callback(null, {
      succes: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la suppression de l'utilisateur : ${error.message}`,
    });
  }
};
// Obtenir les livres empruntés par un utilisateur
const obtenirLivresEmpruntes = async (call, callback) => {
  try {
    const utilisateur = await db.findUtilisateurById(call.request.id);
    if (!utilisateur) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: "Utilisateur non trouvé",
      });
    }
    
    // Récupérer les livres empruntés depuis la DB en mémoire
    const livresEmpruntes = await db.getLivresEmpruntes(call.request.id);
    
    callback(null, {
      livres: livresEmpruntes.map(livreToProto),
      total: livresEmpruntes.length,
      page: 1,
      pages: 1,
    });
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la récupération des livres empruntés : ${error.message}`,
    });
  }
};
// Obtenir l'historique des emprunts d'un utilisateur
const obtenirHistoriqueEmprunts = async (call, callback) => {
  try {
    const utilisateur = await db.findUtilisateurById(call.request.id);
    if (!utilisateur) {
      return callback({
        code: 5, // NOT_FOUND en gRPC
        message: "Utilisateur non trouvé",
      });
    }
    
    // Récupérer l'historique des emprunts
    const historique = utilisateur.historique || [];
    
    callback(null, {
      emprunts: utilisateurToProto(utilisateur).historique,
      total: historique.length,
    });
  } catch (error) {
    callback({
      code: 13, // INTERNAL en gRPC
      message: `Erreur lors de la récupération de l'historique des emprunts : ${error.message}`,
    });
  }
};
module.exports = {
  obtenirUtilisateurs,
  obtenirUtilisateur,
  creerUtilisateur,
  mettreAJourUtilisateur,
  supprimerUtilisateur,
  obtenirLivresEmpruntes,
  obtenirHistoriqueEmprunts,
};
