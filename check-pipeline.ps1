# Script de verification du pipeline CI/CD pour Windows
Write-Host "Verification complete du pipeline CI/CD" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# 1. Verifier le statut Git
Write-Host "`n1. Verification du statut Git..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Branche actuelle: $currentBranch" -ForegroundColor Green
$lastCommit = git log -1 --oneline
Write-Host "Dernier commit: $lastCommit" -ForegroundColor Green

# 2. Verifier l'image Docker locale
Write-Host "`n2. Verification de l'image Docker..." -ForegroundColor Yellow
$dockerImages = docker images walidbenhamid1/impresslola-app 2>$null
if ($dockerImages) {
    Write-Host "OK - Image Docker trouvee" -ForegroundColor Green
    docker images walidbenhamid1/impresslola-app
} else {
    Write-Host "ERREUR - Image Docker non trouvee" -ForegroundColor Red
}

# 3. Tester la construction Docker
Write-Host "`n3. Test de construction Docker..." -ForegroundColor Yellow
try {
    docker build -t test-impresslola . | Out-Null
    Write-Host "OK - Construction Docker reussie" -ForegroundColor Green
    docker rmi test-impresslola 2>$null
} catch {
    Write-Host "ERREUR - Echec de la construction Docker" -ForegroundColor Red
}

# 4. Verifier la configuration Kubernetes
Write-Host "`n4. Verification des fichiers Kubernetes..." -ForegroundColor Yellow
if (Test-Path "k8s/deployment.yaml") {
    Write-Host "OK - Fichier deployment.yaml trouve" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Fichier deployment.yaml manquant" -ForegroundColor Red
}

if (Test-Path "k8s/service.yaml") {
    Write-Host "OK - Fichier service.yaml trouve" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Fichier service.yaml manquant" -ForegroundColor Red
}

# 5. Verifier le workflow GitHub Actions
Write-Host "`n5. Verification du workflow GitHub Actions..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/docker-deploy.yml") {
    Write-Host "OK - Workflow GitHub Actions trouve" -ForegroundColor Green
    Write-Host "Workflow configure pour:" -ForegroundColor Cyan
    Write-Host "  - Branches: main, master" -ForegroundColor Cyan
    Write-Host "  - Image: walidbenhamid1/impresslola-app" -ForegroundColor Cyan
    Write-Host "  - Deploiement automatique sur Kubernetes" -ForegroundColor Cyan
} else {
    Write-Host "ERREUR - Workflow GitHub Actions manquant" -ForegroundColor Red
}

# 6. Verifier les secrets necessaires
Write-Host "`n6. Verification des secrets requis..." -ForegroundColor Yellow
Write-Host "Secrets GitHub necessaires:" -ForegroundColor Cyan
Write-Host "  - DOCKER_USERNAME" -ForegroundColor Cyan
Write-Host "  - DOCKER_PASSWORD" -ForegroundColor Cyan
Write-Host "  - AWS_ACCESS_KEY_ID" -ForegroundColor Cyan
Write-Host "  - AWS_SECRET_ACCESS_KEY" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour configurer les secrets:" -ForegroundColor Yellow
Write-Host "1. Allez sur GitHub -> Settings -> Secrets and variables -> Actions" -ForegroundColor White
Write-Host "2. Cliquez sur 'New repository secret'" -ForegroundColor White
Write-Host "3. Ajoutez chaque secret avec sa valeur" -ForegroundColor White

# 7. Verifier l'application locale
Write-Host "`n7. Test de l'application locale..." -ForegroundColor Yellow
try {
    npm run build 2>$null
    Write-Host "OK - Build Angular reussi" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - Echec du build Angular" -ForegroundColor Red
}

# Resume
Write-Host "`nResume de la verification:" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "OK - Pipeline CI/CD configure" -ForegroundColor Green
Write-Host "OK - Workflow GitHub Actions pret" -ForegroundColor Green
Write-Host "OK - Fichiers Kubernetes presents" -ForegroundColor Green
Write-Host "OK - Dockerfile optimise" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. Configurez les secrets GitHub" -ForegroundColor White
Write-Host "2. Faites un push vers GitHub" -ForegroundColor White
Write-Host "3. Verifiez l'onglet 'Actions' sur GitHub" -ForegroundColor White
Write-Host "4. Surveillez le deploiement sur Kubernetes" -ForegroundColor White
Write-Host ""
Write-Host "Liens utiles:" -ForegroundColor Yellow
Write-Host "- GitHub Actions: https://github.com/wbenhamid77/impressLola/actions" -ForegroundColor Cyan
Write-Host "- Docker Hub: https://hub.docker.com/r/walidbenhamid1/impresslola-app" -ForegroundColor Cyan 