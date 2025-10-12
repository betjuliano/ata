#!/bin/bash

# Script para Build e Push da Imagem Docker
# Uso: ./build-and-push.sh [versao]

set -e

# Configurações
DOCKER_USERNAME="${DOCKER_USERNAME:-seu-usuario}"  # Altere aqui ou exporte variável
IMAGE_NAME="sistema-ata-audio"
VERSION="${1:-latest}"
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$VERSION"

echo "🐳 Iniciando build da imagem Docker..."
echo "📦 Imagem: $FULL_IMAGE_NAME"
echo ""

# Verificar se está logado no Docker Hub
if ! docker info | grep -q "Username"; then
    echo "⚠️  Você não está logado no Docker Hub"
    echo "Execute: docker login"
    exit 1
fi

# Build da imagem
echo "🔨 Construindo imagem..."
cd frontend
docker build -f Dockerfile.prod -t $FULL_IMAGE_NAME .
cd ..

echo "✅ Build concluído!"
echo ""

# Verificar tamanho da imagem
IMAGE_SIZE=$(docker images $FULL_IMAGE_NAME --format "{{.Size}}")
echo "📊 Tamanho da imagem: $IMAGE_SIZE"
echo ""

# Push para Docker Hub
echo "📤 Enviando imagem para Docker Hub..."
docker push $FULL_IMAGE_NAME

echo ""
echo "✅ Imagem enviada com sucesso!"
echo "🌐 Disponível em: https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
echo ""
echo "📝 Para usar na VPS:"
echo "   docker pull $FULL_IMAGE_NAME"
echo ""


