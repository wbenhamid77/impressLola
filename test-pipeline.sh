#!/bin/bash

echo "🧪 Test du pipeline de build et déploiement"

# Variables
IMAGE_NAME="walidbenhamid1/impresslola-app"
TAG="test-$(date +%s)"

echo "📦 Construction de l'image Docker..."
docker build -t $IMAGE_NAME:$TAG .

echo "🐳 Test de l'image localement..."
docker run -d -p 3000:3000 --name test-impresslola $IMAGE_NAME:$TAG

echo "⏳ Attente du démarrage..."
sleep 10

echo "🔍 Test de l'application..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Application accessible localement"
else
    echo "❌ Application non accessible"
fi

echo "🧹 Nettoyage..."
docker stop test-impresslola
docker rm test-impresslola

echo "📤 Push de l'image..."
docker tag $IMAGE_NAME:$TAG $IMAGE_NAME:latest
docker push $IMAGE_NAME:latest

echo "✅ Test terminé!"
echo "🔄 Pour déployer sur Kubernetes :"
echo "kubectl apply -f k8s/deployment.yaml" 