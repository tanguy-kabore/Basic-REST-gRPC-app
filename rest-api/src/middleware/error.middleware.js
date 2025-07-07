// src / middleware / error . middleware . js
const ApiResponse = require("../utils/api-response");
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  let statusCode = err.statusCode || 500;
  let message = err.message || "Erreur serveur";
  // Gérer les erreurs spécifiques de Mongoose
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(" , ");
  }
  if (err.code === 11000) {
    // Erreur de clé dupliquée
    statusCode = 400;
    message = "Une entrée avec cette valeur existe déjà";
  }
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Format d'ID invalide";
  }
  const response = ApiResponse.error(statusCode, message);
  res.status(statusCode).json(response);
};
module.exports = errorHandler;
