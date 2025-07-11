# 🐳 Docker Setup - NeoSale CRM

Este guia explica como containerizar e executar a aplicação NeoSale CRM usando Docker.

## 📋 Pré-requisitos

- Docker instalado e rodando
- Docker Compose (opcional, mas recomendado)
- Conta no Docker Hub (para publicar a imagem)

## 🚀 Quick Start

### 1. Build da Imagem Local

```bash
# Build da imagem
docker build -t neosale-crm .

# Executar o container
docker run -p 3000:3000 neosale-crm
```

### 2. Usando Docker Compose

```bash
# Executar com docker-compose
docker-compose up --build

# Executar em background
docker-compose up -d --build

# Parar os containers
docker-compose down
```

## 📦 Publicar no Docker Hub

### 1. Configurar o Script de Build

Edite o arquivo `build-and-push.sh` e substitua `seu-usuario-dockerhub` pelo seu usuário real do Docker Hub:

```bash
DOCKER_USERNAME="seu-usuario-dockerhub"
```

### 2. Executar o Script

```bash
# Dar permissão de execução (Linux/Mac)
chmod +x build-and-push.sh

# Executar o script
./build-and-push.sh
```

### 3. Comandos Manuais

```bash
# Build da imagem
docker build -t neosale-crm .

# Tag para o Docker Hub
docker tag neosale-crm:latest seu-usuario/neosale-crm:latest

# Login no Docker Hub
docker login

# Push para o Docker Hub
docker push seu-usuario/neosale-crm:latest
```

## 🔧 Configurações

### Variáveis de Ambiente

A aplicação usa as seguintes variáveis de ambiente:

- `NEXT_PUBLIC_API_URL`: URL da API (configurada para produção)
- `NODE_ENV`: Ambiente de execução (production)
- `PORT`: Porta da aplicação (3000)
- `HOSTNAME`: Hostname do servidor (0.0.0.0)

### Arquivo .env.production

O arquivo `.env.production` contém as configurações de produção:

```env
NEXT_PUBLIC_API_URL=https://evolution-api-neosale-api.mrzt3w.easypanel.host/api
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

## 🏗️ Estrutura do Docker

### Dockerfile

O Dockerfile usa uma abordagem multi-stage:

1. **deps**: Instala apenas as dependências de produção
2. **builder**: Faz o build da aplicação Next.js
3. **runner**: Imagem final otimizada para produção

### Otimizações

- Usa `node:18-alpine` para imagens menores
- Output `standalone` do Next.js para reduzir o tamanho
- `.dockerignore` para excluir arquivos desnecessários
- Multi-stage build para otimizar camadas

## 🚀 Deploy em Produção

### 1. Usando a Imagem do Docker Hub

```bash
# Pull da imagem
docker pull seu-usuario/neosale-crm:latest

# Executar em produção
docker run -d \
  --name neosale-crm-prod \
  -p 80:3000 \
  --restart unless-stopped \
  seu-usuario/neosale-crm:latest
```

### 2. Com Docker Compose em Produção

```yaml
version: '3.8'
services:
  neosale-crm:
    image: seu-usuario/neosale-crm:latest
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## 🔍 Troubleshooting

### Verificar Logs

```bash
# Logs do container
docker logs neosale-crm-app

# Logs em tempo real
docker logs -f neosale-crm-app
```

### Acessar o Container

```bash
# Executar bash no container
docker exec -it neosale-crm-app sh
```

### Verificar Status

```bash
# Listar containers rodando
docker ps

# Verificar uso de recursos
docker stats neosale-crm-app
```

## 📊 Monitoramento

### Health Check

Para adicionar health check ao Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1
```

### Logs Estruturados

Para produção, considere usar um sistema de logs como:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Fluentd
- Grafana + Loki

## 🔐 Segurança

- A imagem roda com usuário não-root (`nextjs`)
- Apenas a porta 3000 é exposta
- Não inclui arquivos sensíveis (`.dockerignore`)
- Usa imagem Alpine para menor superfície de ataque

## 📝 Notas Importantes

1. **Tamanho da Imagem**: A imagem final tem aproximadamente 150-200MB
2. **Performance**: O output `standalone` melhora significativamente o tempo de inicialização
3. **Cache**: O Docker faz cache das camadas, rebuilds subsequentes são mais rápidos
4. **Produção**: Sempre use tags específicas em produção, evite `latest`

## 🆘 Suporte

Para problemas relacionados ao Docker:

1. Verifique se o Docker está atualizado
2. Confirme que as portas não estão em uso
3. Verifique os logs do container
4. Teste localmente antes de fazer deploy