# 🚀 Configuration du Déploiement Automatique

## ✅ Problème résolu
Le Dockerfile a été corrigé et fonctionne maintenant correctement.

## 🔧 Configuration requise

### **1. Secrets GitHub (OBLIGATOIRES)**

Allez sur : https://github.com/wbenhamid77/impressLola/settings/secrets/actions

Ajoutez ces 4 secrets :

| Nom du Secret | Valeur |
|---------------|--------|
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

## 🚀 Test du pipeline

Une fois les secrets configurés :

1. **Faites un petit changement** dans votre code
2. **Commitez et poussez** vers GitHub
3. **Allez sur** : https://github.com/wbenhamid77/impressLola/actions
4. **Regardez** le workflow "Auto Build and Deploy"

## 📋 Ce qui va se passer automatiquement :

1. ✅ **Build de l'application** Angular
2. ✅ **Construction de l'image** Docker
3. ✅ **Push vers Docker Hub**
4. ✅ **Déploiement sur Kubernetes**
5. ✅ **Votre application est mise à jour**

## 🔍 Vérification

### **Docker Hub :**
- Allez sur : https://hub.docker.com/r/walidbenhamid1/impresslola-app
- Vérifiez que l'image est mise à jour

### **Kubernetes :**
```bash
kubectl get pods -n impresslola
kubectl get services -n impresslola
```

### **Application :**
- Votre application sera automatiquement mise à jour
- Pas besoin d'intervention manuelle

## 🎯 Résultat final

**À chaque push vers GitHub :**
- 🔄 Build automatique
- 📦 Push Docker automatique
- 🚀 Déploiement automatique
- 🌐 Application mise à jour en ligne

**Votre application sera toujours à jour !** 🎉 