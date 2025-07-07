#!/bin/bash

# Configuration
CLUSTER_NAME="impresslola-cluster"
REGION="us-east-1"
DOMAIN="impresslola.yourdomain.com"

echo "🚀 Déploiement de ImpressLola sur AWS EKS avec ArgoCD"

# 1. Installation des outils nécessaires
echo "📦 Installation des outils..."

# Installer eksctl
if ! command -v eksctl &> /dev/null; then
    echo "Installation d'eksctl..."
    curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
    sudo mv /tmp/eksctl /usr/local/bin
fi

# Installer kubectl
if ! command -v kubectl &> /dev/null; then
    echo "Installation de kubectl..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    chmod +x kubectl
    sudo mv kubectl /usr/local/bin/
fi

# Installer ArgoCD CLI
if ! command -v argocd &> /dev/null; then
    echo "Installation d'ArgoCD CLI..."
    curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
    sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
    rm argocd-linux-amd64
fi

# 2. Création du cluster EKS
echo "🏗️  Création du cluster EKS..."
eksctl create cluster -f aws/eks-cluster.yaml

# 3. Configuration du contexte kubectl
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME

# 4. Installation d'ArgoCD
echo "📦 Installation d'ArgoCD..."
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Attendre qu'ArgoCD soit prêt
echo "⏳ Attente du démarrage d'ArgoCD..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# 5. Installation du AWS Load Balancer Controller
echo "🌐 Installation du AWS Load Balancer Controller..."
kubectl apply -k "https://github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# 6. Application des manifests Kubernetes
echo "📋 Application des manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 7. Déploiement via ArgoCD
echo "🚀 Déploiement via ArgoCD..."
kubectl apply -f argocd/application.yaml

# 8. Récupération du mot de passe ArgoCD
echo "🔑 Mot de passe ArgoCD admin:"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

echo "✅ Déploiement terminé!"
echo "🌐 Interface ArgoCD: https://localhost:8080"
echo "🔗 URL de l'application: http://$DOMAIN" 