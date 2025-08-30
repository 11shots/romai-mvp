# ROME AI MVP - Analyseur d'automatisation des métiers

Une application web Next.js qui analyse le potentiel d'automatisation des métiers du référentiel ROME de Pôle Emploi.

## 🚀 Fonctionnalités

- **Recherche de métiers** : Interface de recherche intuitive dans le référentiel ROME
- **Fiches métiers détaillées** : Visualisation complète des tâches et scores d'automatisation
- **Comparaison de métiers** : Outil de comparaison entre deux métiers différents  
- **Simulateur personnalisé** : Calcul du potentiel d'automatisation selon votre répartition de temps
- **Import de données** : Script d'import des données ROME au format JSON/CSV

## 🛠 Stack technique

- **Framework** : Next.js 15 (App Router)
- **Base de données** : SQLite (dev) / PostgreSQL (prod) avec Drizzle ORM
- **Styling** : Tailwind CSS + shadcn/ui
- **Déploiement** : Vercel
- **Langages** : TypeScript

## 📦 Installation et démarrage

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration de la base de données

```bash
# Générer les migrations
npm run db:generate

# Appliquer les migrations
npm run db:push
```

### 3. Import des données d'exemple

```bash
# Importer les données d'exemple
npm run import-rome sample-data.json
```

### 4. Lancer l'application

```bash
# Mode développement avec Turbopack
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📊 Structure de la base de données

### Tables principales

- **`occupation`** : Métiers du référentiel ROME (code, titre, secteur, description)
- **`task`** : Tâches liées à chaque métier
- **`automation_score`** : Scores d'automatisation par tâche et horizon temporel
- **`user_profile`** : Profils utilisateurs (pour auth future)
- **`user_simulation`** : Simulations personnalisées sauvegardées

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev          # Démarrer en mode dev avec Turbopack
npm run build        # Build de production
npm run start        # Démarrer en mode production
npm run lint         # Linter ESLint

# Base de données
npm run db:generate  # Générer les migrations Drizzle
npm run db:push      # Appliquer les migrations
npm run db:studio    # Interface d'administration Drizzle Studio

# Import de données
npm run import-rome <fichier.json>  # Importer des données ROME
```

## 📁 Structure du projet

```
src/
├── app/                 # Pages et API routes (App Router)
│   ├── api/            # API endpoints
│   ├── search/         # Page de recherche
│   ├── metier/[code]/  # Fiche métier détaillée
│   ├── compare/        # Comparateur de métiers
│   └── simulate/[code]/ # Simulateur d'automatisation
├── components/         # Composants React réutilisables
│   └── ui/            # Composants shadcn/ui
├── db/                # Configuration et schéma Drizzle
│   ├── schema.ts      # Schéma de la base de données
│   └── index.ts       # Configuration de connexion
└── lib/               # Utilitaires
scripts/
└── import-rome.ts     # Script d'import des données ROME
```

## 📥 Format des données ROME

### Format JSON attendu

```json
{
  "occupations": [
    {
      "code_rome": "M1805",
      "titre": "Études et développement informatique",
      "secteur": "Informatique",
      "description": "Conception, développement et maintenance d'applications..."
    }
  ],
  "tasks": [
    {
      "id": "1",
      "occupation_code_rome": "M1805", 
      "libelle": "Développer des applications web",
      "description": "Programmer des applications web..."
    }
  ]
}
```

### Utilisation du script d'import

```bash
# Importer depuis un fichier JSON
npm run import-rome data/rome-export.json

# Le script génère automatiquement les scores d'automatisation
# basés sur l'analyse sémantique des libellés de tâches
```

## 🌐 Déploiement sur Vercel

### 1. Push sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/votre-username/romai-mvp.git
git push -u origin main
```

### 2. Déploiement Vercel

1. Connectez votre repo GitHub sur [vercel.com](https://vercel.com)
2. Configurez les variables d'environnement si nécessaire
3. Déployez automatiquement

## 🎯 Utilisation

### 1. Recherche de métiers
- Accédez à `/search`
- Tapez le nom d'un métier (ex: "développeur", "cuisinier")
- Explorez les résultats avec scores d'automatisation

### 2. Analyse détaillée
- Cliquez sur "Voir détails" depuis la recherche
- Consultez toutes les tâches du métier
- Visualisez le score d'automatisation global

### 3. Comparaison
- Accédez à `/compare`
- Sélectionnez deux métiers à comparer
- Analysez les différences d'automatisation

### 4. Simulation personnalisée
- Depuis une fiche métier, cliquez "Simuler"
- Ajustez le temps consacré à chaque tâche
- Obtenez votre score d'automatisation personnalisé

---

**Note** : Ce MVP utilise des scores d'automatisation générés algorithmiquement à partir de l'analyse sémantique des tâches. Pour une utilisation en production, il est recommandé d'affiner ces scores avec des données d'experts métier.