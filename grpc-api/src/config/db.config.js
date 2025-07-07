// src/config/db.config.js

// Base de données en mémoire pour les tests
class InMemoryDB {
  constructor() {
    this.livres = [];
    this.utilisateurs = [];
    this.livresCounter = 0;
    this.utilisateursCounter = 0;
  }
  
  // Réinitialisation de la disponibilité des livres
  async resetLivresDisponibilite() {
    this.livres.forEach(livre => {
      livre.disponible = true;
      livre.emprunteurId = null;
      livre.dateEmprunt = null;
      livre.dateRetour = null;
    });
    return true;
  }

  // Méthodes pour les livres
  async findLivres(skip = 0, limit = 10) {
    return this.livres.slice(skip, skip + limit);
  }

  async findLivreById(id) {
    return this.livres.find(livre => livre._id === id || livre.id === id);
  }

  async createLivre(livreData) {
    const id = (++this.livresCounter).toString();
    const nouveauLivre = {
      _id: id,
      id: id,
      ...livreData,
      disponible: true,
      nbEmprunts: 0,
      dateCreation: new Date()
    };
    this.livres.push(nouveauLivre);
    return nouveauLivre;
  }

  async updateLivre(id, livreData) {
    const index = this.livres.findIndex(livre => livre._id === id || livre.id === id);
    if (index === -1) return null;
    
    const livre = this.livres[index];
    this.livres[index] = { ...livre, ...livreData };
    return this.livres[index];
  }

  async deleteLivre(id) {
    const index = this.livres.findIndex(livre => livre._id === id || livre.id === id);
    if (index === -1) return null;
    
    const livre = this.livres[index];
    this.livres.splice(index, 1);
    return livre;
  }

  async emprunterLivre(livreId, utilisateurId) {
    const livre = await this.findLivreById(livreId);
    if (!livre) return { success: false, message: "Livre non trouvé" };
    if (!livre.disponible) return { success: false, message: "Livre déjà emprunté" };
    
    const utilisateur = await this.findUtilisateurById(utilisateurId);
    if (!utilisateur) return { success: false, message: "Utilisateur non trouvé" };
    
    livre.disponible = false;
    livre.emprunteurId = utilisateurId;
    livre.dateEmprunt = new Date();
    livre.dateRetour = null;
    livre.nbEmprunts = (livre.nbEmprunts || 0) + 1;
    
    return { success: true, livre };
  }

  async retournerLivre(livreId) {
    const livre = await this.findLivreById(livreId);
    if (!livre) return { success: false, message: "Livre non trouvé" };
    if (livre.disponible) return { success: false, message: "Livre non emprunté" };
    
    livre.disponible = true;
    livre.dateRetour = new Date();
    
    return { success: true, livre };
  }

  async searchLivres(query) {
    let resultats = [...this.livres];
    
    if (query.titre) {
      resultats = resultats.filter(livre => 
        livre.titre && livre.titre.toLowerCase().includes(query.titre.toLowerCase())
      );
    }
    
    if (query.auteur) {
      resultats = resultats.filter(livre => 
        livre.auteur && livre.auteur.toLowerCase().includes(query.auteur.toLowerCase())
      );
    }
    
    if (query.genre) {
      resultats = resultats.filter(livre => 
        livre.genre && livre.genre.toLowerCase().includes(query.genre.toLowerCase())
      );
    }
    
    return resultats;
  }

  // Méthodes pour les utilisateurs
  async findUtilisateurs(skip = 0, limit = 10) {
    return this.utilisateurs.slice(skip, skip + limit);
  }

  async findUtilisateurById(id) {
    return this.utilisateurs.find(utilisateur => utilisateur._id === id || utilisateur.id === id);
  }

  async createUtilisateur(utilisateurData) {
    const id = (++this.utilisateursCounter).toString();
    const nouveauUtilisateur = {
      _id: id,
      id: id,
      ...utilisateurData,
      livresEmpruntes: [],
      historique: [],
      dateCreation: new Date()
    };
    this.utilisateurs.push(nouveauUtilisateur);
    return nouveauUtilisateur;
  }

  async updateUtilisateur(id, utilisateurData) {
    const index = this.utilisateurs.findIndex(utilisateur => utilisateur._id === id || utilisateur.id === id);
    if (index === -1) return null;
    
    const utilisateur = this.utilisateurs[index];
    this.utilisateurs[index] = { ...utilisateur, ...utilisateurData };
    return this.utilisateurs[index];
  }

  async deleteUtilisateur(id) {
    const index = this.utilisateurs.findIndex(utilisateur => utilisateur._id === id || utilisateur.id === id);
    if (index === -1) return null;
    
    const utilisateur = this.utilisateurs[index];
    this.utilisateurs.splice(index, 1);
    return utilisateur;
  }

  async getLivresEmpruntes(utilisateurId) {
    return this.livres.filter(livre => livre.emprunteurId === utilisateurId && !livre.disponible);
  }

  async getHistoriqueEmprunts(utilisateurId) {
    return this.livres.filter(livre => livre.emprunteurId === utilisateurId);
  }

  async getLivreStats(livreId) {
    const livre = await this.findLivreById(livreId);
    if (!livre) return null;
    
    return {
      id: livre.id,
      titre: livre.titre,
      nbEmprunts: livre.nbEmprunts || 0,
      disponible: livre.disponible
    };
  }

  async getAllStats() {
    const totalLivres = this.livres.length;
    const totalEmprunts = this.livres.reduce((sum, livre) => sum + (livre.nbEmprunts || 0), 0);
    const livresEmpruntes = this.livres.filter(l => l.disponible === false).length;
    const livresDisponibles = this.livres.filter(l => l.disponible !== false).length;
    const moyenneEmprunts = totalLivres > 0 ? totalEmprunts / totalLivres : 0;
    
    return {
      totalLivres,
      totalEmprunts,
      livresEmpruntes,
      livresDisponibles,
      moyenneEmprunts
    };
  }
}

// Instance de la DB en mémoire
const db = new InMemoryDB();

// Fonction pour initialiser la base de données en mémoire
const initializeDB = async () => {
  // Ajouter quelques données initiales pour les tests
  if (db.livres.length === 0) {
    await db.createLivre({
      titre: "Le Petit Prince",
      auteur: "Antoine de Saint-Exupéry",
      genre: "Conte philosophique",
      anneePublication: 1943,
      description: "Un conte poétique et philosophique sous l'apparence d'un conte pour enfants."
    });
    
    await db.createLivre({
      titre: "1984",
      auteur: "George Orwell",
      genre: "Science-fiction",
      anneePublication: 1949,
      description: "Une dystopie qui dépeint une société totalitaire."
    });
  }
  
  if (db.utilisateurs.length === 0) {
    await db.createUtilisateur({
      nom: "Dupont",
      prenom: "Jean",
      email: "jean.dupont@exemple.com"
    });
    
    await db.createUtilisateur({
      nom: "Martin",
      prenom: "Marie",
      email: "marie.martin@exemple.com"
    });
  }
  
  console.log('Base de données en mémoire initialisée pour les tests');
  return true;
};

// Pour rétro-compatibilité
const connectDB = initializeDB;

module.exports = connectDB;
module.exports.db = db;
module.exports.initializeDB = initializeDB;
