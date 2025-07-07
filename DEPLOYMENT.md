# 🚀 Déploiement ImpressLola sur AWS EKS avec ArgoCD

## 📋 Prérequis

1. **Compte AWS** avec permissions EKS
2. **AWS CLI** configuré
3. **kubectl** installé
4. **eksctl** installé
5. **ArgoCD CLI** installé
6. **Helm** installé

## 🛠️ Installation des outils

### AWS CLI
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws configure
```

### kubectl
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### eksctl
```bash
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

### ArgoCD CLI
```bash
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
```

### Helm
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

## 🚀 Déploiement automatique

Exécute le script de déploiement :
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Déploiement manuel

### 1. Créer le cluster EKS
```bash
eksctl create cluster -f aws/eks-cluster.yaml
```

### 2. Configurer kubectl
```bash
aws eks update-kubeconfig --region us-east-1 --name impresslola-cluster
```

### 3. Installer ArgoCD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 4. Installer AWS Load Balancer Controller
```bash
kubectl apply -k "https://github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=impresslola-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### 5. Déployer l'application
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 6. Configurer ArgoCD
```bash
kubectl apply -f argocd/application.yaml
```

## 🔗 Accès

### Interface ArgoCD
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
- URL : https://localhost:8080
- Utilisateur : admin
- Mot de passe : `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

### Application
- URL : http://impresslola.yourdomain.com (après configuration DNS)

## 🔧 Configuration DNS

1. Récupérer l'URL de l'ALB :
```bash
kubectl get ingress impresslola-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

2. Créer un enregistrement CNAME dans Route 53 :
   - Nom : impresslola.yourdomain.com
   - Valeur : [URL de l'ALB]

## 📊 Monitoring

### Vérifier le statut du déploiement
```bash
kubectl get pods -n impresslola
kubectl get services -n impresslola
kubectl get ingress -n impresslola
```

### Logs de l'application
```bash
kubectl logs -f deployment/impresslola-deployment -n impresslola
```

## 🧹 Nettoyage

### Supprimer le cluster EKS
```bash
eksctl delete cluster --name impresslola-cluster --region us-east-1
```

## 📝 Notes importantes

1. **Coûts AWS** : Le cluster EKS génère des coûts (~$50-100/mois)
2. **Sécurité** : Configurez les groupes de sécurité appropriés
3. **SSL** : Remplacez `YOUR_CERT_ID` dans ingress.yaml par votre certificat ACM
4. **Domaine** : Remplacez `impresslola.yourdomain.com` par votre domaine

## 🆘 Support

En cas de problème :
1. Vérifiez les logs : `kubectl logs -n impresslola`
2. Vérifiez les événements : `kubectl get events -n impresslola`
3. Vérifiez le statut ArgoCD : `argocd app get impresslola-app` 