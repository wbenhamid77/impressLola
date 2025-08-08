# Configuration Google Maps pour la Localisation

## 🗺️ Amélioration de la Carte de Localisation

Nous avons remplacé Mapbox par **Google Maps** pour offrir une expérience de carte claire, fiable et professionnelle.

## ✨ Avantages de Google Maps

- **Interface claire et familière** : Design reconnu mondialement
- **Performance optimale** : Cartes vectorielles rapides
- **Recherche d'adresse précise** : Geocoding Google de qualité
- **Fiabilité** : Service stable et fiable
- **Plan gratuit généreux** : 28,500 requêtes/mois

## 🔧 Configuration Requise

### 1. Créer un compte Google Cloud

1. Aller sur [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Cliquer sur "Get started for free" et créer un compte
3. Vérifier votre email et téléphone

### 2. Créer un projet

1. Dans la console Google Cloud, cliquer sur "Select a project"
2. Cliquer sur "New Project"
3. Donner un nom au projet (ex: "ImpressLola Maps")
4. Cliquer sur "Create"

### 3. Activer l'API Maps JavaScript

1. Dans le menu de gauche, aller dans "APIs & Services" > "Library"
2. Rechercher "Maps JavaScript API"
3. Cliquer sur "Maps JavaScript API"
4. Cliquer sur "Enable"

### 4. Créer une clé API

1. Dans le menu de gauche, aller dans "APIs & Services" > "Credentials"
2. Cliquer sur "Create credentials" > "API key"
3. Copier la clé générée
4. Cliquer sur "Restrict key" pour sécuriser
5. Sélectionner "Maps JavaScript API" dans les restrictions

### 5. Configurer la clé API

1. Ouvrir le fichier `src/app/config/google-maps.config.ts`
2. Remplacer la ligne :
   ```typescript
   apiKey: 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg',
   ```
3. Par votre clé personnelle :
   ```typescript
   apiKey: 'votre_cle_google_maps_ici',
   ```

## 🎨 Fonctionnalités Disponibles

### Recherche d'Adresse
- **Barre de recherche intégrée** avec autocomplétion
- **Suggestions en temps réel** basées sur Google Places
- **Geocoding précis** pour la France
- **Interface intuitive** et responsive

### Marqueur Interactif
- **Marqueur personnalisé** avec icône moderne
- **Animation de pulsation** pour attirer l'attention
- **Popup informatif** avec coordonnées et adresse
- **Déplacement par glisser-déposer**

### Contrôles de Carte
- **Zoom +/-** avec boutons stylisés
- **Plein écran** pour une meilleure visibilité
- **Géolocalisation** pour se localiser
- **Navigation fluide** et responsive

### Coordonnées Automatiques
- **Mise à jour en temps réel** lors du déplacement
- **Affichage formaté** avec 6 décimales
- **Validation automatique** des données
- **Reverse geocoding** pour obtenir l'adresse

## 💰 Plan Gratuit

Le plan gratuit Google Maps inclut :
- **28,500 chargements de carte** par mois
- **2,500 requêtes de geocoding** par jour
- **1,000 requêtes Places** par jour
- **2,500 requêtes Directions** par jour

## 🚀 Démarrage Rapide

1. **Installer les dépendances** :
   ```bash
   npm install @angular/google-maps
   ```

2. **Configurer la clé API** (voir section ci-dessus)

3. **Démarrer l'application** :
   ```bash
   npm start
   ```

4. **Tester la carte** :
   - Aller sur la page d'ajout d'annonce
   - Section "Localisation sur la carte"
   - Tester la recherche d'adresse
   - Cliquer sur la carte pour placer un marqueur

## 🔍 Dépannage

### Carte ne s'affiche pas
- Vérifier que la clé API est correcte
- Vérifier que l'API Maps JavaScript est activée
- Vérifier les restrictions de la clé API
- Consulter la console du navigateur

### Recherche d'adresse ne fonctionne pas
- Vérifier les quotas de l'API
- Vérifier les restrictions de la clé API
- Tester avec une adresse simple
- Vérifier la connexion internet

### Performance lente
- Vérifier la connexion internet
- Réduire le niveau de zoom
- Vérifier les quotas de l'API

## 📱 Responsive Design

La carte s'adapte automatiquement :
- **Desktop** : Hauteur 500px
- **Tablet** : Hauteur 400px  
- **Mobile** : Hauteur 350px

## 🎯 Fonctionnalités Avancées

### Styles de Carte
- **Roadmap** : Carte routière classique
- **Satellite** : Vue satellite
- **Hybrid** : Satellite avec routes
- **Terrain** : Relief et topographie

### Contrôles Personnalisés
- **Zoom** : Boutons +/- stylisés
- **Plein écran** : Mode immersif
- **Géolocalisation** : Localisation automatique
- **Type de carte** : Sélecteur de style

### Recherche Intelligente
- **Autocomplétion** : Suggestions en temps réel
- **Filtrage par pays** : Limité à la France
- **Geocoding inversé** : Adresse depuis coordonnées
- **Validation** : Vérification des données

## 🔒 Sécurité

### Restrictions de Clé API
- **Référents HTTP** : Limiter aux domaines autorisés
- **APIs** : Restreindre à Maps JavaScript API
- **Quotas** : Surveiller l'utilisation
- **Monitoring** : Suivre les requêtes

## 📞 Support

Pour toute question sur Google Maps :
- [Documentation Google Maps](https://developers.google.com/maps/documentation/javascript)
- [Support Google Cloud](https://cloud.google.com/support)
- [Pricing Google Maps](https://cloud.google.com/maps-platform/pricing)

## 🆚 Comparaison avec Mapbox

| Fonctionnalité | Google Maps | Mapbox |
|----------------|-------------|--------|
| **Plan gratuit** | 28,500/mois | 50,000/mois |
| **Interface** | Familière | Moderne |
| **Fiabilité** | Excellente | Très bonne |
| **Geocoding** | Très précis | Précis |
| **Performance** | Optimale | Très bonne |
| **Support** | Excellent | Bon |

---

**Note** : La clé fournie dans le code est un exemple. Vous devez créer votre propre clé API pour utiliser l'application en production. 