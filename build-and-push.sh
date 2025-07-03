#!/bin/bash

# Script para build, commit, push e deploy da imagem Docker do NeoSale CRM

# Configurações
IMAGE_NAME="neosale-crm"
DOCKER_USERNAME="brunobspaiva"  # Substitua pelo seu usuário do Docker Hub

# Função para incrementar versão
increment_version() {
    local version=$1
    local major=$(echo $version | cut -d. -f1)
    local minor=$(echo $version | cut -d. -f2)
    local patch=$(echo $version | cut -d. -f3)
    
    # Incrementa o patch version
    patch=$((patch + 1))
    
    echo "$major.$minor.$patch"
}

# Ler versão atual do package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📋 Versão atual: $CURRENT_VERSION${NC}"

# Incrementar versão
NEW_VERSION=$(increment_version $CURRENT_VERSION)
echo -e "${GREEN}🔢 Nova versão: $NEW_VERSION${NC}"

# Atualizar package.json com nova versão
node -e "const fs = require('fs'); const pkg = require('./package.json'); pkg.version = '$NEW_VERSION'; fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"
echo -e "${GREEN}✅ package.json atualizado com versão $NEW_VERSION${NC}"

VERSION=$NEW_VERSION

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para gerar mensagem de commit automática
generate_commit_message() {
    local changes=$(git status --porcelain)
    local commit_type="feat"
    local scope=""
    local description=""
    local details=()
    
    # Analisar tipos de alterações
    if echo "$changes" | grep -q "^A.*\.md$\|^A.*README\|^A.*\.txt$"; then
        commit_type="docs"
    elif echo "$changes" | grep -q "^A.*Dockerfile\|^A.*docker-compose\|^A.*\.dockerignore"; then
        commit_type="feat"
        scope="docker"
    elif echo "$changes" | grep -q "^M.*package\.json\|^M.*package-lock\.json"; then
        commit_type="chore"
        scope="deps"
    elif echo "$changes" | grep -q "^M.*\.ts$\|^M.*\.tsx$\|^M.*\.js$\|^M.*\.jsx$"; then
        commit_type="feat"
    elif echo "$changes" | grep -q "^D"; then
        commit_type="refactor"
    elif echo "$changes" | grep -q "^M.*\.css$\|^M.*\.scss$"; then
        commit_type="style"
    fi
    
    # Gerar descrição baseada nos arquivos alterados
    while IFS= read -r line; do
        if [[ $line =~ ^A.*Dockerfile$ ]]; then
            details+=("Add Dockerfile for containerization")
        elif [[ $line =~ ^A.*docker-compose ]]; then
            details+=("Add docker-compose for easy deployment")
        elif [[ $line =~ ^A.*\.dockerignore$ ]]; then
            details+=("Add .dockerignore to optimize build")
        elif [[ $line =~ ^A.*build-and-push ]]; then
            details+=("Add deployment script")
        elif [[ $line =~ ^A.*README.*[Dd]ocker ]]; then
            details+=("Add Docker documentation")
        elif [[ $line =~ ^M.*package\.json$ ]]; then
            details+=("Update package.json scripts")
        elif [[ $line =~ ^M.*\.env ]]; then
            details+=("Update environment configuration")
        elif [[ $line =~ ^M.*Api\.|.*api\. ]]; then
            details+=("Update API services")
        elif [[ $line =~ ^D.*route\.ts$ ]]; then
            details+=("Remove unused API routes")
        elif [[ $line =~ ^M.*component ]]; then
            details+=("Update components")
        fi
    done <<< "$changes"
    
    # Construir mensagem
    if [ ${#details[@]} -eq 0 ]; then
        description="Update project files"
    elif [ ${#details[@]} -eq 1 ]; then
        description="${details[0]}"
    else
        description="Add Docker support and update configurations"
    fi
    
    # Formato final da mensagem
    if [ -n "$scope" ]; then
        echo "${commit_type}(${scope}): ${description}"
    else
        echo "${commit_type}: ${description}"
    fi
    
    # Adicionar detalhes se houver múltiplas alterações
    if [ ${#details[@]} -gt 1 ]; then
        echo ""
        for detail in "${details[@]}"; do
            echo "- $detail"
        done
    fi
}

echo -e "${GREEN}🚀 Iniciando processo de deploy do NeoSale CRM${NC}"

# Verificar se há alterações para commit
echo -e "${BLUE}📝 Verificando alterações no Git...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}📋 Alterações detectadas. Fazendo commit automático...${NC}"
    
    # Adicionar todas as alterações
    git add .
    
    # Gerar mensagem de commit automática
    commit_message=$(generate_commit_message)
    
    # Fazer commit
    echo -e "${BLUE}💬 Mensagem do commit:${NC}"
    echo "$commit_message"
    echo ""
    
    git commit -m "$commit_message"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Commit realizado com sucesso!${NC}"
        
        # Push para o repositório
        echo -e "${YELLOW}📤 Enviando alterações para o repositório...${NC}"
        git push
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Push realizado com sucesso!${NC}"
        else
            echo -e "${RED}❌ Erro ao fazer push. Continuando com o build...${NC}"
        fi
    else
        echo -e "${RED}❌ Erro no commit. Continuando com o build...${NC}"
    fi
else
    echo -e "${GREEN}✅ Nenhuma alteração detectada no Git${NC}"
fi

echo ""

# Verificar se o Docker está rodando
echo -e "${BLUE}🐳 Verificando Docker...${NC}"
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
echo -e "${YELLOW}🏷️  Criando tags para o Docker Hub...${NC}"
docker tag $IMAGE_NAME:$VERSION $DOCKER_USERNAME/$IMAGE_NAME:$VERSION
docker tag $IMAGE_NAME:$VERSION $DOCKER_USERNAME/$IMAGE_NAME:latest

# Login no Docker Hub (opcional - descomente se necessário)
# echo -e "${YELLOW}🔐 Fazendo login no Docker Hub...${NC}"
# docker login

# Push para o Docker Hub
echo -e "${YELLOW}📤 Enviando imagem versionada para o Docker Hub...${NC}"
docker push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Imagem v$VERSION enviada com sucesso!${NC}"
    
    echo -e "${YELLOW}📤 Enviando imagem latest para o Docker Hub...${NC}"
    docker push $DOCKER_USERNAME/$IMAGE_NAME:latest
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 Todas as imagens enviadas com sucesso para o Docker Hub!${NC}"
        echo -e "${GREEN}📋 Versão específica: docker pull $DOCKER_USERNAME/$IMAGE_NAME:$VERSION${NC}"
        echo -e "${GREEN}📋 Versão latest: docker pull $DOCKER_USERNAME/$IMAGE_NAME:latest${NC}"
        echo -e "${GREEN}🚀 Para executar: docker run -p 3000:3000 $DOCKER_USERNAME/$IMAGE_NAME:$VERSION${NC}"
        
        # Criar tag Git para a versão
        echo -e "${YELLOW}🏷️  Criando tag Git v$VERSION...${NC}"
        git tag -a "v$VERSION" -m "Release version $VERSION"
        git push origin "v$VERSION"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Tag Git v$VERSION criada e enviada!${NC}"
        else
            echo -e "${YELLOW}⚠️  Aviso: Erro ao criar/enviar tag Git${NC}"
        fi
    else
        echo -e "${RED}❌ Erro ao enviar imagem latest para o Docker Hub${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Erro ao enviar imagem versionada para o Docker Hub${NC}"
    exit 1
fi

echo -e "${GREEN}✨ Processo concluído!${NC}"