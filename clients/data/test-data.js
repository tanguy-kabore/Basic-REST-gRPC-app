// clients/data/test-data.js
// Données de test pour les livres
const livresTest = [
  {
    titre: "Le Petit Prince",
    auteur: "Antoine de Saint-Exupéry",
    isbn: "9782070612758",
    anneePublication: 1943,
    genre: "Conte philosophique",
    description:
      "Un aviateur, échoué dans le désert, rencontre un jeune prince venu d'une autre planète.",
  },
  {
    titre: "1984",
    auteur: "George Orwell",
    isbn: "9782070368228",
    anneePublication: 1949,
    genre: "Science-fiction",
    description:
      "Dans un monde totalitaire, un homme tente de préserver son humanité.",
  },
  {
    titre: "Le Seigneur des Anneaux",
    auteur: "J.R.R. Tolkien",
    isbn: "9782070612895",
    anneePublication: 1954,
    genre: "Fantasy",
    description:
      "Épopée dans un monde imaginaire où le bien et le mal s'affrontent.",
  },
  {
    titre: "Harry Potter à l'école des sorciers",
    auteur: "J.K. Rowling",
    isbn: "9782070643028",
    anneePublication: 1997,
    genre: "Fantasy",
    description:
      "Un jeune orphelin découvre qu'il est un sorcier et rejoint une école de magie.",
  },
  {
    titre: "L'Étranger",
    auteur: "Albert Camus",
    isbn: "9782070360024",
    anneePublication: 1942,
    genre: "Roman philosophique",
    description:
      "Un homme commet un meurtre et fait face à l'absurdité de l'existence.",
  },
];

// Données de test pour les utilisateurs
const utilisateursTest = [
  {
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@example.com",
  },
  {
    nom: "Martin",
    prenom: "Sophie",
    email: "sophie.martin@example.com",
  },
  {
    nom: "Bernard",
    prenom: "Paul",
    email: "paul.bernard@example.com",
  },
];

module.exports = {
  livresTest,
  utilisateursTest,
};
