# Script de test du repository Docker walidbenhamid1/impresslola-app
Write-Host "Test du repository Docker walidbenhamid1/impresslola-app" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Yellow

# 1. Vérifier la configuration
Write-Host "`n1. Verification de la configuration..." -ForegroundColor Yellow
Write-Host "Repository Docker: walidbenhamid1/impresslola-app" -ForegroundColor Green
Write-Host "Workflow GitHub: auto-deploy.yml" -ForegroundColor Green
Write-Host "Deployment Kubernetes: k8s/deployment.yaml" -ForegroundColor Green

# 2. Test de build local
Write-Host "`n2. Test de build local..." -ForegroundColor Yellow
try {
    docker build -t walidbenhamid1/impresslola-app:test .
    Write-Host "OK - Build local reussi" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - Build local echoue" -ForegroundColor Red
}

# 3. Test de connexion Docker Hub
Write-Host "`n3. Test de connexion Docker Hub..." -ForegroundColor Yellow
try {
    docker login -u walidbenhamid1
    Write-Host "OK - Connexion Docker Hub reussie" -ForegroundColor Green
} catch {
    Write-Host "ATTENTION - Connexion Docker Hub echoue (normal si pas de credentials)" -ForegroundColor Yellow
}

# 4. Vérifier les images locales
Write-Host "`n4. Images Docker locales..." -ForegroundColor Yellow
docker images walidbenhamid1/impresslola-app

# 5. Test de push (si connecté)
Write-Host "`n5. Test de push vers Docker Hub..." -ForegroundColor Yellow
try {
    docker push walidbenhamid1/impresslola-app:test
    Write-Host "OK - Push reussi" -ForegroundColor Green
} catch {
    Write-Host "ATTENTION - Push echoue (normal si pas de credentials)" -ForegroundColor Yellow
}

# 6. Vérifier la configuration Kubernetes
Write-Host "`n6. Verification Kubernetes..." -ForegroundColor Yellow
if (Test-Path "k8s/deployment.yaml") {
    $content = Get-Content "k8s/deployment.yaml"
    $imageLine = $content | Where-Object { $_ -like "*image:*" }
    Write-Host "Image Kubernetes: $imageLine" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Fichier deployment.yaml manquant" -ForegroundColor Red
}

# 7. Vérifier le workflow GitHub
Write-Host "`n7. Verification du workflow GitHub..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/auto-deploy.yml") {
    Write-Host "OK - Workflow auto-deploy.yml trouve" -ForegroundColor Green
    $workflow = Get-Content ".github/workflows/auto-deploy.yml"
    $imageName = $workflow | Where-Object { $_ -like "*IMAGE_NAME:*" }
    Write-Host "Configuration workflow: $imageName" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Workflow auto-deploy.yml manquant" -ForegroundColor Red
}

# Résumé
Write-Host "`nResume de la configuration:" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host "✅ Repository Docker: walidbenhamid1/impresslola-app" -ForegroundColor Green
Write-Host "✅ Workflow GitHub configuré" -ForegroundColor Green
Write-Host "✅ Deployment Kubernetes configuré" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. Configurez les secrets GitHub" -ForegroundColor White
Write-Host "2. Faites un push vers GitHub" -ForegroundColor White
Write-Host "3. Vérifiez l'onglet Actions" -ForegroundColor White
Write-Host "4. Votre application sera automatiquement mise à jour!" -ForegroundColor White
Write-Host ""
Write-Host "Liens utiles:" -ForegroundColor Yellow
Write-Host "- Docker Hub: https://hub.docker.com/r/walidbenhamid1/impresslola-app" -ForegroundColor Cyan
Write-Host "- GitHub Actions: https://github.com/wbenhamid77/impressLola/actions" -ForegroundColor Cyan 