// clients/grpc-client/src/index.js
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const chalk = require('chalk');
const dotenv = require('dotenv');
const { Timestamp } = require('google-protobuf/google/protobuf/timestamp_pb');
const { livresTest, utilisateursTest } = require('../../data/test-data');

// Charger les variables d'environnement
dotenv.config();

// Configuration de l'API gRPC
const GRPC_HOST = process.env.GRPC_HOST || '127.0.0.1'; // Utilisation explicite d'IPv4
const GRPC_PORT = process.env.GRPC_PORT || '50051';
const GRPC_ADDRESS = `${GRPC_HOST}:${GRPC_PORT}`;

// Charger le fichier proto
const PROTO_PATH = path.resolve(__dirname, 'protos/bibliotheque.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const bibliothequeProto = grpc.loadPackageDefinition(packageDefinition).bibliotheque;

// Fonctions utilitaires pour travailler avec les timestamps
function dateToTimestamp(date) {
  if (!date) return null;
  
  const timestamp = {};
  timestamp.seconds = Math.floor(date.getTime() / 1000);
  timestamp.nanos = (date.getTime() % 1000) * 1000000;
  return timestamp;
}

function timestampToDate(timestamp) {
  if (!timestamp) return null;
  
  return new Date(timestamp.seconds * 1000 + timestamp.nanos / 1000000);
}

// Client gRPC
class GrpcClient {
  constructor(address) {
    this.livreService = new bibliothequeProto.LivreService(
      address,
      grpc.credentials.createInsecure()
    );
    
    this.utilisateurService = new bibliothequeProto.UtilisateurService(
      address,
      grpc.credentials.createInsecure()
    );
  }

  // Méthode utilitaire pour transformer les appels gRPC en promesses
  promisify(service, method, request) {
    return new Promise((resolve, reject) => {
      service[method](request, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
  }

  // Tests sur les livres
  async testLivres() {
    console.log(chalk.blue.bold('\n=== Tests gRPC pour les livres ===\n'));
    
    try {
      // Création de plusieurs livres
      console.log(chalk.green('1. Création de livres:'));
      const livresCreesPromises = livresTest.map(livre => 
        this.promisify(this.livreService, 'creerLivre', livre)
      );
      const livresCreesResponses = await Promise.all(livresCreesPromises);
      const livresCreesIds = livresCreesResponses.map(livre => livre.id);
      console.log(chalk.green('✓ Livres créés avec succès'));
      
      // Récupération de tous les livres
      console.log(chalk.green('\n2. Récupération de tous les livres:'));
      const tousLivres = await this.promisify(this.livreService, 'obtenirLivres', { page: 1, limite: 10 });
      console.log(`Total des livres: ${tousLivres.total}`);
      console.log(chalk.green('✓ Livres récupérés avec succès'));
      
      // Récupération d'un livre spécifique
      console.log(chalk.green('\n3. Récupération d\'un livre spécifique:'));
      const livreId = livresCreesIds[0];
      const livre = await this.promisify(this.livreService, 'obtenirLivre', { id: livreId });
      console.log(`Titre: ${livre.titre}`);
      console.log(`Auteur: ${livre.auteur}`);
      console.log(chalk.green('✓ Livre récupéré avec succès'));
      
      // Mise à jour d'un livre
      console.log(chalk.green('\n4. Mise à jour d\'un livre:'));
      const livreModifie = {
        ...livre,
        description: 'Description mise à jour pour les tests gRPC'
      };
      const livreMAJ = await this.promisify(this.livreService, 'mettreAJourLivre', livreModifie);
      console.log(`Description mise à jour: ${livreMAJ.description}`);
      console.log(chalk.green('✓ Livre mis à jour avec succès'));
      
      // Recherche de livres
      console.log(chalk.green('\n5. Recherche de livres:'));
      const recherche = await this.promisify(this.livreService, 'rechercherLivres', { terme: 'fantasy', champ: 'genre' });
      console.log(`Résultats de recherche: ${recherche.livres.length} livre(s) trouvé(s)`);
      console.log(chalk.green('✓ Recherche effectuée avec succès'));
      
      // Création d'utilisateurs pour tester les emprunts
      console.log(chalk.green('\n6. Création d\'un utilisateur pour les emprunts:'));
      const utilisateur = await this.promisify(this.utilisateurService, 'creerUtilisateur', utilisateursTest[0]);
      const utilisateurId = utilisateur.id;
      console.log(`Utilisateur créé: ${utilisateur.prenom} ${utilisateur.nom}`);
      console.log(chalk.green('✓ Utilisateur créé avec succès'));
      
      // Emprunt d'un livre
      console.log(chalk.green('\n7. Emprunt d\'un livre:'));
      const emprunt = await this.promisify(this.livreService, 'emprunterLivre', { livreId, utilisateurId });
      console.log(`Livre "${emprunt.titre}" emprunté par l'utilisateur ${utilisateurId}`);
      console.log(chalk.green('✓ Livre emprunté avec succès'));
      
      // Retour d'un livre
      console.log(chalk.green('\n8. Retour d\'un livre:'));
      const retour = await this.promisify(this.livreService, 'retournerLivre', { livreId, utilisateurId });
      console.log(`Livre "${retour.titre}" retourné`);
      console.log(chalk.green('✓ Livre retourné avec succès'));
      
      // Statistiques
      console.log(chalk.green('\n9. Récupération des statistiques:'));
      const stats = await this.promisify(this.livreService, 'obtenirStatistiques', {});
      console.log(`Total des emprunts: ${stats.totalEmprunts}`);
      console.log(`Moyenne des emprunts par livre: ${stats.moyenneEmprunts.toFixed(2)}`);
      console.log(chalk.green('✓ Statistiques récupérées avec succès'));
      
      // Suppression (nettoyage)
      console.log(chalk.green('\n10. Nettoyage - Suppression des livres créés:'));
      for (const id of livresCreesIds) {
        await this.promisify(this.livreService, 'supprimerLivre', { id });
      }
      await this.promisify(this.utilisateurService, 'supprimerUtilisateur', { id: utilisateurId });
      console.log(chalk.green('✓ Nettoyage effectué avec succès'));
      
      console.log(chalk.blue.bold('\nTous les tests gRPC ont réussi!'));
      
    } catch (error) {
      console.error(chalk.red('\nErreur lors des tests gRPC:'));
      console.error(chalk.red(`Code: ${error.code}`));
      console.error(chalk.red(`Message: ${error.message}`));
      console.error(chalk.red(`Details: ${error.details || 'Non disponible'}`));
    }
  }

  // Tests sur les utilisateurs
  async testUtilisateurs() {
    console.log(chalk.blue.bold('\n=== Tests gRPC pour les utilisateurs ===\n'));
    
    try {
      // Création de plusieurs utilisateurs
      console.log(chalk.green('1. Création d\'utilisateurs:'));
      const utilisateursCreesPromises = utilisateursTest.map(utilisateur => 
        this.promisify(this.utilisateurService, 'creerUtilisateur', utilisateur)
      );
      const utilisateursCreesResponses = await Promise.all(utilisateursCreesPromises);
      const utilisateursCreesIds = utilisateursCreesResponses.map(utilisateur => utilisateur.id);
      console.log(chalk.green('✓ Utilisateurs créés avec succès'));
      
      // Récupération de tous les utilisateurs
      console.log(chalk.green('\n2. Récupération de tous les utilisateurs:'));
      const tousUtilisateurs = await this.promisify(this.utilisateurService, 'obtenirUtilisateurs', { page: 1, limite: 10 });
      console.log(`Total des utilisateurs: ${tousUtilisateurs.total}`);
      console.log(chalk.green('✓ Utilisateurs récupérés avec succès'));
      
      // Récupération d'un utilisateur spécifique
      console.log(chalk.green('\n3. Récupération d\'un utilisateur spécifique:'));
      const utilisateurId = utilisateursCreesIds[0];
      const utilisateur = await this.promisify(this.utilisateurService, 'obtenirUtilisateur', { id: utilisateurId });
      console.log(`Nom: ${utilisateur.nom} ${utilisateur.prenom}`);
      console.log(`Email: ${utilisateur.email}`);
      console.log(chalk.green('✓ Utilisateur récupéré avec succès'));
      
      // Mise à jour d'un utilisateur
      console.log(chalk.green('\n4. Mise à jour d\'un utilisateur:'));
      const utilisateurModifie = {
        ...utilisateur,
        email: 'email.modifie.grpc@example.com'
      };
      const utilisateurMAJ = await this.promisify(this.utilisateurService, 'mettreAJourUtilisateur', utilisateurModifie);
      console.log(`Email mis à jour: ${utilisateurMAJ.email}`);
      console.log(chalk.green('✓ Utilisateur mis à jour avec succès'));
      
      // Suppression (nettoyage)
      console.log(chalk.green('\n5. Nettoyage - Suppression des utilisateurs créés:'));
      for (const id of utilisateursCreesIds) {
        await this.promisify(this.utilisateurService, 'supprimerUtilisateur', { id });
      }
      console.log(chalk.green('✓ Nettoyage effectué avec succès'));
      
      console.log(chalk.blue.bold('\nTous les tests gRPC ont réussi!'));
      
    } catch (error) {
      console.error(chalk.red('\nErreur lors des tests gRPC:'));
      console.error(chalk.red(`Code: ${error.code}`));
      console.error(chalk.red(`Message: ${error.message}`));
      console.error(chalk.red(`Details: ${error.details || 'Non disponible'}`));
    }
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log(chalk.yellow.bold('=== Démarrage des tests du client gRPC ==='));
    await this.testLivres();
    await this.testUtilisateurs();
    console.log(chalk.yellow.bold('\n=== Tests gRPC terminés ==='));
  }
}

// Exécuter les tests si le script est exécuté directement
if (require.main === module) {
  const client = new GrpcClient(GRPC_ADDRESS);
  client.runAllTests().catch(console.error);
}

module.exports = GrpcClient;