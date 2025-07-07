// clients/rest-client/src/index.js
const axios = require('axios');
const dotenv = require('dotenv');
const chalk = require('chalk');
const { livresTest, utilisateursTest } = require('../../data/test-data');

// Charger les variables d'environnement
dotenv.config();

// Configuration de l'API REST
const API_URL = process.env.REST_API_URL || 'http://localhost:3000';

// Client REST
class RestClient {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Tests sur les livres
  async testLivres() {
    console.log(chalk.blue.bold('\n=== Tests REST pour les livres ===\n'));
    
    try {
      // Création de plusieurs livres
      console.log(chalk.green('1. Création de livres:'));
      const livresCreesPromises = livresTest.map(livre => 
        this.api.post('/livres', livre)
      );
      const livresCreesResponses = await Promise.all(livresCreesPromises);
      const livresCreesIds = livresCreesResponses.map(res => res.data.data.id || res.data.data._id);
      console.log(chalk.green('✓ Livres créés avec succès'));
      
      // Récupération de tous les livres
      console.log(chalk.green('\n2. Récupération de tous les livres:'));
      const { data: tousLivres } = await this.api.get('/livres');
      console.log(`Total des livres: ${tousLivres.data.pagination.total}`);
      console.log(chalk.green('✓ Livres récupérés avec succès'));
      
      // Récupération d'un livre spécifique
      console.log(chalk.green('\n3. Récupération d\'un livre spécifique:'));
      const livreId = livresCreesIds[0];
      const { data: livre } = await this.api.get(`/livres/${livreId}`);
      console.log(`Titre: ${livre.data.titre}`);
      console.log(`Auteur: ${livre.data.auteur}`);
      console.log(chalk.green('✓ Livre récupéré avec succès'));
      
      // Mise à jour d'un livre
      console.log(chalk.green('\n4. Mise à jour d\'un livre:'));
      const livreModifie = {
        ...livre.data,
        description: 'Description mise à jour pour les tests'
      };
      const { data: livreMAJ } = await this.api.put(`/livres/${livreId}`, livreModifie);
      console.log(`Description mise à jour: ${livreMAJ.data.description}`);
      console.log(chalk.green('✓ Livre mis à jour avec succès'));
      
      // Recherche de livres
      console.log(chalk.green('\n5. Recherche de livres:'));
      const { data: recherche } = await this.api.get('/livres/recherche?terme=fantasy&champ=genre');
      console.log(`Résultats de recherche: ${recherche.data.length} livre(s) trouvé(s)`);
      console.log(chalk.green('✓ Recherche effectuée avec succès'));
      
      // Création d'utilisateurs pour tester les emprunts
      console.log(chalk.green('\n6. Création d\'un utilisateur pour les emprunts:'));
      const { data: utilisateur } = await this.api.post('/utilisateurs', utilisateursTest[0]);
      const utilisateurId = utilisateur.data.id || utilisateur.data._id;
      console.log(`Utilisateur créé: ${utilisateur.data.prenom} ${utilisateur.data.nom}`);
      console.log(chalk.green('✓ Utilisateur créé avec succès'));
      
      // Emprunt d'un livre
      console.log(chalk.green('\n7. Emprunt d\'un livre:'));
      const { data: emprunt } = await this.api.post(`/livres/${livreId}/emprunter`, { utilisateurId });
      console.log(`Livre "${emprunt.data.titre}" emprunté par l'utilisateur ${utilisateurId}`);
      console.log(chalk.green('✓ Livre emprunté avec succès'));
      
      // Retour d'un livre
      console.log(chalk.green('\n8. Retour d\'un livre:'));
      const { data: retour } = await this.api.post(`/livres/${livreId}/retourner`, { utilisateurId });
      console.log(`Livre "${retour.data.titre}" retourné`);
      console.log(chalk.green('✓ Livre retourné avec succès'));
      
      // Statistiques
      console.log(chalk.green('\n9. Récupération des statistiques:'));
      const { data: stats } = await this.api.get('/livres/statistiques');
      console.log(`Total des emprunts: ${stats.data.totalEmprunts}`);
      console.log(`Moyenne des emprunts par livre: ${stats.data.moyenneEmprunts.toFixed(2)}`);
      console.log(chalk.green('✓ Statistiques récupérées avec succès'));
      
      // Suppression (nettoyage)
      console.log(chalk.green('\n10. Nettoyage - Suppression des livres créés:'));
      for (const id of livresCreesIds) {
        await this.api.delete(`/livres/${id}`);
      }
      await this.api.delete(`/utilisateurs/${utilisateurId}`);
      console.log(chalk.green('✓ Nettoyage effectué avec succès'));
      
      console.log(chalk.blue.bold('\nTous les tests REST ont réussi!'));
      
    } catch (error) {
      console.error(chalk.red('\nErreur lors des tests REST:'));
      if (error.response) {
        console.error(chalk.red(`Status: ${error.response.status}`));
        console.error(chalk.red(`Message: ${JSON.stringify(error.response.data, null, 2)}`));
      } else {
        console.error(chalk.red(error.message));
      }
    }
  }

  // Tests sur les utilisateurs
  async testUtilisateurs() {
    console.log(chalk.blue.bold('\n=== Tests REST pour les utilisateurs ===\n'));
    
    try {
      // Création de plusieurs utilisateurs
      console.log(chalk.green('1. Création d\'utilisateurs:'));
      const utilisateursCreesPromises = utilisateursTest.map(utilisateur => 
        this.api.post('/utilisateurs', utilisateur)
      );
      const utilisateursCreesResponses = await Promise.all(utilisateursCreesPromises);
      const utilisateursCreesIds = utilisateursCreesResponses.map(res => res.data.data.id || res.data.data._id);
      console.log(chalk.green('✓ Utilisateurs créés avec succès'));
      
      // Récupération de tous les utilisateurs
      console.log(chalk.green('\n2. Récupération de tous les utilisateurs:'));
      const { data: tousUtilisateurs } = await this.api.get('/utilisateurs');
      console.log(`Total des utilisateurs: ${tousUtilisateurs.data.pagination.total}`);
      console.log(chalk.green('✓ Utilisateurs récupérés avec succès'));
      
      // Récupération d'un utilisateur spécifique
      console.log(chalk.green('\n3. Récupération d\'un utilisateur spécifique:'));
      const utilisateurId = utilisateursCreesIds[0];
      const { data: utilisateur } = await this.api.get(`/utilisateurs/${utilisateurId}`);
      console.log(`Nom: ${utilisateur.data.nom} ${utilisateur.data.prenom}`);
      console.log(`Email: ${utilisateur.data.email}`);
      console.log(chalk.green('✓ Utilisateur récupéré avec succès'));
      
      // Mise à jour d'un utilisateur
      console.log(chalk.green('\n4. Mise à jour d\'un utilisateur:'));
      const utilisateurModifie = {
        ...utilisateur.data,
        email: 'email.modifie@example.com'
      };
      const { data: utilisateurMAJ } = await this.api.put(`/utilisateurs/${utilisateurId}`, utilisateurModifie);
      console.log(`Email mis à jour: ${utilisateurMAJ.data.email}`);
      console.log(chalk.green('✓ Utilisateur mis à jour avec succès'));
      
      // Suppression (nettoyage)
      console.log(chalk.green('\n5. Nettoyage - Suppression des utilisateurs créés:'));
      for (const id of utilisateursCreesIds) {
        await this.api.delete(`/utilisateurs/${id}`);
      }
      console.log(chalk.green('✓ Nettoyage effectué avec succès'));
      
      console.log(chalk.blue.bold('\nTous les tests REST ont réussi!'));
      
    } catch (error) {
      console.error(chalk.red('\nErreur lors des tests REST:'));
      if (error.response) {
        console.error(chalk.red(`Status: ${error.response.status}`));
        console.error(chalk.red(`Message: ${JSON.stringify(error.response.data, null, 2)}`));
      } else {
        console.error(chalk.red(error.message));
      }
    }
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log(chalk.yellow.bold('=== Démarrage des tests du client REST ==='));
    await this.testLivres();
    await this.testUtilisateurs();
    console.log(chalk.yellow.bold('\n=== Tests REST terminés ==='));
  }
}

// Exécuter les tests si le script est exécuté directement
if (require.main === module) {
  const client = new RestClient(API_URL);
  client.runAllTests().catch(console.error);
}

module.exports = RestClient;