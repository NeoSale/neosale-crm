# 🚀 Guia de Deploy - NeoSale CRM

Este documento descreve como usar os scripts automatizados para deploy do NeoSale CRM.

## 📋 Scripts Disponíveis

### 1. Deploy Completo (Recomendado)
```bash
npm run deploy
```

**O que este comando faz:**
- ✅ Verifica alterações no Git
- 📝 Gera commit automático com mensagem semântica
- 📤 Faz push para o repositório
- 🐳 Constrói a imagem Docker
- 🏷️ Cria tag para Docker Hub
- 📦 Envia imagem para Docker Hub

### 2. Scripts Docker Individuais

#### Build da imagem Docker
```bash
npm run docker:build
```

#### Executar container localmente
```bash
npm run docker:run
```

### 3. Script Manual
```bash
bash build-and-push.sh
```

## 🤖 Geração Automática de Commits

O script analisa as alterações e gera mensagens de commit seguindo o padrão **Conventional Commits**:

### Tipos de Commit Detectados:

- **feat**: Novas funcionalidades
- **feat(docker)**: Alterações relacionadas ao Docker
- **docs**: Documentação
- **chore(deps)**: Dependências
- **refactor**: Remoção de código
- **style**: Alterações de CSS/SCSS

### Exemplos de Mensagens Geradas:

```
feat(docker): Add Docker support and update configurations

- Add Dockerfile for containerization
- Add docker-compose for easy deployment
- Add .dockerignore to optimize build
- Add deployment script
```

```
feat: Update API services
```

```
docs: Add Docker documentation
```

## 🔧 Configuração

### Pré-requisitos:
- Git configurado
- Docker instalado e rodando
- Login no Docker Hub (se necessário)

### Configurações no Script:
- **IMAGE_NAME**: `neosale-crm`
- **DOCKER_USERNAME**: `brunobspaiva`
- **VERSION**: `latest`

## 📦 Uso da Imagem Docker

### Baixar do Docker Hub:
```bash
docker pull brunobspaiva/neosale-crm:latest
```

### Executar:
```bash
docker run -p 3000:3000 brunobspaiva/neosale-crm:latest
```

### Com Docker Compose:
```bash
docker-compose up
```

## 🎯 Fluxo de Trabalho Recomendado

1. **Desenvolvimento**: Faça suas alterações no código
2. **Deploy**: Execute `npm run deploy`
3. **Verificação**: O script fará tudo automaticamente
4. **Produção**: Use a imagem do Docker Hub

## 🚨 Troubleshooting

### Docker não está rodando
```bash
# Windows
Start-Process "Docker Desktop"

# Verificar status
docker info
```

### Erro de push no Git
- Verifique suas credenciais Git
- Certifique-se de ter permissão no repositório

### Erro de push no Docker Hub
- Faça login: `docker login`
- Verifique suas credenciais do Docker Hub

## 📝 Logs e Debugging

O script fornece logs coloridos para facilitar o debugging:
- 🔴 **Vermelho**: Erros
- 🟡 **Amarelo**: Avisos/Processamento
- 🔵 **Azul**: Informações
- 🟢 **Verde**: Sucesso

---

**Desenvolvido para o NeoSale CRM** 🚀