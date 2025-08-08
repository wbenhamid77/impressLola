# Configuration Mapbox pour la Localisation

## 🗺️ Amélioration de la Carte de Localisation

Nous avons remplacé Leaflet par **Mapbox** pour offrir une expérience de carte plus professionnelle et moderne.

## ✨ Avantages de Mapbox

- **Interface professionnelle** : Design moderne et épuré
- **Performance optimisée** : Cartes vectorielles rapides
- **Recherche d'adresse** : Geocoding intégré
- **Styles multiples** : Différents thèmes de carte disponibles
- **Plan gratuit généreux** : 50,000 vues/mois

## 🔧 Configuration Requise

### 1. Créer un compte Mapbox

1. Aller sur [https://www.mapbox.com/](https://www.mapbox.com/)
2. Cliquer sur "Sign up" et créer un compte gratuit
3. Vérifier votre email

### 2. Obtenir un Token d'Accès

1. Se connecter à votre compte Mapbox
2. Aller dans **Account** > **Access tokens**
3. Cliquer sur **Create a token**
4. Donner un nom au token (ex: "ImpressLola App")
5. Sélectionner les permissions :
   - ✅ **public** (pour les cartes)
   - ✅ **styles:read** (pour les styles de carte)
6. Cliquer sur **Create token**
7. **Copier le token généré**

### 3. Configurer le Token

1. Ouvrir le fichier `src/app/config/mapbox.config.ts`
2. Remplacer la ligne :
   ```typescript
   accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
   ```
3. Par votre token personnel :
   ```typescript
   accessToken: 'votre_token_mapbox_ici',
   ```

## 🎨 Styles de Carte Disponibles

Mapbox propose plusieurs styles professionnels :

- **Streets** : Carte routière classique
- **Outdoors** : Carte pour activités extérieures
- **Light** : Style épuré et moderne
- **Dark** : Thème sombre
- **Satellite** : Vue satellite
- **Satellite Streets** : Satellite avec routes
- **Navigation** : Optimisé pour la navigation

## 📍 Fonctionnalités Implémentées

### Recherche d'Adresse
- Barre de recherche intégrée
- Suggestions automatiques
- Geocoding en temps réel
- Limité à la France

### Marqueur Interactif
- Marqueur personnalisé moderne
- Animation de pulsation
- Popup informatif
- Déplacement par glisser-déposer

### Contrôles de Carte
- Zoom +/-
- Plein écran
- Géolocalisation
- Navigation fluide

### Coordonnées Automatiques
- Mise à jour en temps réel
- Affichage formaté
- Validation automatique

## 💰 Plan Gratuit

Le plan gratuit Mapbox inclut :
- **50,000 vues de carte** par mois
- **100,000 requêtes de geocoding** par mois
- **50,000 requêtes de style** par mois

## 🚀 Démarrage Rapide

1. **Installer les dépendances** :
   ```bash
   npm install mapbox-gl @types/mapbox-gl
   ```

2. **Configurer le token** (voir section ci-dessus)

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
- Vérifier que le token est correct
- Vérifier la connexion internet
- Consulter la console du navigateur

### Recherche d'adresse ne fonctionne pas
- Vérifier les permissions du token
- Vérifier les limites du plan gratuit
- Tester avec une adresse simple

### Performance lente
- Vérifier la connexion internet
- Réduire le niveau de zoom
- Utiliser un style plus simple

## 📱 Responsive Design

La carte s'adapte automatiquement :
- **Desktop** : Hauteur 500px
- **Tablet** : Hauteur 400px  
- **Mobile** : Hauteur 300px

## 🎯 Prochaines Améliorations

- [ ] Sélecteur de style de carte
- [ ] Mode satellite
- [ ] Calcul de distance
- [ ] Itinéraires
- [ ] Zones de recherche personnalisées

## 📞 Support

Pour toute question sur Mapbox :
- [Documentation Mapbox](https://docs.mapbox.com/)
- [Support Mapbox](https://support.mapbox.com/)
- [Pricing Mapbox](https://www.mapbox.com/pricing)

---

**Note** : Le token fourni dans le code est un exemple. Vous devez créer votre propre token pour utiliser l'application en production. 