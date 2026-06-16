# LE FIL — Forum étudiant

Forum complet écrit en **JavaScript pur** (Node.js + Express côté serveur, HTML/CSS/JS
**sans framework front** côté client) avec une base de données **MySQL**.

Projet réalisé dans le cadre du module *Projet Forum* (Ynov).

---

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation & lancement](#installation--lancement)
- [Configuration](#configuration)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Liste des routes](#liste-des-routes)
  - [Routes « vue »](#routes--vue-)
  - [Routes « données » (API)](#routes--données--api)
- [Architecture du projet](#architecture-du-projet)
- [Sécurité](#sécurité)
- [Couverture des fonctionnalités](#couverture-des-fonctionnalités)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Serveur HTTP | Node.js + Express |
| Base de données | MySQL 8 (pilote `mysql2`) |
| Authentification | JWT (`jsonwebtoken`) |
| Hachage mot de passe | SHA-512 + sel (module natif `crypto`) |
| Upload d'images | `multer` |
| Sécurité HTTP | `helmet`, `cors` |
| Front-end | HTML / CSS / JavaScript natif (aucun framework) |

---

## Prérequis

- **Node.js** ≥ 18
- **MySQL** 8 — soit en local, soit via **Docker** (recommandé)

---

## Installation & lancement

### Tout en Docker (le plus simple)

Une seule commande démarre **le site + la base de données** :

```bash
docker compose up -d --build
```

- Le site est disponible sur **http://localhost:8080**
- La base est créée et remplie automatiquement au premier démarrage
  (les données sont conservées ensuite, même après un redémarrage).

Commandes utiles :

```bash
docker compose logs -f app    # voir les logs du site
docker compose down           # arrêter
docker compose down -v        # arrêter ET supprimer les données (repart à zéro)
```

> Pour repartir de zéro avec des données de test fraîches : `docker compose down -v`
> puis `docker compose up -d --build`.

---

### Lancement manuel (Node local + MySQL)

#### 1. Installer les dépendances

```bash
npm install
```

#### 2. Démarrer MySQL

**Option A — Docker (MySQL seul)**

```bash
docker compose up -d mysql
```

Cela démarre un MySQL 8 sur le port hôte **3307** (mot de passe `root`, base `forum`).

**Option B — MySQL local**

Utilisez votre instance MySQL existante (port 3306 par défaut) et adaptez la
configuration (voir [Configuration](#configuration)).

#### 3. Créer le schéma et les données de test

```bash
# Avec le MySQL Docker (port 3307) :
APP_CFG_APP__DATABASE__PORT=3307 APP_CFG_APP__DATABASE__PASSWORD=root npm run db:setup
```

> Sous PowerShell :
> ```powershell
> $env:APP_CFG_APP__DATABASE__PORT=3307; $env:APP_CFG_APP__DATABASE__PASSWORD="root"; npm run db:setup
> ```

Ce script exécute `db/schema.sql` puis `db/seed.sql`. Vous pouvez aussi lancer
ces fichiers à la main :

```bash
mysql -u root -p < db/schema.sql
mysql -u root -p forum < db/seed.sql
```

#### 4. Lancer le serveur

```bash
# Avec le MySQL Docker (port 3307) :
APP_CFG_APP__DATABASE__PORT=3307 APP_CFG_APP__DATABASE__PASSWORD=root npm start
```

Le site est alors disponible sur **http://localhost:8080** (front + API).
L'API est préfixée par `/api/v1`.

> `npm run dev` relance automatiquement le serveur à chaque modification.

---

## Configuration

La configuration suit un modèle « à la Spring Boot » :

1. `config/application.yml` — configuration de base ;
2. `config/application-<profil>.yml` — surcharge par profil (`dev` par défaut) ;
3. variables d'environnement — surcharge finale.

Variables d'environnement utiles :

| Variable | Effet |
|----------|-------|
| `PORT` | Port d'écoute du serveur HTTP |
| `APP_CFG_APP__DATABASE__HOST` | Hôte MySQL |
| `APP_CFG_APP__DATABASE__PORT` | Port MySQL |
| `APP_CFG_APP__DATABASE__USER` | Utilisateur MySQL |
| `APP_CFG_APP__DATABASE__PASSWORD` | Mot de passe MySQL |
| `APP_CFG_APP__DATABASE__DATABASE` | Nom de la base |
| `APP_CFG_APP__SECURITY__JWT__SECRET` | Secret de signature JWT |

---

## Comptes de démonstration

Créés par `db/seed.sql` :

| Pseudo | Mot de passe | Rôle |
|--------|--------------|------|
| `admin` | `Admin@123` | ADMIN |
| `alice` | `Alice@123` | USER |
| `bob` | `Bobby@123` | USER |

---

## Liste des routes

### Routes « vue »

Pages HTML statiques servies depuis `src/front` (aucun traitement de données).

| Méthode | Chemin | Page |
|---------|--------|------|
| GET | `/` ou `/index.html` | Fil des sujets (recherche, filtres, pagination) |
| GET | `/login.html` | Connexion |
| GET | `/register.html` | Inscription |
| GET | `/new-topic.html` | Création d'un sujet |
| GET | `/topic.html?id=<id>` | Consultation d'un sujet et de ses messages |
| GET | `/profile.html` / `?u=<pseudo>` | Profil (le sien ou celui d'un autre) |
| GET | `/settings.html` | Paramètres du profil |
| GET | `/admin.html` | Dashboard administrateur |

### Routes « données » (API)

Toutes préfixées par `/api/v1`. 🔒 = authentification requise · 👑 = rôle ADMIN.

**Santé**
| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/health` | État du service |

**Authentification**
| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/auth/register` | Inscription |
| POST | `/auth/login` | Connexion (identifiant = pseudo **ou** e-mail) |
| GET | `/auth/me` 🔒 | Utilisateur courant |

**Sujets (topics)**
| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/topics` | Liste (params : `search`, `tag`, `size`=10/20/30/all, `page`) |
| POST | `/topics` 🔒 | Créer un sujet |
| GET | `/topics/:id` | Consulter un sujet |
| PUT | `/topics/:id` 🔒 | Modifier (propriétaire) |
| DELETE | `/topics/:id` 🔒 | Supprimer (propriétaire) |
| GET | `/topics/:id/messages` | Messages (params : `sort`=recent/oldest/popularity, `size`, `page`) |
| POST | `/topics/:id/messages` 🔒 | Poster un message (avec image facultative) |
| GET | `/tags` | Liste des tags et leur nombre de sujets |

**Messages**
| Méthode | Chemin | Description |
|---------|--------|-------------|
| DELETE | `/messages/:id` 🔒 | Supprimer (auteur, propriétaire du sujet ou admin) |
| POST | `/messages/:id/like` 🔒 | Liker (+1, exclusif du dislike) |
| POST | `/messages/:id/dislike` 🔒 | Disliker (-1, exclusif du like) |

**Profils & amitiés**
| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/profiles/me` 🔒 | Mon profil + statistiques |
| PUT | `/profiles/me` 🔒 | Modifier bio / photo |
| GET | `/profiles/me/friends` 🔒 | Mes amis |
| GET | `/profiles/me/friend-requests` 🔒 | Demandes d'amis reçues |
| GET | `/profiles/:username` | Profil public d'un utilisateur |
| POST | `/profiles/friend-requests` 🔒 | Envoyer une demande d'ami |
| POST | `/profiles/friend-requests/:id/accept` 🔒 | Accepter |
| POST | `/profiles/friend-requests/:id/decline` 🔒 | Refuser |

**Administration** 👑
| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/admin/users` | Lister les comptes |
| POST | `/admin/users/:id/ban` | Bannir / réactiver un compte |
| PATCH | `/admin/topics/:id/state` | Changer l'état d'un sujet |
| DELETE | `/admin/topics/:id` | Supprimer un sujet |
| DELETE | `/admin/messages/:id` | Supprimer un message |

**Fichiers**
| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/uploads/<fichier>` | Images jointes aux messages |

---

## Architecture du projet

```
.
├── config/                 # Configuration YAML (base + profils)
├── db/
│   ├── schema.sql          # Création de la base et des tables
│   └── seed.sql            # Données de test
├── docker-compose.yml      # MySQL pour le développement
├── scripts/db-setup.js     # Applique schema.sql + seed.sql
└── src/
    ├── app.js              # Assemblage Express
    ├── server.js           # Démarrage (pool MySQL + écoute)
    ├── config/             # Chargement de la configuration
    ├── db/pool.js          # Pool de connexions MySQL
    ├── controllers/        # Couche HTTP
    ├── services/           # Logique métier
    ├── repositories/       # Accès aux données (SQL)
    ├── middlewares/        # Auth, upload, erreurs, logs
    ├── validators/         # Validation des entrées
    ├── utils/              # Mot de passe, pagination, helpers
    └── front/              # Front-end (HTML/CSS/JS, sans framework)
```

Découpage en couches **controller → service → repository**, avec injection de
dépendances par fonctions fabriques.

---

## Sécurité

- **Mots de passe** stockés hachés en **SHA-512 avec un sel aléatoire par
  utilisateur** (`src/utils/password.js`), conformément au cahier des charges.
- **JWT** signés (issuer / audience / expiration) pour les sessions.
- **helmet** pour les en-têtes HTTP, **CORS** configurable.
- Validation systématique des entrées ; comptes bannis bloqués à la connexion
  et sur chaque requête authentifiée.
- À la suppression d'un sujet, tous les éléments liés (messages, votes, tags)
  sont supprimés en cascade (clés étrangères `ON DELETE CASCADE`).

---

## Couverture des fonctionnalités

| Réf. | Fonctionnalité | Statut |
|------|----------------|--------|
| FT-1 | Inscription | ✅ |
| FT-2 | Connexion (pseudo ou e-mail) | ✅ |
| FT-3 | Création de topic (titre, corps, tags, date, auteur, état) | ✅ |
| FT-4 | Consulter un topic | ✅ |
| FT-5 | Poster un message | ✅ |
| FT-6 | Gestion du topic et des messages par le propriétaire | ✅ |
| FT-7 | Like / dislike d'un message (exclusifs) | ✅ |
| FT-8 | Tri des messages (chronologique / popularité) | ✅ |
| FT-9 | Pagination (10 / 20 / 30 / tout, défaut 10) | ✅ |
| FT-10 | Affichage des topics par catégorie (tag) | ✅ |
| FT-11 | Dashboard administrateur | ✅ |
| FT-12 | Recherche d'un topic (titre ou tag) | ✅ |
| FTB-1 | Images dans les messages | ✅ |
| FTB-2 | Création et gestion du profil | ✅ |
| FTB-3 | Gestion des amitiés + topics privés | ✅ |
