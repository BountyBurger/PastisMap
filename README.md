<picture>
  <img src="public/images/logo.png" alt="PastisMap" width="30%">
</picture>

#### **PastisMap** est une application web interactive, moderne et responsive pour répertorier, visualiser et comparer le prix du pastis dans différents bars et enseignes en France.


## 🎯 Fonctionnalités

### 👁️ Mode Lecture Seule (Publique)
- **Carte Interactive Leaflet :** Centrée sur la France avec tuiles CartoDB Voyager modernes.
- **Marqueurs de prix :** Les épingles sur la carte affichent directement le prix du pastis avec un code couleur :
  - 🟢 **Vert :** &le; 2.50 €
  - 🟡 **Jaune :** 2.50 € - 3.50 €
  - 🔴 **Rouge :** &gt; 3.50 €
- **Filtres et Recherche en temps réel :**
  - Recherche instantanée par nom d'établissement, ville ou marque.
  - Filtre par catégorie de prix et par marque (Ricard, Pastis 51, Henri Bardouin, Casanis, Duval, Artisanale...).
  - Tri par prix croissant/décroissant ou par nom.
- **Baromètre du Pastis :** Calcul des statistiques en temps réel (prix moyen national, pastis le moins cher, marque la plus populaire).
- **Géolocalisation rapide :** Bouton "📍 Ma position" pour vous centrer directement sur la carte.

### ✏️ Mode Éditeur (Admin)
Accessible uniquement via un token secret transmis dans l'URL ou saisi dans l'interface :
- **URL Secrète :** `http://localhost:3000/?token=put-a-really-long-token-here`
- **Actions autorisées en mode éditeur :**
  - ➕ **Ajouter un point :** En cliquant directement sur la carte ou via votre géolocalisation GPS.
  - ✏️ **Modifier un point :** Mise à jour du prix, du nom, de la marque, des coordonnées ou des remarques.
  - 🗑️ **Supprimer un point :** Retrait d'un bar de la base de données.


## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Variables d'environnement (`.env`)
Le fichier `.env` à la racine contient la configuration :
```env
PORT=3000
ADMIN_TOKEN=put-a-really-long-token-here
CARTOMAP_API_KEY=your-cartomap-api-key-here
```

### 3. Lancement du serveur
```bash
npm start
```
Ou en mode développement (auto-reload) :
```bash
npm run dev
```

L'application sera accessible sur :
- **Mode Public (Lecture) :** [http://localhost:3000](http://localhost:3000)
- **Mode Éditeur (Admin) :** [http://localhost:3000/?token=put-a-really-long-token-here](http://localhost:3000/?token=put-a-really-long-token-here)