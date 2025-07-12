# Script de verification du deploiement AWS
Write-Host "Verification du deploiement AWS" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

# 1. Verifier la configuration kubectl
Write-Host "`n1. Verification de kubectl..." -ForegroundColor Yellow
try {
    $context = kubectl config current-context
    Write-Host "Contexte actuel: $context" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - kubectl non configure" -ForegroundColor Red
    Write-Host "Configurez avec: aws eks update-kubeconfig --region us-east-1 --name impresslola-cluster" -ForegroundColor Cyan
    exit 1
}

# 2. Verifier la connexion AWS
Write-Host "`n2. Verification AWS..." -ForegroundColor Yellow
try {
    aws sts get-caller-identity
    Write-Host "OK - AWS configure" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - AWS non configure" -ForegroundColor Red
    Write-Host "Configurez AWS CLI avec: aws configure" -ForegroundColor Cyan
}

# 3. Verifier le cluster EKS
Write-Host "`n3. Verification du cluster EKS..." -ForegroundColor Yellow
try {
    aws eks describe-cluster --name impresslola-cluster --region us-east-1
    Write-Host "OK - Cluster EKS trouve" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - Cluster EKS non trouve" -ForegroundColor Red
    Write-Host "Creez le cluster avec: eksctl create cluster -f aws/eks-cluster.yaml" -ForegroundColor Cyan
}

# 4. Verifier les namespaces
Write-Host "`n4. Verification des namespaces..." -ForegroundColor Yellow
kubectl get namespaces

# 5. Verifier les pods
Write-Host "`n5. Verification des pods..." -ForegroundColor Yellow
kubectl get pods -n impresslola

# 6. Verifier les services
Write-Host "`n6. Verification des services..." -ForegroundColor Yellow
kubectl get services -n impresslola

# 7. Verifier l'ingress
Write-Host "`n7. Verification de l'ingress..." -ForegroundColor Yellow
kubectl get ingress -n impresslola

# 8. Forcer le redéploiement
Write-Host "`n8. Forcer le redéploiement..." -ForegroundColor Yellow
try {
    kubectl apply -f k8s/deployment.yaml
    Write-Host "OK - Deploiement applique" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - Deploiement echoue" -ForegroundColor Red
}

# 9. Verifier le statut du rollout
Write-Host "`n9. Statut du rollout..." -ForegroundColor Yellow
try {
    kubectl rollout status deployment/impresslola-deployment -n impresslola
} catch {
    Write-Host "ERREUR - Rollout echoue" -ForegroundColor Red
}

# 10. Logs des pods
Write-Host "`n10. Logs des pods..." -ForegroundColor Yellow
$pods = kubectl get pods -n impresslola -o jsonpath='{.items[*].metadata.name}'
if ($pods) {
    $firstPod = $pods.Split(' ')[0]
    Write-Host "Logs du pod: $firstPod" -ForegroundColor Cyan
    kubectl logs $firstPod -n impresslola --tail=10
} else {
    Write-Host "Aucun pod trouve" -ForegroundColor Red
}

Write-Host "`nVerification terminee!" -ForegroundColor Green 