
# 📄 Spécification Design – Page de Login CAN 2025 Maroc

## 🎯 Objectif
Créer une **page de connexion Angular** inspirée de la tradition marocaine et de l’événement **CAN 2025** au Maroc.  
Le formulaire de login doit apparaître **dans un espace blanc centré**, en reprenant le design de l’image fournie.

---

## 🖼️ Design à reproduire
- **Fond principal** :  
  - Partie supérieure en **rouge** (motifs géométriques marocains).  
  - Partie inférieure en **vert** (motifs similaires).  
- **Éléments visuels** :  
  - En haut : texte **“CAN 2025”** accompagné d’un ballon de football stylisé.  
  - À gauche : une **lanterne marocaine dorée**.  
  - À droite : silhouettes **d’architecture marocaine** (arcades, minaret).  
- **Espace central** :  
  - Un **rectangle blanc aux coins arrondis** (style carte moderne).  
  - Cet espace est réservé pour le **formulaire de login**.  

---

## 📋 Contenu attendu du formulaire
Le formulaire de login doit contenir :  
1. **Champ Email** (obligatoire, type email).  
2. **Champ Mot de passe** (obligatoire, type password).  
3. **Case à cocher** "Se souvenir de moi".  
4. **Lien** "Mot de passe oublié ?".  
5. **Bouton** "Se connecter" (vert, large, moderne).  

---

## 🎨 Style attendu
- **Formulaire** :  
  - Centré dans le rectangle blanc.  
  - Texte et labels sobres et lisibles.  
  - Bouton arrondi, couleur **verte (#008000)**.  
- **Police** : moderne, sans-serif (ex: *Roboto*).  
- **Responsive** : doit s’adapter à différentes tailles d’écran.  

---

## 📂 Intégration Angular
- Créer un composant `login` avec Angular (`ng generate component login`).  
- Utiliser **ReactiveFormsModule** pour gérer le formulaire.  
- Associer le design via le **HTML + CSS** en respectant le schéma ci-dessus.  
- Le rectangle blanc (formulaire) doit être **injecté au centre du fond décoratif**.  

---

## ✅ Résultat attendu
Une page de connexion professionnelle qui :  
- Donne une **impression marocaine** (tradition + couleurs nationales).  
- Reflète l’esprit de la **CAN 2025 et du football**.  
- Contient un **formulaire clair, moderne et utilisable**.  
