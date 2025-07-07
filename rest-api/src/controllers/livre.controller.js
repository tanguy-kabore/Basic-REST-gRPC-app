// src / controllers / livre . controller . js
const mongoose = require("mongoose");
const Livre = require("../models/livre.model");
const Utilisateur = require("../models/utilisateur.model");
const ApiResponse = require("../utils/api-response");
// Récupérer tous les livres ( avec pagination )
const getLivres = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limite = parseInt(req.query.limite, 10) || 10;
    const skip = (page - 1) * limite;
    const total = await Livre.countDocuments();
    const livres = await Livre.find()
      .skip(skip)
      .limit(limite)
      .sort({ createdAt: -1 });
    res.status(200).json(
      ApiResponse.success({
        livres,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limite),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};
// Récupérer un livre par son ID
const getLivreById = async (req, res, next) => {
  try {
    const livre = await Livre.findById(req.params.id);
    if (!livre) {
      return res.status(404).json(ApiResponse.error(404, "Livre non trouvé"));
    }
    res.status(200).json(ApiResponse.success(livre));
  } catch (error) {
    next(error);
  }
};
// Créer un nouveau livre
const createLivre = async (req, res, next) => {
  try {
    const livre = new Livre(req.body);
    const nouveauLivre = await livre.save();
    res
      .status(201)
      .json(ApiResponse.success(nouveauLivre, "Livre créé avec succès", 201));
  } catch (error) {
    next(error);
  }
};
// Mettre à jour un livre
const updateLivre = async (req, res, next) => {
  try {
    const livre = await Livre.findById(req.params.id);
    if (!livre) {
      return res.status(404).json(ApiResponse.error(404, "Livre non trouvé"));
    }
    // Empêcher la modification des champs spécifiques liés à l ’ emprunt via cette ro
    delete req.body.emprunteurId;
    delete req.body.dateEmprunt;
    delete req.body.nbEmprunts;
    Object.assign(livre, req.body);
    const livreMisAJour = await livre.save();
    res
      .status(200)
      .json(ApiResponse.success(livreMisAJour, "Livre mis à jour avec succès"));
  } catch (error) {
    next(error);
  }
};
// Supprimer un livre
const deleteLivre = async (req, res, next) => {
  try {
    const livre = await Livre.findById(req.params.id);
    if (!livre) {
      return res.status(404).json(ApiResponse.error(404, "Livre non trouvé"));
    }
    // Vérifier si le livre est actuellement emprunté
    if (!livre.disponible) {
      return res
        .status(400)
        .json(
          ApiResponse.error(
            400,
            "Impossible de supprimer un livre actuellement emprun"
          )
        );
    }
    await livre.remove();
    res
      .status(200)
      .json(ApiResponse.success(null, "Livre supprimé avec succès"));
  } catch (error) {
    next(error);
  }
};
// Rechercher des livres
const searchLivres = async (req, res, next) => {
  try {
    const { terme, champ } = req.query;
    if (!terme) {
      return res
        .status(400)
        .json(ApiResponse.error(400, "Un terme de recherche est requis"));
    }
    let query = {};
    // Recherche spécifique par champ
    if (champ) {
      query[champ] = { $regex: terme, $options: "i" };
    } else {
      // Recherche full - text
      query = { $text: { $search: terme } };
    }
    const livres = await Livre.find(query);
    res.status(200).json(ApiResponse.success(livres));
  } catch (error) {
    next(error);
  }
};
// Emprunter un livre
const emprunterLivre = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { utilisateurId } = req.body;
    const livreId = req.params.id;
    if (!utilisateurId) {
      return res
        .status(400)
        .json(ApiResponse.error(400, "L  ID de l  utilisateur est requis"));
    }
    const livre = await Livre.findById(livreId).session(session);
    if (!livre) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(ApiResponse.error(404, "Livre non trouvé"));
    }
    const utilisateur = await Utilisateur.findById(utilisateurId).session(
      session
    );
    if (!utilisateur) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(ApiResponse.error(404, "Utilisateur non trouvé"));
    }
    // Vérifier si le livre est disponible
    if (!livre.disponible) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          ApiResponse.error(400, "Ce livre n'est pas disponible pour l'emprunt")
        );
    }
    // Emprunter le livre
    livre.emprunter(utilisateur._id);
    await livre.save({ session });
    // Mettre à jour l ’ utilisateur
    utilisateur.emprunterLivre(livre);
    await utilisateur.save({ session });
    await session.commitTransaction();
    session.endSession();
    res
      .status(200)
      .json(ApiResponse.success(livre, "Livre emprunté avec succès"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
// Retourner un livre
const retournerLivre = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { utilisateurId } = req.body;
    const livreId = req.params.id;
    if (!utilisateurId) {
      return res
        .status(400)
        .json(ApiResponse.error(400, "L  ID de l  utilisateur est requis"));
    }
    const livre = await Livre.findById(livreId).session(session);
    if (!livre) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(ApiResponse.error(404, "Livre non trouvé"));
    }
    const utilisateur = await Utilisateur.findById(utilisateurId).session(
      session
    );
    if (!utilisateur) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(ApiResponse.error(404, "Utilisateur non trouvé"));
    }
    // Vérifier si le livre est bien emprunté par cet utilisateur
    if (
      livre.disponible ||
      livre.emprunteurId.toString() !== utilisateur._id.toString()
    ) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          ApiResponse.error(
            400,
            "Ce livre n'est pas emprunté par cet utilisateur"
          )
        );
    }
    // Retourner le livre
    livre.retourner();
    await livre.save({ session });
    // Mettre à jour l ’ utilisateur
    utilisateur.retournerLivre(livre._id);
    await utilisateur.save({ session });
    await session.commitTransaction();
    session.endSession();
    res
      .status(200)
      .json(ApiResponse.success(livre, "Livre retourné avec succès"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
// Obtenir des statistiques sur les emprunts
const getStatistiques = async (req, res, next) => {
  try {
    // Livres les plus empruntés
    const livresPopulaires = await Livre.find()
      .sort({ nbEmprunts: -1 })
      .limit(10)
      .select("titre auteur nbEmprunts");
    // Total des emprunts
    const totalEmprunts = await Livre.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$nbEmprunts" },
        },
      },
    ]);
    // Moyenne des emprunts par livre
    const moyenneEmpruntsPipeline = await Livre.aggregate([
      {
        $group: {
          _id: null,
          moyenne: { $avg: "$nbEmprunts" },
        },
      },
    ]);
    const totalLivres = await Livre.countDocuments();
    const stats = {
      livresPopulaires,
      totalEmprunts: totalEmprunts.length > 0 ? totalEmprunts[0].total : 0,
      moyenneEmprunts:
        moyenneEmpruntsPipeline.length > 0
          ? moyenneEmpruntsPipeline[0].moyenne
          : 0,
      totalLivres,
    };
    res.status(200).json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getLivres,
  getLivreById,
  createLivre,
  updateLivre,
  deleteLivre,
  searchLivres,
  emprunterLivre,
  retournerLivre,
  getStatistiques,
};
