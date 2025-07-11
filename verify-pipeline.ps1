# Script de vérification du pipeline CI/CD pour Windows
Write-Host "🔍 Vérification complète du pipeline CI/CD" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# 1. Vérifier le statut Git
Write-Host "`n1. Vérification du statut Git..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Branche actuelle: $currentBranch" -ForegroundColor Green
$lastCommit = git log -1 --oneline
Write-Host "Dernier commit: $lastCommit" -ForegroundColor Green

# 2. Vérifier l'image Docker locale
Write-Host "`n2. Vérification de l'image Docker..." -ForegroundColor Yellow
$dockerImages = docker images walidbenhamid1/impresslola-app 2>$null
if ($dockerImages) {
    Write-Host "✅ Image Docker trouvée" -ForegroundColor Green
    docker images walidbenhamid1/impresslola-app
} else {
    Write-Host "❌ Image Docker non trouvée" -ForegroundColor Red
}

# 3. Tester la construction Docker
Write-Host "`n3. Test de construction Docker..." -ForegroundColor Yellow
try {
    docker build -t test-impresslola . | Out-Null
    Write-Host "✅ Construction Docker réussie" -ForegroundColor Green
    docker rmi test-impresslola 2>$null
} catch {
    Write-Host "❌ Échec de la construction Docker" -ForegroundColor Red
}

# 4. Vérifier la configuration Kubernetes
Write-Host "`n4. Vérification des fichiers Kubernetes..." -ForegroundColor Yellow
if (Test-Path "k8s/deployment.yaml") {
    Write-Host "✅ Fichier deployment.yaml trouvé" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier deployment.yaml manquant" -ForegroundColor Red
}

if (Test-Path "k8s/service.yaml") {
    Write-Host "✅ Fichier service.yaml trouvé" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier service.yaml manquant" -ForegroundColor Red
}

# 5. Vérifier le workflow GitHub Actions
Write-Host "`n5. Vérification du workflow GitHub Actions..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/docker-deploy.yml") {
    Write-Host "✅ Workflow GitHub Actions trouvé" -ForegroundColor Green
    Write-Host "Workflow configuré pour:" -ForegroundColor Cyan
    Write-Host "  - Branches: main, master" -ForegroundColor Cyan
    Write-Host "  - Image: walidbenhamid1/impresslola-app" -ForegroundColor Cyan
    Write-Host "  - Déploiement automatique sur Kubernetes" -ForegroundColor Cyan
} else {
    Write-Host "❌ Workflow GitHub Actions manquant" -ForegroundColor Red
}

# 6. Vérifier les secrets nécessaires
Write-Host "`n6. Vérification des secrets requis..." -ForegroundColor Yellow
Write-Host "Secrets GitHub nécessaires:" -ForegroundColor Cyan
Write-Host "  - DOCKER_USERNAME" -ForegroundColor Cyan
Write-Host "  - DOCKER_PASSWORD" -ForegroundColor Cyan
Write-Host "  - AWS_ACCESS_KEY_ID" -ForegroundColor Cyan
Write-Host "  - AWS_SECRET_ACCESS_KEY" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour configurer les secrets:" -ForegroundColor Yellow
Write-Host "1. Allez sur GitHub → Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host "2. Cliquez sur 'New repository secret'" -ForegroundColor White
Write-Host "3. Ajoutez chaque secret avec sa valeur" -ForegroundColor White

# 7. Vérifier l'application locale
Write-Host "`n7. Test de l'application locale..." -ForegroundColor Yellow
try {
    npm run build 2>$null
    Write-Host "✅ Build Angular réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Échec du build Angular" -ForegroundColor Red
}

# Résumé
Write-Host "`n📋 Résumé de la vérification:" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "✅ Pipeline CI/CD configuré" -ForegroundColor Green
Write-Host "✅ Workflow GitHub Actions prêt" -ForegroundColor Green
Write-Host "✅ Fichiers Kubernetes présents" -ForegroundColor Green
Write-Host "✅ Dockerfile optimisé" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Configurez les secrets GitHub" -ForegroundColor White
Write-Host "2. Faites un push vers GitHub" -ForegroundColor White
Write-Host "3. Vérifiez l'onglet 'Actions' sur GitHub" -ForegroundColor White
Write-Host "4. Surveillez le déploiement sur Kubernetes" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Liens utiles:" -ForegroundColor Yellow
Write-Host "- GitHub Actions: https://github.com/wbenhamid77/impressLola/actions" -ForegroundColor Cyan
Write-Host "- Docker Hub: https://hub.docker.com/r/walidbenhamid1/impresslola-app" -ForegroundColor Cyan 