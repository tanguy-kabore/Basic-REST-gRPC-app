// src/middleware/validation.middleware.js
const ApiResponse = require("../utils/api-response");
// Middleware pour valider la création d ’ un livre
const validateLivreCreate = (req, res, next) => {
  const { titre, auteur, isbn, anneePublication, genre } = req.body;
  const errors = [];
  if (!titre) errors.push("Le titre est requis");
  if (!auteur) errors.push("L'auteur est requis");
  if (!isbn) errors.push("L'ISBN est requis");
  if (!anneePublication) errors.push("L'année de publication est requise");
  if (anneePublication && (isNaN(anneePublication) || anneePublication < 0)) {
    errors.push("L'année de publication doit être un nombre positif");
  }
  if (!genre) errors.push("Le genre est requis");
  if (errors.length > 0) {
    return res.status(400).json(ApiResponse.error(400, errors.join(", ")));
  }
  next();
};
// Middleware pour valider la création d ’ un utilisateur
const validateUtilisateurCreate = (req, res, next) => {
  const { nom, prenom, email } = req.body;
  const errors = [];
  if (!nom) errors.push("Le nom est requis");
  if (!prenom) errors.push("Le prénom est requis");
  if (!email) errors.push("L'email est requis");
  if (
    email &&
    !/^\ w +([. -]?\ w +)* @ \ w +([. -]?\ w +)*(\.\ w {2 ,3})+ $/.test(email)
  ) {
    errors.push("L'email n'est pas valide");
  }
  if (errors.length > 0) {
    return res.status(400).json(ApiResponse.error(400, errors.join(", ")));
  }
  next();
};
module.exports = {
  validateLivreCreate,
  validateUtilisateurCreate,
};
