// Fichier : rest-api/src/index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Base de données en mémoire pour les tests
class InMemoryDB {
  constructor() {
    this.livres = [];
    this.utilisateurs = [];
    this.livresCounter = 0;
    this.utilisateursCounter = 0;
  }
  
  // Méthode pour réinitialiser la disponibilité de tous les livres
  async resetLivresDisponibilite() {
    this.livres.forEach(livre => {
      livre.disponible = true;
      livre.emprunteurId = null;
      livre.dateEmprunt = null;
      livre.dateRetour = null;
    });
  }
  
  // Méthode pour supprimer un utilisateur
  async deleteUtilisateur(id) {
    const index = this.utilisateurs.findIndex(u => u._id === id || u.id === id);
    if (index === -1) return null;
    
    const utilisateur = this.utilisateurs[index];
    this.utilisateurs.splice(index, 1);
    return utilisateur;
  }

  // Méthodes pour les livres
  async createLivre(data) {
    const id = (++this.livresCounter).toString();
    const livre = { 
      _id: id, 
      id, 
      ...data, 
      disponible: data.disponible !== undefined ? data.disponible : true,
      nbEmprunts: data.nbEmprunts || 0,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.livres.push(livre);
    return livre;
  }

  async findLivres(skip = 0, limit = 10) {
    return this.livres.slice(skip, skip + limit);
  }

  async countLivres() {
    return this.livres.length;
  }

  async findLivreById(id) {
    return this.livres.find(l => l._id === id || l.id === id);
  }

  async updateLivre(id, data) {
    const index = this.livres.findIndex(l => l._id === id || l.id === id);
    if (index === -1) return null;
    
    this.livres[index] = { ...this.livres[index], ...data, updatedAt: new Date() };
    return this.livres[index];
  }

  async deleteLivre(id) {
    const index = this.livres.findIndex(l => l._id === id || l.id === id);
    if (index === -1) return null;
    
    const livre = this.livres[index];
    this.livres.splice(index, 1);
    return livre;
  }

  async findLivresByIds(ids) {
    return this.livres.filter(l => ids.includes(l._id) || ids.includes(l.id));
  }

  // Méthodes pour les utilisateurs
  async createUtilisateur(data) {
    const id = (++this.utilisateursCounter).toString();
    const utilisateur = { _id: id, id, ...data, livresEmpruntes: [], historique: [], createdAt: new Date(), updatedAt: new Date() };
    this.utilisateurs.push(utilisateur);
    return utilisateur;
  }

  async findUtilisateurs(skip = 0, limit = 10) {
    return this.utilisateurs.slice(skip, skip + limit);
  }

  async countUtilisateurs() {
    return this.utilisateurs.length;
  }

  async findUtilisateurById(id) {
    return this.utilisateurs.find(u => u._id === id || u.id === id);
  }

  async updateUtilisateur(id, data) {
    const index = this.utilisateurs.findIndex(u => u._id === id || u.id === id);
    if (index === -1) return null;
    
    this.utilisateurs[index] = { ...this.utilisateurs[index], ...data, updatedAt: new Date() };
    return this.utilisateurs[index];
  }
}

// Initialiser la base de données en mémoire
const db = new InMemoryDB();
console.log("Base de données en mémoire initialisée (mode test)");

// Routes pour l'API
app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API REST de la bibliothèque !" });
});

// Routes pour les livres
app.post("/livres", async (req, res) => {
  try {
    const livre = await db.createLivre(req.body);
    res.status(201).json({ success: true, data: livre });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/livres", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const skip = (page - 1) * limite;

    const total = await db.countLivres();
    const livres = await db.findLivres(skip, limite);

    res.status(200).json({
      success: true,
      data: {
        livres,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limite)
        }
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Route pour les statistiques globales des livres
app.get("/livres/statistiques", async (req, res) => {
  try {
    const livres = await db.findLivres(0, 1000);
    
    // Calculer les statistiques
    const totalLivres = livres.length;
    const totalEmprunts = livres.reduce((sum, livre) => sum + (livre.nbEmprunts || 0), 0);
    const livresEmpruntes = livres.filter(l => l.disponible === false).length;
    const livresDisponibles = livres.filter(l => l.disponible !== false).length;
    const moyenneEmprunts = totalLivres > 0 ? totalEmprunts / totalLivres : 0;
    
    const stats = {
      totalLivres,
      totalEmprunts,
      livresEmpruntes,
      livresDisponibles,
      moyenneEmprunts
    };
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Recherche de livres
app.get("/livres/recherche", async (req, res) => {
  try {
    const { titre, auteur, genre } = req.query;
    let resultats = await db.findLivres(0, 1000); // Récupérer tous les livres
    
    // Filtrer selon les critères
    if (titre) {
      resultats = resultats.filter(livre => 
        livre.titre && livre.titre.toLowerCase().includes(titre.toLowerCase())
      );
    }
    
    if (auteur) {
      resultats = resultats.filter(livre => 
        livre.auteur && livre.auteur.toLowerCase().includes(auteur.toLowerCase())
      );
    }
    
    if (genre) {
      resultats = resultats.filter(livre => 
        livre.genre && livre.genre.toLowerCase().includes(genre.toLowerCase())
      );
    }
    
    res.status(200).json({
      success: true,
      data: {
        livres: resultats,
        total: resultats.length
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/livres/:id", async (req, res) => {
  try {
    const livre = await db.findLivreById(req.params.id);
    if (!livre) {
      return res.status(404).json({ success: false, error: "Livre non trouvé" });
    }
    res.status(200).json({ success: true, data: livre });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put("/livres/:id", async (req, res) => {
  try {
    const livre = await db.updateLivre(req.params.id, req.body);
    if (!livre) {
      return res.status(404).json({ success: false, error: "Livre non trouvé" });
    }
    res.status(200).json({ success: true, data: livre });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete("/livres/:id", async (req, res) => {
  try {
    const livre = await db.deleteLivre(req.params.id);
    if (!livre) {
      return res.status(404).json({ success: false, error: "Livre non trouvé" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/livres/:id/emprunter", async (req, res) => {
  try {
    const { utilisateurId } = req.body;
    if (!utilisateurId) {
      return res.status(400).json({ success: false, error: "ID utilisateur requis" });
    }

    const utilisateur = await db.findUtilisateurById(utilisateurId);
    if (!utilisateur) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
    }

    const livre = await db.findLivreById(req.params.id);
    if (!livre) {
      return res.status(404).json({ success: false, error: "Livre non trouvé" });
    }

    if (!livre.disponible) {
      return res.status(400).json({ success: false, error: "Livre déjà emprunté" });
    }

    // Mise à jour du livre
    livre.disponible = false;
    livre.emprunteurId = utilisateurId;
    livre.dateEmprunt = new Date();
    livre.nbEmprunts = (livre.nbEmprunts || 0) + 1;
    await db.updateLivre(livre.id, livre);

    // Mise à jour de l'utilisateur
    utilisateur.livresEmpruntes = utilisateur.livresEmpruntes || [];
    utilisateur.historique = utilisateur.historique || [];
    utilisateur.livresEmpruntes.push(livre.id);
    utilisateur.historique.push({
      livreId: livre.id,
      titreLivre: livre.titre,
      dateEmprunt: new Date()
    });
    await db.updateUtilisateur(utilisateur.id, utilisateur);

    res.status(200).json({ success: true, data: livre });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/livres/:id/retourner", async (req, res) => {
  try {
    const livre = await db.findLivreById(req.params.id);
    if (!livre) {
      return res.status(404).json({ success: false, error: "Livre non trouvé" });
    }

    if (livre.disponible) {
      return res.status(400).json({ success: false, error: "Ce livre n'est pas emprunté" });
    }

    const utilisateurId = livre.emprunteurId;
    const utilisateur = utilisateurId ? await db.findUtilisateurById(utilisateurId) : null;

    // Mise à jour du livre
    livre.disponible = true;
    livre.emprunteurId = null;
    livre.dateRetour = new Date();
    await db.updateLivre(livre.id, livre);

    if (utilisateur) {
      // Mise à jour de l'utilisateur
      utilisateur.livresEmpruntes = (utilisateur.livresEmpruntes || []).filter(
        id => id !== livre.id
      );

      // Mise à jour de l'historique
      const emprunt = (utilisateur.historique || []).find(
        h => h.livreId === livre.id && !h.dateRetour
      );
      if (emprunt) {
        emprunt.dateRetour = new Date();
      }
      await db.updateUtilisateur(utilisateur.id, utilisateur);
    }

    res.status(200).json({ success: true, data: livre });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Routes pour les utilisateurs
app.post("/utilisateurs", async (req, res) => {
  try {
    const utilisateur = await db.createUtilisateur(req.body);
    res.status(201).json({ success: true, data: utilisateur });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/utilisateurs", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const skip = (page - 1) * limite;

    const total = await db.countUtilisateurs();
    const utilisateurs = await db.findUtilisateurs(skip, limite);

    res.status(200).json({
      success: true,
      data: {
        utilisateurs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limite)
        }
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/utilisateurs/:id", async (req, res) => {
  try {
    const utilisateur = await db.findUtilisateurById(req.params.id);
    if (!utilisateur) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
    }
    res.status(200).json({ success: true, data: utilisateur });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put("/utilisateurs/:id", async (req, res) => {
  try {
    const utilisateur = await db.updateUtilisateur(req.params.id, req.body);
    if (!utilisateur) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
    }
    res.status(200).json({ success: true, data: utilisateur });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete("/utilisateurs/:id", async (req, res) => {
  try {
    const utilisateur = await db.deleteUtilisateur(req.params.id);
    if (!utilisateur) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Route pour réinitialiser les données (utile pour les tests)
app.post("/reset", async (req, res) => {
  try {
    await db.resetLivresDisponibilite();
    res.status(200).json({ success: true, message: "Données réinitialisées avec succès" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Route pour obtenir les statistiques d'un livre
app.get("/livres/:id/stats", async (req, res) => {
  try {
    const livre = await db.findLivreById(req.params.id);
    if (!livre) {
      return res.status(404).json({ success: false, error: "Livre non trouvé" });
    }
    
    // Préparer les statistiques
    const stats = {
      id: livre.id,
      titre: livre.titre,
      auteur: livre.auteur,
      nbEmprunts: livre.nbEmprunts || 0,
      disponible: livre.disponible || true,
      dernierEmprunt: livre.dateEmprunt,
      dernierRetour: livre.dateRetour
    };
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/utilisateurs/:id/livres", async (req, res) => {
  try {
    const utilisateur = await db.findUtilisateurById(req.params.id);
    if (!utilisateur) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
    }
    
    const livres = await db.findLivresByIds(utilisateur.livresEmpruntes || []);
    
    res.status(200).json({
      success: true,
      data: {
        livres,
        total: livres.length
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/utilisateurs/:id/historique", async (req, res) => {
  try {
    const utilisateur = await db.findUtilisateurById(req.params.id);
    if (!utilisateur) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
    }
    
    res.status(200).json({
      success: true,
      data: {
        historique: utilisateur.historique || [],
        total: (utilisateur.historique || []).length
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log("API REST démarrée sur http://localhost:"+port);
});
