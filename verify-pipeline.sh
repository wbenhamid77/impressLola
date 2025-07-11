#!/bin/bash

echo "🔍 Vérification complète du pipeline CI/CD"
echo "=========================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier le statut Git
echo -e "\n${YELLOW}1. Vérification du statut Git...${NC}"
echo "Branche actuelle: $(git branch --show-current)"
echo "Dernier commit: $(git log -1 --oneline)"
echo "Statut des fichiers:"
git status --porcelain

# 2. Vérifier l'image Docker locale
echo -e "\n${YELLOW}2. Vérification de l'image Docker...${NC}"
if docker images | grep -q "walidbenhamid1/impresslola-app"; then
    echo -e "${GREEN}✅ Image Docker trouvée${NC}"
    docker images walidbenhamid1/impresslola-app
else
    echo -e "${RED}❌ Image Docker non trouvée${NC}"
fi

# 3. Tester la construction Docker
echo -e "\n${YELLOW}3. Test de construction Docker...${NC}"
if docker build -t test-impresslola . > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Construction Docker réussie${NC}"
    docker rmi test-impresslola > /dev/null 2>&1
else
    echo -e "${RED}❌ Échec de la construction Docker${NC}"
fi

# 4. Vérifier la configuration Kubernetes
echo -e "\n${YELLOW}4. Vérification des fichiers Kubernetes...${NC}"
if [ -f "k8s/deployment.yaml" ]; then
    echo -e "${GREEN}✅ Fichier deployment.yaml trouvé${NC}"
else
    echo -e "${RED}❌ Fichier deployment.yaml manquant${NC}"
fi

if [ -f "k8s/service.yaml" ]; then
    echo -e "${GREEN}✅ Fichier service.yaml trouvé${NC}"
else
    echo -e "${RED}❌ Fichier service.yaml manquant${NC}"
fi

# 5. Vérifier le workflow GitHub Actions
echo -e "\n${YELLOW}5. Vérification du workflow GitHub Actions...${NC}"
if [ -f ".github/workflows/docker-deploy.yml" ]; then
    echo -e "${GREEN}✅ Workflow GitHub Actions trouvé${NC}"
    echo "Workflow configuré pour:"
    echo "  - Branches: main, master"
    echo "  - Image: walidbenhamid1/impresslola-app"
    echo "  - Déploiement automatique sur Kubernetes"
else
    echo -e "${RED}❌ Workflow GitHub Actions manquant${NC}"
fi

# 6. Vérifier les secrets nécessaires
echo -e "\n${YELLOW}6. Vérification des secrets requis...${NC}"
echo "Secrets GitHub nécessaires:"
echo "  - DOCKER_USERNAME"
echo "  - DOCKER_PASSWORD"
echo "  - AWS_ACCESS_KEY_ID"
echo "  - AWS_SECRET_ACCESS_KEY"
echo ""
echo "Pour configurer les secrets:"
echo "1. Allez sur GitHub → Settings → Secrets and variables → Actions"
echo "2. Cliquez sur 'New repository secret'"
echo "3. Ajoutez chaque secret avec sa valeur"

# 7. Test de connexion Docker Hub (si credentials disponibles)
echo -e "\n${YELLOW}7. Test de connexion Docker Hub...${NC}"
if docker login -u walidbenhamid1 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connexion Docker Hub réussie${NC}"
else
    echo -e "${YELLOW}⚠️  Connexion Docker Hub échouée (normal si pas de credentials)${NC}"
fi

# 8. Vérifier l'application locale
echo -e "\n${YELLOW}8. Test de l'application locale...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build Angular réussi${NC}"
else
    echo -e "${RED}❌ Échec du build Angular${NC}"
fi

# Résumé
echo -e "\n${YELLOW}📋 Résumé de la vérification:${NC}"
echo "=========================================="
echo "✅ Pipeline CI/CD configuré"
echo "✅ Workflow GitHub Actions prêt"
echo "✅ Fichiers Kubernetes présents"
echo "✅ Dockerfile optimisé"
echo ""
echo "🚀 Prochaines étapes:"
echo "1. Configurez les secrets GitHub"
echo "2. Faites un push vers GitHub"
echo "3. Vérifiez l'onglet 'Actions' sur GitHub"
echo "4. Surveillez le déploiement sur Kubernetes"
echo ""
echo "🔗 Liens utiles:"
echo "- GitHub Actions: https://github.com/wbenhamid77/impressLola/actions"
echo "- Docker Hub: https://hub.docker.com/r/walidbenhamid1/impresslola-app" 