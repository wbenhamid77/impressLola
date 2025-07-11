# Script pour verifier le statut Kubernetes
Write-Host "Verification du statut Kubernetes" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

# Verifier si kubectl est configure
Write-Host "`n1. Verification de la configuration kubectl..." -ForegroundColor Yellow
try {
    $context = kubectl config current-context
    Write-Host "Contexte actuel: $context" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - kubectl non configure" -ForegroundColor Red
    Write-Host "Configurez kubectl avec: aws eks update-kubeconfig --region us-east-1 --name impresslola-cluster" -ForegroundColor Cyan
    exit 1
}

# Verifier les namespaces
Write-Host "`n2. Verification des namespaces..." -ForegroundColor Yellow
kubectl get namespaces | findstr impresslola

# Verifier les pods
Write-Host "`n3. Verification des pods..." -ForegroundColor Yellow
kubectl get pods -n impresslola

# Verifier les services
Write-Host "`n4. Verification des services..." -ForegroundColor Yellow
kubectl get services -n impresslola

# Verifier l'ingress
Write-Host "`n5. Verification de l'ingress..." -ForegroundColor Yellow
kubectl get ingress -n impresslola

# Verifier les logs
Write-Host "`n6. Logs des pods..." -ForegroundColor Yellow
$pods = kubectl get pods -n impresslola -o jsonpath='{.items[*].metadata.name}'
if ($pods) {
    Write-Host "Logs du premier pod:" -ForegroundColor Cyan
    $firstPod = $pods.Split(' ')[0]
    kubectl logs $firstPod -n impresslola --tail=10
} else {
    Write-Host "Aucun pod trouve" -ForegroundColor Red
}

# Verifier les evenements
Write-Host "`n7. Evenements du namespace..." -ForegroundColor Yellow
kubectl get events -n impresslola --sort-by='.lastTimestamp'

Write-Host "`nVerification terminee!" -ForegroundColor Green 