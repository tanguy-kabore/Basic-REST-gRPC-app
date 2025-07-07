// src/helpers/conversion.helper.js
const { Timestamp } = require("google-protobuf/google/protobuf/timestamp_pb");
// Convertir un objet Date en Timestamp proto
const dateToTimestamp = (date) => {
  if (!date) return null;
  const timestamp = new Timestamp();
  timestamp.setSeconds(Math.floor(date.getTime() / 1000));
  timestamp.setNanos((date.getTime() % 1000) * 1000000);
  return timestamp;
};
// Convertir un Timestamp proto en objet Date
const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  const seconds = timestamp.getSeconds();
  const nanos = timestamp.getNanos();
  return new Date(seconds * 1000 + nanos / 1000000);
};
// Convertir un document Livre Mongoose en message Livre proto
const livreToProto = (livre) => {
  return {
    id: livre._id.toString(),
    titre: livre.titre,
    auteur: livre.auteur,
    isbn: livre.isbn,
    anneePublication: livre.anneePublication,
    genre: livre.genre,
    description: livre.description || "",
    disponible: livre.disponible,
    emprunteurId: livre.emprunteurId ? livre.emprunteurId.toString() : "",
    dateEmprunt: livre.dateEmprunt ? dateToTimestamp(livre.dateEmprunt) : null,
    nbEmprunts: livre.nbEmprunts,
  };
};
// Convertir un message Livre proto en objet pour création / mise à jour Mongoose
const protoToLivre = (proto) => {
  const livre = {
    titre: proto.titre,
    auteur: proto.auteur,
    isbn: proto.isbn,
    anneePublication: proto.anneePublication,
    genre: proto.genre,
    description: proto.description,
  };
  // Ajouter l'ID uniquement s'il est présent ( pour les mises à jour )
  if (proto.id && proto.id !== " ") {
    livre._id = proto.id;
  }
  return livre;
};
// Convertir un document Utilisateur Mongoose en message Utilisateur proto
const utilisateurToProto = (utilisateur) => {
  return {
    id: utilisateur._id.toString(),
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    email: utilisateur.email,
    livresEmpruntes: (utilisateur.livresEmpruntes || []).map((id) => id.toString()),
    historique: (utilisateur.historique || []).map((h) => ({
      livreId: h.livreId.toString(),
      titreLivre: h.titreLivre,
      dateEmprunt: dateToTimestamp(h.dateEmprunt),
      dateRetour: h.dateRetour ? dateToTimestamp(h.dateRetour) : null,
    })),
  };
};
// Convertir un message Utilisateur proto en objet pour création / mise à jour Mongoose
const protoToUtilisateur = (proto) => {
  const utilisateur = {
    nom: proto.nom,
    prenom: proto.prenom,
    email: proto.email,
  };
  // Ajouter l'ID uniquement s'il est présent ( pour les mises à jour )
  if (proto.id && proto.id !== " ") {
    utilisateur._id = proto.id;
  }
  return utilisateur;
};
module.exports = {
  dateToTimestamp,
  timestampToDate,
  livreToProto,
  protoToLivre,
  utilisateurToProto,
  protoToUtilisateur,
};
