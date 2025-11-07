# Guide d'implémentation - Flux de Paiement avec Split 80/20

## 📋 Vue d'ensemble

Ce document explique comment le système de paiement avec répartition automatique 80/20 a été intégré dans l'application frontend Angular.

### Principe de fonctionnement

Lorsqu'un locataire effectue un paiement pour une réservation :
- **80%** du montant est transféré au locateur (propriétaire)
- **20%** du montant reste sur la plateforme (commission)

Le backend génère automatiquement les instructions de transaction lors de la confirmation du paiement.

---

## 🏗️ Architecture du système

### 1. Services mis à jour

#### `src/app/services/api.service.ts`

Nouveaux endpoints ajoutés :

```typescript
// Créer un paiement
creerPaiement(request: any): Observable<any>

// Confirmer un paiement (génère automatiquement les transactions 80/20)
confirmerPaiement(paiementId: string, request: any): Observable<any>

// Récupérer un paiement par ID
getPaiementById(paiementId: string): Observable<any>

// Récupérer les paiements d'une réservation
getPaiementsByReservation(reservationId: string): Observable<any[]>

// Récupérer les instructions de transaction d'un paiement
getInstructionsByPaiement(paiementId: string): Observable<TransactionInstructionDTO[]>
```

### 2. Composant de paiement locataire

#### `src/app/components/paiements-locataire/paiements-locataire.component.ts`

La méthode `effectuerPaiement()` a été améliorée pour :

1. **Vérifier le RIB du locataire** (pour les remboursements éventuels)
2. **Afficher le split 80/20** avant confirmation
3. **Simuler le PSP** (Stripe, PayPal, etc.)
4. **Confirmer le paiement** avec référence de transaction
5. **Récupérer et afficher** les instructions générées

---

## 🔄 Flux de paiement détaillé

### Étape 1 : Création de la réservation

Lorsqu'un locataire crée une réservation, celle-ci est créée avec le statut `EN_ATTENTE`.

```typescript
// Dans reservation.service.ts
creerReservation(reservation, locataireId) {
  // Crée la réservation
  // Statut initial: EN_ATTENTE
}
```

### Étape 2 : Confirmation par le locateur

Le locateur confirme la réservation, ce qui la fait passer au statut `CONFIRMEE`.

### Étape 3 : Création du paiement

Un paiement est créé automatiquement ou manuellement pour la réservation :

```typescript
const paiementRequest = {
  reservationId: reservation.id,
  montant: 350.00,
  typePaiement: 'TOTAL',
  modePaiement: 'CARTE_BANCAIRE',
  description: 'Paiement pour réservation...'
};

// Le backend crée le paiement (statut: EN_ATTENTE)
// ET génère automatiquement 2 instructions en PENDING:
// - Instruction 1: 280€ (80%) -> Locateur
// - Instruction 2: 70€ (20%) -> Plateforme
```

### Étape 4 : Locataire effectue le paiement

Le locataire clique sur "Payer" :

```typescript
async effectuerPaiement(paiement: Paiement) {
  // 1. Vérifier le RIB du locataire
  // 2. Calculer et afficher le split 80/20
  const montantLocateur = paiement.montant * 0.8;  // 80%
  const montantPlateforme = paiement.montant * 0.2;  // 20%
  
  // 3. Demander confirmation
  const confirmation = confirm(`
    💰 Récapitulatif du paiement:
    Montant total: ${montant}
    • 80% au propriétaire: ${montantLocateur}
    • 20% commission plateforme: ${montantPlateforme}
  `);
  
  // 4. Marquer en cours
  await this.paiementService.marquerEnCours(paiement.id);
  
  // 5. Simuler PSP (2 secondes)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 6. Confirmer le paiement
  const numeroTransaction = `TXN-STRIPE-${Date.now()}`;
  const paiementConfirme = await this.paiementService.confirmerPaiement(
    paiement.id,
    { numeroTransaction, referenceExterne: 'pi_abc123...' }
  );
  
  // ⚠️ Le backend fait automatiquement:
  // - Marque le paiement comme PAYE
  // - Marque les 2 instructions (80/20) comme EXECUTED
  // - Crée une instruction PAYIN (locataire → plateforme)
  
  // 7. Récupérer et afficher les transactions générées
  const instructions = await this.apiService.getInstructionsByPaiement(paiement.id);
  // Affiche: "2 transactions générées: 1 paiement locateur, 1 commission plateforme"
}
```

---

## 📊 Types de transactions générées

### 1. PAYIN_PLATEFORME
- **De:** Locataire
- **Vers:** Plateforme
- **Montant:** 100% du paiement
- **Quand:** Lors de la confirmation du paiement

### 2. PAYOUT_LOCATEUR
- **De:** Plateforme
- **Vers:** Locateur
- **Montant:** 80% du paiement
- **Quand:** Lors de la confirmation du paiement

### 3. COMMISSION_PLATEFORME
- **De:** Plateforme
- **Vers:** Plateforme
- **Montant:** 20% du paiement
- **Quand:** Lors de la confirmation du paiement

---

## 🎯 Exemple complet

### Scénario : Paiement de 350,00 MAD

#### 1. Création du paiement
```json
POST /api/paiements
{
  "reservationId": "res-001",
  "montant": 350.00,
  "typePaiement": "TOTAL",
  "modePaiement": "CARTE_BANCAIRE",
  "description": "Paiement pour Studio Paris"
}
```

**Backend génère automatiquement :**
```json
[
  {
    "id": "instr-001",
    "type": "PAYOUT_LOCATEUR",
    "statut": "PENDING",
    "montant": 280.00,  // 80%
    "notes": "Split 80% au locateur"
  },
  {
    "id": "instr-002",
    "type": "COMMISSION_PLATEFORME",
    "statut": "PENDING",
    "montant": 70.00,  // 20%
    "notes": "Commission 20% plateforme"
  }
]
```

#### 2. Confirmation du paiement
```json
PUT /api/paiements/{paiementId}/confirmer
{
  "numeroTransaction": "TXN-STRIPE-20251025-ABC123",
  "referenceExterne": "pi_3Abc123Def456Ghi789"
}
```

**Backend met à jour automatiquement :**
```json
{
  "paiement": {
    "statut": "PAYE",
    "numeroTransaction": "TXN-STRIPE-20251025-ABC123"
  },
  "instructions": [
    {
      "id": "instr-001",
      "type": "PAYOUT_LOCATEUR",
      "statut": "EXECUTED",  // ✅ Marqué comme exécuté
      "montant": 280.00,
      "reference": "TXN-STRIPE-20251025-ABC123"
    },
    {
      "id": "instr-002",
      "type": "COMMISSION_PLATEFORME",
      "statut": "EXECUTED",  // ✅ Marqué comme exécuté
      "montant": 70.00,
      "reference": "TXN-STRIPE-20251025-ABC123"
    },
    {
      "id": "instr-003",
      "type": "PAYIN_PLATEFORME",
      "statut": "EXECUTED",
      "montant": 350.00,  // 100% encaissé
      "notes": "Encaissement du locataire"
    }
  ]
}
```

---

## 🧪 Comment tester

### 1. Prérequis
- Backend lancé sur `http://localhost:8083`
- Frontend lancé sur `http://localhost:4200`
- Un compte locataire et un compte locateur créés
- Une annonce publiée par le locateur
- Une réservation créée et confirmée

### 2. Étapes de test

1. **Connexion en tant que locataire**
   ```
   Se connecter avec un compte locataire
   ```

2. **Naviguer vers les paiements**
   ```
   Menu → Mes Paiements
   ```

3. **Effectuer un paiement**
   ```
   Cliquer sur "Payer" pour un paiement EN_ATTENTE
   Vérifier l'affichage du split 80/20
   Confirmer le paiement
   ```

4. **Vérifier les transactions générées**
   ```
   Ouvrir la console du navigateur (F12)
   Vérifier les logs:
   - ✅ Paiement confirmé
   - ✅ Instructions récupérées
   - ✅ 2 transactions générées (80/20)
   ```

5. **Vérifier le solde**
   ```
   Section "Solde" → Vérifier que le montant est correct
   Section "Derniers encaissements" → Vérifier les transactions EXECUTED
   ```

6. **Connexion en tant que locateur**
   ```
   Se connecter avec le compte locateur
   Menu → Paiements → Vérifier l'encaissement de 80%
   ```

### 3. Tests console

```javascript
// Dans la console du navigateur (après effectuerPaiement)
// Vous devriez voir :

🔄 Démarrage du flux de paiement...
📝 Étape 1: Marquer le paiement en cours...
💳 Étape 2: Simulation du traitement PSP (2 secondes)...
✅ Étape 3: Confirmation du paiement avec le backend...
   Numéro transaction: TXN-STRIPE-1729863000000
   Référence externe: pi_abc123xyz
✅ Paiement confirmé: {...}
📊 Étape 4: Récupération des instructions de transaction...
✅ Instructions récupérées: [
  { type: "PAYOUT_LOCATEUR", montant: 280, statut: "EXECUTED" },
  { type: "COMMISSION_PLATEFORME", montant: 70, statut: "EXECUTED" },
  { type: "PAYIN_PLATEFORME", montant: 350, statut: "EXECUTED" }
]
```

---

## 🔍 Débogage

### Problème : Paiement ne se confirme pas

**Vérifier :**
1. Le backend est lancé et accessible
2. La réservation est au statut `CONFIRMEE`
3. Le locateur a un RIB configuré avec `defautCompte: true`
4. La plateforme a un RIB (créé automatiquement au démarrage)

### Problème : Transactions non générées

**Vérifier :**
1. L'endpoint `/api/payouts/paiement/{paiementId}` retourne des données
2. Les logs du backend pour voir si les instructions sont créées
3. La table `transaction_instruction` dans la base de données

### Problème : Split incorrect

**Vérifier :**
1. Le montant du paiement est correct
2. Les calculs dans le frontend (80% et 20%)
3. Les calculs dans le backend (PaiementService.java)

---

## 📚 Ressources

- **Guide backend complet :** `PAIEMENT_TRANSACTIONS_SOLDES.md`
- **Guide API :** `GUIDE_FRONTEND_PAIEMENT_SPLIT_80_20.md`
- **Modèles TypeScript :** `src/app/models/transaction-instruction.model.ts`
- **Service API :** `src/app/services/api.service.ts`
- **Service Paiement :** `src/app/services/paiement.service.ts`

---

## ✅ Checklist d'implémentation

- [x] Service API mis à jour avec les nouveaux endpoints
- [x] Méthode `effectuerPaiement()` améliorée avec split 80/20
- [x] Affichage du récapitulatif avant paiement
- [x] Simulation PSP intégrée
- [x] Récupération des instructions de transaction
- [x] Affichage des transactions générées
- [x] Gestion des erreurs
- [x] Logs détaillés pour le débogage
- [x] Documentation complète

---

## 🚀 Prochaines étapes (optionnel)

### Améliorations possibles :

1. **Interface visuelle améliorée**
   - Modal avec animation pour le processus de paiement
   - Graphique circulaire montrant le split 80/20
   - Timeline des étapes du paiement

2. **Intégration PSP réelle**
   - Stripe Checkout
   - PayPal
   - Gestion des webhooks

3. **Notifications**
   - Email de confirmation au locataire
   - Email de notification au locateur (80% reçu)
   - Notifications push dans l'application

4. **Historique détaillé**
   - Page dédiée aux transactions
   - Filtres avancés
   - Export en PDF/CSV

5. **Dashboard analytics**
   - Graphiques des paiements
   - Évolution des commissions
   - Statistiques par locateur

---

**Dernière mise à jour :** 25 octobre 2025  
**Version :** 1.0  
**Auteur :** Équipe ImprèssLola


