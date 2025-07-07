# Système de Gestion de Bibliothèque - Comparaison REST vs gRPC

![image](https://cdn.prod.website-files.com/63d926b37ec0d886c2d5d538/66bb66942fc4f72d06c290b3_6694de3f901ec6665122e9f7_gRPC-and-REST-API.webp)

![image](https://miro.medium.com/v2/resize:fit:740/1*Ijzagnux2EhithLN2qzliA.jpeg)

## 📚 Introduction théorique: REST vs gRPC

### Principes de REST (Representational State Transfer)

REST est un style d'architecture logicielle défini par Roy Fielding en 2000 dans sa thèse de doctorat. Il s'agit d'un ensemble de contraintes qui, lorsqu'elles sont appliquées comme un tout, permettent de créer des services web scalables et maintenables.

![image](https://businesscentralgeek.com/wp-content/uploads/2023/12/image-7.png)

![image](https://cdn.prod.website-files.com/5ff66329429d880392f6cba2/660c2294bf94571e7579bdde_467-min.jpg)

**Principes fondamentaux de REST :**

1. **Architecture client-serveur** : Séparation claire des préoccupations entre client et serveur
2. **Stateless (sans état)** : Chaque requête du client au serveur doit contenir toutes les informations nécessaires
3. **Cacheable** : Les réponses doivent indiquer si elles sont cachables
4. **Interface uniforme** : Utilisation cohérente des méthodes HTTP (GET, POST, PUT, DELETE)
5. **Système en couches** : Des composants intermédiaires peuvent être placés entre client et serveur

**Format de données** : Principalement JSON (parfois XML), facile à lire par les humains et largement supporté

**Protocole de transport** : HTTP/1.1 généralement

### Principes de gRPC (Google Remote Procedure Call)

gRPC est un framework RPC (Remote Procedure Call) moderne et open source développé par Google. Il permet aux applications distribuées de communiquer efficacement en appelant des procédures à distance comme si elles étaient locales.

![image](https://docs.oracle.com/en/middleware/standalone/weblogic-server/14.1.1.0/saclt/img/corba_idl.png)

![image](https://miro.medium.com/v2/resize:fit:808/1*oP0uG515-rrd5KowRFnVVw.png)

![image](https://cdn.prod.website-files.com/5ff66329429d880392f6cba2/660c22adf74e44dbd627e70b_468-min.jpg)

**Principes fondamentaux de gRPC :**

1. **IDL (Interface Definition Language)** : Utilisation de Protocol Buffers pour définir les services et messages
2. **Typage fort** : Contrat strict entre client et serveur via les fichiers .proto
3. **Génération de code** : Le compilateur protoc génère automatiquement le code client et serveur
4. **Streaming bidirectionnel** : Support des flux de données unidirectionnels et bidirectionnels
5. **Multiplexage** : Plusieurs appels peuvent partager une seule connexion HTTP/2

**Format de données** : Protocol Buffers, format binaire compact et efficace

**Protocole de transport** : HTTP/2 avec ses avantages (multiplexage, compression d'en-têtes, etc.)

### Quand utiliser REST vs gRPC

**Privilégier REST pour :**

- Applications web publiques avec interfaces utilisateur directes
- APIs accessibles depuis des navigateurs web sans proxy
- Services nécessitant une cache HTTP native
- Architecture où la simplicité et la lisibilité sont prioritaires
- Exposition d'API pour partenaires externes et intégration tierce

**Privilégier gRPC pour :**

- Communication microservices à haut débit et faible latence
- Systèmes distribués où la performance est critique
- Services nécessitant des contrats stricts et du typage fort
- Flux de données bidirectionnels (streaming)
- Communication polyglotte entre services développés dans différents langages

## 🔍 À propos du projet

Ce projet implémente un système de gestion de bibliothèque avec deux interfaces d'API différentes (REST et gRPC) pour permettre une comparaison directe de leurs performances, caractéristiques et cas d'usage.

## 📋 Vue d'ensemble

Le projet est structuré en plusieurs composants indépendants:

- **API REST** : Implémentation basée sur Express.js et JSON
- **API gRPC** : Implémentation basée sur Protocol Buffers et HTTP/2
- **Client REST** : Client de test pour l'API REST
- **Client gRPC** : Client de test pour l'API gRPC
- **Base de données** : Implémentation en mémoire (remplaçant MongoDB)

Les deux APIs offrent des fonctionnalités identiques, permettant une comparaison équitable:
- Gestion complète des livres (CRUD)
- Gestion des utilisateurs (CRUD)
- Emprunts et retours de livres
- Recherche et statistiques

## 🏗️ Structure du projet

```
bibliotheque-api/
├── rest-api/                   # Implémentation de l'API REST
│   ├── src/
│   │   ├── controllers/        # Contrôleurs REST
│   │   ├── routes/             # Définition des routes
│   │   └── index.js            # Point d'entrée
├── grpc-api/                   # Implémentation de l'API gRPC
│   ├── src/
│   │   ├── protos/             # Définitions Protocol Buffers
│   │   ├── services/           # Implémentation des services gRPC
│   │   ├── helpers/            # Fonctions utilitaires
│   │   ├── config/             # Configuration (dont DB en mémoire)
│   │   └── index.js            # Point d'entrée
└── clients/                    # Clients de test
    ├── rest-client/            # Client de test pour l'API REST
    └── grpc-client/            # Client de test pour l'API gRPC
```

## ⚙️ Prérequis

- Node.js (v14+)
- npm
- [ghz](https://ghz.sh/) - Pour les tests de charge gRPC (optionnel)
- Apache Benchmark (ab) - Pour les tests de charge REST (optionnel)

## 🚀 Installation

1. Cloner le répertoire:

```bash
git clone https://github.com/tanguy-kabore/Basic-REST-gRPC-app.git
cd Basic-REST-gRPC-app
```

2. Installer les dépendances pour chaque composant:

```bash
# API REST
cd rest-api
npm install

# API gRPC
cd ../grpc-api
npm install

# Client REST
cd ../clients/rest-client
npm install

# Client gRPC
cd ../grpc-client
npm install
```

## 📡 Démarrage des serveurs

### API REST

```bash
cd rest-api
npm run dev
```

Le serveur REST démarre sur http://localhost:3000

### API gRPC

```bash
cd grpc-api
npm run dev
```

Le serveur gRPC démarre sur le port 50051

## 🧪 Exécuter les tests

### Tests fonctionnels REST

```bash
cd clients/rest-client
npm start
```

Ce script teste toutes les fonctionnalités de l'API REST, notamment:
- Création, lecture, mise à jour, suppression de livres et d'utilisateurs
- Emprunt et retour de livres
- Recherche et statistiques

### Tests fonctionnels gRPC

```bash
cd clients/grpc-client
npm start
```

Ce script teste les mêmes fonctionnalités que le client REST, mais via l'API gRPC.

### Tests de performance

#### Tests REST avec ApacheBench

```bash
# Test de lecture (GET)
ab -n 1000 -c 100 -H "Content-Type: application/json" http://localhost:3000/livres

# Test de création (POST)
ab -n 100 -c 10 -p livre.json -T "application/json" -H "Content-Type: application/json" http://localhost:3000/livres
```

#### Tests gRPC avec ghz

```bash
# Test de lecture
ghz --insecure -n 100 -c 10 --proto src/protos/bibliotheque.proto --call bibliotheque.LivreService.ObtenirLivres --data-file data.json 127.0.0.1:50051

# Test de création
ghz --insecure --proto src/protos/bibliotheque.proto --call bibliotheque.LivreService.CreerLivre --data-file livre-test.json -n 100 -c 10 127.0.0.1:50051
```

## 💾 Base de données

Le projet utilise une base de données en mémoire (`InMemoryDB` dans `grpc-api/src/config/db.config.js`) qui simule les opérations MongoDB. Cette implémentation:
- Élimine la dépendance externe à MongoDB
- Offre des performances optimales pour les tests de benchmark
- Fournit toutes les fonctionnalités nécessaires aux deux APIs

La base de données est réinitialisée à chaque démarrage du serveur avec des données de test.

## 📊 Résultats des tests de performance

### API REST (Apache Benchmark)

| Opération | Requêtes/sec | Temps moyen/requête |
|-----------|--------------|---------------------|
| Lecture   | 495.89       | 201.659 ms          |
| Création  | 491.80       | 20.333 ms           |

### API gRPC (ghz)

| Opération | Requêtes/sec | Temps moyen/requête |
|-----------|--------------|---------------------|
| Lecture   | 1626.89      | 5.06 ms             |
| Création  | 1197.29      | 6.27 ms             |

Ces résultats montrent que gRPC surpasse REST en termes de performance, avec un débit 3.28× supérieur pour les lectures et 2.43× pour les écritures.

## 🔍 Points importants

- **Adresse IPv4 explicite** : Pour le client gRPC, utilisez `127.0.0.1` au lieu de `localhost` pour éviter les problèmes de résolution IPv6.
- **Conflit de port** : Assurez-vous que le port 50051 est libre avant de démarrer le serveur gRPC.
- **Initialisation des propriétés** : Les propriétés `livresEmpruntes` et `historique` sont initialisées comme tableaux vides lors de la création d'un utilisateur.

## 🛠️ Dépannage

### Problème: Le serveur gRPC ne démarre pas

**Solution**: Vérifiez si le port 50051 est déjà utilisé:
```bash
netstat -ano | findstr :50051
```
Puis arrêtez le processus qui utilise ce port:
```bash
taskkill /F /PID <ID_du_processus>
```

### Problème: Erreur de connexion du client gRPC

**Solution**: Assurez-vous d'utiliser l'adresse IPv4 explicite (`127.0.0.1`) au lieu de `localhost`.
