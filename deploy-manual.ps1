# Script de déploiement manuel
Write-Host "Deploiement manuel de ImpressLola" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

# 1. Build de l'application
Write-Host "`n1. Construction de l'application..." -ForegroundColor Yellow
npm run build

# 2. Build de l'image Docker
Write-Host "`n2. Construction de l'image Docker..." -ForegroundColor Yellow
docker build -t walidbenhamid1/impresslola-app:latest .

# 3. Push vers Docker Hub
Write-Host "`n3. Push vers Docker Hub..." -ForegroundColor Yellow
docker push walidbenhamid1/impresslola-app:latest

# 4. Déploiement Kubernetes
Write-Host "`n4. Deploiement sur Kubernetes..." -ForegroundColor Yellow
kubectl apply -f k8s/deployment.yaml

# 5. Vérification
Write-Host "`n5. Verification du deploiement..." -ForegroundColor Yellow
kubectl get pods -n impresslola
kubectl get services -n impresslola

Write-Host "`nDeploiement manuel termine!" -ForegroundColor Green
Write-Host "Pour verifier: kubectl get pods -n impresslola" -ForegroundColor Cyan 