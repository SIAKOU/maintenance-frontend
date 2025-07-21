
# 🔧 MaintenancePro - Système de Gestion de Maintenance

## 📋 Vue d'ensemble

**MaintenancePro** est une application web professionnelle de gestion de maintenance industrielle permettant de :

- ✅ Gérer les interventions de maintenance
- ✅ Suivre les équipements et machines
- ✅ Créer des rapports de dépannage avec fichiers joints
- ✅ Administrer les utilisateurs (3 rôles : Admin, Technicien, Administration)
- ✅ Analyser les performances avec des statistiques avancées
- ✅ Interface responsive et moderne

## 🏗️ Architecture

- **Frontend** : React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend** : Node.js + Express + PostgreSQL + Sequelize
- **Authentification** : JWT avec gestion des rôles
- **Upload** : Multer pour les fichiers (images, vidéos, documents)
- **Sécurité** : Helmet, CORS, Rate Limiting, Validation Joi

## 🚀 Installation Rapide

### Prérequis
- Node.js >= 16.x
- PostgreSQL >= 13.x
- npm ou yarn

### 1. Clonage du projet
```bash
git clone <your-repo-url>
cd maintenance-app
```

### 2. Configuration Backend

```bash
cd backend
npm install

# Créer la base de données PostgreSQL
sudo -u postgres psql
CREATE USER maintenance_user WITH PASSWORD 'your_password';
CREATE DATABASE maintenance_db OWNER maintenance_user;
GRANT ALL PRIVILEGES ON DATABASE maintenance_db TO maintenance_user;
\q

# Configuration des variables d'environnement
cp .env.example .env
# Éditez .env avec vos paramètres de base de données

# Démarrage du serveur backend
npm run dev
```

Le backend sera accessible sur : `http://localhost:5000`

### 3. Configuration Frontend

```bash
# Dans un nouveau terminal
cd frontend
npm install

# Démarrage du serveur de développement
npm run dev
```

Le frontend sera accessible sur : `http://localhost:5173`



## 🎯 Fonctionnalités Principales

### 🔐 Authentification & Rôles
- Connexion sécurisée JWT
- 3 types d'utilisateurs avec permissions granulaires
- Protection des routes sensibles

### 📊 Dashboard Intelligent
- Statistiques en temps réel
- Interventions récentes
- Maintenance programmée
- KPIs de performance

### 🔧 Gestion des Interventions
- Création et suivi des demandes
- Affectation automatique/manuelle
- Statuts : En attente, En cours, Terminé
- Historique complet

### 📝 Rapports de Dépannage
- Formulaires détaillés pour techniciens
- Upload de fichiers (images, vidéos, PDF)
- Validation par l'administration
- Export PDF/Excel

### 🏭 Parc Machine
- Fiche complète par équipement
- Historique des interventions
- Maintenance préventive
- Alertes de panne

### 👨‍💼 Gestion Utilisateurs (Admin)
- Création/modification des comptes
- Attribution des rôles
- Suivi des activités
- Audit trail

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling moderne
- **shadcn/ui** - Composants UI professionnels
- **React Router** - Navigation
- **TanStack Query** - Gestion des données
- **Lucide React** - Icônes

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de données
- **Sequelize** - ORM
- **JWT** - Authentification
- **Multer** - Upload de fichiers
- **Joi** - Validation des données
- **Winston** - Logging

### Sécurité
- **Helmet.js** - Protection headers HTTP
- **CORS** - Gestion des origines
- **Rate Limiting** - Protection DDoS
- **bcrypt** - Hachage des mots de passe

## 📱 Interface Utilisateur

### Design System
- **Couleurs** : Palette bleue professionnelle
- **Typography** : Inter font family
- **Composants** : shadcn/ui + customisations
- **Responsive** : Mobile-first design
- **Animations** : Transitions fluides

### Pages Principales
1. **Page d'accueil** - Présentation et connexion
2. **Dashboard** - Vue d'ensemble et statistiques
3. **Rapports** - Gestion des rapports de dépannage
4. **Machines** - Parc d'équipements
5. **Utilisateurs** - Administration (admin seulement)
6. **Paramètres** - Configuration utilisateur

## 🗂️ Structure du Projet

```
maintenance-app/
├── backend/
│   ├── config/          # Configuration DB
│   ├── controllers/     # Logique métier
│   ├── middleware/      # Middlewares Express
│   ├── models/         # Modèles Sequelize
│   ├── routes/         # Routes API
│   ├── uploads/        # Fichiers uploadés
│   └── server.js       # Point d'entrée
│
├── src/
│   ├── components/     # Composants React
│   │   ├── auth/      # Authentification
│   │   ├── layout/    # Layout principal
│   │   └── ui/        # Composants shadcn/ui
│   ├── pages/         # Pages de l'application
│   ├── hooks/         # Hooks personnalisés
│   └── lib/           # Utilitaires
│
└── README.md
```

## 🔧 Configuration Avancée

### Variables d'environnement Backend (.env)
```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maintenance_db
DB_USER=maintenance_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key

# Serveur
PORT=5000
NODE_ENV=development

# Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

### Scripts Utiles

```bash
# Backend
npm run dev          # Démarrage développement
npm start           # Démarrage production
npm test            # Tests
npm run migrate     # Migrations DB

# Frontend
npm run dev         # Démarrage développement
npm run build       # Build production
npm run preview     # Aperçu build
npm run lint        # Linting
```

## 📈 Performances & Scalabilité

- **Pagination** : Toutes les listes sont paginées
- **Lazy Loading** : Chargement à la demande
- **Optimistic Updates** : Interface réactive
- **Caching** : TanStack Query pour le cache côté client
- **Compression** : Gzip sur les assets statiques

## 🔒 Sécurité

### Mesures Implémentées
- Authentification JWT avec expiration
- Validation des entrées (Joi)
- Protection CSRF
- Rate limiting par IP
- Headers de sécurité (Helmet)
- Upload sécurisé avec filtres de types
- Logs d'audit pour traçabilité

### Bonnes Pratiques
- Mots de passe hachés (bcrypt)
- Tokens stockés de manière sécurisée
- Validation côté client ET serveur
- Gestion granulaire des permissions

## 🚀 Déploiement

### Docker (Recommandé)
```bash
# Construction et lancement
docker-compose up -d

# Logs
docker-compose logs -f
```

### Déploiement Manuel
1. Build du frontend : `npm run build`
2. Configuration production backend
3. Reverse proxy (Nginx)
4. SSL/TLS (Let's Encrypt)
5. Base de données PostgreSQL en production

## 🤝 Contribution

1. **Fork** le projet
2. **Créer** une branche feature
3. **Committer** les changements
4. **Tester** les modifications
5. **Soumettre** une Pull Request

## 🆘 Support & Dépannage

### Problèmes Courants

**Erreur de connexion DB**
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql
# Vérifier les credentials dans .env
```

**Erreur JWT**
```bash
# Vérifier JWT_SECRET dans .env
echo $JWT_SECRET
```

**Erreur Upload**
```bash
# Vérifier permissions dossier uploads
chmod 755 backend/uploads
```

### Logs & Debug
```bash
# Logs backend
tail -f backend/logs/app.log

# Debug mode
NODE_ENV=development npm run dev
```

## 📚 Documentation

- **API** : Swagger disponible sur `/api/docs`
- **Components** : Storybook (en développement)
- **Database** : Schéma ER disponible dans `/docs`

## 🎯 Roadmap

### Version 1.1
- [ ] Notifications push en temps réel
- [ ] Exports PDF avancés
- [ ] API mobile
- [ ] Tableau de bord analytique

### Version 1.2
- [ ] Intégration calendrier
- [ ] Module de planification
- [ ] Scanner QR codes
- [ ] Application mobile

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Développé avec ❤️ pour optimiser la maintenance industrielle**

Pour toute question ou support : maintenance@yourcompany.com
