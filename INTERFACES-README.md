# Interfaces d'Inscription et Connexion - CAF 2025

## Vue d'ensemble

Ce projet propose deux interfaces modernes et intuitives pour l'application de location de maisons pour le CAF 2025 :

1. **Interface d'Inscription** - Permet aux utilisateurs de créer un compte en tant que locataire ou locateur
2. **Interface de Connexion** - Permet aux utilisateurs de se connecter à leur compte

## Fonctionnalités

### Interface d'Inscription (`/inscription`)

#### Sélection du type d'utilisateur
- **Locataire** 🏠 : Pour les personnes cherchant à louer un logement
- **Locateur** 🔑 : Pour les propriétaires proposant des logements

#### Formulaire Locataire
**Informations personnelles :**
- Prénom et nom
- Email et téléphone
- Date de naissance
- Mot de passe

**Adresse personnelle :**
- Adresse complète
- Ville et code postal
- Pays

**Informations professionnelles :**
- Profession et employeur
- Revenu annuel
- Date d'embauche

**Informations du garant :**
- Nom et téléphone du garant
- Email et adresse du garant

#### Formulaire Locateur
**Informations personnelles :** (mêmes champs que locataire)
**Adresse personnelle :** (mêmes champs que locataire)
**Informations professionnelles :** (mêmes champs que locataire)
**Informations professionnelles spécifiques :**
- Numéro SIRET (14 chiffres)
- Raison sociale
- Adresse professionnelle

### Interface de Connexion (`/login`)

- **Email** : Champ email avec validation
- **Mot de passe** : Champ mot de passe avec option d'affichage/masquage
- **Bouton de connexion** : Avec indicateur de chargement
- **Lien vers l'inscription** : Pour les nouveaux utilisateurs

## API Endpoints

### Inscription
- `POST /api/locataires` - Création d'un compte locataire
- `POST /api/locateurs` - Création d'un compte locateur

### Connexion
- `POST /api/auth/login` - Authentification utilisateur

## Configuration Backend

Le backend doit être configuré sur `localhost:8083` avec les endpoints suivants :

### Structure des données Locataire
```json
{
  "email": "jean.dupont@example.com",
  "motDePasse": "password123",
  "nom": "Dupont",
  "prenom": "Jean",
  "telephone": "0123456789",
  "dateNaissance": "1990-05-15",
  "adresse": "123 Rue de la Paix, 75001 Paris",
  "ville": "Paris",
  "codePostal": "75001",
  "pays": "France",
  "profession": "Développeur",
  "revenuAnnuel": 45000,
  "employeur": "TechCorp",
  "dateEmbauche": "2020-03-01",
  "garantNom": "Marie Dupont",
  "garantTelephone": "0987654321",
  "garantEmail": "marie.dupont@example.com",
  "garantAdresse": "456 Avenue des Champs, 75008 Paris"
}
```

### Structure des données Locateur
```json
{
  "email": "pierre.martin@example.com",
  "motDePasse": "password123",
  "nom": "Martin",
  "prenom": "Pierre",
  "telephone": "0123456789",
  "dateNaissance": "1985-08-20",
  "adresse": "789 Boulevard Saint-Germain, 75006 Paris",
  "ville": "Paris",
  "codePostal": "75006",
  "pays": "France",
  "profession": "Architecte",
  "revenuAnnuel": 65000,
  "employeur": "ArchitecturePlus",
  "dateEmbauche": "2018-09-15",
  "numeroSiret": "12345678901234",
  "raisonSociale": "Martin Immobilier",
  "adresseProfessionnelle": "123 Avenue de l'Opéra, 75001 Paris"
}
```

## Fonctionnalités UX/UI

### Design Responsive
- Interface adaptée aux mobiles, tablettes et ordinateurs
- Grille flexible pour les formulaires
- Boutons et champs optimisés pour le tactile

### Validation en Temps Réel
- Validation des champs email
- Validation du format SIRET (14 chiffres)
- Messages d'erreur contextuels
- Indicateurs visuels pour les champs invalides

### Animations et Transitions
- Transitions fluides entre les états
- Animations de chargement
- Effets hover sur les boutons
- Animations de focus sur les champs

### Accessibilité
- Labels appropriés pour les lecteurs d'écran
- Navigation au clavier
- Contraste de couleurs approprié
- Messages d'erreur clairs

## Installation et Utilisation

1. **Démarrer le backend** sur `localhost:8083`
2. **Lancer l'application Angular** : `ng serve`
3. **Accéder à l'application** : `http://localhost:4200`

## Routes Disponibles

- `/login` - Page de connexion
- `/inscription` - Page d'inscription
- `/dashboard` - Tableau de bord (après connexion)

## Technologies Utilisées

- **Angular 17** - Framework principal
- **Reactive Forms** - Gestion des formulaires
- **CSS Grid & Flexbox** - Layout responsive
- **CSS Gradients** - Design moderne
- **TypeScript** - Typage statique
- **HTTP Client** - Appels API

## Sécurité

- Validation côté client et serveur
- Chiffrement des mots de passe
- Tokens JWT pour l'authentification
- Protection CSRF
- Headers de sécurité appropriés 