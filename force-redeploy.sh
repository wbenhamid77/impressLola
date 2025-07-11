#!/bin/bash

echo "🔄 Forçage du redéploiement de ImpressLola..."

# 1. Vérifier le contexte kubectl
echo "📋 Vérification du contexte kubectl..."
kubectl config current-context

# 2. Forcer le redéploiement en changeant l'annotation
echo "🔄 Forçage du redéploiement..."
kubectl patch deployment impresslola-deployment -n impresslola -p '{"spec":{"template":{"metadata":{"annotations":{"date":"'$(date +%s)'"}}}}}'

# 3. Vérifier le statut du déploiement
echo "📊 Statut du déploiement..."
kubectl rollout status deployment/impresslola-deployment -n impresslola

# 4. Vérifier les pods
echo "🐳 Vérification des pods..."
kubectl get pods -n impresslola

# 5. Vérifier les services
echo "🌐 Vérification des services..."
kubectl get services -n impresslola

# 6. Vérifier l'ingress
echo "🚪 Vérification de l'ingress..."
kubectl get ingress -n impresslola

echo "✅ Redéploiement terminé!" 