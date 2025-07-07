// src / models / utilisateur . model . js
const mongoose = require("mongoose");
const empruntHistoriqueSchema = new mongoose.Schema({
  livreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Livre",
    required: true,
  },
  titreLivre: {
    type: String,
    required: true,
  },
  dateEmprunt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dateRetour: {
    type: Date,
    default: null,
  },
});
const utilisateurSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    prenom: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\ w +([. -]?\ w +)* @ \ w +([. -]?\ w +)*(\.\ w {2 ,3})+ $ /,
        "Veuillez fournir une adresse email valide",
      ],
    },
    livresEmpruntes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Livre",
      },
    ],
    historique: [empruntHistoriqueSchema],
  },
  {
    timestamps: true,
  }
);
// Méthode pour ajouter un livre emprunté
utilisateurSchema.methods.emprunterLivre = function (livre) {
  // Vérifier si le livre est déjà emprunté par cet utilisateur
  if (this.livresEmpruntes.includes(livre._id)) {
    throw new Error("Ce livre est déjà emprunté par cet utilisateur");
  }
  this.livresEmpruntes.push(livre._id);
  this.historique.push({
    livreId: livre._id,
    titreLivre: livre.titre,
    dateEmprunt: new Date(),
    dateRetour: null,
  });
  return this;
};
// Méthode pour retourner un livre
utilisateurSchema.methods.retournerLivre = function (livreId) {
  // Vérifier si le livre est emprunté par cet utilisateur
  const index = this.livresEmpruntes.findIndex(
    (id) => id.toString() === livreId.toString()
  );
  if (index === -1) {
    throw new Error("Ce livre n'est pas emprunté par cet utilisateur");
  }
  // Retirer le livre de la liste des livres empruntés
  this.livresEmpruntes.splice(index, 1);
  // Mettre à jour l historique
  const historiqueIndex = this.historique.findIndex(
    (h) => h.livreId.toString() === livreId.toString() && h.dateRetour === null
  );
  if (historiqueIndex !== -1) {
    this.historique[historiqueIndex].dateRetour = new Date();
  }
  return this;
};
const Utilisateur = mongoose.model("Utilisateur", utilisateurSchema);
module.exports = Utilisateur;
