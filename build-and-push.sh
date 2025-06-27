#!/bin/bash

# Script para build e push da imagem Docker do NeoSale CRM

# Configurações
IMAGE_NAME="neosale-crm"
DOCKER_USERNAME="brunobspaiva"  # Substitua pelo seu usuário do Docker Hub
VERSION="latest"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando build da imagem Docker do NeoSale CRM${NC}"

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente.${NC}"
    exit 1
fi

# Build da imagem
echo -e "${YELLOW}📦 Fazendo build da imagem...${NC}"
docker build -t $IMAGE_NAME:$VERSION .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro no build da imagem${NC}"
    exit 1
fi

# Tag para o Docker Hub
echo -e "${YELLOW}🏷️  Criando tag para o Docker Hub...${NC}"
docker tag $IMAGE_NAME:$VERSION $DOCKER_USERNAME/$IMAGE_NAME:$VERSION

# Login no Docker Hub (opcional - descomente se necessário)
# echo -e "${YELLOW}🔐 Fazendo login no Docker Hub...${NC}"
# docker login

# Push para o Docker Hub
echo -e "${YELLOW}📤 Enviando imagem para o Docker Hub...${NC}"
docker push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Imagem enviada com sucesso para o Docker Hub!${NC}"
    echo -e "${GREEN}📋 Para usar a imagem: docker pull $DOCKER_USERNAME/$IMAGE_NAME:$VERSION${NC}"
    echo -e "${GREEN}🚀 Para executar: docker run -p 3000:3000 $DOCKER_USERNAME/$IMAGE_NAME:$VERSION${NC}"
else
    echo -e "${RED}❌ Erro ao enviar imagem para o Docker Hub${NC}"
    exit 1
fi

echo -e "${GREEN}✨ Processo concluído!${NC}"