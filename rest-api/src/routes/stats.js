// routes/stats.js
const express = require('express');
const router = express.Router();

module.exports = function(db) {
  // Route pour les statistiques globales des livres
  router.get("/livres/statistiques", async (req, res) => {
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

  return router;
};
