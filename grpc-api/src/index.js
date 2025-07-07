// src/index.js
const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const dotenv = require("dotenv");
// Charger les variables d ' environnement
dotenv.config();
// Importer la configuration de la base de données en mémoire
const { db, initializeDB } = require("./config/db.config");
// Importer les services
const livreService = require("./services/livre.service");
const utilisateurService = require("./services/utilisateur.service");
// Charger le fichier proto
const PROTO_PATH = path.resolve(__dirname, "protos/bibliotheque.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const bibliothequeProto =
  grpc.loadPackageDefinition(packageDefinition).bibliotheque;
// Initialiser la base de données en mémoire
initializeDB();
// Créer un serveur gRPC
const server = new grpc.Server();
// Ajouter les services au serveur
server.addService(bibliothequeProto.LivreService.service, {
  obtenirLivres: livreService.obtenirLivres,
  obtenirLivre: livreService.obtenirLivre,
  creerLivre: livreService.creerLivre,
  mettreAJourLivre: livreService.mettreAJourLivre,
  supprimerLivre: livreService.supprimerLivre,
  rechercherLivres: livreService.rechercherLivres,
  emprunterLivre: livreService.emprunterLivre,
  retournerLivre: livreService.retournerLivre,
  obtenirStatistiques: livreService.obtenirStatistiques,
});
server.addService(bibliothequeProto.UtilisateurService.service, {
  obtenirUtilisateurs: utilisateurService.obtenirUtilisateurs,
  obtenirUtilisateur: utilisateurService.obtenirUtilisateur,
  creerUtilisateur: utilisateurService.creerUtilisateur,
  mettreAJourUtilisateur: utilisateurService.mettreAJourUtilisateur,
  supprimerUtilisateur: utilisateurService.supprimerUtilisateur,
  obtenirLivresEmpruntes: utilisateurService.obtenirLivresEmpruntes,
  obtenirHistoriqueEmprunts: utilisateurService.obtenirHistoriqueEmprunts,
});
// Démarrer le serveur
const PORT = process.env.GRPC_PORT || 50051;
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Erreur lors du démarrage du serveur gRPC : ", err);
      process.exit(1);
    }
    console.log(`Serveur gRPC démarré sur le port ${port}`);
    // Le serveur est déjà démarré par bindAsync
  }
);
