# 🚀 Pipeline Automatique Complet

## ✅ Configuration requise

### **1. Secrets GitHub (OBLIGATOIRES)**

Allez sur : https://github.com/wbenhamid77/impressLola/settings/secrets/actions

Ajoutez ces 4 secrets :

| Secret | Valeur |
|--------|--------|
| `DOCKER_USERNAME` | `walidbenhamid1` |
| `DOCKER_PASSWORD` | [Votre token Docker Hub] |
| `AWS_ACCESS_KEY_ID` | [Votre clé AWS] |
| `AWS_SECRET_ACCESS_KEY` | [Votre clé secrète AWS] |

### **2. Comment obtenir le token Docker Hub :**

1. Allez sur https://hub.docker.com
2. Connectez-vous
3. Cliquez sur votre nom → **Account Settings**
4. **Security** → **New Access Token**
5. Nom : "GitHub Actions"
6. Permissions : **Read & Write**
7. Cliquez sur **Generate**
8. **COPIEZ le token**

### **3. Comment obtenir les clés AWS :**

1. Allez sur https://console.aws.amazon.com
2. Connectez-vous
3. Cliquez sur votre nom → **Security credentials**
4. **Create access key**
5. Copiez **Access Key ID** et **Secret Access Key**

## 🎯 Comment ça fonctionne

**À chaque `git push origin main` :**

1. ✅ **Build automatique** de l'application Angular
2. ✅ **Construction** de l'image Docker
3. ✅ **Push automatique** vers Docker Hub
4. ✅ **Déploiement automatique** sur AWS EKS
5. ✅ **Votre application** mise à jour en ligne

## 🔧 Test du pipeline

1. **Configurez les secrets GitHub** (voir ci-dessus)
2. **Faites un petit changement** dans votre code
3. **Commitez et poussez** :
   ```bash
   git add .
   git commit -m "Test du pipeline automatique"
   git push origin main
   ```
4. **Vérifiez** : https://github.com/wbenhamid77/impressLola/actions
5. **Votre application** sera automatiquement mise à jour !

## 📋 Vérification

### **GitHub Actions :**
- Allez sur : https://github.com/wbenhamid77/impressLola/actions
- Vous devriez voir "Complete Auto Deploy Pipeline" en cours

### **Docker Hub :**
- Allez sur : https://hub.docker.com/r/walidbenhamid1/impresslola-app
- L'image devrait être mise à jour

### **AWS EKS :**
- Votre application sera automatiquement mise à jour
- Pas besoin d'intervention manuelle

## 🎉 Résultat

**Votre application sera toujours à jour automatiquement !**

- 🔄 **Build automatique**
- 📦 **Push Docker automatique**
- 🚀 **Déploiement AWS automatique**
- 🌐 **Application mise à jour en ligne** 