# Script pour forcer la mise à jour de l'application
Write-Host "Forçage de la mise à jour de l'application" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

# 1. Supprimer les pods en erreur
Write-Host "`n1. Suppression des pods en erreur..." -ForegroundColor Yellow
kubectl delete pods --field-selector=status.phase=Failed -n impresslola
kubectl delete pods --field-selector=status.phase=Error -n impresslola

# 2. Forcer le redéploiement
Write-Host "`n2. Forçage du redéploiement..." -ForegroundColor Yellow
kubectl rollout restart deployment/impresslola-deployment -n impresslola

# 3. Attendre le redéploiement
Write-Host "`n3. Attente du redéploiement..." -ForegroundColor Yellow
kubectl rollout status deployment/impresslola-deployment -n impresslola

# 4. Vérifier les nouveaux pods
Write-Host "`n4. Vérification des nouveaux pods..." -ForegroundColor Yellow
kubectl get pods -n impresslola

# 5. Vérifier les logs
Write-Host "`n5. Logs des nouveaux pods..." -ForegroundColor Yellow
$pods = kubectl get pods -n impresslola -o jsonpath='{.items[*].metadata.name}'
if ($pods) {
    $newestPod = $pods.Split(' ')[0]
    Write-Host "Logs du pod le plus récent: $newestPod" -ForegroundColor Cyan
    kubectl logs $newestPod -n impresslola --tail=10
}

# 6. Vérifier le service
Write-Host "`n6. Vérification du service..." -ForegroundColor Yellow
kubectl get service impresslola-service -n impresslola

Write-Host "`nMise à jour terminée!" -ForegroundColor Green 