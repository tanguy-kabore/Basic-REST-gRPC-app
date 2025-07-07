// src/models/livre.model.js
const mongoose = require("mongoose");
const livreSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
      trim: true,
    },
    auteur: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    anneePublication: {
      type: Number,
      required: true,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    emprunteurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Utilisateur",
      default: null,
    },
    dateEmprunt: {
      type: Date,
      default: null,
    },
    nbEmprunts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
// Ajouter des index pour améliorer les performances des recherches
livreSchema.index({ titre: "text", auteur: "text", genre: "text" });
// Méthode pour vérifier si un livre est disponible
livreSchema.methods.estDisponible = function () {
  return this.disponible;
};
// Méthode pour emprunter un livre
livreSchema.methods.emprunter = function (utilisateurId) {
  if (!this.disponible) {
    throw new Error("Ce livre n'est pas disponible pour l'emprunt");
  }
  this.disponible = false;
  this.emprunteurId = utilisateurId;
  this.dateEmprunt = new Date();
  this.nbEmprunts += 1;
  return this;
};
// Méthode pour retourner un livre
livreSchema.methods.retourner = function () {
  if (this.disponible) {
    throw new Error("Ce livre n'est pas actuellement emprunté");
  }
  this.disponible = true;
  this.emprunteurId = null;
  this.dateEmprunt = null;
  return this;
};
const Livre = mongoose.model("Livre", livreSchema);
module.exports = Livre;
