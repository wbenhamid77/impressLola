# 🏠 Composants de Réservation - Guide d'Utilisation

## 📋 **Vue d'ensemble**

Ce module contient des composants Angular complets pour la gestion des réservations, conçus pour fonctionner avec votre API de réservations. Les composants sont **standalone** et utilisent Angular 17+.

## 🎯 **Composants Disponibles**

### **1. ReservationsLocataireComponent**
**Sélecteur :** `app-reservations-locataire`

**Fonctionnalités :**
- ✅ Vue d'ensemble des réservations du locataire
- ✅ Création de nouvelles réservations
- ✅ Filtrage par statut et recherche
- ✅ Pagination intelligente
- ✅ Gestion des réservations (annulation, détails)

**Utilisation :**
```html
<app-reservations-locataire></app-reservations-locataire>
```

### **2. ReservationsLocateurComponent**
**Sélecteur :** `app-reservations-locateur`

**Fonctionnalités :**
- ✅ Tableau de bord avec statistiques
- ✅ Gestion des statuts des réservations
- ✅ Actions contextuelles selon le statut
- ✅ Filtrage avancé par période et statut
- ✅ Interface d'administration complète

**Utilisation :**
```html
<app-reservations-locateur></app-reservations-locateur>
```

### **3. ReservationCreateComponent**
**Sélecteur :** `app-reservation-create`

**Fonctionnalités :**
- ✅ Formulaire de création complet
- ✅ Validation en temps réel
- ✅ Calcul de récapitulatif
- ✅ Gestion des frais additionnels
- ✅ Interface utilisateur intuitive

**Utilisation :**
```html
<app-reservation-create
  [annonceId]="'annonce-123'"
  [locataireId]="'user-456'"
  (reservationCreee)="onReservationCreee($event)"
  (annulation)="onAnnulation()"
></app-reservation-create>
```

## 🚀 **Installation et Configuration**

### **1. Importer les composants**
```typescript
import { ReservationsLocataireComponent } from './components/reservation-locataire/reservations-locataire.component';
import { ReservationsLocateurComponent } from './components/reservation-locateur/reservations-locateur.component';
import { ReservationCreateComponent } from './components/reservation/reservation-create.component';
```

### **2. Ajouter aux imports du composant**
```typescript
@Component({
  selector: 'app-mon-composant',
  standalone: true,
  imports: [
    CommonModule,
    ReservationsLocataireComponent,
    ReservationsLocateurComponent,
    ReservationCreateComponent
  ],
  // ...
})
```

### **3. Utiliser dans le template**
```html
<!-- Pour les locataires -->
<app-reservations-locataire></app-reservations-locataire>

<!-- Pour les locateurs -->
<app-reservations-locateur></app-reservations-locateur>

<!-- Pour créer une réservation -->
<app-reservation-create
  [annonceId]="monAnnonceId"
  [locataireId]="monLocataireId"
  (reservationCreee)="gererReservationCreee($event)"
  (annulation)="gererAnnulation()"
></app-reservation-create>
```

## 🔧 **Configuration Requise**

### **Services nécessaires :**
- `ReservationService` - Gestion des API de réservations
- `AuthService` - Authentification et gestion des sessions

### **Modèles requis :**
- `Reservation` - Interface de réservation
- `RecapitulatifRequest` - Requête de récapitulatif
- `RecapitulatifResponse` - Réponse de récapitulatif

### **Dépendances :**
- Angular 17+
- RxJS
- FontAwesome (pour les icônes)

## 📱 **Responsive Design**

Tous les composants sont **100% responsifs** et s'adaptent automatiquement :
- **Desktop** : Layout en grille avec toutes les fonctionnalités
- **Tablet** : Adaptation des colonnes et espacement
- **Mobile** : Layout vertical optimisé pour le tactile

## 🎨 **Personnalisation des Styles**

### **Variables CSS personnalisables :**
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #48bb78;
  --warning-color: #ed8936;
  --danger-color: #e53e3e;
  --border-radius: 12px;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
```

### **Classes utilitaires :**
- `.btn-primary`, `.btn-secondary`, `.btn-success`
- `.badge-warning`, `.badge-success`, `.badge-danger`
- `.form-control`, `.form-select`
- `.alert-danger`, `.alert-success`

## 🔌 **API Endpoints Utilisés**

Les composants utilisent automatiquement ces endpoints :

### **Locataires :**
- `GET /api/reservations/locataire/{id}` - Réservations du locataire
- `GET /api/reservations/locataire/{id}/futures` - Réservations futures
- `GET /api/reservations/locataire/{id}/passees` - Réservations passées
- `POST /api/reservations/recapitulatif` - Calcul récapitulatif
- `POST /api/reservations` - Création réservation
- `PUT /api/reservations/{id}/annuler` - Annulation

### **Locateurs :**
- `GET /api/reservations/locateur/{id}` - Réservations du locateur
- `GET /api/locateurs/{id}/reservations/recapitulatif` - Statistiques
- `GET /api/locateurs/{id}/reservations/en-attente` - En attente
- `PUT /api/reservations/{id}/confirmer` - Confirmation
- `PUT /api/reservations/{id}/statut` - Changement statut

## 🧪 **Tests et Démonstration**

### **Composant de démonstration :**
```typescript
import { DemoReservationComponent } from './components/reservation/demo-reservation.component';
```

Ce composant montre tous les composants en action avec des données de test.

## 🚨 **Gestion des Erreurs**

Tous les composants incluent :
- ✅ **Validation des formulaires** en temps réel
- ✅ **Gestion des erreurs API** avec messages utilisateur
- ✅ **États de chargement** avec spinners
- ✅ **Messages de succès** pour les actions réussies
- ✅ **Fallbacks** pour les données manquantes

## 📊 **Fonctionnalités Avancées**

### **Pagination intelligente :**
- Navigation par pages avec indicateurs
- Gestion des séparateurs pour les longues listes
- Boutons précédent/suivant contextuels

### **Filtrage avancé :**
- Filtrage par statut (EN_ATTENTE, CONFIRMEE, etc.)
- Filtrage par période (futures, en cours, passées)
- Recherche textuelle sur tous les champs

### **Statistiques en temps réel :**
- Compteurs de réservations par statut
- Revenus totaux pour les locateurs
- Mise à jour automatique des données

## 🔒 **Sécurité**

- ✅ **Validation côté client** des formulaires
- ✅ **Sanitisation** des entrées utilisateur
- ✅ **Gestion des sessions** via AuthService
- ✅ **Contrôle d'accès** basé sur les rôles

## 🚀 **Performance**

- ✅ **Lazy loading** des composants
- ✅ **Gestion de la mémoire** avec OnDestroy
- ✅ **Optimisation des requêtes** avec RxJS
- ✅ **Cache intelligent** des données

## 📝 **Exemples d'Usage**

### **Intégration dans une page de profil :**
```html
<div class="profile-page">
  <app-profile-header></app-profile-header>
  
  <div class="profile-content">
    <app-reservations-locataire></app-reservations-locataire>
  </div>
</div>
```

### **Intégration dans un dashboard :**
```html
<div class="dashboard">
  <app-dashboard-header></app-dashboard-header>
  
  <div class="dashboard-content">
    <app-reservations-locateur></app-reservations-locateur>
  </div>
</div>
```

### **Modal de création de réservation :**
```html
<div class="modal" *ngIf="showCreateModal">
  <app-reservation-create
    [annonceId]="selectedAnnonce.id"
    [locataireId]="currentUser.id"
    (reservationCreee)="onReservationCreated($event)"
    (annulation)="closeModal()"
  ></app-reservation-create>
</div>
```

## 🆘 **Support et Maintenance**

### **Logs et débogage :**
Tous les composants incluent des logs détaillés :
- `console.log` pour les actions utilisateur
- `console.error` pour les erreurs
- Indicateurs visuels de chargement

### **Maintenance :**
- Code modulaire et réutilisable
- Documentation complète des méthodes
- Tests unitaires recommandés
- Mise à jour facile des dépendances

---

**🎉 Votre système de réservations est maintenant prêt à l'emploi !** 