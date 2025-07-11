# 🔐 Configuration des Secrets GitHub Actions

## 📋 Problème identifié
Le pipeline CI/CD ne fonctionne pas car les secrets GitHub ne sont pas configurés.

## 🚀 Solution étape par étape

### **Étape 1: Accéder aux Secrets GitHub**

1. Allez sur votre repository GitHub : https://github.com/wbenhamid77/impressLola
2. Cliquez sur l'onglet **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret**

### **Étape 2: Configurer les Secrets Docker**

#### **DOCKER_USERNAME**
- **Nom du secret** : `DOCKER_USERNAME`
- **Valeur** : `walidbenhamid1`

#### **DOCKER_PASSWORD**
- **Nom du secret** : `DOCKER_PASSWORD`
- **Valeur** : Votre token Docker Hub (PAS votre mot de passe)

**Comment obtenir le token Docker Hub :**
1. Allez sur https://hub.docker.com
2. Connectez-vous à votre compte
3. Cliquez sur votre nom d'utilisateur → **Account Settings**
4. Cliquez sur **Security**
5. Cliquez sur **New Access Token**
6. Donnez un nom (ex: "GitHub Actions")
7. Copiez le token généré

### **Étape 3: Configurer les Secrets AWS**

#### **AWS_ACCESS_KEY_ID**
- **Nom du secret** : `AWS_ACCESS_KEY_ID`
- **Valeur** : Votre clé d'accès AWS

#### **AWS_SECRET_ACCESS_KEY**
- **Nom du secret** : `AWS_SECRET_ACCESS_KEY`
- **Valeur** : Votre clé secrète AWS

**Comment obtenir les clés AWS :**
1. Allez sur https://console.aws.amazon.com
2. Connectez-vous à votre compte AWS
3. Cliquez sur votre nom d'utilisateur → **Security credentials**
4. Cliquez sur **Create access key**
5. Copiez l'Access Key ID et Secret Access Key

### **Étape 4: Vérifier la configuration**

Une fois les secrets configurés :
1. Faites un petit changement dans votre code
2. Committez et poussez vers GitHub
3. Allez dans l'onglet **Actions** de votre repository
4. Vérifiez que le workflow se déclenche

## 🔧 Test immédiat

Pour tester sans secrets, utilisez le workflow simple :
- Le fichier `.github/workflows/test-simple.yml` va se déclencher
- Il ne nécessite pas de secrets
- Il va tester que GitHub Actions fonctionne

## 📞 Support

Si vous avez des problèmes :
1. Vérifiez que les secrets sont correctement nommés
2. Vérifiez que les valeurs sont correctes
3. Regardez les logs dans l'onglet Actions de GitHub 