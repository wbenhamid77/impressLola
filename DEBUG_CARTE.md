# 🗺️ Guide de Debug pour la Carte

## Problème de Carte qui ne s'affiche pas

### ✅ **Étapes de Vérification**

#### 1. **Redémarrer le Serveur Angular**
```bash
# Arrêter le serveur (Ctrl+C)
ng serve
```
**Raison :** Les changements dans `angular.json` (ajout du CSS Leaflet) nécessitent un redémarrage.

#### 2. **Ouvrir la Console du Navigateur**
1. Aller sur la page d'ajout d'annonce
2. Appuyer sur `F12` pour ouvrir les DevTools
3. Aller dans l'onglet `Console`

#### 3. **Naviguer vers l'Étape 4 (Localisation)**
- Cliquez sur l'étape 4 dans la navigation
- Regardez les logs dans la console

#### 4. **Logs Attendus dans la Console**
```
Début de l'initialisation de la carte étape 4...
Container map étape 4 trouvé: true
Dimensions du conteneur définies: 450px 450px
Création de la carte Leaflet...
Carte Leaflet créée avec succès
Tentative avec OpenStreetMap...
```

#### 5. **Test Manuel dans la Console**
Tapez dans la console du navigateur :
```javascript
// Accéder au composant Angular (dans la console)
const component = ng.getComponent(document.querySelector('app-ajouter-annonce'));

// Test de diagnostic
component.testMap();

// Si aucune carte ne s'affiche, forcer l'affichage d'une carte simple
component.createSimpleMap();
```

### 🔍 **Scénarios Possibles**

#### ✅ **Scénario 1 : Carte Leaflet Fonctionne**
- Vous voyez une vraie carte interactive avec des tuiles
- Le marqueur est déplaçable
- Les contrôles de zoom fonctionnent

#### ✅ **Scénario 2 : Carte Fallback s'affiche**
- Vous voyez une carte stylisée avec un fond dégradé bleu
- Un marqueur vert/rouge au centre
- Les coordonnées affichées en bas

#### ⚠️ **Scénario 3 : Erreur Visible**
- Un message d'erreur s'affiche avec un bouton "Réessayer"
- Cliquez sur "Réessayer" pour relancer l'initialisation

### 🛠️ **Solutions selon les Erreurs**

#### **Erreur : "Container map étape 4 non trouvé"**
- Vérifiez que vous êtes bien à l'étape 4
- Rafraîchissez la page (F5)

#### **Erreur de Chargement des Tuiles**
- Problème de connexion internet
- La carte fallback devrait s'afficher automatiquement

#### **Console Vide (aucun log)**
- Le serveur Angular n'est pas redémarré
- Rafraîchissez la page après redémarrage

### 🎯 **Test Final**
Si tout fonctionne :
1. ✅ Vous voyez une carte (vraie ou fallback)
2. ✅ Aucune erreur dans la console
3. ✅ L'interface est responsive et professionnelle

### 📞 **Support**
Si le problème persiste :
1. Copiez les logs de la console
2. Faites une capture d'écran de ce qui s'affiche
3. Mentionnez le navigateur utilisé (Chrome, Firefox, etc.)
