# 🧪 Plan de test - Flux de paiement avec transactions 80/20

## Objectif
Vérifier que le système génère correctement les transactions 80/20 lors d'un paiement et que toutes les données sont affichées correctement dans le frontend.

---

## 📋 Prérequis

### 1. Environnement
- ✅ Backend lancé sur `http://localhost:8083`
- ✅ Frontend lancé sur `http://localhost:4200`
- ✅ Base de données configurée et accessible

### 2. Données de test
- ✅ Un compte locateur créé et vérifié
- ✅ Un compte locataire créé et vérifié
- ✅ Une annonce publiée par le locateur
- ✅ Le locateur a configuré un RIB avec `defautCompte: true`

---

## 🎬 Scénario de test principal

### Test 1 : Création de réservation et paiement

#### Étape 1.1 : Créer une réservation (Locataire)
```
1. Se connecter en tant que locataire
2. Naviguer vers la liste des annonces
3. Choisir une annonce
4. Créer une réservation pour 3 nuits
   - Date arrivée : J+7
   - Date départ : J+10
   - Montant attendu : 350,00 MAD (exemple)
5. Vérifier : Réservation créée avec statut "EN_ATTENTE"
```

**Résultat attendu :**
- ✅ Réservation visible dans "Mes Réservations"
- ✅ Statut : EN_ATTENTE
- ✅ Montant total : 350,00 MAD

---

#### Étape 1.2 : Confirmer la réservation (Locateur)
```
1. Se déconnecter du compte locataire
2. Se connecter en tant que locateur
3. Naviguer vers "Mes Réservations"
4. Trouver la réservation en attente
5. Cliquer sur "Confirmer"
```

**Résultat attendu :**
- ✅ Réservation passe au statut "CONFIRMEE"
- ✅ Un paiement est créé automatiquement (statut: EN_ATTENTE)

---

#### Étape 1.3 : Effectuer le paiement (Locataire)
```
1. Se déconnecter du compte locateur
2. Se connecter en tant que locataire
3. Naviguer vers "Mes Paiements"
4. Trouver le paiement EN_ATTENTE
5. Cliquer sur "Payer"
```

**Résultat attendu :**
```
📋 Pop-up de confirmation s'affiche avec :

💰 Récapitulatif du paiement:

Montant total: 350,00 MAD

Répartition automatique:
• 80% au propriétaire: 280,00 MAD
• 20% commission plateforme: 70,00 MAD

✅ Les transactions seront générées automatiquement.

Confirmer le paiement ?
[Oui] [Non]
```

---

#### Étape 1.4 : Confirmer le paiement
```
1. Cliquer sur "Oui" dans la pop-up
2. Attendre 2 secondes (simulation PSP)
3. Observer les logs dans la console du navigateur (F12)
```

**Résultat attendu dans la console :**
```
🔄 Démarrage du flux de paiement...
📝 Étape 1: Marquer le paiement en cours...
💳 Étape 2: Simulation du traitement PSP (2 secondes)...
✅ Étape 3: Confirmation du paiement avec le backend...
   Numéro transaction: TXN-STRIPE-1729863000000
   Référence externe: pi_abc123xyz456
✅ Paiement confirmé: {id: "...", statut: "PAYE", ...}
📊 Étape 4: Récupération des instructions de transaction...
✅ Instructions récupérées: [
  {
    id: "...",
    type: "PAYOUT_LOCATEUR",
    statut: "EXECUTED",
    montant: 280.00,
    reference: "TXN-STRIPE-1729863000000"
  },
  {
    id: "...",
    type: "COMMISSION_PLATEFORME",
    statut: "EXECUTED",
    montant: 70.00,
    reference: "TXN-STRIPE-1729863000000"
  },
  {
    id: "...",
    type: "PAYIN_PLATEFORME",
    statut: "EXECUTED",
    montant: 350.00,
    reference: "TXN-STRIPE-1729863000000"
  }
]
```

**Pop-up de confirmation finale :**
```
✅ Paiement effectué avec succès!

💳 Numéro de transaction: TXN-STRIPE-1729863000000

📊 Transactions générées automatiquement:

• 1 paiement(s) au propriétaire (80%)
• 1 commission(s) plateforme (20%)
• 1 encaissement(s) plateforme

✅ Toutes les transactions ont été exécutées avec succès.
```

---

#### Étape 1.5 : Vérifier la section "Solde" (Locataire)
```
1. Après fermeture de la pop-up
2. Observer la section "Solde"
3. Observer la section "Derniers encaissements"
```

**Résultat attendu :**
```
Solde
├─ Entrées : 0,00 MAD (le locataire ne reçoit rien pour ce paiement)
├─ Sorties : 0,00 MAD
└─ Net : 0,00 MAD

Derniers encaissements
└─ (Aucun encaissement pour le locataire)
```

---

#### Étape 1.6 : Vérifier côté locateur
```
1. Se déconnecter du compte locataire
2. Se connecter en tant que locateur
3. Naviguer vers "Mes Paiements"
4. Observer la section "Solde"
5. Observer la section "Derniers encaissements"
```

**Résultat attendu :**
```
Solde
├─ Entrées : 280,00 MAD (80% du paiement de 350 MAD)
├─ Sorties : 0,00 MAD
└─ Net : 280,00 MAD

Derniers encaissements
└─ PAYOUT_LOCATEUR
   ├─ Montant : 280,00 MAD
   ├─ Ref : TXN-STRIPE-1729863000000
   ├─ Statut : EXECUTED
   └─ Date : 25/10/2025 14:35
```

---

## 🧪 Tests supplémentaires

### Test 2 : Vérification en base de données

```sql
-- Vérifier le paiement
SELECT * FROM paiement WHERE id = '{paiementId}';
-- Résultat attendu: statut = 'PAYE', numero_transaction = 'TXN-STRIPE-...'

-- Vérifier les instructions de transaction
SELECT * FROM transaction_instruction WHERE paiement_id = '{paiementId}';
-- Résultat attendu: 3 lignes
-- 1. PAYOUT_LOCATEUR (280 MAD) - EXECUTED
-- 2. COMMISSION_PLATEFORME (70 MAD) - EXECUTED
-- 3. PAYIN_PLATEFORME (350 MAD) - EXECUTED

-- Vérifier les montants
SELECT type, SUM(montant) as total
FROM transaction_instruction
WHERE paiement_id = '{paiementId}' AND statut = 'EXECUTED'
GROUP BY type;
-- Résultat attendu:
-- PAYOUT_LOCATEUR: 280.00
-- COMMISSION_PLATEFORME: 70.00
-- PAYIN_PLATEFORME: 350.00
```

---

### Test 3 : Vérification via les endpoints API

```bash
# 1. Récupérer le paiement
curl -X GET http://localhost:8083/api/paiements/{paiementId} \
  -H "Authorization: Bearer {token}"

# 2. Récupérer les instructions du paiement
curl -X GET http://localhost:8083/api/payouts/paiement/{paiementId} \
  -H "Authorization: Bearer {token}"

# 3. Vérifier le solde du locateur
curl -X GET http://localhost:8083/api/payouts/solde/locateur/{locateurId} \
  -H "Authorization: Bearer {token}"

# 4. Vérifier les encaissements du locateur
curl -X GET http://localhost:8083/api/payouts/encaissements/locateur/{locateurId} \
  -H "Authorization: Bearer {token}"

# 5. Vérifier le solde de la plateforme
curl -X GET http://localhost:8083/api/payouts/solde/plateforme \
  -H "Authorization: Bearer {token}"
```

---

## 🐛 Tests de cas d'erreur

### Test 4 : Paiement sans RIB locateur

```
1. Créer un nouveau compte locateur
2. Ne PAS configurer de RIB
3. Créer une annonce
4. Tenter de créer une réservation et un paiement
```

**Résultat attendu :**
- ❌ Erreur lors de la confirmation du paiement
- Message : "RIB par défaut du locateur introuvable"

---

### Test 5 : Paiement expiré (24h)

```
1. Créer un paiement EN_ATTENTE
2. Modifier manuellement la date d'expiration dans la BD (< maintenant)
3. Tenter de payer
```

**Résultat attendu :**
- ❌ Erreur lors du paiement
- Message : "Le paiement a expiré"

---

### Test 6 : Réservation non confirmée

```
1. Créer une réservation (statut: EN_ATTENTE)
2. Tenter de créer un paiement manuellement via API
```

**Résultat attendu :**
- ❌ Erreur 400
- Message : "La réservation doit être confirmée pour créer un paiement"

---

## 📊 Métriques à vérifier

### Métriques frontend (Console navigateur)

```javascript
// Durée totale du processus de paiement
// Attendu : ~2-3 secondes (simulation PSP = 2s + requêtes API)

// Nombre de requêtes API
// Attendu : 
// 1. PUT /api/paiements/{id}/en-cours
// 2. PUT /api/paiements/{id}/confirmer
// 3. GET /api/payouts/paiement/{id}
// 4. GET /api/paiements/locataire/{id} (rechargement)
// 5. GET /api/payouts/encaissements/locataire/{id}
// 6. GET /api/payouts/solde/locataire/{id}

// Taille des réponses
// Vérifier que les réponses sont raisonnables (< 50 KB chacune)
```

### Métriques backend (Logs serveur)

```
// Vérifier dans les logs du backend :
- Création du paiement → 2 instructions générées (PENDING)
- Confirmation du paiement → 2 instructions marquées EXECUTED + 1 PAYIN créée
- Temps de traitement < 500ms
```

---

## ✅ Checklist de validation

### Fonctionnalités
- [ ] Création de paiement avec génération automatique des instructions 80/20
- [ ] Affichage du récapitulatif avec split avant confirmation
- [ ] Simulation PSP de 2 secondes
- [ ] Confirmation du paiement avec référence de transaction
- [ ] Récupération des instructions de transaction générées
- [ ] Affichage des transactions dans la pop-up de confirmation
- [ ] Mise à jour du solde locateur (80%)
- [ ] Mise à jour des encaissements locateur
- [ ] Affichage correct dans "Derniers encaissements"

### Interface utilisateur
- [ ] Loading spinner visible pendant le processus
- [ ] Messages d'erreur clairs en cas d'échec
- [ ] Pop-up de confirmation informative
- [ ] Rafraîchissement automatique des données après paiement
- [ ] Badge/statut "PAYÉ" visible dans la liste des paiements

### Performance
- [ ] Temps de réponse < 3 secondes pour le flux complet
- [ ] Pas de freeze de l'interface
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Pas d'erreurs 500 côté backend

### Données
- [ ] Montants corrects (80% et 20%)
- [ ] Références de transaction correctes et uniques
- [ ] Statuts des instructions : EXECUTED
- [ ] Dates de création et d'exécution correctes
- [ ] Soldes calculés correctement

---

## 📝 Rapport de test

### Date du test : ______________

### Testeur : ______________

### Environnement :
- Backend version : ______________
- Frontend version : ______________
- Navigateur : ______________

### Résultats :
```
Test 1 (Création réservation + paiement) : [ ] Pass [ ] Fail
Test 2 (Vérification BDD)                 : [ ] Pass [ ] Fail
Test 3 (Endpoints API)                    : [ ] Pass [ ] Fail
Test 4 (Erreur RIB manquant)              : [ ] Pass [ ] Fail
Test 5 (Paiement expiré)                  : [ ] Pass [ ] Fail
Test 6 (Réservation non confirmée)        : [ ] Pass [ ] Fail
```

### Notes / Observations :
```
___________________________________________________________
___________________________________________________________
___________________________________________________________
```

### Bugs trouvés :
```
___________________________________________________________
___________________________________________________________
___________________________________________________________
```

---

## 🚀 Tests de charge (optionnel)

### Scénario : 10 paiements simultanés

```javascript
// Script de test (à exécuter dans Node.js)
const axios = require('axios');

async function testMultiplePaiements() {
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.put(`http://localhost:8083/api/paiements/${paiementIds[i]}/confirmer`, {
        numeroTransaction: `TXN-TEST-${i}`,
        referenceExterne: `ref-${i}`
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    );
  }
  
  const results = await Promise.all(promises);
  console.log(`✅ ${results.length} paiements confirmés simultanément`);
}

testMultiplePaiements();
```

**Résultat attendu :**
- ✅ Tous les paiements confirmés sans erreur
- ✅ Toutes les transactions générées correctement
- ✅ Pas de conflit de données (race conditions)
- ✅ Temps de traitement total < 5 secondes

---

**Version :** 1.0  
**Dernière mise à jour :** 25 octobre 2025


